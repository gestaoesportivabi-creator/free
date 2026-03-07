/**
 * Script para popular o sistema com dados fictícios de demonstração
 * 
 * Uso: npm run seed:demo [--clean]
 */

import prisma from '../src/config/database';
import { getTenantInfo } from '../src/utils/tenant.helper';
import { generateBrazilianName, generateNickname, generateTeamName } from './helpers/name-generator';
import { generateTeamStats, generatePlayerStats } from './helpers/stats-generator';
import { generateTimeControls, generateScheduleDays, generateInjury, generateAssessment, generateBaseAssessmentData } from './helpers/data-generators';

const ADMIN_EMAIL = 'admin@admin.com';

interface SeedProgress {
  equipes: number;
  jogadores: number;
  competicoes: number;
  jogos: number;
  estatisticasEquipe: number;
  estatisticasJogador: number;
  timeControls: number;
  avaliacoes: number;
  programacoes: number;
  campeonatos: number;
  campeonatosJogos: number;
  metas: number;
  lesoes: number;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClean = args.includes('--clean');
  
  console.log('🌱 Iniciando seed de dados de demonstração...\n');
  
  // Buscar técnico admin
  console.log('📋 Buscando técnico admin...');
  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    include: { tecnico: true, clube: true },
  });
  
  if (!user) {
    throw new Error(`Usuário ${ADMIN_EMAIL} não encontrado!`);
  }
  
  if (!user.tecnico) {
    throw new Error(`Usuário ${ADMIN_EMAIL} não possui técnico associado!`);
  }
  
  console.log(`✓ Técnico encontrado: ${user.tecnico.nome} (ID: ${user.tecnico.id})\n`);
  
  // Obter tenantInfo
  const tenantInfo = await getTenantInfo(
    { id: user.id, role_id: user.roleId, email: user.email, name: user.name },
    async (userId: string) => {
      const t = await prisma.tecnico.findUnique({ where: { userId } });
      return t ? { id: t.id, user_id: t.userId, nome: t.nome } : null;
    },
    async (userId: string) => {
      const c = await prisma.clube.findUnique({ where: { userId } });
      return c ? { id: c.id, user_id: c.userId, razao_social: c.razaoSocial } : null;
    },
    async (tecnicoId: string) => {
      const equipes = await prisma.equipe.findMany({ where: { tecnicoId }, select: { id: true } });
      return equipes;
    },
    async (clubeId: string) => {
      const equipes = await prisma.equipe.findMany({ where: { clubeId }, select: { id: true } });
      return equipes;
    }
  );
  
  if (!tenantInfo.tecnico_id) {
    throw new Error('Não foi possível obter tenantInfo do técnico!');
  }
  
  console.log(`✓ TenantInfo obtido: tecnico_id=${tenantInfo.tecnico_id}\n`);
  
  // Limpar dados anteriores se solicitado
  if (shouldClean) {
    console.log('🧹 Limpando dados anteriores do técnico...');
    await cleanData(tenantInfo);
    console.log('✓ Dados anteriores limpos\n');
  }
  
  const progress: SeedProgress = {
    equipes: 0,
    jogadores: 0,
    competicoes: 0,
    jogos: 0,
    estatisticasEquipe: 0,
    estatisticasJogador: 0,
    timeControls: 0,
    avaliacoes: 0,
    programacoes: 0,
    campeonatos: 0,
    campeonatosJogos: 0,
    metas: 0,
    lesoes: 0,
  };
  
  // 1. Criar Equipes (4-5 equipes)
  console.log('👥 Criando equipes...');
  const equipes = await seedEquipes(tenantInfo.tecnico_id);
  progress.equipes = equipes.length;
  console.log(`✓ ${equipes.length} equipes criadas\n`);
  
  // Atualizar tenantInfo com as novas equipes
  tenantInfo.equipe_ids = equipes.map(e => e.id);
  
  // 2. Criar Jogadores (25-30 por equipe = 125-150 total)
  console.log('⚽ Criando jogadores...');
  const jogadores = await seedJogadores(equipes, tenantInfo);
  progress.jogadores = jogadores.length;
  console.log(`✓ ${jogadores.length} jogadores criados\n`);
  
  // 3. Criar Competições (5-6 competições)
  console.log('🏆 Criando competições...');
  const competicoes = await seedCompetitions();
  progress.competicoes = competicoes.length;
  console.log(`✓ ${competicoes.length} competições criadas\n`);
  
  // 4. Criar Jogos (50-60 jogos ao longo de 3 meses)
  console.log('🎮 Criando jogos...');
  const jogos = await seedJogos(equipes, competicoes);
  progress.jogos = jogos.length;
  console.log(`✓ ${jogos.length} jogos criados\n`);
  
  // 5. Criar Estatísticas de Jogos
  console.log('📊 Criando estatísticas de jogos...');
  const stats = await seedEstatisticas(jogos, jogadores);
  progress.estatisticasEquipe = stats.estatisticasEquipe;
  progress.estatisticasJogador = stats.estatisticasJogador;
  console.log(`✓ ${stats.estatisticasEquipe} estatísticas de equipe e ${stats.estatisticasJogador} de jogadores criadas\n`);
  
  // 6. Criar Time Controls
  console.log('⏱️ Criando time controls...');
  const timeControlsCount = await seedTimeControls(jogos, jogadores);
  progress.timeControls = timeControlsCount;
  console.log(`✓ ${timeControlsCount} time controls criados\n`);
  
  // 7. Criar Avaliações Físicas (3-4 por jogador)
  console.log('💪 Criando avaliações físicas...');
  const avaliacoesCount = await seedAvaliacoes(jogadores);
  progress.avaliacoes = avaliacoesCount;
  console.log(`✓ ${avaliacoesCount} avaliações físicas criadas\n`);
  
  // 8. Criar Programações Semanais (12-15 programações)
  console.log('📅 Criando programações semanais...');
  const programacoesCount = await seedProgramacoes(equipes);
  progress.programacoes = programacoesCount;
  console.log(`✓ ${programacoesCount} programações criadas\n`);
  
  // 9. Criar Campeonatos e Jogos de Campeonato
  console.log('🏅 Criando campeonatos...');
  const campeonatosData = await seedCampeonatos(equipes, jogos);
  progress.campeonatos = campeonatosData.campeonatos;
  progress.campeonatosJogos = campeonatosData.campeonatosJogos;
  console.log(`✓ ${campeonatosData.campeonatos} campeonatos e ${campeonatosData.campeonatosJogos} jogos de campeonato criados`);
  console.log(`   - Partidas FINALIZADAS: 60 (com dados de scout)`);
  console.log(`   - Partidas INCOMPLETAS: 5 (passadas sem dados)`);
  console.log(`   - Partidas PROGRAMADAS: 8 (futuras)\n`);
  
  // 10. Criar Metas de Estatísticas
  console.log('🎯 Criando metas de estatísticas...');
  const metasCount = await seedMetas(equipes);
  progress.metas = metasCount;
  console.log(`✓ ${metasCount} metas criadas\n`);
  
  // 11. Criar Lesões (50-80 lesões)
  console.log('🏥 Criando lesões...');
  const lesoesCount = await seedLesoes(jogadores);
  progress.lesoes = lesoesCount;
  console.log(`✓ ${lesoesCount} lesões criadas\n`);
  
  // Resumo final
  console.log('\n✅ Seed concluído com sucesso!\n');
  console.log('📊 Resumo:');
  console.log(`   - Equipes: ${progress.equipes}`);
  console.log(`   - Jogadores: ${progress.jogadores}`);
  console.log(`   - Competições: ${progress.competicoes}`);
  console.log(`   - Jogos: ${progress.jogos}`);
  console.log(`   - Estatísticas (Equipe): ${progress.estatisticasEquipe}`);
  console.log(`   - Estatísticas (Jogador): ${progress.estatisticasJogador}`);
  console.log(`   - Time Controls: ${progress.timeControls}`);
  console.log(`   - Avaliações Físicas: ${progress.avaliacoes}`);
  console.log(`   - Programações: ${progress.programacoes}`);
  console.log(`   - Campeonatos: ${progress.campeonatos}`);
  console.log(`   - Jogos de Campeonato: ${progress.campeonatosJogos}`);
  console.log(`   - Metas: ${progress.metas}`);
  console.log(`   - Lesões: ${progress.lesoes}\n`);
}

async function cleanData(tenantInfo: any) {
  // Deletar em ordem reversa de dependências
  const equipeIds = tenantInfo.equipe_ids || [];
  
  if (equipeIds.length > 0) {
    // Buscar jogadores vinculados
    const jogadoresVinculados = await prisma.equipesJogadores.findMany({
      where: { equipeId: { in: equipeIds } },
      select: { jogadorId: true },
    });
    const jogadorIds = [...new Set(jogadoresVinculados.map(v => v.jogadorId))];
    
    if (jogadorIds.length > 0) {
      // Deletar lesões, avaliações, estatísticas de jogadores
      await prisma.lesao.deleteMany({ where: { jogadorId: { in: jogadorIds } } });
      await prisma.avaliacaoFisica.deleteMany({ where: { jogadorId: { in: jogadorIds } } });
      await prisma.jogosEstatisticasJogador.deleteMany({ where: { jogadorId: { in: jogadorIds } } });
      await prisma.jogosEventos.deleteMany({ where: { jogadorId: { in: jogadorIds } } });
      await prisma.equipesJogadores.deleteMany({ where: { jogadorId: { in: jogadorIds } } });
      await prisma.jogador.deleteMany({ where: { id: { in: jogadorIds } } });
    }
    
    // Buscar jogos
    const jogos = await prisma.jogo.findMany({
      where: { equipeId: { in: equipeIds } },
      select: { id: true },
    });
    const jogoIds = jogos.map(j => j.id);
    
    if (jogoIds.length > 0) {
      await prisma.jogosEstatisticasEquipe.deleteMany({ where: { jogoId: { in: jogoIds } } });
      await prisma.jogosEstatisticasJogador.deleteMany({ where: { jogoId: { in: jogoIds } } });
      await prisma.jogosEventos.deleteMany({ where: { jogoId: { in: jogoIds } } });
      await prisma.campeonatosJogos.deleteMany({ where: { jogoId: { in: jogoIds } } });
      await prisma.jogo.deleteMany({ where: { id: { in: jogoIds } } });
    }
    
    // Deletar programações, campeonatos, metas
    // Primeiro buscar programações para deletar os dias
    const programacoes = await prisma.programacao.findMany({
      where: { equipeId: { in: equipeIds } },
      select: { id: true },
    });
    const programacaoIds = programacoes.map(p => p.id);
    if (programacaoIds.length > 0) {
      await prisma.programacoesDias.deleteMany({ where: { programacaoId: { in: programacaoIds } } });
    }
    await prisma.programacao.deleteMany({ where: { equipeId: { in: equipeIds } } });
    await prisma.campeonato.deleteMany({ where: { equipeId: { in: equipeIds } } });
    await prisma.metasEstatisticas.deleteMany({ where: { equipeId: { in: equipeIds } } });
  }
  
  // Deletar equipes
  await prisma.equipe.deleteMany({ where: { tecnicoId: tenantInfo.tecnico_id } });
}

async function seedEquipes(tecnicoId: string) {
  const categorias = [
    { nome: 'Equipe Principal - Futsal', categoria: 'Adulto', temporada: '2024' },
  ];
  
  const equipes = [];
  for (const cat of categorias) {
    const equipe = await prisma.equipe.create({
      data: {
        nome: cat.nome,
        categoria: cat.categoria,
        temporada: cat.temporada,
        tecnicoId,
      },
    });
    equipes.push(equipe);
  }
  
  return equipes;
}

async function seedJogadores(equipes: any[], tenantInfo: any) {
  const distribuicaoPosicoes: Record<string, number> = {
    'Goleiro': 3,
    'Fixo': 5,
    'Ala': 10,
    'Pivô': 7,
  };
  
  const jogadores = [];
  
  for (const equipe of equipes) {
    const categoria = equipe.categoria || 'Adulto';
    const idadeMin = categoria === 'Sub-15' ? 13 : categoria === 'Sub-17' ? 15 : categoria === 'Sub-20' ? 18 : 20;
    const idadeMax = categoria === 'Sub-15' ? 15 : categoria === 'Sub-17' ? 17 : categoria === 'Sub-20' ? 20 : 35;
    
    const numJogadores = 25; // Exatamente 25 jogadores
    const numerosUsados = new Set<number>();
    let jogadoresEquipe = 0;
    
    // Criar jogadores por posição até atingir o número desejado
    for (const [posicao, quantidade] of Object.entries(distribuicaoPosicoes)) {
      const quantidadeAjustada = Math.min(quantidade, numJogadores - jogadoresEquipe);
      for (let i = 0; i < quantidadeAjustada && jogadoresEquipe < numJogadores; i++) {
        const nome = generateBrazilianName();
        const apelido = generateNickname(nome);
        const idade = idadeMin + Math.floor(Math.random() * (idadeMax - idadeMin + 1));
        const dataNascimento = new Date();
        dataNascimento.setFullYear(dataNascimento.getFullYear() - idade);
        dataNascimento.setMonth(Math.floor(Math.random() * 12));
        dataNascimento.setDate(1 + Math.floor(Math.random() * 28));
        
        // Gerar número de camisa único na equipe
        let numeroCamisa;
        do {
          numeroCamisa = 1 + Math.floor(Math.random() * 99);
        } while (numerosUsados.has(numeroCamisa));
        numerosUsados.add(numeroCamisa);
        
        const altura = categoria === 'Sub-15' ? 150 + Math.random() * 20 : 160 + Math.random() * 35;
        const peso = (altura / 100) ** 2 * (20 + Math.random() * 5); // IMC 20-25
        
        const peDominante = Math.random() < 0.7 ? 'Direito' : 'Esquerdo';
        const isTransferido = Math.random() < 0.1; // 10% transferidos
        const dataTransferencia = isTransferido ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) : null;
        
        const jogador = await prisma.jogador.create({
          data: {
            nome,
            apelido,
            dataNascimento,
            idade,
            funcaoEmQuadra: posicao,
            numeroCamisa,
            peDominante,
            altura: Math.round(altura * 100) / 100,
            peso: Math.round(peso * 100) / 100,
            ultimoClube: isTransferido ? generateTeamName(categoria) : undefined,
            isTransferido,
            dataTransferencia,
            isAtivo: true,
          },
        });
        
        // Vincular jogador à equipe
        await prisma.equipesJogadores.create({
          data: {
            equipeId: equipe.id,
            jogadorId: jogador.id,
            dataInicio: new Date(),
            dataFim: null,
          },
        });
        
        jogadores.push(jogador);
        jogadoresEquipe++;
      }
    }
    
    // Se ainda faltam jogadores, criar mais (distribuindo entre as posições)
    while (jogadoresEquipe < numJogadores) {
      const posicoes = ['Goleiro', 'Fixo', 'Ala', 'Pivô'];
      const posicao = posicoes[Math.floor(Math.random() * posicoes.length)];
      
      const nome = generateBrazilianName();
      const apelido = generateNickname(nome);
      const idade = idadeMin + Math.floor(Math.random() * (idadeMax - idadeMin + 1));
      const dataNascimento = new Date();
      dataNascimento.setFullYear(dataNascimento.getFullYear() - idade);
      dataNascimento.setMonth(Math.floor(Math.random() * 12));
      dataNascimento.setDate(1 + Math.floor(Math.random() * 28));
      
      let numeroCamisa;
      do {
        numeroCamisa = 1 + Math.floor(Math.random() * 99);
      } while (numerosUsados.has(numeroCamisa));
      numerosUsados.add(numeroCamisa);
      
      const altura = categoria === 'Sub-15' ? 150 + Math.random() * 20 : 160 + Math.random() * 35;
      const peso = (altura / 100) ** 2 * (20 + Math.random() * 5);
      const peDominante = Math.random() < 0.7 ? 'Direito' : 'Esquerdo';
      const isTransferido = Math.random() < 0.1;
      const dataTransferencia = isTransferido ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) : null;
      
      const jogador = await prisma.jogador.create({
        data: {
          nome,
          apelido,
          dataNascimento,
          idade,
          funcaoEmQuadra: posicao,
          numeroCamisa,
          peDominante,
          altura: Math.round(altura * 100) / 100,
          peso: Math.round(peso * 100) / 100,
          ultimoClube: isTransferido ? generateTeamName(categoria) : undefined,
          isTransferido,
          dataTransferencia,
          isAtivo: true,
        },
      });
      
      await prisma.equipesJogadores.create({
        data: {
          equipeId: equipe.id,
          jogadorId: jogador.id,
          dataInicio: new Date(),
          dataFim: null,
        },
      });
      
      jogadores.push(jogador);
      jogadoresEquipe++;
    }
  }
  
  return jogadores;
}

async function seedCompetitions() {
  const nomes = [
    'Campeonato Estadual de Futsal 2024',
    'Copa Regional de Futsal 2024',
    'Liga Municipal de Futsal 2024',
    'Taça Cidade de Futsal 2024',
  ];
  
  const competicoes = [];
  for (const nome of nomes) {
    const existing = await prisma.competicao.findUnique({ where: { nome } });
    if (!existing) {
      const competicao = await prisma.competicao.create({ data: { nome } });
      competicoes.push(competicao);
    } else {
      competicoes.push(existing);
    }
  }
  
  return competicoes;
}

async function seedJogos(equipes: any[], competicoes: any[]) {
  const jogos = [];
  const hoje = new Date();
  const tresMesesAtras = new Date(hoje);
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
  
  // Gerar exatamente 60 jogos (15 por campeonato x 4 campeonatos)
  const numJogos = 60;
  const diasSemana = [1, 3, 6, 0]; // Segunda, Quarta, Sábado, Domingo
  
  // Criar lista de datas possíveis (apenas dias úteis para jogos)
  const datasPossiveis: Date[] = [];
  let dataAtual = new Date(tresMesesAtras);
  
  while (dataAtual <= hoje) {
    const diaSemana = dataAtual.getDay();
    if (diasSemana.includes(diaSemana)) {
      datasPossiveis.push(new Date(dataAtual));
    }
    dataAtual.setDate(dataAtual.getDate() + 1);
  }
  
  // Selecionar datas aleatórias para os jogos
  const datasSelecionadas = [...datasPossiveis]
    .sort(() => Math.random() - 0.5)
    .slice(0, numJogos)
    .sort((a, b) => a.getTime() - b.getTime());
  
  for (const dataJogo of datasSelecionadas) {
    const equipe = equipes[Math.floor(Math.random() * equipes.length)];
    const competicao = competicoes[Math.floor(Math.random() * competicoes.length)];
    const adversario = generateTeamName(equipe.categoria || 'Adulto');
    
    // Resultado: 40% V, 30% D, 30% E
    const resultadoRand = Math.random();
    let resultado: string;
    let golsPro: number;
    let golsContra: number;
    
    if (resultadoRand < 0.4) {
      resultado = 'V';
      golsPro = 3 + Math.floor(Math.random() * 5); // 3-7
      golsContra = Math.floor(Math.random() * golsPro); // 0 até golsPro-1
    } else if (resultadoRand < 0.7) {
      resultado = 'D';
      golsContra = 3 + Math.floor(Math.random() * 5); // 3-7
      golsPro = Math.floor(Math.random() * golsContra); // 0 até golsContra-1
    } else {
      resultado = 'E';
      golsPro = Math.floor(Math.random() * 6); // 0-5
      golsContra = golsPro;
    }
    
    const videoUrl = Math.random() < 0.35 ? `https://example.com/video-${Date.now()}-${Math.random()}.mp4` : null;
    const local = ['Ginásio Principal', 'Arena Municipal', 'Quadra Coberta', 'Campo Auxiliar'][Math.floor(Math.random() * 4)];
    
    const jogo = await prisma.jogo.create({
      data: {
        equipeId: equipe.id,
        adversario,
        data: dataJogo,
        competicaoId: competicao.id,
        resultado,
        golsPro,
        golsContra,
        videoUrl,
        local,
      },
    });
    
    jogos.push(jogo);
  }
  
  return jogos;
}

async function seedEstatisticas(jogos: any[], jogadores: any[]) {
  let estatisticasEquipeCount = 0;
  let estatisticasJogadorCount = 0;
  
  for (const jogo of jogos) {
    // Estatísticas da equipe
    const teamStats = generateTeamStats();
    await prisma.jogosEstatisticasEquipe.create({
      data: {
        jogoId: jogo.id,
        ...teamStats,
      },
    });
    estatisticasEquipeCount++;
    
    // Estatísticas de jogadores (10-14 por jogo)
    const numJogadoresNoJogo = 10 + Math.floor(Math.random() * 5);
    const jogadoresNoJogo = [...jogadores].sort(() => Math.random() - 0.5).slice(0, numJogadoresNoJogo);
    
    for (const jogador of jogadoresNoJogo) {
      const minutosJogados = 5 + Math.random() * 40; // 5-45 minutos
      const playerStats = generatePlayerStats(minutosJogados);
      
      await prisma.jogosEstatisticasJogador.create({
        data: {
          jogoId: jogo.id,
          jogadorId: jogador.id,
          ...playerStats,
        },
      });
      estatisticasJogadorCount++;
    }
  }
  
  return { estatisticasEquipe: estatisticasEquipeCount, estatisticasJogador: estatisticasJogadorCount };
}

async function seedTimeControls(jogos: any[], jogadores: any[]) {
  let count = 0;
  
  for (const jogo of jogos) {
    const numJogadores = 10 + Math.floor(Math.random() * 5); // 10-14 jogadores
    const jogadoresNoJogo = [...jogadores].sort(() => Math.random() - 0.5).slice(0, numJogadores);
    
    for (const jogador of jogadoresNoJogo) {
      const timeControls = generateTimeControls(1, 40)[0];
      
      for (const entry of timeControls.entries) {
        // Criar evento ENTRADA
        const [entryMin, entrySec] = entry.entryTime.split(':').map(Number);
        await prisma.jogosEventos.create({
          data: {
            jogoId: jogo.id,
            jogadorId: jogador.id,
            tipoEvento: 'ENTRADA',
            minuto: entryMin,
            segundo: entrySec,
          },
        });
        count++;
        
        // Criar evento SAIDA se houver
        if (entry.exitTime) {
          const [exitMin, exitSec] = entry.exitTime.split(':').map(Number);
          await prisma.jogosEventos.create({
            data: {
              jogoId: jogo.id,
              jogadorId: jogador.id,
              tipoEvento: 'SAIDA',
              minuto: exitMin,
              segundo: exitSec,
            },
          });
          count++;
        }
      }
    }
  }
  
  return count;
}

async function seedAvaliacoes(jogadores: any[]) {
  const hoje = new Date();
  const tresMesesAtras = new Date(hoje);
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
  
  let count = 0;
  
  for (const jogador of jogadores) {
    // 3-4 avaliações por jogador
    const numAvaliacoes = 3 + Math.floor(Math.random() * 2);
    
    // Dados base do jogador
    const baseData = generateBaseAssessmentData(
      jogador.idade || 25,
      Number(jogador.altura) || 175
    );
    
    for (let i = 0; i < numAvaliacoes; i++) {
      const progresso = i / (numAvaliacoes - 1); // 0 a 1
      const diasAtras = tresMesesAtras.getTime() + (hoje.getTime() - tresMesesAtras.getTime()) * progresso;
      const data = new Date(diasAtras);
      
      const assessment = generateAssessment(baseData, progresso);
      
      await prisma.avaliacaoFisica.create({
        data: {
          jogadorId: jogador.id,
          data,
          ...assessment,
        },
      });
      count++;
    }
  }
  
  return count;
}

async function seedProgramacoes(equipes: any[]) {
  const hoje = new Date();
  const tresMesesAtras = new Date(hoje);
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
  
  let count = 0;
  
  // 12-15 programações (4-5 semanas x 3 meses)
  const numProgramacoes = 12 + Math.floor(Math.random() * 4);
  
  for (let i = 0; i < numProgramacoes; i++) {
    const equipe = equipes[Math.floor(Math.random() * equipes.length)];
    const dataInicio = new Date(tresMesesAtras);
    dataInicio.setDate(dataInicio.getDate() + i * 7);
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 6); // 7 dias
    
    const isAtivo = i === numProgramacoes - 1 || i === numProgramacoes - 2; // Últimas 2 ativas
    
    const programacao = await prisma.programacao.create({
      data: {
        equipeId: equipe.id,
        titulo: `Programação Semana ${i + 1}`,
        dataInicio,
        dataFim,
        isAtivo,
      },
    });
    
    // Criar dias da programação
    const dias = generateScheduleDays(dataInicio, dataFim);
    for (const dia of dias) {
      await prisma.programacoesDias.create({
        data: {
          programacaoId: programacao.id,
          ...dia,
        },
      });
    }
    
    count++;
  }
  
  return count;
}

async function seedCampeonatos(equipes: any[], jogos: any[]) {
  const nomes = [
    'Campeonato Estadual de Futsal 2024',
    'Copa Regional de Futsal 2024',
    'Liga Municipal de Futsal 2024',
    'Taça Cidade de Futsal 2024',
  ];
  
  const campeonatos = [];
  for (const nome of nomes) {
    const equipe = equipes[Math.floor(Math.random() * equipes.length)];
    const campeonato = await prisma.campeonato.create({
      data: {
        nome,
        equipeId: equipe.id,
      },
    });
    campeonatos.push(campeonato);
  }
  
  // Buscar jogos completos com competição para usar o nome correto
  const jogosCompletos = await prisma.jogo.findMany({
    where: {
      id: { in: jogos.map((j: any) => j.id) }
    },
    include: {
      competicao: {
        select: { nome: true }
      }
    },
    orderBy: { data: 'asc' }
  });
  
  // Distribuir 60 jogos uniformemente: 15 por campeonato
  const jogosPorCampeonato = 15;
  let count = 0;
  
  for (let i = 0; i < campeonatos.length; i++) {
    const campeonato = campeonatos[i];
    const inicio = i * jogosPorCampeonato;
    const fim = inicio + jogosPorCampeonato;
    const jogosParaCampeonato = jogosCompletos.slice(inicio, fim);
    
    for (const jogo of jogosParaCampeonato) {
      await prisma.campeonatosJogos.create({
        data: {
          campeonatoId: campeonato.id,
          data: jogo.data,
          horario: '20:00',
          equipe: 'Nossa Equipe',
          adversario: jogo.adversario,
          competicao: jogo.competicao?.nome || campeonato.nome,
          local: Math.random() < 0.5 ? 'Mandante' : 'Visitante',
          metaPontuacao: 'Vencer',
          jogoId: jogo.id,
        },
      });
      count++;
    }
  }
  
  // ADICIONAR: Partidas INCOMPLETO (passadas sem dados)
  const hoje = new Date();
  const umMesAtras = new Date(hoje);
  umMesAtras.setMonth(umMesAtras.getMonth() - 1);
  
  // 5 partidas passadas sem dados (INCOMPLETO) - uma por semana no último mês
  for (let i = 0; i < 5; i++) {
    const dataJogo = new Date(umMesAtras);
    dataJogo.setDate(dataJogo.getDate() + (i * 7));
    
    const campeonato = campeonatos[Math.floor(Math.random() * campeonatos.length)];
    const adversarios = ['Futsal Cidade FC', 'Esporte Clube União', 'Atlético Regional', 'Sport Clube Estrela', 'Associação Vitória'];
    
    await prisma.campeonatosJogos.create({
      data: {
        campeonatoId: campeonato.id,
        data: dataJogo,
        horario: '20:00',
        equipe: 'Nossa Equipe',
        adversario: adversarios[i],
        competicao: campeonato.nome,
        local: i % 2 === 0 ? 'Mandante' : 'Visitante',
        metaPontuacao: 'Vencer',
        jogoId: null, // Sem jogo vinculado = INCOMPLETO
      },
    });
    count++;
  }
  
  // ADICIONAR: Partidas PROGRAMADAS (futuras)
  const umMesAFrente = new Date(hoje);
  umMesAFrente.setMonth(umMesAFrente.getMonth() + 1);
  
  // 8 partidas futuras (PROGRAMADA) - 2 por semana nas próximas 4 semanas
  for (let i = 0; i < 8; i++) {
    const dataJogo = new Date(hoje);
    dataJogo.setDate(dataJogo.getDate() + 3 + (i * 3)); // A cada 3 dias
    
    const campeonato = campeonatos[Math.floor(Math.random() * campeonatos.length)];
    const adversarios = [
      'Futebol São Paulo Esporte', 
      'Associação São Paulo FC', 
      'Sport Fortaleza FC', 
      'Atlético Salvador Team', 
      'Futebol São Paulo FC',
      'Sport Porto Alegre Futsal',
      'Clube Rio de Janeiro Futsal',
      'Associação Belo Horizonte Team'
    ];
    const horarios = ['18:00', '19:00', '20:00', '20:30', '21:00'];
    
    await prisma.campeonatosJogos.create({
      data: {
        campeonatoId: campeonato.id,
        data: dataJogo,
        horario: horarios[Math.floor(Math.random() * horarios.length)],
        equipe: 'Nossa Equipe',
        adversario: adversarios[i],
        competicao: campeonato.nome,
        local: i % 2 === 0 ? 'Mandante' : 'Visitante',
        metaPontuacao: 'Vencer',
        jogoId: null, // Sem jogo vinculado = PROGRAMADA (mas com data futura)
      },
    });
    count++;
  }
  
  return { campeonatos: campeonatos.length, campeonatosJogos: count };
}

async function seedMetas(equipes: any[]) {
  let count = 0;
  
  for (const equipe of equipes) {
    await prisma.metasEstatisticas.create({
      data: {
        equipeId: equipe.id,
        gols: 3,
        assistencias: 3,
        passesCorretos: 120,
        passesErrados: 10,
        chutesNoGol: 15,
        chutesFora: 8,
        desarmesComPosse: 12,
        desarmesSemPosse: 15,
        desarmesContraAtaque: 8,
        errosTransicao: 3,
      },
    });
    count++;
  }
  
  return count;
}

async function seedLesoes(jogadores: any[]) {
  const hoje = new Date();
  const tresMesesAtras = new Date(hoje);
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
  
  // 30-40% dos jogadores com pelo menos 1 lesão
  const numJogadoresComLesao = Math.floor(jogadores.length * (0.3 + Math.random() * 0.1));
  const jogadoresComLesao = [...jogadores].sort(() => Math.random() - 0.5).slice(0, numJogadoresComLesao);
  
  let count = 0;
  
  for (const jogador of jogadoresComLesao) {
    // 3-5 lesões por jogador com histórico
    const numLesoes = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numLesoes; i++) {
      const diasAtras = tresMesesAtras.getTime() + Math.random() * (hoje.getTime() - tresMesesAtras.getTime());
      const dataInicio = new Date(diasAtras);
      const data = new Date(dataInicio);
      
      const injury = generateInjury();
      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() + injury.diasAfastado);
      
      // 80% das lesões já curadas
      const isCurada = Math.random() < 0.8;
      
      await prisma.lesao.create({
        data: {
          jogadorId: jogador.id,
          data,
          dataInicio,
          dataFim: isCurada ? dataFim : null,
          tipo: injury.tipo,
          localizacao: injury.localizacao,
          lado: injury.lado,
          severidade: injury.severidade,
          origem: injury.origem,
          diasAfastado: injury.diasAfastado,
        },
      });
      count++;
    }
  }
  
  return count;
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
