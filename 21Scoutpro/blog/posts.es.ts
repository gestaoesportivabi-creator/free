import type { BlogPost } from './types';

/**
 * Posts en español. Mismo formato de bloques (h2/h3/p/list/quote/callout/cta-*)
 * que posts.pt.ts para que la UI renderice el layout completo con TOC y crédito.
 * Las capas se comparten con PT vía /public/blog-covers/<pt-slug>.jpg.
 */
export const POSTS_ES: BlogPost[] = [
  {
    slug: 'por-que-datos-en-la-base',
    lang: 'es',
    title: 'Por qué los datos en la base valen más que cualquier planilla en el futsal',
    subtitle:
      'Una planilla funciona al inicio. Después se vuelve ruido, retrabajo y versión en conflicto. Una base única devuelve confianza al cuerpo técnico para decidir mejor.',
    date: '2026-04-12',
    updatedDate: '2026-04-20',
    readMinutes: 9,
    author: 'Redacción SCOUT21',
    heroEmoji: '🧠',
    tags: ['gestión', 'datos', 'planilla', 'club'],
    coverImage: '/blog-covers/por-que-dados-no-banco-importam-mais-que-no-papel.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'AS Photography',
      photographerUrl: 'https://www.pexels.com/@asphotography',
      photoUrl: 'https://www.pexels.com/photo/black-samsung-tablet-computer-106344/',
    },
    excerpt:
      'Cuando el scout, la asistencia, el calendario y las evaluaciones viven en archivos sueltos, el club pierde tiempo y claridad. Una base única convierte datos dispersos en decisiones.',
    keywords: [
      'gestión de club de futsal',
      'planillas futsal',
      'base de datos deportiva',
      'scout futsal',
      'análisis de rendimiento',
      'KPIs del club',
    ],
    translations: {
      'pt-BR': 'por-que-dados-no-banco-importam-mais-que-no-papel',
      en: 'why-database-beats-spreadsheet',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Todo club empieza con una planilla. En el primer mes resuelve: carga de plantel, goles, asistencias. Al tercer mes aparecen las grietas — el preparador físico hizo una copia, el entrenador otra, el analista exportó un PDF. En la quinta fecha nadie sabe cuál es la versión "oficial" del scout. La información existe, pero no decide nada, porque no es confiable.',
      },
      { type: 'h2', text: 'El costo invisible de la planilla compartida' },
      {
        type: 'p',
        text:
          'El dolor no es Excel. El dolor es que las planillas no fueron hechas para ser la fuente única de verdad de una operación con muchas personas escribiendo al mismo tiempo, en momentos distintos y con criterios distintos. Se hicieron para cálculo, no para gobernanza de datos.',
      },
      {
        type: 'list',
        items: [
          'Sin historial auditable: ¿quién cambió la evaluación física del atleta? ¿cuándo? ¿por qué?',
          'Sin integridad referencial: un jugador puede aparecer con dos IDs distintos y volverse dos personas.',
          'Sin concurrencia segura: dos personas editando a la vez generan conflictos silenciosos.',
          'Sin consultas complejas: "mostrame a todos los atletas que hicieron >3 goles contra sistema 3×1" se vuelve una búsqueda manual.',
        ],
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'Atajo mental',
        text:
          'Si tu cuerpo técnico gasta más tiempo acomodando la planilla que leyendo lo que dice, el ROI ya es negativo — aunque la planilla sea "gratis".',
      },
      { type: 'h2', text: 'Qué cambia con una base única' },
      {
        type: 'p',
        text:
          'Al centralizar scout, fisiología, asistencia y calendario en una sola base de datos, el club obtiene tres cosas que una planilla nunca entrega: historial, consistencia y velocidad de consulta.',
      },
      { type: 'h3', text: 'Historial que nadie borra' },
      {
        type: 'p',
        text:
          'Cada evaluación, cada partido, cada minuto en cancha queda registrado con sello de tiempo y autor. Eso cambia la charla con el atleta: dejás de argumentar desde la memoria y pasás a argumentar desde la serie temporal — "en los últimos 5 partidos tu precisión de pase bajo presión cayó de 82% a 64%, mirá acá".',
      },
      { type: 'h3', text: 'Consistencia entre quien escribe y quien lee' },
      {
        type: 'p',
        text:
          'El entrenador no escribe el mismo nombre con dos grafías, porque el sistema obliga a elegir al atleta cargado. La preparación física no crea una tercera "tabla de FC", porque el esquema es único. El informe gerencial toma exactamente los mismos datos que el scout.',
      },
      { type: 'h3', text: 'Velocidad para hacer preguntas difíciles' },
      {
        type: 'p',
        text:
          'La pregunta deja de ser "¿está en la planilla?" y pasa a ser "¿qué quiero saber?". La base procesa recortes en segundos — cruzás posición, rival, sistema defensivo y momento del partido sin abrir 5 pestañas.',
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'Cuándo la planilla todavía sirve' },
      {
        type: 'p',
        text:
          'No es una religión. La planilla sigue siendo buena para tres cosas: borrador, informe puntual y prototipo de métrica nueva. El error es hacerla la espina dorsal del club. La espina dorsal debe ser una base con esquema explícito y permisos por rol.',
      },
      { type: 'h2', text: 'Cómo migrar sin frenar la operación' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Listá las 5 preguntas que el cuerpo técnico se hace cada semana. Esas son las que la base tiene que responder en 10 segundos.',
          'Modelá sólo lo mínimo: atleta, partido, evento de scout, evaluación física. No importes todo de golpe.',
          'Importá la planilla actual una sola vez y congelala — desde ahí sólo la base escribe.',
          'Armá informes que cierren el loop semanal: qué cambió, quién jugó menos, a quién se le subió la carga.',
          'Recién ahí avanzá a micro-métricas (cuartetos, posesión, fisiología avanzada).',
        ],
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Dónde entra SCOUT 21',
        text:
          'SCOUT 21 es exactamente esta base única, con pantallas listas para scout, fisiología, calendario e informe gerencial. No construís esquema: abrís, cargás el plantel y empezás a registrar el primer partido.',
      },
      { type: 'h2', text: 'Un criterio honesto de éxito' },
      {
        type: 'p',
        text:
          'Si dentro de tres meses el entrenador mira la pantalla y dice "yo lo sentí así, pero el dato muestra otra cosa", la migración valió la pena. Porque ahora el dato es más fuerte que la impresión, y el club decide con más coraje.',
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'rutina-semana-competitiva',
    lang: 'es',
    title: 'Cómo organizar una semana competitiva con plantel ajustado',
    subtitle:
      'Cuando el plantel es corto, improvisar cuesta caro. La semana necesita ritmo, visibilidad y decisiones compartidas entre entrenador, analista y preparación física.',
    date: '2026-04-08',
    updatedDate: '2026-04-20',
    readMinutes: 10,
    author: 'Redacción SCOUT21',
    heroEmoji: '📅',
    tags: ['rutina', 'carga', 'preparación física', 'cuerpo técnico'],
    coverImage: '/blog-covers/rotina-de-semana-competitiva-com-elenco-apertado.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Md Jawadur Rahman',
      photographerUrl: 'https://www.pexels.com/@srijonism',
      photoUrl: 'https://www.pexels.com/photo/men-playing-football-indoors-15818644/',
    },
    excerpt:
      'Carga, recuperación, convocatoria y comunicación tienen que vivir en el mismo flujo. Un microciclo bien diseñado baja el roce y cuida el rendimiento.',
    keywords: [
      'semana competitiva futsal',
      'gestión de carga',
      'preparación física futsal',
      'microciclo',
      'RPE',
      'rutina entrenamiento',
    ],
    translations: {
      'pt-BR': 'rotina-de-semana-competitiva-com-elenco-apertado',
      en: 'competitive-week-routine',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Plantel ajustado es regla, no excepción. El cuerpo técnico que gana con 12 atletas disponibles hace lo mismo todas las semanas: transforma incertidumbre en ritmo. Este es el esqueleto que, en nuestra experiencia, aguanta toda la temporada — aunque aparezca lesión, dolor muscular y viaje en medio.',
      },
      { type: 'h2', text: 'El principio: una semana es un sistema, no un calendario' },
      {
        type: 'p',
        text:
          'La diferencia entre un club organizado y uno que apaga incendios es que el primero puede responder tres preguntas cualquier día: quién está disponible, a qué carga y para qué objetivo. El calendario es apenas la proyección de eso en el tiempo.',
      },
      { type: 'h2', text: 'El esqueleto de 7 días' },
      { type: 'h3', text: 'Día de partido (D-0)' },
      {
        type: 'p',
        text:
          'Foco en activación, repaso táctico corto y decisión rápida de quién juega en serio. La charla con el atleta es objetiva: sensación 1–10, dolores, confianza en el rol táctico.',
      },
      { type: 'h3', text: 'D+1 — recuperación activa y registro honesto' },
      {
        type: 'p',
        text:
          'Todo atleta que jugó completa RPE, duración percibida y molestias. Esa capa de datos es el combustible del microciclo siguiente. Sin ella, el preparador físico inventa.',
      },
      { type: 'h3', text: 'D+2 — carga alta (central)' },
      {
        type: 'p',
        text:
          'Sesión más intensa de la semana para quienes acumularon menos minutos el D-0. Los que jugaron mucho hacen regenerativo o compensatorio. Esa decisión debe ser visible para todo el staff, no sólo para la preparación física.',
      },
      { type: 'h3', text: 'D+3 — táctica específica contra el próximo rival' },
      {
        type: 'p',
        text:
          'El scout del rival ya es estudio: sistemas, transiciones, arquero, pelota parada. El entrenamiento tiene contexto, no es "jugar el patrón". Sube la calidad percibida de la sesión y baja el roce.',
      },
      { type: 'h3', text: 'D+4 — carga media, reducido, decisiones reales' },
      {
        type: 'p',
        text:
          'Día para afinar roles. Acá se prueba el cuarteto y el portero-jugador. El staff debe cerrar el día con un borrador de la convocatoria.',
      },
      { type: 'h3', text: 'D-1 — activación, pelota parada, pulido' },
      {
        type: 'p',
        text:
          'Sesión corta, centrada en pelota parada y situaciones decisivas. El atleta se va con claridad absoluta de su rol. Duda en D-1 es derrota en D-0.',
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'Los tres agujeros que matan la semana' },
      {
        type: 'list',
        items: [
          'RPE que se recoge de forma inconsistente se vuelve adorno, no herramienta de decisión.',
          'Scout del rival que vive sólo en la cabeza del analista no llega al entrenamiento — la sesión pierde densidad.',
          'Convocatoria que llega al vestuario el D-0 sin haberse borrado el D+4 siempre genera ruido con el plantel.',
        ],
      },
      { type: 'h2', text: 'Comunicación: el multiplicador silencioso' },
      {
        type: 'p',
        text:
          'Lo peor del plantel corto no es la cantidad de atletas — es la cantidad de decisiones rápidas que hay que tomar. Cuando todo el staff ve los mismos datos (RPE, disponibilidad, historial), la charla se acorta. Cuando cada uno mira un lado distinto, la reunión de 10 minutos se vuelve 40.',
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'Un ritual que vale oro',
        text:
          'Bloqueá 15 minutos cada D+2 y D+4 con todo el staff mirando la misma pantalla. Una fuente, una decisión, cero mensajes perdidos en WhatsApp.',
      },
      { type: 'h2', text: 'Cómo funciona dentro de SCOUT 21' },
      {
        type: 'list',
        items: [
          'Programación centraliza entrenamientos y partidos con convocatoria y asistencia auditables.',
          'Scout colectivo alimenta el informe del microciclo (carga percibida × minutos × eventos técnicos).',
          'Fisiología (planes Performance/Avanzado) liga RPE y evaluaciones a la evolución del atleta.',
        ],
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'scout-mas-alla-de-los-numeros',
    lang: 'es',
    title: 'Scout más allá de los números: el contexto que el entrenador usa de verdad',
    subtitle:
      'El número crudo responde poco. El entrenador quiere saber cuándo, contra qué sistema, con qué cuarteto y en qué tipo de posesión pasó la jugada.',
    date: '2026-04-03',
    updatedDate: '2026-04-20',
    readMinutes: 8,
    author: 'Redacción SCOUT21',
    heroEmoji: '🎯',
    tags: ['scout', 'análisis táctico', 'contexto', 'entrenador'],
    coverImage: '/blog-covers/scout-alem-dos-numeros-contexto-para-o-treinador.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Franco Monsalvo',
      photographerUrl: 'https://www.pexels.com/@franco-monsalvo-252430633',
      photoUrl: 'https://www.pexels.com/photo/soccer-coaches-discussing-strategy-outdoors-32101180/',
    },
    excerpt:
      'Scout de verdad no es contar. Es evento con minuto, sistema, cuarteto y origen, para que el cuerpo técnico ajuste entrenamiento, lectura y convocatoria.',
    keywords: [
      'scout futsal',
      'análisis táctico futsal',
      'contexto scout',
      'cuarteto futsal',
      'transiciones futsal',
      'análisis de partido',
    ],
    translations: {
      'pt-BR': 'scout-alem-dos-numeros-contexto-para-o-treinador',
      en: 'scout-beyond-numbers',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Dos números dicen muy poco. Remates y goles. El primero puede ser un tiro desesperado, el segundo un rebote con suerte. El scout de alto nivel no es contar — es contexto estructurado. Ahí está la diferencia entre un sistema que entrega tabla y un sistema que ayuda a decidir.',
      },
      { type: 'h2', text: 'Las cuatro dimensiones que convierten números en decisiones' },
      { type: 'h3', text: '1. Momento del partido' },
      {
        type: 'p',
        text:
          'Un gol recibido en los últimos 3 minutos del primer tiempo tiene peso táctico distinto que uno en los primeros 3. Eso cambia entrenamiento, cambios y hasta cabeza del plantel. Si el scout no marca el minuto, perdés esa capa.',
      },
      { type: 'h3', text: '2. Sistema en cancha' },
      {
        type: 'p',
        text:
          'La misma jugada contra 3×1 es una cosa; contra 4×0 otra. Cuando el scout registra el sistema en el momento del evento, el entrenador arma un mapa de "dónde nos hacen daño" por sistema rival. Foco al entrenamiento táctico.',
      },
      { type: 'h3', text: '3. Cuarteto en cancha' },
      {
        type: 'p',
        text:
          'El rendimiento es colectivo. Saber qué cuarteto estaba en cancha en cada evento cambia la lectura: dos veces pivot aislado, tres veces el mismo último hombre expuesto. Eso se vuelve convocatoria informada, no corazonada.',
      },
      { type: 'h3', text: '4. Origen de la pelota' },
      {
        type: 'p',
        text:
          'Un gol nacido en transición rápida enseña algo distinto que uno de jugada ensayada. Cuando el scout marca el origen (pelota parada, transición, salida de presión, posicional), el mapa táctico se vuelve accionable.',
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'El peligro de las métricas sin contexto' },
      {
        type: 'p',
        text:
          'Un ranking de "quién más remata" sin filtro de sistema y minuto premia al jugador que arriesga de lejos en los momentos menos decisivos. Contamina la charla con el plantel y lleva al entrenador a insistir en soluciones que no deciden partido.',
      },
      {
        type: 'quote',
        text:
          'El número sin contexto convence, pero convence de lo que no es. El entrenador que decide con contexto gana confianza y evita el círculo de "rotar por rotar".',
        cite: 'Cuerpo técnico Sub-20, partner SCOUT21',
      },
      { type: 'h2', text: 'Cómo armar un scout que cargue contexto' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Definí un catálogo cerrado de eventos: remate, pase, quite, recuperación, pérdida, falta, pelota parada, asistencia, gol recibido.',
          'Cada evento debe tener: minuto, cuarteto en cancha, sistema propio, sistema rival.',
          'Los eventos de riesgo (gol recibido, pérdida en salida) exigen un campo libre corto describiendo el origen.',
          'Armá informes en dos vistas: individual (para el 1:1 con el atleta) y colectiva (para ajuste táctico).',
          'Revisá el catálogo cada 10 partidos — el scout tiene que evolucionar con el equipo.',
        ],
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Listo para usar',
        text:
          'SCOUT 21 trae este catálogo estructurado con sistema, cuarteto, pelota parada, posesión y scout de portero-jugador. Ganás contexto sin construir esquema.',
      },
      { type: 'h2', text: 'Honestidad: lo que el dato nunca te va a decir' },
      {
        type: 'p',
        text:
          'El dato te da el "qué" y parte del "por qué". Nunca te dice "quién está dispuesto a correr el riesgo en la próxima jugada". Ese es el trabajo del entrenador. Buen scout no reemplaza oficio: libera al técnico del ruido administrativo para que piense en lo que sólo él puede hacer.',
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'kpi-de-alto-rendimiento-para-clubes-de-futsal',
    lang: 'es',
    title: 'KPIs de alto rendimiento para clubes de futsal: el kit mínimo del cuerpo técnico',
    subtitle:
      'Un dashboard no tiene que impresionar. Tiene que responder rápido. El kit mínimo correcto pone al entrenador, a la coordinación y a la directiva mirando la misma realidad.',
    date: '2026-04-16',
    updatedDate: '2026-04-20',
    readMinutes: 8,
    author: 'Redacción SCOUT21',
    heroEmoji: '📊',
    tags: ['KPIs', 'métricas', 'alto rendimiento', 'dashboard'],
    coverImage: '/blog-covers/indicadores-de-alta-performance-para-clubes-de-futsal.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Ketut Subiyanto',
      photographerUrl: 'https://www.pexels.com/@ketut-subiyanto',
      photoUrl: 'https://www.pexels.com/photo/man-setting-smartwatch-before-exercise-5037319/',
    },
    excerpt:
      'Pocas métricas, leídas todas las semanas, con dueño claro. Este es el set que más ayuda a los clubes de futsal a decidir sin perderse en pantallas lindas.',
    keywords: [
      'KPI futsal',
      'indicadores de rendimiento deportivo',
      'dashboard club',
      'BI futsal',
      'métricas de gestión deportiva',
    ],
    translations: {
      'pt-BR': 'indicadores-de-alta-performance-para-clubes-de-futsal',
      en: 'high-performance-kpis-for-futsal-clubs',
    },
    blocks: [
      {
        type: 'p',
        text:
          'La mayoría de los dashboards de club sufre del mismo problema: demasiadas métricas. La gestión de alto rendimiento es lo contrario — pocos indicadores, leídos todas las semanas, con dueño claro. Esta es la versión reducida que usamos con clubes desde amateur serio hasta profesional.',
      },
      { type: 'h2', text: 'KPIs operativos (el piso de la fábrica)' },
      { type: 'h3', text: '1. Disponibilidad del plantel (%)' },
      {
        type: 'p',
        text:
          'Atletas aptos ÷ total del plantel, semana a semana. Por debajo de 75% de disponibilidad sostenida, la planificación táctica directamente colapsa. Es la primera señal de sobrecarga o de ruido en la comunicación clínica.',
      },
      { type: 'h3', text: '2. Distribución de minutos' },
      {
        type: 'p',
        text:
          'Minutos del top 4 vs bottom 4 del plantel. Si la diferencia supera 3×, el club juega con medio plantel — fatiga acumulada y frustración de banco se traducen en mal resultado a final de temporada.',
      },
      { type: 'h3', text: '3. RPE medio del microciclo' },
      {
        type: 'p',
        text:
          'Percepción media de esfuerzo entre D+1 y D-1. Por debajo de 5: el entrenamiento no desafía. Por encima de 8: estás quemando al plantel. Sólo tiene sentido comparado con su propio historial.',
      },
      { type: 'h2', text: 'KPIs tácticos (la mesa del entrenador)' },
      { type: 'h3', text: '4. xG a favor y xG en contra' },
      {
        type: 'p',
        text:
          'Los expected goals estiman la probabilidad de gol según la calidad de los remates. Si el club gana partidos con xG en contra mayor al propio, preparate: el resultado va a regresar a la media en pocas fechas.',
      },
      { type: 'h3', text: '5. Eficiencia ofensiva por cuarteto' },
      {
        type: 'p',
        text:
          'Goles a favor ÷ minutos del cuarteto. Identifica combinaciones que generan chance real. Cruzado con xG evita premiar suerte.',
      },
      { type: 'h3', text: '6. Recuperación en campo ofensivo' },
      {
        type: 'p',
        text:
          'Quites y recuperaciones en el último tercio por 100 posesiones rivales. Es el KPI más subestimado: los equipos que recuperan alto crean sin depender de jugadas ensayadas.',
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'KPIs de gestión (la mesa de la directiva)' },
      { type: 'h3', text: '7. Adherencia a la planificación técnica' },
      {
        type: 'p',
        text:
          'Entrenamientos realizados ÷ planificados. Debajo de 85% sostenido hay un problema estructural: logística, cancha, personal o falta de claridad en el plan.',
      },
      { type: 'h3', text: '8. Tiempo medio para tener el dato del partido' },
      {
        type: 'p',
        text:
          'Tiempo entre el pitido final y el informe cerrado en el sistema. Cuanto más corto, más rápido ajusta el cuerpo técnico. En la práctica, un club que tarda más de 48h pierde al menos un microciclo completo de decisión.',
      },
      {
        type: 'callout',
        kind: 'warn',
        title: 'Alerta',
        text:
          'Si no podés sacar estos 8 números en 10 minutos cada lunes, todavía no estás en alto rendimiento — no importa el nombre del plan que hayas comprado.',
      },
      { type: 'h2', text: 'Cómo SCOUT 21 entrega estos KPIs' },
      {
        type: 'list',
        items: [
          'Disponibilidad y distribución de minutos: nativas en Gestión de Equipo + Programación.',
          'RPE, eficiencia por cuarteto y recuperación: módulo Scout (colectivo ampliado/completo).',
          'xG a favor y xG en contra: plan Avanzado (informe gerencial).',
          'Adherencia y tiempo de cierre: derivados de la auditoría del sistema.',
        ],
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'como-armar-un-scout-individual-en-10-pasos',
    lang: 'es',
    title: 'Scout individual en futsal: cómo transformar la observación en plan de evolución',
    subtitle:
      'El scout individual sólo es herramienta cuando ayuda a hablar mejor con el atleta y generar metas claras. Sin eso se vuelve archivo muerto.',
    date: '2026-04-19',
    updatedDate: '2026-04-20',
    readMinutes: 7,
    author: 'Redacción SCOUT21',
    heroEmoji: '🧩',
    tags: ['scout individual', 'evaluación', 'feedback', 'atleta'],
    coverImage: '/blog-covers/como-montar-um-scout-individual-em-10-passos.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Anastasia Shuraeva',
      photographerUrl: 'https://www.pexels.com/@anastasia-shuraeva',
      photoUrl: 'https://www.pexels.com/photo/group-of-women-playing-football-9442068/',
    },
    excerpt:
      'Un método simple para convertir observación dispersa en historial, comparación y feedback útil para atleta, entrenador y cuerpo técnico.',
    keywords: [
      'scout individual',
      'evaluación de atleta',
      'feedback deportivo',
      'evolución del atleta',
      'gestión de rendimiento',
    ],
    translations: {
      'pt-BR': 'como-montar-um-scout-individual-em-10-passos',
      en: 'how-to-build-an-individual-scouting-sheet-in-10-steps',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Un scout individual que vive sólo en la cabeza del analista no decide nada. Este es el proceso que vimos funcionar en clubes de futsal que quieren escalar sin contratar un analista por atleta.',
      },
      { type: 'h2', text: 'El método, explícito' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Definí el rol del atleta dentro del modelo de juego (ej: ala-pivot que inicia salida corta).',
          'Listá 5 conductas observables que materializan ese rol (ej: fijación del defensor, salida en diagonal, cobertura del ala opuesto).',
          'Para cada conducta, definí el evento de scout que la representa (ej: "fijación exitosa").',
          'Recolectá esos eventos en todos los partidos, 6–8 seguidos, sin excepción.',
          'Compará al atleta consigo mismo: tendencia de los últimos 3 partidos vs histórico.',
          'Compará al atleta con la norma de la posición en tu club (no con el top de la liga — esa referencia destruye la moral).',
          'Agendá un 1:1 con el atleta y abran los datos juntos. El atleta ve, pregunta, discute si quiere.',
          'Transformá el 1:1 en 2 metas conductuales (no de resultado) para los próximos 3 partidos.',
          'Registrá las metas en el sistema — entran al próximo ciclo de evaluación.',
          'Repetí. El scout individual sólo funciona como rutina, nunca como evento aislado.',
        ],
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'Qué no hacer' },
      {
        type: 'list',
        items: [
          'No mezcles la evaluación individual con un ranking público de plantel — destruye confianza.',
          'No compares al atleta con el protagonista de la posición. Usá la norma del grupo.',
          'No uses nota 1–10 sin conducta detrás. Eso es opinión disfrazada de número.',
        ],
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'Tiempo real invertido',
        text:
          'Un cuerpo técnico organizado tarda ~20 minutos por atleta en preparar un 1:1 mensual. Sin una base única, tarda 2–3 horas — por eso casi nadie lo hace.',
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'gestion-de-equipo-futsal-sin-grupo-de-whatsapp',
    lang: 'es',
    title: 'Gestión de equipo en futsal: dejar de manejar el plantel por WhatsApp y cuaderno',
    subtitle:
      'Plantel, asistencia, minutos, estado físico y comunicación no pueden vivir en cinco lugares distintos. La buena gestión arranca cuando todos miran la misma base.',
    date: '2026-04-21',
    updatedDate: '2026-04-21',
    readMinutes: 9,
    author: 'Redacción SCOUT21',
    heroEmoji: '👥',
    tags: ['gestión de equipo', 'plantel', 'disponibilidad', 'organización'],
    coverImage: '/blog-covers/gestao-de-equipe-no-futsal-como-parar-de-gerir-no-grupo.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: "César O'neill",
      photographerUrl: 'https://www.pexels.com/@cesar-o-neill-26650613',
      photoUrl: 'https://www.pexels.com/photo/team-unity-celebrated-in-pre-game-huddle-29811412/',
    },
    excerpt:
      'La mayoría de los clubes pierde claridad antes de perder rendimiento. Cuando el plantel se maneja en el grupo, la planilla y la memoria, el staff trabaja sin una visión única.',
    keywords: [
      'gestión de equipo futsal',
      'control de plantel futsal',
      'software para club de futsal',
      'organización de cuerpo técnico',
      'gestión deportiva futsal',
    ],
    translations: {
      'pt-BR': 'gestao-de-equipe-no-futsal-como-parar-de-gerir-no-grupo',
      en: 'team-management-futsal-stop-running-it-from-whatsapp',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Todo cuerpo técnico conoce la escena: el entrenador pregunta quién está apto, el preparador físico responde "casi todos", el analista recuerda que dos atletas se fueron antes del último entrenamiento, y la coordinación se entera sobre la hora de que un tercero no va a llegar. No falta esfuerzo. Falta una fuente única de verdad.',
      },
      { type: 'h2', text: 'El problema no es la comunicación. Es la fragmentación.' },
      {
        type: 'p',
        text:
          'El grupo de WhatsApp sirve para velocidad, no para gobernanza. El cuaderno sirve para memoria local, no para historial compartido. La planilla sirve para cálculo, no para operación viva. Cuando plantel, asistencia, disponibilidad y observaciones están sueltos, el club empieza a decidir por intuición.',
      },
      {
        type: 'list',
        items: [
          'La coordinación ve una versión del plantel; el entrenador otra.',
          'La asistencia al entrenamiento no conversa con los minutos del partido.',
          'El estado físico se reporta suelto, sin historial comparable.',
          'La ausencia de un atleta se vuelve sorpresa, no dato procesado.',
        ],
      },
      { type: 'h2', text: 'Lo que una buena gestión de equipo tiene que mostrar' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Quiénes están en el plantel hoy, con carga limpia y rol claro.',
          'Quién estuvo en cada entrenamiento, partido o reunión.',
          'Quién está disponible, con restricción o fuera de sesión.',
          'Qué atleta está acumulando más minutos y carga.',
          'Qué observaciones importan para la próxima decisión del staff.',
        ],
      },
      { type: 'h2', text: 'Cómo aparece esto en SCOUT 21' },
      {
        type: 'p',
        text:
          'En el módulo de Gestión de Equipo, el club centraliza plantel, asistencia, programación e historial operativo en un mismo ambiente. Eso no es detalle administrativo: es la base para armar convocatoria, planificar microciclo, distribuir minutos y evitar ruido entre staff.',
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Traducción práctica',
        text:
          'Cuando la gestión de equipo está redonda, el cuerpo técnico gasta menos energía recordando lo que pasó y más energía eligiendo qué hacer.',
      },
      { type: 'cta-newsletter', text: '¿Querés ver ejemplos reales de organización de cuerpo técnico en futsal?' },
      { type: 'h2', text: 'La ganancia no es sólo orden. Es velocidad de decisión.' },
      {
        type: 'p',
        text:
          'Los clubes pequeños y medianos no pueden darse el lujo de gastar una tarde consolidando información antes de un partido. Cuanto más centralizada la gestión, más rápido cierra la semana, mejor convoca y llega al partido con menos improvisación.',
      },
      { type: 'cta-product', text: 'Conocé la base operativa de SCOUT 21 para manejar el plantel sin planillas sueltas.' },
    ],
  },
  {
    slug: 'seo-local-para-clubes-de-futsal-como-ser-encontrado-en-google',
    lang: 'es',
    title: 'SEO local para clubes de futsal: cómo ser encontrado en Google',
    subtitle:
      'La mayoría de los clubes de futsal ni siquiera aparecen en Google Maps cuando los padres buscan opciones cerca de casa. Con ajustes simples de SEO local, su club puede dominar las búsquedas regionales y atraer más atletas sin gastar en anuncios.',
    date: '2026-04-22',
    updatedDate: '2026-04-22',
    readMinutes: 10,
    author: 'Redacción SCOUT21',
    heroEmoji: '🔍',
    tags: ['SEO local', 'marketing deportivo', 'google my business', 'fútbol sala'],
    excerpt:
      'Los clubes de futsal que invierten en optimización para motores de búsqueda locales ven un aumento del 300% en consultas orgánicas en hasta 3 meses. Esta guía práctica muestra cómo configurar su perfil, obtener reseñas y optimizar su sitio para ser encontrado por padres y atletas en su región.',
    keywords: [
      'SEO local para clubes',
      'fútbol sala google',
      'clubes fútbol sala cerca de mí',
      'optimización sitio deportivo',
      'google my business fútbol sala',
    ],
    translations: {
      'pt-BR': 'seo-local-para-clubes-de-futsal-como-ser-encontrado-no-google',
      en: 'local-seo-for-futsal-clubs-how-to-be-found-on-google',
    },
    coverImage: '/blog-covers/seo-local-para-clubes-de-futsal-como-ser-encontrado-no-google.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Mikhail Nilov',
      photographerUrl: 'https://www.pexels.com/@mikhailnilov',
      photoUrl: 'https://www.pexels.com/photo/top-view-football-football-stadium-1810162/',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Cuando un padre busca por "club de futsal cerca de mí" o "escuela de fútbol sala", espera encontrar opciones relevantes en los primeros resultados de Google. Sin embargo, muchos clubes deportivos ni siquiera aparecen en Google Maps, mucho menos en los resultados orgánicos de búsqueda.',
      },
      {
        type: 'h2',
        text: 'Por qué el SEO local es crucial para clubes de futsal',
      },
      {
        type: 'p',
        text:
          'A diferencia de negocios que atienden a nivel nacional o internacional, los clubes de futsal tienen un público hiperlocal: padres y atletas que viven a pocos kilómetros de distancia. Aparecer en las búsquedas locales no es solo sobre visibilidad — es sobre accesibilidad y conveniencia para su público objetivo.',
      },
      {
        type: 'list',
        items: [
          'El 76% de las personas que hacen una búsqueda local visitan un establecimiento dentro de 24 horas',
          'El 28% de las búsquedas locales resultan en una compra o matrícula',
          'Los clubes con perfil completo en Google Maps reciben 7x más clics que perfiles incompletos',
        ],
      },
      {
        type: 'h2',
        text: 'Paso a paso: configurando su perfil en Google Mi Negocio',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Cree o reclame su perfil en Google Mi Negocio (business.google.com)',
          'Complete toda la información: nombre completo, dirección, teléfono, sitio web y horarios',
          'Seleccione categorías relevantes como "Club de deportes", "Escuela de fútbol" y "Academia de deportes"',
          'Agrega fotos de alta calidad de las instalaciones, entrenamientos y eventos',
          'Incentiva a padres y atletas a dejar reseñas después de cada clase o juego',
          'Responde a todas las reseñas, tanto positivas como negativas, de forma profesional',
          'Publica actualizaciones semanales sobre actividades, resultados e inscripciones abiertas',
        ],
      },
      {
        type: 'h2',
        text: 'Optimizando su sitio para búsquedas locales',
      },
      {
        type: 'p',
        text:
          'Además de Google Mi Negocio, su sitio necesita estar optimizado para que Google entienda su ubicación y relevancia para búsquedas regionales.',
      },
      {
        type: 'list',
        items: [
          'Incluya el nombre de su ciudad y región en los títulos de las páginas (title tags)',
          'Agregue su dirección completa en el pie de página de todas las páginas',
          'Cree páginas específicas para cada modalidad o categoría de edad que ofrece',
          'Use marcado estructurado (schema.org) para destacar información del club',
          'Asegúrese de que su sitio sea compatible con dispositivos móviles, ya que más del 60% de las búsquedas locales provienen de smartphones',
          'Incluya palabras clave locales naturalmente en el contenido, como "futsal en [su ciudad]"',
        ],
      },
      {
        type: 'h2',
        text: 'Construyendo autoridad mediante citas locales',
      },
      {
        type: 'p',
        text:
          'Las citas son menciones al nombre, dirección y teléfono de su club en otros sitios, incluso sin incluir un enlace directo a su sitio.',
      },
      {
        type: 'list',
        items: [
          'Regístrese su club en directorios locales de deportes y recreación',
          'Garantiza consistencia total en la información (NAP: Nombre, Dirección, Teléfono) en todos los registros',
          'Busque asociaciones con escuelas, academias y tiendas de artículos deportivos locales',
          'Participación en eventos comunitarios suele generar menciones en sitios de noticias locales',
          'Monitoree y corrija cualquier información inconsistente que encuentre en línea',
        ],
      },
      {
        type: 'h2',
        text: 'La importancia de las reseñas en línea',
      },
      {
        type: 'p',
        text:
          'Las reseñas son uno de los factores más importantes para el posicionamiento en búsquedas locales e influyen directamente en la decisión de padres potenciales.',
      },
      {
        type: 'list',
        items: [
          'Pida reseñas justo después de clases de prueba o juegos importantes',
          'Responda siempre a las reseñas, agradeciendo el feedback positivo y abordando constructivamente cualquier crítica',
          'Nunca ofrezca incentivos a cambio de reseñas, ya que esto viola las directrices de Google y puede resultar en penalización',
          'Utilice el feedback negativo como oportunidad para mejorar sus servicios y demuestre que le importa la experiencia de los clientes',
        ],
      },
      {
        type: 'h2',
        text: 'Midiendo resultados y ajustando su estrategia',
      },
      {
        type: 'list',
        items: [
          'Monitoree sus clasificaciones para términos como "futsal [su ciudad]" y "escuela de fútbol sala [región]"',
          'Use Google Analytics para ver cuánto tráfico proviene de búsquedas locales',
          'Controle el aumento de llamadas y mensajes provenientes de su perfil en Google Maps',
          'Ajuste su estrategia cada trimestre basado en los datos recopilados',
          'Recuerde: el SEO local es un proceso continuo, no una tarea única',
        ],
      },
      {
        type: 'cta-newsletter',
        text: 'Reciba más consejos prácticos de marketing deportivo para el crecimiento de su club',
      },
      {
        type: 'h2',
        text: 'Empezando hoy: acciones inmediatas para mejorar su visibilidad local',
      },
      {
        type: 'list',
        items: [
          'Hoy: reclame y complete su perfil en Google Mi Negocio',
          'Esta semana: tome 20 fotos de calidad de sus instalaciones y entrenamientos',
          'Este mes: pida reseñas a 10 padres satisfechos y responda a cada una',
          'Próximos meses: monitoree sus resultados y expanda a directorios locales relevantes',
        ],
      },
      {
        type: 'cta-product',
        text: '¿Quiere ver cómo SCOUT 21 puede ayudar en la gestión y divulgación de su club?',
      },
    ],
  },
  {
    slug: 'programacion-semanal-entrenamientos-y-partidos-sin-whatsapp',
    lang: 'es',
    title: 'Programación semanal de entrenamientos y partidos: organizar la semana sin depender del WhatsApp',
    subtitle:
      'La semana de un club cambia demasiado rápido para vivir sólo en mensajes. Una buena programación tiene que ser visible, actualizable y conectada a la realidad del plantel.',
    date: '2026-04-21',
    updatedDate: '2026-04-21',
    readMinutes: 8,
    author: 'Redacción SCOUT21',
    heroEmoji: '🗓️',
    tags: ['programación', 'entrenamientos', 'partidos', 'microciclo'],
    coverImage: '/blog-covers/programacao-semanal-de-treinos-e-jogos-sem-whatsapp.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Matheus Bertelli',
      photographerUrl: 'https://www.pexels.com/@bertellifotografia',
      photoUrl: 'https://www.pexels.com/photo/2025-desk-calendar-with-coffee-and-succulent-29509456/',
    },
    excerpt:
      'La programación no es sólo una agenda. Es la espina dorsal de la semana. Cuando no está clara, el resto de la operación se vuelve mensajes perdidos y decisiones reactivas.',
    keywords: [
      'programación semanal futsal',
      'agenda de entrenamientos futsal',
      'organización de partidos futsal',
      'software de programación deportiva',
      'microciclo futsal',
    ],
    translations: {
      'pt-BR': 'programacao-semanal-de-treinos-e-jogos-sem-whatsapp',
      en: 'weekly-planning-trainings-matches-without-whatsapp',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Muchos cuerpos técnicos creen que programar es "poner entrenamiento en el calendario". No lo es. Programar bien implica ligar sesión, objetivo, asistencia, convocatoria y contexto competitivo. Cuando eso no sucede, la semana existe en el papel pero no manda a nadie.',
      },
      { type: 'h2', text: 'Lo que suele romper la programación' },
      {
        type: 'list',
        items: [
          'Cambio de horario que no llega igual a todos.',
          'Entrenamiento registrado sin dejar claro el objetivo de esa sesión.',
          'Convocatoria cerrada por fuera de la programación, en otro canal.',
          'Cuerpo técnico mirando agendas distintas.',
        ],
      },
      { type: 'h2', text: 'Una buena programación responde 4 preguntas' },
      {
        type: 'list',
        ordered: true,
        items: [
          '¿Qué va a pasar hoy?',
          '¿Quién tiene que estar acá?',
          '¿Cuál es el objetivo técnico, físico o táctico de la sesión?',
          '¿Qué cambia esta sesión para el próximo partido?',
        ],
      },
      {
        type: 'p',
        text:
          'Si la programación no responde eso con claridad para entrenador, preparador, atleta y coordinación, es sólo una agenda linda. Y una agenda linda no gana partidos.',
      },
      { type: 'h2', text: 'Cómo ayuda el módulo Programación al staff' },
      {
        type: 'p',
        text:
          'En SCOUT 21, Programación no vive aislada. Conversa con asistencia, plantel y rutina competitiva. Eso transforma la semana en un proceso auditable: quién vino, qué se hizo, qué cambió y cuál es la próxima decisión.',
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'Buena práctica',
        text:
          'Si cada D+2 y D+4 el staff mira la misma programación actualizada, la reunión se vuelve objetiva. Cuando cada uno trae su versión, la semana pierde foco.',
      },
      { type: 'cta-newsletter', text: 'Recibí más textos prácticos sobre rutina competitiva y organización de staff.' },
      { type: 'h2', text: 'La organización es ventaja competitiva' },
      {
        type: 'p',
        text:
          'En clubes con presupuesto ajustado, la organización se vuelve rendimiento. La programación correcta no reemplaza la calidad del entrenamiento, pero la protege de ruido evitable. Es una de las formas más baratas de mejorar la operación.',
      },
      { type: 'cta-product', text: 'Mirá cómo SCOUT 21 organiza toda la semana en un flujo único.' },
    ],
  },
  {
    slug: 'informe-gerencial-futsal-que-necesita-la-directiva',
    lang: 'es',
    title: 'Informe gerencial en futsal: qué necesita ver la directiva sin ahogar al staff',
    subtitle:
      'Directiva y coordinación no necesitan 40 pestañas. Necesitan pocas señales confiables sobre disponibilidad, carga, rendimiento y avance de la operación.',
    date: '2026-04-21',
    updatedDate: '2026-04-21',
    readMinutes: 8,
    author: 'Redacción SCOUT21',
    heroEmoji: '📄',
    tags: ['informe gerencial', 'directiva', 'coordinación', 'dashboard'],
    coverImage: '/blog-covers/relatorio-gerencial-no-futsal-o-que-a-presidencia-precisa-ver.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'RDNE Stock project',
      photographerUrl: 'https://www.pexels.com/@rdne',
      photoUrl: 'https://www.pexels.com/photo/person-holding-white-printer-paper-7580792/',
    },
    excerpt:
      'Un informe gerencial bueno no controla al cuerpo técnico: reduce ruido entre quienes operan el día a día y quienes necesitan ver la salud deportiva del club.',
    keywords: [
      'informe gerencial futsal',
      'dashboard directiva club',
      'indicadores de gestión deportiva',
      'coordinación deportiva futsal',
      'BI para clubes',
    ],
    translations: {
      'pt-BR': 'relatorio-gerencial-no-futsal-o-que-a-presidencia-precisa-ver',
      en: 'management-report-for-futsal-what-the-board-needs',
    },
    blocks: [
      {
        type: 'p',
        text:
          'La tensión entre cuerpo técnico y gestión casi nunca nace de mala voluntad. Nace de falta de visibilidad. La directiva quiere entender qué está pasando. El staff quiere trabajar sin tener que reconstruir toda la semana en PDF cada lunes.',
      },
      { type: 'h2', text: 'El error común: mucho informe, poca utilidad' },
      {
        type: 'p',
        text:
          'Muchos clubes producen informes largos, lindos y casi inútiles. Tienen color, gráficos y texto, pero no responden lo esencial: ¿está disponible el plantel? ¿es coherente la carga? ¿se sostiene el rendimiento? ¿cierra la operación a tiempo?',
      },
      {
        type: 'list',
        items: [
          'Disponibilidad del plantel por ciclo.',
          'Distribución de minutos y concentración de carga.',
          'Tendencia de rendimiento colectivo e individual.',
          'Adherencia a la planificación semanal.',
          'Tiempo para cerrar el dato después del partido.',
        ],
      },
      { type: 'h2', text: 'El rol del informe gerencial en SCOUT 21' },
      {
        type: 'p',
        text:
          'El módulo de Informe Gerencial existe para acortar la distancia entre operación y gestión. Organiza las señales que importan sin obligar al staff a "armar un dossier" cada vez que alguien pregunta cómo está el equipo.',
      },
      { type: 'h2', text: 'Cuando el informe es bueno, la conversación mejora' },
      {
        type: 'p',
        text:
          'La directiva deja de pedir por intuición. El staff deja de defenderse a ciegas. Y la coordinación obtiene una visión más limpia de lo que hay que corregir: rutina, carga, proceso o rendimiento.',
      },
      {
        type: 'quote',
        text:
          'El informe gerencial no está para vigilar el entrenamiento. Está para evitar que la gestión decida sin ver la realidad deportiva.',
        cite: 'Principio editorial SCOUT21',
      },
      { type: 'cta-newsletter', text: '¿Querés más contenidos sobre gestión deportiva guiada por datos?' },
      { type: 'h2', text: 'Menos PowerPoint, más claridad' },
      {
        type: 'p',
        text:
          'Al final, un buen informe es el que ahorra tiempo a todos. Si cada semana exige consolidación manual, capturas de pantalla y explicación paralela, no está resolviendo la operación. Está agregando otra capa de trabajo.',
      },
      { type: 'cta-product', text: 'Conocé el Informe Gerencial de SCOUT 21 y bajá el roce entre gestión y staff.' },
    ],
  },
  {
    slug: 'monitoreo-fisiologico-futsal-con-pse-psr-y-bienestar',
    lang: 'es',
    title: 'Monitoreo fisiológico en futsal: PSE, PSR y bienestar sin inflar la operación',
    subtitle:
      'La fisiología no tiene por qué volverse burocracia. La clave es recolectar poco, recolectar bien y ligar esas señales a lo que el cuerpo técnico realmente decide.',
    date: '2026-04-21',
    updatedDate: '2026-04-21',
    readMinutes: 9,
    author: 'Redacción SCOUT21',
    heroEmoji: '❤️',
    tags: ['fisiología', 'PSE', 'PSR', 'bienestar'],
    coverImage: '/blog-covers/monitoramento-fisiologico-no-futsal-com-pse-psr-e-bem-estar.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'VO2 Master',
      photographerUrl: 'https://www.pexels.com/@vo2-master-1061578389',
      photoUrl: 'https://www.pexels.com/photo/man-with-training-date-on-tablet-20523364/',
    },
    excerpt:
      'PSE, PSR, bienestar diario y evaluación física sólo valen la pena cuando entran al flujo del staff. Si no, quedan como formularios sin consecuencia.',
    keywords: [
      'monitoreo fisiológico futsal',
      'PSE futsal',
      'PSR futsal',
      'bienestar diario atleta',
      'evaluación física futsal',
    ],
    translations: {
      'pt-BR': 'monitoramento-fisiologico-no-futsal-com-pse-psr-e-bem-estar',
      en: 'physiological-monitoring-futsal-rpe-psr-wellness',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Recolectar datos fisiológicos es fácil. Lo difícil es que ese dato entre en la conversación del cuerpo técnico. Por eso tantos clubes abandonan la práctica después de algunas semanas: completan formularios, exportan planillas, pero la decisión sigue siendo "a ojo".',
      },
      { type: 'h2', text: 'El mínimo que ya cambia la rutina' },
      {
        type: 'list',
        items: [
          'PSE de entrenamiento y partido para ver carga percibida.',
          'PSR para leer recuperación.',
          'Bienestar diario para señalar fatiga y sueño.',
          'Evaluación física periódica para contexto de evolución.',
        ],
      },
      {
        type: 'p',
        text:
          'Aislados, esos números son débiles. Juntos, cuentan una historia operativa: quién acumula fatiga, quién tolera bien el microciclo, quién necesita ajuste antes de que el problema aparezca en el partido.',
      },
      { type: 'h2', text: 'Dónde se pierden los clubes' },
      {
        type: 'list',
        items: [
          'Recolectan de más y nadie analiza.',
          'Recolectan bien, pero el entrenador no lo ve.',
          'Lo ven, pero no lo cruzan con asistencia, minutos y scout.',
          'Sólo miran el dato cuando el atleta ya cayó de rendimiento.',
        ],
      },
      { type: 'h2', text: 'Cómo la fisiología conversa con SCOUT 21' },
      {
        type: 'p',
        text:
          'El módulo de Fisiología de SCOUT 21 organiza Monitoreo Fisiológico, PSE, PSR, Bienestar Diario y Evaluación Física dentro del mismo ecosistema de gestión y scout. Eso acorta la distancia entre recolección y acción.',
      },
      {
        type: 'callout',
        kind: 'warn',
        title: 'Señal de alerta',
        text:
          'Si el atleta completa el formulario y nadie cambia nada a partir de eso, el proceso está comunicando desorganización, no cuidado.',
      },
      { type: 'cta-newsletter', text: 'Suscribite a la newsletter para recibir contenidos prácticos sobre fisiología y rutina competitiva.' },
      { type: 'h2', text: 'Fisiología útil es fisiología integrada' },
      {
        type: 'p',
        text:
          'El mejor escenario no es tener más datos. Es tener suficiente dato, bien recolectado, dentro de la misma conversación del staff. Cuando la fisiología entra al flujo diario, el club protege mejor la carga, comunica mejor el cuidado y decide menos a ciegas.',
      },
      { type: 'cta-product', text: 'Mirá cómo el módulo de Fisiología de SCOUT 21 convierte la recolección en decisión.' },
    ],
  },
  {
    slug: 'ciclo-de-feedback-scout-entrenamiento-72h-futsal',
    lang: 'es',
    title: 'El ciclo de 72 horas entre scout y entrenamiento: cómo acortar la distancia entre observar y corregir',
    subtitle:
      'Un scout que se queda en un informe es solo descripción. Un scout que se transforma en corrección en el entrenamiento de la semana es decisión. El ciclo de 72 horas conecta ambos lados.',
    date: '2026-04-22',
    updatedDate: '2026-04-22',
    readMinutes: 8,
    author: 'Redacción SCOUT21',
    heroEmoji: '🔁',
    tags: ['scout', 'entrenamiento', 'metodología', 'feedback'],
    excerpt:
      'La mayoría de los clubes recolecta scout y devuelve feedback demasiado tarde — la semana siguiente, el próximo ciclo, la próxima entrevista. Cuando el dato llega después de que la memoria del partido se diluye, pierde fuerza. Un ciclo de 72 horas lo resuelve.',
    keywords: [
      'ciclo de feedback futsal',
      'scout y entrenamiento futsal',
      'metodología de entrenamiento futsal',
      'post-partido futsal',
      'corrección táctica futsal',
      'microciclo competitivo',
    ],
    translations: {
      pt: 'ciclo-de-feedback-scout-treino-72h-futsal',
      en: 'scout-training-feedback-loop-72h-futsal',
    },
    coverImage: '/blog-covers/ciclo-de-feedback-scout-treino-72h-futsal.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Franco Monsalvo',
      photographerUrl: 'https://www.pexels.com/@franco-monsalvo-252430633',
      photoUrl: 'https://www.pexels.com/photo/soccer-coaches-discussing-strategy-outdoors-32101180/',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Todo club sabe que debe hacer scout. Menos clubes saben qué pasa después. El informe queda listo, circula por el grupo del staff, finalmente se convierte en una charla con el plantel — pero, la mayoría de las veces, el entrenamiento de la semana siguiente ya fue planificado sin él. El scout describe el pasado, el entrenamiento mira hacia adelante, y los dos rara vez se encuentran en el lugar donde deberían: en la cancha, el martes.',
      },
      { type: 'h2', text: 'Por qué importa la ventana corta' },
      {
        type: 'p',
        text:
          'La memoria del plantel sobre el partido cae rápido. Pasados tres días, el cuerpo ya procesó la carga, la cabeza ya pasó al próximo rival, y aquella imagen exacta de cómo se rompió el bloqueo o de cómo falló la marca zonal empieza a volverse abstracción. Si la corrección entra al entrenamiento después de eso, compite con lo que está por suceder — y pierde.',
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Regla práctica',
        text:
          'El scout solo genera adaptación técnica real si vuelve al plantel antes del tercer entrenamiento post-partido. Después, la corrección compite con la preparación del próximo rival.',
      },
      { type: 'h2', text: 'El diseño de las 72 horas' },
      {
        type: 'p',
        text:
          'El ciclo no es complicado. Lo que cuesta es la disciplina de cumplir los tres cortes sin saltarse ninguno. Cada ventana tiene un objetivo claro, un responsable y un artefacto que debe existir al final.',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          '0–24h: scout técnico-táctico consolidado, con los tres a cinco puntos más importantes para el grupo — no la lista exhaustiva de eventos.',
          '24–48h: charla en bloque con el plantel — video corto, lenguaje del entrenador, foco en el patrón, no en el error individual.',
          '48–72h: primer entrenamiento con el ajuste aplicado, diseñado en situación real, con variaciones de presión que reproduzcan el escenario problemático del partido.',
        ],
      },
      { type: 'h2', text: 'Lo que rompe el ciclo en la práctica' },
      {
        type: 'list',
        items: [
          'Scout demasiado pulido: informe de 20 páginas que nadie lee y que retrasa la devolución.',
          'Video demasiado largo: un montaje de 15 minutos con cortes que el plantel ya no recuerda.',
          'Entrenamiento desconectado: el entrenador conoce el scout, pero el plan de la semana ya estaba cerrado.',
          'Pulverización: cada área del staff tiene su versión de la verdad y el plantel recibe señales contradictorias.',
        ],
      },
      {
        type: 'quote',
        text:
          'La corrección tardía se vuelve una charla. La corrección dentro de la ventana se vuelve entrenamiento. La diferencia está en el calendario, no en el ojo del analista.',
      },
      { type: 'h2', text: 'Cómo SCOUT 21 sostiene el ciclo' },
      {
        type: 'p',
        text:
          'Cuando scout, calendario, asistencia y entrenamiento viven en la misma base de datos, cerrar el ciclo en 72h deja de depender de fuerza de voluntad. El analista publica el scout, el staff marca los tres puntos priorizados, el entrenador arma el entrenamiento de la semana ya conectado a esos puntos, y el jugador ve la misma narrativa en cada momento del microciclo.',
      },
      { type: 'cta-newsletter', text: 'Recibí textos cortos sobre metodología, scout y rutina de club — directo a tu correo, sin ruido.' },
      { type: 'h2', text: 'Cuando el ciclo se vuelve cultura' },
      {
        type: 'p',
        text:
          'Un ciclo cumplido una vez es suerte. Cumplido semana tras semana, se vuelve método. Y método, en el futsal, es lo que separa al club que repite un buen resultado del club que construye un buen año. El scout deja de ser una obligación de reporte y pasa a ser parte viva del entrenamiento — que es, al final, donde el equipo realmente se construye.',
      },
      { type: 'cta-product', text: 'Mirá cómo SCOUT 21 conecta scout, entrenamiento y análisis táctico en un solo flujo.' },
    ],
   },
  {
    slug: 'seo-tecnico-para-sitios-de-clubes-de-futsal-como-mejorar-rendimiento-e-indexacion',
    lang: 'es',
    title: 'SEO técnico para sitios de clubes de futsal: cómo mejorar rendimiento e indexación',
    subtitle:
      'Muchos clubes invierten en contenido y palabras clave, pero olvidan la base: velocidad, estructura y accesibilidad del sitio. Corregir puntos técnicos simples puede duplicar el tráfico orgánico sin gastar un centavo en anuncios.',
    date: '2026-04-27',
    updatedDate: '2026-04-27',
    readMinutes: 11,
    author: 'Redacción SCOUT21',
    heroEmoji: '⚙️',
    tags: ['SEO técnico', 'rendimiento web', 'indexación', 'sitio deportivo'],
    excerpt:
      'Un sitio lento, con estructura confusa o errores de rastreamiento pierde posiciones en Google incluso con buen contenido. Esta guía muestra cómo auditarlos y corregir los puntos técnicos que más afectan a los clubes de futsal: Core Web Vitals, arquitectura de información, schema.org y accesibilidad.',
    keywords: [
      'SEO técnico para clubes',
      'rendimiento sitio deportivo',
      'Core Web Vitals futsal',
      'schema.org club',
      'accesibilidad sitio deportivo',
    ],
    translations: {
      pt: 'seo-tecnico-para-sites-de-clubes-de-futsal-como-melhorar-performance-e-indexacao',
      en: 'technical-seo-for-futsal-club-sites-how-to-improve-performance-and-indexing',
    },
    coverImage: '/blog-covers/seo-tecnico-para-sites-de-clubes-de-futsal-como-melhorar-performance-e-indexacao.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Rafael Guajardo',
      photographerUrl: 'https://www.pexels.com/@rafa-guajardo',
      photoUrl: 'https://www.pexels.com/photo/close-up-of-laptop-and-notebook-1181403/',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Los clubes de futsal a menudo se enfocan en crear contenido de calidad y elegir las palabras clave correctas, pero dejan de lado la fundación del SEO: los aspectos técnicos del sitio. Un sitio lento, con estructura confusa o errores de rastreimiento puede sabotear todo el trabajo de contenido, haciendo que el club pierda posiciones en Google incluso produciendo materiales excelentes.',
      },
      { type: 'h2', text: 'Por qué el SEO técnico es el primer paso' },
      {
        type: 'p',
        text:
          'Piensa en el SEO técnico como la fundación de una casa. Puedes tener los muebles más bonitos (contenido) y la mejor ubicación (palabras clave), pero si la estructura está agrietada (sitio lento o inaccesible), todo se derrumba. Google prioriza sitios que ofrecen buena experiencia técnica porque tienden a retener más usuarios.',
        },
      {
        type: 'list',
        items: [
          'Los sitios que cargan en hasta 2 segundos tienen una tasa de rebote 50% menor que aquellos que tardan 5 segundos o más',
          'El 70% de los usuarios dice que la velocidad de la página influye en su disposición para comprar en un sitio',
          'Google ha utilizado el rendimiento móvil como factor de clasificación desde 2018',
        ],
      },
      { type: 'callout', kind: 'tip', title: 'Prueba rápida', text: 'Accede a tu sitio desde el celular y cuenta hasta 3. Si aún no se ha cargado completamente, tienes un problema de rendimiento que está afectando tu SEO.' },
      { type: 'h2', text: 'Los 4 pilares del SEO técnico para clubes' },
      {
        type: 'h3',
        text: '1. Core Web Vitals: la experiencia del usuario medida por Google',
      },
      {
        type: 'p',
        text:
          'Google mide tres métricas esenciales de rendimiento: LCP (mayor contenido pintado), FID (primer retraso de entrada) y CLS (desplazamiento de diseño acumulativo). Mejorar estos indicadores no solo ayuda en el posicionamiento sino que deja a los padres y atletas más satisfechos al navegar por el sitio.',
      },
      {
        type: 'list',
        items: [
          'LCP (Largest Contentful Paint): mide cuándo aparece el contenido principal. Meta: menos de 2.5 segundos',
          'FID (First Input Delay): mide la interactividad. Meta: menos de 100 milisegundos',
          'CLS (Cumulative Layout Shift): mide la estabilidad visual. Meta: menos de 0.1',
        ],
      },
      {
        type: 'h3',
        text: '2. Estructura de información y arquitectura del sitio',
      },
      {
        type: 'p',
        text:
          'Un sitio bien estructurado ayuda tanto a usuarios como a robots de búsqueda a encontrar lo que necesitan. Para clubes de futsal, esto significa organizar lógicamente la información sobre modalidades, horarios, profesores, ubicación y procesos de inscripción.',
      },
      {
        type: 'list',
        items: [
          'Audita menús, URLs y enlaces internos para que cada página clave esté a tres clics o menos',
          'Mantén títulos y metadatos consistentes para modalidad, edad y ubicación',
          'Revisa páginas huérfanas y consolida contenidos duplicados por temporada',
        ],
      },
    ],
  },
];
