/**
 * Service para Jogadores
 * Lógica de negócio e orquestração
 */

import { TenantInfo } from '../utils/tenant.helper';
import { playersRepository } from '../repositories/players.repository';
import { lesoesRepository } from '../repositories/lesoes.repository';
import { assessmentsRepository } from '../repositories/assessments.repository';
import { transformPlayerToFrontend } from '../adapters/player.adapter';
import { Player } from '../types/frontend';
import { NotFoundError } from '../utils/errors';
import prisma from '../config/database';

export const playersService = {
  /**
   * Buscar todos os jogadores do tenant
   */
  async getAll(tenantInfo: TenantInfo): Promise<Player[]> {
    // Buscar jogadores do banco
    const jogadores = await playersRepository.findAll(tenantInfo);
    
    if (jogadores.length === 0) {
      return [];
    }

    // Buscar lesões e avaliações relacionadas
    const jogadorIds = jogadores.map(j => j.id);
    const [lesoes, avaliacoes] = await Promise.all([
      lesoesRepository.findByJogadores(jogadorIds, tenantInfo),
      assessmentsRepository.findAll(tenantInfo),
    ]);

    // Agrupar lesões e avaliações por jogador
    const lesoesMap = new Map<string, typeof lesoes>();
    lesoes.forEach(lesao => {
      const key = lesao.jogadorId;
      if (!lesoesMap.has(key)) {
        lesoesMap.set(key, []);
      }
      lesoesMap.get(key)!.push(lesao);
    });

    const avaliacoesMap = new Map<string, typeof avaliacoes>();
    avaliacoes.forEach(av => {
      const key = av.jogadorId;
      if (!avaliacoesMap.has(key)) {
        avaliacoesMap.set(key, []);
      }
      avaliacoesMap.get(key)!.push(av);
    });

    // Transformar para formato frontend usando adapter
    return jogadores.map(jogador => {
      const lesoesJogador = lesoesMap.get(jogador.id) || [];
      const avaliacoesJogador = avaliacoesMap.get(jogador.id) || [];
      
      return transformPlayerToFrontend(
        jogador as any,
        lesoesJogador as any,
        avaliacoesJogador as any
      );
    });
  },

  /**
   * Buscar jogador por ID
   */
  async getById(id: string, tenantInfo: TenantInfo): Promise<Player> {
    const jogador = await playersRepository.findById(id, tenantInfo);
    
    if (!jogador) {
      throw new NotFoundError('Jogador', id);
    }

    // Buscar lesões e avaliações
    const [lesoes, avaliacoes] = await Promise.all([
      lesoesRepository.findByJogador(id, tenantInfo),
      assessmentsRepository.findByJogador(id, tenantInfo),
    ]);

    return transformPlayerToFrontend(
      jogador as any,
      lesoes as any,
      avaliacoes as any
    );
  },

  /**
   * Criar novo jogador
   */
  async create(data: {
    nome: string;
    apelido?: string;
    dataNascimento?: Date;
    idade?: number;
    funcaoEmQuadra?: string;
    numeroCamisa?: number;
    peDominante?: string;
    altura?: number;
    peso?: number;
    ultimoClube?: string;
    fotoUrl?: string;
    isTransferido?: boolean;
    dataTransferencia?: Date;
    isAtivo?: boolean;
    equipeId?: string; // ID da equipe para vincular o jogador
  }, tenantInfo: TenantInfo): Promise<Player> {
    try {
      console.log('[PLAYERS_SERVICE] create - Iniciando criação de jogador:', {
        nome: data.nome,
        equipeId: data.equipeId,
        tenant_tecnico_id: tenantInfo.tecnico_id,
        tenant_clube_id: tenantInfo.clube_id,
        tenant_equipe_ids: tenantInfo.equipe_ids,
      });

      // Validação: garantir que tenantInfo existe
      if (!tenantInfo) {
        console.error('[PLAYERS_SERVICE] create - ERRO: tenantInfo não fornecido');
        throw new Error('Tenant info não fornecido');
      }

      // Equipes do tenant (podem estar vazias – cadastro é só de atletas)
      const equipeIds = tenantInfo.equipe_ids || [];
      console.log('[PLAYERS_SERVICE] create - Equipes do tenant:', equipeIds);

      let equipeIdParaVincular: string | undefined = data.equipeId;

      if (equipeIds.length > 0) {
        equipeIdParaVincular = equipeIdParaVincular || equipeIds[0];
        if (equipeIdParaVincular && !equipeIds.includes(equipeIdParaVincular)) {
          console.error('[PLAYERS_SERVICE] create - ERRO: Equipe não pertence ao tenant');
          throw new Error('A equipe selecionada não pertence ao seu tenant.');
        }
        console.log('[PLAYERS_SERVICE] create - Usando equipe:', equipeIdParaVincular);
      } else if (tenantInfo.tecnico_id) {
        // Sem equipes: criar equipe padrão "Elenco" e usar para o vínculo
        const existente = await prisma.equipe.findFirst({
          where: {
            tecnicoId: tenantInfo.tecnico_id,
            nome: 'Elenco',
          },
        });
        if (existente) {
          equipeIdParaVincular = existente.id;
          console.log('[PLAYERS_SERVICE] create - Usando equipe padrão existente:', equipeIdParaVincular);
        } else {
          const elenco = await prisma.equipe.create({
            data: {
              nome: 'Elenco',
              tecnicoId: tenantInfo.tecnico_id,
            },
          });
          equipeIdParaVincular = elenco.id;
          console.log('[PLAYERS_SERVICE] create - Equipe padrão "Elenco" criada:', equipeIdParaVincular);
        }
      } else {
        console.error('[PLAYERS_SERVICE] create - ERRO: Tenant sem técnico nem equipes');
        throw new Error('Configuração do tenant inválida. Entre em contato com o suporte.');
      }

      // Remover equipeId, id, injuryHistory e maxLoads dos dados antes de criar o jogador
      const { equipeId, injuryHistory: injuryHistoryPayload, maxLoads: maxLoadsPayload, ...dadosRecebidos } = data as any;
      delete (dadosRecebidos as any).id;

      // Validar que o nome está presente
      const nome = dadosRecebidos.nome || (dadosRecebidos as any).name;
      if (!nome || nome.trim().length === 0) {
        console.error('[PLAYERS_SERVICE] create - ERRO: Nome não fornecido');
        throw new Error('Nome do jogador é obrigatório');
      }

      // Mapear campos do frontend (inglês) para backend (português)
      // O frontend pode enviar tanto em inglês quanto em português
      const dadosJogador: any = {
        nome: nome.trim(),
        apelido: (dadosRecebidos.apelido && dadosRecebidos.apelido.toString().trim() !== '')
          ? dadosRecebidos.apelido.toString().trim()
          : ((dadosRecebidos as any).nickname && (dadosRecebidos as any).nickname.toString().trim() !== '')
            ? (dadosRecebidos as any).nickname.toString().trim()
            : undefined,
        dataNascimento: (dadosRecebidos.dataNascimento && dadosRecebidos.dataNascimento.toString().trim() !== '')
          ? new Date(dadosRecebidos.dataNascimento)
          : ((dadosRecebidos as any).birthDate && (dadosRecebidos as any).birthDate.toString().trim() !== '')
            ? new Date((dadosRecebidos as any).birthDate)
            : undefined,
        idade: (dadosRecebidos.idade !== undefined && dadosRecebidos.idade !== null && dadosRecebidos.idade !== '' && typeof dadosRecebidos.idade !== 'string')
          ? Number(dadosRecebidos.idade) 
          : ((dadosRecebidos as any).age !== undefined && (dadosRecebidos as any).age !== null && (dadosRecebidos as any).age !== '' && typeof (dadosRecebidos as any).age !== 'string')
            ? Number((dadosRecebidos as any).age) 
            : (typeof dadosRecebidos.idade === 'string' && dadosRecebidos.idade.trim() !== '')
              ? Number(dadosRecebidos.idade)
              : (typeof (dadosRecebidos as any).age === 'string' && (dadosRecebidos as any).age.trim() !== '')
                ? Number((dadosRecebidos as any).age)
                : undefined,
        funcaoEmQuadra: (dadosRecebidos.funcaoEmQuadra && dadosRecebidos.funcaoEmQuadra.toString().trim() !== '')
          ? dadosRecebidos.funcaoEmQuadra.toString().trim()
          : ((dadosRecebidos as any).position && (dadosRecebidos as any).position.toString().trim() !== '')
            ? (dadosRecebidos as any).position.toString().trim()
            : undefined,
        numeroCamisa: (dadosRecebidos.numeroCamisa !== undefined && dadosRecebidos.numeroCamisa !== null && dadosRecebidos.numeroCamisa !== '' && typeof dadosRecebidos.numeroCamisa !== 'string')
          ? Number(dadosRecebidos.numeroCamisa) 
          : ((dadosRecebidos as any).jerseyNumber !== undefined && (dadosRecebidos as any).jerseyNumber !== null && (dadosRecebidos as any).jerseyNumber !== '' && typeof (dadosRecebidos as any).jerseyNumber !== 'string')
            ? Number((dadosRecebidos as any).jerseyNumber) 
            : (typeof dadosRecebidos.numeroCamisa === 'string' && dadosRecebidos.numeroCamisa.trim() !== '')
              ? Number(dadosRecebidos.numeroCamisa)
              : (typeof (dadosRecebidos as any).jerseyNumber === 'string' && (dadosRecebidos as any).jerseyNumber.trim() !== '')
                ? Number((dadosRecebidos as any).jerseyNumber)
                : undefined,
        peDominante: (dadosRecebidos.peDominante && dadosRecebidos.peDominante.toString().trim() !== '')
          ? dadosRecebidos.peDominante.toString().trim()
          : ((dadosRecebidos as any).dominantFoot && (dadosRecebidos as any).dominantFoot.toString().trim() !== '')
            ? (dadosRecebidos as any).dominantFoot.toString().trim()
            : undefined,
        altura: (dadosRecebidos.altura !== undefined && dadosRecebidos.altura !== null && dadosRecebidos.altura !== '' && typeof dadosRecebidos.altura !== 'string')
          ? Number(dadosRecebidos.altura) 
          : ((dadosRecebidos as any).height !== undefined && (dadosRecebidos as any).height !== null && (dadosRecebidos as any).height !== '' && typeof (dadosRecebidos as any).height !== 'string')
            ? Number((dadosRecebidos as any).height) 
            : (typeof dadosRecebidos.altura === 'string' && dadosRecebidos.altura.trim() !== '')
              ? Number(dadosRecebidos.altura)
              : (typeof (dadosRecebidos as any).height === 'string' && (dadosRecebidos as any).height.trim() !== '')
                ? Number((dadosRecebidos as any).height)
                : undefined,
        peso: (dadosRecebidos.peso !== undefined && dadosRecebidos.peso !== null && dadosRecebidos.peso !== '' && typeof dadosRecebidos.peso !== 'string')
          ? Number(dadosRecebidos.peso) 
          : ((dadosRecebidos as any).weight !== undefined && (dadosRecebidos as any).weight !== null && (dadosRecebidos as any).weight !== '' && typeof (dadosRecebidos as any).weight !== 'string')
            ? Number((dadosRecebidos as any).weight) 
            : (typeof dadosRecebidos.peso === 'string' && dadosRecebidos.peso.trim() !== '')
              ? Number(dadosRecebidos.peso)
              : (typeof (dadosRecebidos as any).weight === 'string' && (dadosRecebidos as any).weight.trim() !== '')
                ? Number((dadosRecebidos as any).weight)
                : undefined,
        ultimoClube: (dadosRecebidos.ultimoClube && dadosRecebidos.ultimoClube.toString().trim() !== '')
          ? dadosRecebidos.ultimoClube.toString().trim()
          : ((dadosRecebidos as any).lastClub && (dadosRecebidos as any).lastClub.toString().trim() !== '')
            ? (dadosRecebidos as any).lastClub.toString().trim()
            : undefined,
        fotoUrl: (dadosRecebidos.fotoUrl && dadosRecebidos.fotoUrl.toString().trim() !== '')
          ? dadosRecebidos.fotoUrl.toString().trim()
          : ((dadosRecebidos as any).photoUrl && (dadosRecebidos as any).photoUrl.toString().trim() !== '')
            ? (dadosRecebidos as any).photoUrl.toString().trim()
            : undefined,
        maxLoadsJson: Array.isArray(maxLoadsPayload) && maxLoadsPayload.length > 0
          ? maxLoadsPayload
          : undefined,
        isTransferido: dadosRecebidos.isTransferido !== undefined 
          ? Boolean(dadosRecebidos.isTransferido) 
          : (dadosRecebidos as any).isTransferred !== undefined 
            ? Boolean((dadosRecebidos as any).isTransferred) 
            : false,
        dataTransferencia: (dadosRecebidos.dataTransferencia && dadosRecebidos.dataTransferencia.toString().trim() !== '')
          ? new Date(dadosRecebidos.dataTransferencia)
          : ((dadosRecebidos as any).transferDate && (dadosRecebidos as any).transferDate.toString().trim() !== '')
            ? new Date((dadosRecebidos as any).transferDate)
            : undefined,
        isAtivo: dadosRecebidos.isAtivo !== undefined 
          ? Boolean(dadosRecebidos.isAtivo) 
          : true,
      };

      // Remover apenas campos undefined (manter null, 0, false, etc.)
      Object.keys(dadosJogador).forEach(key => {
        if (dadosJogador[key] === undefined) {
          delete dadosJogador[key];
        }
      });

      // Garantir que campos obrigatórios estão presentes
      if (!dadosJogador.nome) {
        throw new Error('Nome do jogador é obrigatório');
      }

      console.log('[PLAYERS_SERVICE] create - Dados do jogador mapeados:', {
        nome: dadosJogador.nome,
        numeroCamisa: dadosJogador.numeroCamisa,
        funcaoEmQuadra: dadosJogador.funcaoEmQuadra,
        idade: dadosJogador.idade,
        altura: dadosJogador.altura,
      });

      // Criar jogador
      const jogador = await playersRepository.create(dadosJogador);
      console.log('[PLAYERS_SERVICE] create - Jogador criado no banco:', {
        id: jogador.id,
        nome: jogador.nome,
      });

      // Vincular jogador à equipe especificada
      try {
        console.log('[PLAYERS_SERVICE] create - Verificando vínculo existente:', {
          jogadorId: jogador.id,
          equipeId: equipeIdParaVincular,
        });

        // Verificar se já existe vínculo ativo
        const vinculoExistente = await prisma.equipesJogadores.findFirst({
          where: {
            jogadorId: jogador.id,
            equipeId: equipeIdParaVincular,
            dataFim: null,
          },
        });

        if (vinculoExistente) {
          console.log('[PLAYERS_SERVICE] create - Vínculo já existe, pulando criação');
        } else {
          // Usar apenas a data (sem hora) para dataInicio
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          
          console.log('[PLAYERS_SERVICE] create - Criando vínculo:', {
            equipeId: equipeIdParaVincular,
            jogadorId: jogador.id,
            dataInicio: hoje,
          });

          await prisma.equipesJogadores.create({
            data: {
              equipeId: equipeIdParaVincular,
              jogadorId: jogador.id,
              dataInicio: hoje,
              dataFim: null,
            },
          });

          console.log('[PLAYERS_SERVICE] create - Vínculo criado com sucesso');
        }

        // Persistir lesões se houver
        const injuries = Array.isArray(injuryHistoryPayload) ? injuryHistoryPayload : [];
        for (const inj of injuries) {
          const startDate = inj.startDate || inj.date;
          if (!startDate) continue;
          const endDateVal = inj.returnDateActual || inj.returnDate || inj.endDate;
          await prisma.lesao.create({
            data: {
              jogadorId: jogador.id,
              data: new Date(startDate),
              dataInicio: new Date(startDate),
              dataFim: endDateVal ? new Date(endDateVal) : null,
              tipo: inj.type || 'Outros',
              localizacao: inj.location || 'Não informado',
              lado: inj.side || null,
              severidade: inj.severity || null,
              origem: inj.origin || null,
              diasAfastado: inj.daysOut ?? null,
            },
          });
        }
      } catch (error: any) {
        // Se houver erro ao vincular, fazer rollback: deletar o jogador criado
        console.error('[PLAYERS_SERVICE] create - ERRO ao vincular jogador à equipe:', {
          error: error?.message,
          code: error?.code,
          meta: error?.meta,
          stack: error?.stack,
        });
        
        try {
          await playersRepository.delete(jogador.id);
          console.log('[PLAYERS_SERVICE] create - Rollback: Jogador deletado');
        } catch (deleteError) {
          console.error('[PLAYERS_SERVICE] create - ERRO ao fazer rollback:', deleteError);
        }
        
        throw new Error(`Erro ao vincular jogador à equipe: ${error.message || 'Equipe não encontrada'}`);
      }

      // Retornar transformado (sem lesões/avaliações ainda)
      return transformPlayerToFrontend(
        jogador as any,
        [],
        []
      );
    } catch (error: any) {
      console.error('Erro ao criar jogador:', error);
      throw error;
    }
  },

  /**
   * Atualizar jogador
   * Mapeia campos do frontend (name, jerseyNumber, etc.) para o banco (nome, numeroCamisa, etc.)
   */
  async update(id: string, data: Partial<any>, tenantInfo: TenantInfo): Promise<Player> {
    const existing = await playersRepository.findById(id, tenantInfo);
    if (!existing) {
      throw new NotFoundError('Jogador', id);
    }

    const d = data as any;
    const mapNum = (v: any) => (v !== undefined && v !== null && v !== '') ? Number(v) : undefined;
    const mapDate = (v: any) => (v && String(v).trim() !== '') ? new Date(v) : undefined;
    const mapStr = (v: any) => (v != null && String(v).trim() !== '') ? String(v).trim() : undefined;

    const payload: Record<string, unknown> = {};
    const nome = mapStr(d.nome ?? d.name); if (nome !== undefined) payload.nome = nome;
    const apelido = mapStr(d.apelido ?? d.nickname); if (apelido !== undefined) payload.apelido = apelido;
    const idade = mapNum(d.idade ?? d.age); if (idade !== undefined) payload.idade = idade;
    const funcao = mapStr(d.funcaoEmQuadra ?? d.position); if (funcao !== undefined) payload.funcaoEmQuadra = funcao;
    const numero = mapNum(d.numeroCamisa ?? d.jerseyNumber); if (numero !== undefined) payload.numeroCamisa = numero;
    const pe = mapStr(d.peDominante ?? d.dominantFoot); if (pe !== undefined) payload.peDominante = pe;
    const altura = mapNum(d.altura ?? d.height); if (altura !== undefined) payload.altura = altura;
    const peso = mapNum(d.peso ?? d.weight); if (peso !== undefined) payload.peso = peso;
    const ultimo = mapStr(d.ultimoClube ?? d.lastClub); if (ultimo !== undefined) payload.ultimoClube = ultimo;
    const foto = mapStr(d.fotoUrl ?? d.photoUrl); if (foto !== undefined) payload.fotoUrl = foto;
    if (d.isTransferido !== undefined || d.isTransferred !== undefined) {
      payload.isTransferido = Boolean(d.isTransferido ?? d.isTransferred);
    }
    const dtTransfer = mapDate(d.dataTransferencia ?? d.transferDate);
    if (dtTransfer !== undefined) payload.dataTransferencia = dtTransfer;
    const dtNasc = mapDate(d.dataNascimento ?? d.birthDate);
    if (dtNasc !== undefined) payload.dataNascimento = dtNasc;
    if (d.isAtivo !== undefined) payload.isAtivo = Boolean(d.isAtivo);
    if (Array.isArray(d.maxLoads) && d.maxLoads.length > 0) payload.maxLoadsJson = d.maxLoads;

    const jogador = await playersRepository.update(id, payload as any);

    // Sincronizar lesões (injuryHistory)
    const injuryHistory = (d as any).injuryHistory;
    if (Array.isArray(injuryHistory)) {
      await prisma.lesao.deleteMany({ where: { jogadorId: id } });
      for (const inj of injuryHistory) {
        const startDate = inj.startDate || inj.date;
        if (!startDate) continue;
        const endDateVal = inj.returnDateActual || inj.returnDate || inj.endDate;
        await prisma.lesao.create({
          data: {
            jogadorId: id,
            data: new Date(startDate),
            dataInicio: new Date(startDate),
            dataFim: endDateVal ? new Date(endDateVal) : null,
            tipo: inj.type || 'Outros',
            localizacao: inj.location || 'Não informado',
            lado: inj.side || null,
            severidade: inj.severity || null,
            origem: inj.origin || null,
            diasAfastado: inj.daysOut ?? null,
          },
        });
      }
    }

    const [lesoes, avaliacoes] = await Promise.all([
      lesoesRepository.findByJogador(id, tenantInfo),
      assessmentsRepository.findByJogador(id, tenantInfo),
    ]);

    return transformPlayerToFrontend(
      jogador as any,
      lesoes as any,
      avaliacoes as any
    );
  },

  /**
   * Deletar jogador
   */
  async delete(id: string, tenantInfo: TenantInfo): Promise<boolean> {
    // Verificar se jogador existe e pertence ao tenant
    const existing = await playersRepository.findById(id, tenantInfo);
    if (!existing) {
      throw new NotFoundError('Jogador', id);
    }

    await playersRepository.delete(id);
    return true;
  },
};

