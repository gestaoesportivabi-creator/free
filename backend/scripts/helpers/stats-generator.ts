/**
 * Gerador de estatísticas realistas para futsal
 */

export function generateTeamStats(): {
  minutosJogados: number;
  gols: number;
  golsSofridos: number;
  assistencias: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  passesCorretos: number;
  passesErrados: number;
  passesErradosTransicao: number;
  desarmesComBola: number;
  desarmesContraAtaque: number;
  desarmesSemBola: number;
  chutesNoGol: number;
  chutesFora: number;
  rpePartida: number | null;
  golsMarcadosJogoAberto: number;
  golsMarcadosBolaParada: number;
  golsSofridosJogoAberto: number;
  golsSofridosBolaParada: number;
} {
  const gols = Math.floor(Math.random() * 11); // 0-10 gols
  const golsSofridos = Math.floor(Math.random() * 11); // 0-10 gols
  
  // Estatísticas baseadas em futsal profissional
  const passesCorretos = 60 + Math.floor(Math.random() * 141); // 60-200
  const passesErrados = 3 + Math.floor(Math.random() * 23); // 3-25
  const passesErradosTransicao = Math.floor(Math.random() * 8); // 0-7
  const chutesNoGol = 8 + Math.floor(Math.random() * 23); // 8-30
  const chutesFora = 3 + Math.floor(Math.random() * 18); // 3-20
  const desarmesComBola = 5 + Math.floor(Math.random() * 16); // 5-20
  const desarmesContraAtaque = 3 + Math.floor(Math.random() * 13); // 3-15
  const desarmesSemBola = 4 + Math.floor(Math.random() * 17); // 4-20
  const totalDesarmes = desarmesComBola + desarmesContraAtaque + desarmesSemBola;
  
  // Assistências: geralmente 60-80% dos gols
  const assistencias = Math.floor(gols * (0.6 + Math.random() * 0.2));
  
  // Cartões: amarelos mais comuns que vermelhos
  const cartoesAmarelos = Math.floor(Math.random() * 5); // 0-4
  const cartoesVermelhos = Math.random() < 0.2 ? 1 : 0; // 20% chance de ter vermelho
  
  // RPE (Rate of Perceived Exertion): 1-10, geralmente 6-9
  const rpePartida = 6 + Math.floor(Math.random() * 4);
  
  // Gols em jogo aberto vs bola parada (70% jogo aberto, 30% bola parada)
  const golsMarcadosJogoAberto = Math.floor(gols * 0.7);
  const golsMarcadosBolaParada = gols - golsMarcadosJogoAberto;
  const golsSofridosJogoAberto = Math.floor(golsSofridos * 0.7);
  const golsSofridosBolaParada = golsSofridos - golsSofridosJogoAberto;
  
  return {
    minutosJogados: 40, // Futsal tem 2 tempos de 20 minutos
    gols,
    golsSofridos,
    assistencias,
    cartoesAmarelos,
    cartoesVermelhos,
    passesCorretos,
    passesErrados,
    passesErradosTransicao,
    desarmesComBola,
    desarmesContraAtaque,
    desarmesSemBola,
    chutesNoGol,
    chutesFora,
    rpePartida,
    golsMarcadosJogoAberto,
    golsMarcadosBolaParada,
    golsSofridosJogoAberto,
    golsSofridosBolaParada,
  };
}

export function generatePlayerStats(minutosJogados: number): {
  minutosJogados: number;
  gols: number;
  golsSofridos: number;
  assistencias: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  passesCorretos: number;
  passesErrados: number;
  passesErradosTransicao: number;
  desarmesComBola: number;
  desarmesContraAtaque: number;
  desarmesSemBola: number;
  chutesNoGol: number;
  chutesFora: number;
  rpePartida: number | null;
  golsMarcadosJogoAberto: number;
  golsMarcadosBolaParada: number;
  golsSofridosJogoAberto: number;
  golsSofridosBolaParada: number;
} {
  // Estatísticas individuais baseadas em minutos jogados
  const fatorMinutos = minutosJogados / 40; // Normalizar para 40 minutos
  
  // Gols: 0-4 por jogador (raramente mais)
  const gols = Math.random() < 0.3 ? Math.floor(Math.random() * 5) : 0; // 30% chance de marcar
  
  // Assistências: 0-4 por jogador
  const assistencias = Math.random() < 0.25 ? Math.floor(Math.random() * 5) : 0; // 25% chance
  
  // Passes: proporcional aos minutos
  const passesCorretos = Math.floor((10 + Math.random() * 30) * fatorMinutos); // 10-40 por jogo completo
  const passesErrados = Math.floor((1 + Math.random() * 5) * fatorMinutos); // 1-5 por jogo completo
  const passesErradosTransicao = Math.floor(Math.random() * 3 * fatorMinutos); // 0-2 por jogo completo
  
  // Chutes: proporcional aos minutos
  const chutesNoGol = Math.floor((1 + Math.random() * 4) * fatorMinutos); // 1-4 por jogo completo
  const chutesFora = Math.floor((0.5 + Math.random() * 3) * fatorMinutos); // 0.5-3 por jogo completo
  
  // Desarmes: proporcional aos minutos
  const desarmesComBola = Math.floor((1 + Math.random() * 3) * fatorMinutos); // 1-3 por jogo completo
  const desarmesContraAtaque = Math.floor((0.5 + Math.random() * 2) * fatorMinutos); // 0.5-2 por jogo completo
  const desarmesSemBola = Math.floor((1 + Math.random() * 3) * fatorMinutos); // 1-3 por jogo completo
  
  // Cartões: raros
  const cartoesAmarelos = Math.random() < 0.15 ? 1 : 0; // 15% chance
  const cartoesVermelhos = Math.random() < 0.02 ? 1 : 0; // 2% chance
  
  // RPE: 6-9
  const rpePartida = 6 + Math.floor(Math.random() * 4);
  
  // Gols em jogo aberto vs bola parada
  const golsMarcadosJogoAberto = Math.floor(gols * 0.7);
  const golsMarcadosBolaParada = gols - golsMarcadosJogoAberto;
  
  return {
    minutosJogados: Math.round(minutosJogados),
    gols,
    golsSofridos: 0, // Jogador individual não sofre gols
    assistencias,
    cartoesAmarelos,
    cartoesVermelhos,
    passesCorretos,
    passesErrados,
    passesErradosTransicao,
    desarmesComBola,
    desarmesContraAtaque,
    desarmesSemBola,
    chutesNoGol,
    chutesFora,
    rpePartida,
    golsMarcadosJogoAberto,
    golsMarcadosBolaParada,
    golsSofridosJogoAberto: 0,
    golsSofridosBolaParada: 0,
  };
}
