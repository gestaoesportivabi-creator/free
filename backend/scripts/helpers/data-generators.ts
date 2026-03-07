/**
 * Geradores diversos de dados para seed
 */

export function generateTimeControls(numJogadores: number, duracaoJogo: number = 40): Array<{
  jogadorId: string;
  entries: Array<{ entryTime: string; exitTime?: string }>;
}> {
  const timeControls: Array<{
    jogadorId: string;
    entries: Array<{ entryTime: string; exitTime?: string }>;
  }> = [];
  
  // 30-40% dos jogadores com múltiplas entradas
  const jogadoresComMultiplasEntradas = Math.floor(numJogadores * (0.3 + Math.random() * 0.1));
  
  for (let i = 0; i < numJogadores; i++) {
    const jogadorId = `jogador-${i}`; // Será substituído pelo ID real
    const entries: Array<{ entryTime: string; exitTime?: string }> = [];
    
    const temMultiplasEntradas = i < jogadoresComMultiplasEntradas;
    const numEntradas = temMultiplasEntradas ? 2 + Math.floor(Math.random() * 2) : 1; // 1-3 entradas
    
    for (let j = 0; j < numEntradas; j++) {
      // Primeira entrada pode começar do início (30% chance)
      const inicio = j === 0 && Math.random() < 0.3 ? 0 : Math.floor(Math.random() * (duracaoJogo - 10));
      const fim = Math.min(inicio + 5 + Math.floor(Math.random() * (duracaoJogo - inicio - 5)), duracaoJogo);
      
      const entryTime = formatTime(inicio);
      const exitTime = formatTime(fim);
      
      entries.push({ entryTime, exitTime });
    }
    
    timeControls.push({ jogadorId, entries });
  }
  
  return timeControls;
}

function formatTime(minutos: number): string {
  const min = Math.floor(minutos);
  const sec = Math.floor((minutos - min) * 60);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function generateScheduleDays(dataInicio: Date, dataFim: Date): Array<{
  data: Date;
  diaSemana: string;
  diaSemanaNumero: number;
  atividade: string;
  horario: string;
  localizacao: string;
  observacoes?: string;
}> {
  const dias: Array<{
    data: Date;
    diaSemana: string;
    diaSemanaNumero: number;
    atividade: string;
    horario: string;
    localizacao: string;
    observacoes?: string;
  }> = [];
  
  const atividades = [
    { nome: 'Treino Técnico', peso: 0.4 },
    { nome: 'Treino Tático', peso: 0.3 },
    { nome: 'Treino Físico', peso: 0.15 },
    { nome: 'Jogo', peso: 0.1 },
    { nome: 'Descanso', peso: 0.05 },
  ];
  
  const horarios = ['07:00', '08:00', '14:00', '18:00', '19:00', '20:00'];
  const localizacoes = ['Ginásio Principal', 'Campo Auxiliar', 'Academia', 'Quadra Coberta'];
  
  const currentDate = new Date(dataInicio);
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  
  while (currentDate <= dataFim) {
    // Pular domingos (geralmente descanso)
    if (currentDate.getDay() !== 0 || Math.random() < 0.3) {
      const diaSemanaNumero = currentDate.getDay();
      const diaSemana = diasSemana[diaSemanaNumero];
      
      // Selecionar atividade baseada no peso
      const rand = Math.random();
      let atividadeSelecionada = atividades[0].nome;
      let acumulado = 0;
      for (const atividade of atividades) {
        acumulado += atividade.peso;
        if (rand <= acumulado) {
          atividadeSelecionada = atividade.nome;
          break;
        }
      }
      
      // Descanso não tem horário/localização
      if (atividadeSelecionada !== 'Descanso') {
        const horario = horarios[Math.floor(Math.random() * horarios.length)];
        const localizacao = localizacoes[Math.floor(Math.random() * localizacoes.length)];
        
        dias.push({
          data: new Date(currentDate),
          diaSemana,
          diaSemanaNumero,
          atividade: atividadeSelecionada,
          horario,
          localizacao,
        });
      } else {
        dias.push({
          data: new Date(currentDate),
          diaSemana,
          diaSemanaNumero,
          atividade: atividadeSelecionada,
          horario: '',
          localizacao: '',
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dias;
}

export function generateInjury(): {
  tipo: string;
  localizacao: string;
  lado?: string;
  severidade: string;
  origem: string;
  diasAfastado: number;
} {
  const tipos = [
    { nome: 'Muscular', peso: 0.5 },
    { nome: 'Trauma', peso: 0.3 },
    { nome: 'Articular', peso: 0.15 },
    { nome: 'Outros', peso: 0.05 },
  ];
  
  const localizacoes = [
    'Coxa', 'Panturrilha', 'Joelho', 'Tornozelo', 'Pé', 'Quadril', 'Virilha',
    'Ombro', 'Braço', 'Cotovelo', 'Pulso', 'Mão', 'Costas', 'Abdômen'
  ];
  
  const lados = ['Direito', 'Esquerdo'];
  const severidades = [
    { nome: 'Leve', peso: 0.4, diasMin: 1, diasMax: 7 },
    { nome: 'Moderada', peso: 0.4, diasMin: 8, diasMax: 30 },
    { nome: 'Grave', peso: 0.2, diasMin: 31, diasMax: 90 },
  ];
  
  const origens = [
    { nome: 'Treino', peso: 0.6 },
    { nome: 'Jogo', peso: 0.3 },
    { nome: 'Outros', peso: 0.1 },
  ];
  
  // Selecionar tipo
  const randTipo = Math.random();
  let tipoSelecionado = tipos[0].nome;
  let acumulado = 0;
  for (const tipo of tipos) {
    acumulado += tipo.peso;
    if (randTipo <= acumulado) {
      tipoSelecionado = tipo.nome;
      break;
    }
  }
  
  // Selecionar localização
  const localizacao = localizacoes[Math.floor(Math.random() * localizacoes.length)];
  
  // Selecionar lado (50% chance)
  const lado = Math.random() < 0.5 ? lados[Math.floor(Math.random() * lados.length)] : undefined;
  
  // Selecionar severidade
  const randSeveridade = Math.random();
  let severidadeSelecionada = severidades[0];
  acumulado = 0;
  for (const severidade of severidades) {
    acumulado += severidade.peso;
    if (randSeveridade <= acumulado) {
      severidadeSelecionada = severidade;
      break;
    }
  }
  
  // Selecionar origem
  const randOrigem = Math.random();
  let origemSelecionada = origens[0].nome;
  acumulado = 0;
  for (const origem of origens) {
    acumulado += origem.peso;
    if (randOrigem <= acumulado) {
      origemSelecionada = origem.nome;
      break;
    }
  }
  
  // Gerar dias de afastamento
  const diasAfastado = severidadeSelecionada.diasMin + 
    Math.floor(Math.random() * (severidadeSelecionada.diasMax - severidadeSelecionada.diasMin + 1));
  
  return {
    tipo: tipoSelecionado,
    localizacao,
    lado,
    severidade: severidadeSelecionada.nome,
    origem: origemSelecionada,
    diasAfastado,
  };
}

export function generateAssessment(baseData: {
  peso: number;
  altura: number;
  gorduraCorporal: number;
  vo2max: number;
  flexibilidade: number;
  velocidade: number;
  forca: number;
  agilidade: number;
}, progresso: number): {
  peso: number;
  altura: number;
  gorduraCorporal: number;
  vo2max: number;
  flexibilidade: number;
  velocidade: number;
  forca: number;
  agilidade: number;
  peitoral: number;
  axilar: number;
  subescapular: number;
  triceps: number;
  abdominal: number;
  suprailiaca: number;
  coxa: number;
  planoAcao?: string;
} {
  // Progresso: 0 = início, 1 = fim (melhora ao longo do tempo)
  // Gordura corporal diminui (melhora)
  const gorduraCorporal = baseData.gorduraCorporal * (1 - progresso * 0.15);
  
  // VO2max aumenta (melhora)
  const vo2max = baseData.vo2max * (1 + progresso * 0.1);
  
  // Velocidade melhora (diminui tempo)
  const velocidade = baseData.velocidade * (1 - progresso * 0.05);
  
  // Força aumenta
  const forca = baseData.forca * (1 + progresso * 0.1);
  
  // Agilidade melhora (diminui tempo)
  const agilidade = baseData.agilidade * (1 - progresso * 0.05);
  
  // Flexibilidade varia pouco
  const flexibilidade = baseData.flexibilidade * (1 + (Math.random() - 0.5) * 0.1);
  
  // Peso varia pouco (±2kg)
  const peso = baseData.peso + (Math.random() - 0.5) * 4;
  
  // Skinfolds (dobras cutâneas) - diminuem com o tempo
  const fatorSkinfold = 1 - progresso * 0.1;
  const peitoral = (5 + Math.random() * 10) * fatorSkinfold;
  const axilar = (5 + Math.random() * 10) * fatorSkinfold;
  const subescapular = (8 + Math.random() * 12) * fatorSkinfold;
  const triceps = (5 + Math.random() * 10) * fatorSkinfold;
  const abdominal = (8 + Math.random() * 15) * fatorSkinfold;
  const suprailiaca = (8 + Math.random() * 15) * fatorSkinfold;
  const coxa = (8 + Math.random() * 15) * fatorSkinfold;
  
  // Plano de ação (30% chance)
  const planosAcao = [
    'Manter treinamento atual',
    'Aumentar volume de treino',
    'Focar em força',
    'Melhorar condicionamento',
    'Trabalhar flexibilidade',
  ];
  const planoAcao = Math.random() < 0.3 ? planosAcao[Math.floor(Math.random() * planosAcao.length)] : undefined;
  
  return {
    peso: Math.round(peso * 100) / 100,
    altura: baseData.altura, // Altura não muda
    gorduraCorporal: Math.round(gorduraCorporal * 100) / 100,
    vo2max: Math.round(vo2max * 100) / 100,
    flexibilidade: Math.round(flexibilidade * 100) / 100,
    velocidade: Math.round(velocidade * 100) / 100,
    forca: Math.round(forca * 100) / 100,
    agilidade: Math.round(agilidade * 100) / 100,
    peitoral: Math.round(peitoral * 100) / 100,
    axilar: Math.round(axilar * 100) / 100,
    subescapular: Math.round(subescapular * 100) / 100,
    triceps: Math.round(triceps * 100) / 100,
    abdominal: Math.round(abdominal * 100) / 100,
    suprailiaca: Math.round(suprailiaca * 100) / 100,
    coxa: Math.round(coxa * 100) / 100,
    planoAcao,
  };
}

export function generateBaseAssessmentData(idade: number, altura: number): {
  peso: number;
  altura: number;
  gorduraCorporal: number;
  vo2max: number;
  flexibilidade: number;
  velocidade: number;
  forca: number;
  agilidade: number;
} {
  // Peso baseado em IMC médio de atleta (22-25)
  const imc = 22 + Math.random() * 3;
  const peso = (imc * (altura / 100) ** 2);
  
  // Gordura corporal: 7-20% (atletas têm menos)
  const gorduraCorporal = 7 + Math.random() * 13;
  
  // VO2max: 42-68 ml/kg/min (melhora com treino)
  const vo2max = 42 + Math.random() * 26;
  
  // Flexibilidade: 12-28 cm (teste de sentar e alcançar)
  const flexibilidade = 12 + Math.random() * 16;
  
  // Velocidade: 7.5-13s (teste de 30m)
  const velocidade = 7.5 + Math.random() * 5.5;
  
  // Força: 45-130 kg (teste de 1RM)
  const forca = 45 + Math.random() * 85;
  
  // Agilidade: 7.5-16s (teste T)
  const agilidade = 7.5 + Math.random() * 8.5;
  
  return {
    peso: Math.round(peso * 100) / 100,
    altura,
    gorduraCorporal: Math.round(gorduraCorporal * 100) / 100,
    vo2max: Math.round(vo2max * 100) / 100,
    flexibilidade: Math.round(flexibilidade * 100) / 100,
    velocidade: Math.round(velocidade * 100) / 100,
    forca: Math.round(forca * 100) / 100,
    agilidade: Math.round(agilidade * 100) / 100,
  };
}
