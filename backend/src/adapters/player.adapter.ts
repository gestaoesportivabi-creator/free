/**
 * Adapter para transformar dados de jogadores do PostgreSQL para formato Player do frontend
 * Aplicar ajuste recomendado da Seção 11.2.C (item 15)
 */

import { Player, InjuryRecord } from '../types/frontend';

// Tipos do banco de dados (Prisma retorna camelCase)
interface JogadorDB {
  id: string;
  nome: string;
  apelido?: string | null;
  dataNascimento?: Date | string | null;
  idade?: number | null;
  funcaoEmQuadra?: string | null;
  numeroCamisa?: number | null;
  peDominante?: string | null;
  altura?: number | null;
  peso?: number | null;
  ultimoClube?: string | null;
  fotoUrl?: string | null;
  maxLoadsJson?: unknown;
  isTransferido: boolean;
  dataTransferencia?: Date | string | null;
  isAtivo: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface LesaoDB {
  id: string;
  jogadorId: string;
  data: Date | string; // DEPRECADO: usar dataInicio
  dataInicio: Date | string;
  dataFim?: Date | string | null;
  tipo: string;
  localizacao: string;
  lado?: string | null;
  severidade?: string | null;
  origem?: string | null;
  diasAfastado?: number | null;
  createdAt: Date | string;
}

interface AvaliacaoFisicaDB {
  id: string;
  jogadorId: string;
  data: Date | string;
  peso?: number | null;
  altura?: number | null;
  gorduraCorporal?: number | null;
  massaMuscular?: number | null;
  vo2max?: number | null;
  flexibilidade?: number | null;
  velocidade?: number | null;
  forca?: number | null;
  agilidade?: number | null;
  peitoral?: number | null;
  axilar?: number | null;
  subescapular?: number | null;
  triceps?: number | null;
  abdominal?: number | null;
  suprailiaca?: number | null;
  coxa?: number | null;
  planoAcao?: string | null;
  createdAt: Date | string;
}

/**
 * Formata data para string YYYY-MM-DD
 */
function formatDate(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

/**
 * Transforma lesão do banco para formato InjuryRecord do frontend
 */
function transformLesaoToFrontend(lesao: LesaoDB): InjuryRecord {
  return {
    id: lesao.id,
    playerId: lesao.jogadorId,
    date: formatDate(lesao.dataInicio || lesao.data || undefined), // Usar dataInicio se disponível
    startDate: formatDate(lesao.dataInicio || lesao.data || undefined) || '',
    endDate: formatDate(lesao.dataFim || undefined),
    type: lesao.tipo,
    location: lesao.localizacao,
    side: (lesao.lado as any) || 'N/A',
    severity: lesao.severidade || '',
    origin: (lesao.origem as any) || 'Outros',
    daysOut: lesao.diasAfastado ?? undefined,
  };
}

/**
 * Transforma jogador do banco de dados para formato Player do frontend
 */
export function transformPlayerToFrontend(
  jogador: JogadorDB,
  lesoes: LesaoDB[] = [],
  _avaliacoesFisicas: AvaliacaoFisicaDB[] = []
): Player {
  // Transformar lesões para formato do frontend
  const injuryHistory: InjuryRecord[] = lesoes
    .filter((lesao) => lesao.jogadorId === jogador.id)
    .map(transformLesaoToFrontend)
    .sort((a, b) => {
      // Ordenar por data mais recente primeiro
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });

  // Calcular idade se não estiver disponível
  let age = jogador.idade || 0;
  if (!age && jogador.dataNascimento) {
    const birthDate = typeof jogador.dataNascimento === 'string'
      ? new Date(jogador.dataNascimento)
      : jogador.dataNascimento;
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  return {
    id: jogador.id,
    name: jogador.nome,
    nickname: jogador.apelido || jogador.nome,
    position: (jogador.funcaoEmQuadra as any) || 'Fixo', // Mapear para Position type
    jerseyNumber: jogador.numeroCamisa || 0,
    dominantFoot: (jogador.peDominante as any) || 'Destro',
    age,
    height: jogador.altura ? Number(jogador.altura) : 0,
    weight: jogador.peso ? Number(jogador.peso) : undefined,
    lastClub: jogador.ultimoClube || '',
    photoUrl: jogador.fotoUrl || undefined,
    isTransferred: jogador.isTransferido || false,
    transferDate: formatDate(jogador.dataTransferencia || undefined),
    birthDate: formatDate(jogador.dataNascimento || undefined),
    injuryHistory: injuryHistory.length > 0 ? injuryHistory : undefined,
    maxLoads: Array.isArray(jogador.maxLoadsJson) ? (jogador.maxLoadsJson as any[]) : undefined,
  };
}

/**
 * Transforma array de jogadores para formato do frontend
 */
export function transformPlayersToFrontend(
  jogadores: JogadorDB[],
  lesoesMap: Map<string, LesaoDB[]>,
  avaliacoesMap: Map<string, AvaliacaoFisicaDB[]>
): Player[] {
  return jogadores.map((jogador) => {
    const lesoes = lesoesMap.get(jogador.id) || [];
    const avaliacoes = avaliacoesMap.get(jogador.id) || [];
    return transformPlayerToFrontend(jogador, lesoes, avaliacoes);
  });
}

