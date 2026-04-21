import type { BlogPost } from './types';

export const POSTS_ES: BlogPost[] = [
  {
    slug: 'por-que-datos-en-la-base',
    lang: 'es',
    title: 'Por qué los datos en la base importan más que en la planilla',
    date: '2026-04-12',
    readMinutes: 4,
    author: 'SCOUT21',
    keywords: ['analítica futsal', 'gestión del plantel', 'base de datos deportiva'],
    excerpt:
      'Las planillas funcionan hasta que dejan de funcionar. Una única fuente de verdad evita versiones en conflicto y da histórico al cuerpo técnico.',
    paragraphs: [
      'Planillas y notas compartidas funcionan hasta que dejan de funcionar: alguien sobreescribe una celda, la versión vieja circula por WhatsApp y nadie sabe cuál es la fuente real. En una base de datos cada registro tiene contexto y alimenta plantel, calendario y lectura post-partido sin recopiar a mano.',
      'Para el coordinador no es «más tecnología», es menos trabajo duplicado: el mismo dato alimenta disponibilidad, preparación de la semana y decisiones en el banco.',
      'SCOUT21 parte de ese principio: histórico por equipo, legible para quien decide — no sólo para quien ama las hojas de cálculo.',
    ],
    translations: { 'pt-BR': 'por-que-dados-no-banco-importam-mais-que-no-papel', en: 'why-database-beats-spreadsheet' },
  },
  {
    slug: 'rutina-semana-competitiva',
    lang: 'es',
    title: 'Rutina de una semana competitiva con plantel ajustado',
    date: '2026-04-08',
    readMinutes: 5,
    author: 'SCOUT21',
    keywords: ['semana competitiva futsal', 'gestión de carga', 'rutina entrenamiento'],
    excerpt:
      'Una semana cargada es una secuencia de decisiones: carga, disponibilidad y comunicación entre staff. Sin visión común, cada uno improvisa.',
    paragraphs: [
      'Una semana cargada es una secuencia de decisiones encadenadas: quién entrena a qué intensidad, quién gestiona carga, quién juega con minutos limitados el fin de semana. Sin visión común cada miembro del staff improvisa por su cuenta — y el atleta paga la inconsistencia.',
      'Una rutina sana combina calendario claro, estado del plantel (lesión, disponibilidad, minutos recientes) y comunicación corta entre staff.',
      'Las herramientas ayudan cuando eliminan copiar y pegar y muestran la misma información a todos los que deciden.',
    ],
    translations: { 'pt-BR': 'rotina-de-semana-competitiva-com-elenco-apertado', en: 'competitive-week-routine' },
  },
  {
    slug: 'scout-mas-alla-de-los-numeros',
    lang: 'es',
    title: 'Scout más allá de los números: el contexto que el entrenador necesita',
    date: '2026-04-03',
    readMinutes: 4,
    author: 'SCOUT21',
    keywords: ['análisis de partido', 'estadísticas con contexto', 'scouting táctico'],
    excerpt:
      'Las estadísticas crudas sirven, pero el entrenador pregunta «¿en qué momento?», «¿contra qué sistema?». El contexto convierte números en decisiones.',
    paragraphs: [
      'Las estadísticas crudas — tiros, pases, distancia — son útiles pero raramente suficientes. El entrenador pregunta en qué momento del partido pasó, contra qué sistema, con qué jugadores en cancha.',
      'Los buenos equipos unen evento a momento y jugador: no sólo «cuántos», sino «cuándo y por qué».',
      'En SCOUT21, la ambición es acercar el registro a la realidad del banco: el mismo partido alimenta la lectura colectiva y la individual.',
    ],
    translations: { 'pt-BR': 'scout-alem-dos-numeros-contexto-para-o-treinador', en: 'scout-beyond-numbers' },
  },
];
