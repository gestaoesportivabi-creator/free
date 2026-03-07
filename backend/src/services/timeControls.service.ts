/**
 * Service para Controle de Tempo Jogado
 * Transforma eventos de entrada/saída em formato PlayerTimeControl do frontend
 */

import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';
import { timeControlsRepository } from '../repositories/timeControls.repository';
import { PlayerTimeControl } from '../types/frontend';
import prisma from '../config/database';

function db(tx?: TransactionClient) {
  return tx ?? prisma;
}

/**
 * Transforma eventos do banco para formato PlayerTimeControl do frontend
 */
function transformEventosToTimeControl(
  jogoId: string,
  jogadorId: string,
  eventos: any[]
): PlayerTimeControl {
  // Agrupar eventos por jogador e ordenar por tempo
  const eventosOrdenados = eventos
    .filter(e => e.jogadorId === jogadorId)
    .sort((a, b) => {
      if (a.minuto !== b.minuto) return a.minuto - b.minuto;
      return a.segundo - b.segundo;
    });

  // Criar entradas de tempo (pares ENTRADA/SAIDA)
  const entries: { entryTime: string; exitTime?: string }[] = [];
  let currentEntry: { entryTime: string; exitTime?: string } | null = null;

  eventosOrdenados.forEach(evento => {
    if (evento.tipoEvento === 'ENTRADA') {
      // Se já existe uma entrada sem saída, fechar ela primeiro
      if (currentEntry && !currentEntry.exitTime) {
        // Não fechar, apenas criar nova entrada
      }
      currentEntry = {
        entryTime: `${String(evento.minuto).padStart(2, '0')}:${String(evento.segundo).padStart(2, '0')}`,
      };
      entries.push(currentEntry);
    } else if (evento.tipoEvento === 'SAIDA' && currentEntry) {
      currentEntry.exitTime = `${String(evento.minuto).padStart(2, '0')}:${String(evento.segundo).padStart(2, '0')}`;
      currentEntry = null;
    }
  });

  // Calcular tempo total
  let totalMinutes = 0;
  entries.forEach(entry => {
    if (entry.entryTime && entry.exitTime) {
      const [entryMin, entrySec] = entry.entryTime.split(':').map(Number);
      const [exitMin, exitSec] = entry.exitTime.split(':').map(Number);
      const entryTotal = entryMin * 60 + entrySec;
      const exitTotal = exitMin * 60 + exitSec;
      if (exitTotal > entryTotal) {
        totalMinutes += (exitTotal - entryTotal) / 60;
      }
    }
  });

  return {
    id: `${jogoId}-${jogadorId}`,
    matchId: jogoId,
    playerId: jogadorId,
    entries: entries.length > 0 ? entries : [{ entryTime: '', exitTime: undefined }],
    timeEntries: entries.length > 0 ? entries : [{ entryTime: '', exitTime: undefined }], // Compatibilidade com frontend
    totalMinutes: Math.round(totalMinutes * 100) / 100, // Arredondar para 2 casas decimais
  } as any; // Usar 'as any' porque o tipo pode ter campos opcionais
}

export const timeControlsService = {
  /**
   * Buscar todos os time controls de um jogo
   */
  async getByMatchId(matchId: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<PlayerTimeControl[]> {
    const eventos = await timeControlsRepository.findByJogoId(matchId, tenantInfo, tx);
    if (eventos.length === 0) return [];

    // Agrupar eventos por jogador
    const jogadoresMap = new Map<string, any[]>();
    eventos.forEach(evento => {
      if (!jogadoresMap.has(evento.jogadorId)) {
        jogadoresMap.set(evento.jogadorId, []);
      }
      jogadoresMap.get(evento.jogadorId)!.push(evento);
    });

    // Transformar para formato frontend
    const timeControls: PlayerTimeControl[] = [];
    jogadoresMap.forEach((eventosJogador, jogadorId) => {
      timeControls.push(transformEventosToTimeControl(matchId, jogadorId, eventosJogador));
    });

    return timeControls;
  },

  /**
   * Salvar time controls de um jogo
   * Deleta eventos existentes e cria novos
   */
  async saveForMatch(matchId: string, timeControls: PlayerTimeControl[], tenantInfo: TenantInfo, tx?: TransactionClient): Promise<PlayerTimeControl[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) throw new Error('Nenhuma equipe encontrada para o tenant');

    const jogo = await db(tx).jogo.findUnique({ where: { id: matchId } });
    if (!jogo || !equipeIds.includes(jogo.equipeId)) throw new Error('Jogo não encontrado ou não pertence ao tenant');

    await timeControlsRepository.deleteByJogoId(matchId, tx);

    for (const tc of timeControls) {
      const entries = tc.timeEntries || [];
      for (const entry of entries) {
        if (entry.entryTime) {
          const [entryMin, entrySec] = entry.entryTime.split(':').map(Number);
          await timeControlsRepository.createEvento({
            jogoId: matchId,
            jogadorId: tc.playerId,
            tipoEvento: 'ENTRADA',
            minuto: entryMin || 0,
            segundo: entrySec || 0,
          }, tx);
          if (entry.exitTime) {
            const [exitMin, exitSec] = entry.exitTime.split(':').map(Number);
            await timeControlsRepository.createEvento({
              jogoId: matchId,
              jogadorId: tc.playerId,
              tipoEvento: 'SAIDA',
              minuto: exitMin || 0,
              segundo: exitSec || 0,
            }, tx);
          }
        }
      }
    }

    return this.getByMatchId(matchId, tenantInfo, tx);
  },
};

