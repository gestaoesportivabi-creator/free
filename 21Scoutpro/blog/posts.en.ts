import type { BlogPost } from './types';

/**
 * English posts. Same block format as posts.pt.ts (h2/h3/p/list/quote/callout/cta-*)
 * so the UI renders the full rich layout with TOC and attribution. Cover images
 * and credits reuse the PT files in /public/blog-covers/<pt-slug>.jpg.
 */
export const POSTS_EN: BlogPost[] = [
  {
    slug: 'why-database-beats-spreadsheet',
    lang: 'en',
    title: 'Why a real database beats another spreadsheet for your squad',
    subtitle:
      'Spreadsheets work for a while. Then they become noise, rework and conflicting versions. A single database gives the coaching staff trustworthy ground to stand on.',
    date: '2026-04-12',
    updatedDate: '2026-04-20',
    readMinutes: 9,
    author: 'SCOUT21 editorial',
    heroEmoji: '🧠',
    tags: ['management', 'data', 'spreadsheet', 'club'],
    coverImage: '/blog-covers/por-que-dados-no-banco-importam-mais-que-no-papel.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'AS Photography',
      photographerUrl: 'https://www.pexels.com/@asphotography',
      photoUrl: 'https://www.pexels.com/photo/black-samsung-tablet-computer-106344/',
    },
    excerpt:
      'When scouting, availability, calendar and evaluations live in scattered files, the club loses time and clarity. A single database turns scattered data into decisions.',
    keywords: [
      'futsal club management',
      'futsal spreadsheets',
      'sports database',
      'futsal scouting',
      'performance analysis',
      'club KPIs',
    ],
    translations: {
      'pt-BR': 'por-que-dados-no-banco-importam-mais-que-no-papel',
      es: 'por-que-datos-en-la-base',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Every club starts with a spreadsheet. In the first month it does the job: roster, goals, assists. By the third month cracks show — the fitness coach kept a copy, the head coach another, the analyst exported a PDF. By the fifth round nobody knows which version of the scout is the real one. Information exists, but it does not drive decisions, because nobody trusts it.',
      },
      { type: 'h2', text: 'The invisible cost of a shared spreadsheet' },
      {
        type: 'p',
        text:
          'The pain is not Excel itself. The pain is that spreadsheets were never built to be the single source of truth of a shared operation where many people type at the same time, in different moments, with different criteria. They were built for calculation, not for data governance.',
      },
      {
        type: 'list',
        items: [
          'No auditable history: who changed the athlete\u2019s fitness score, when, and why?',
          'No referential integrity: a player can exist under two different IDs and look like two different people.',
          'No safe concurrency: two editors at the same time create silent conflicts.',
          'No complex queries: "show me every athlete who scored >3 goals against a 3x1 defence" becomes a manual treasure hunt.',
        ],
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'A mental shortcut',
        text:
          'If your staff spends more time tidying the spreadsheet than reading what it says, ROI is already negative — even if the spreadsheet itself is "free".',
      },
      { type: 'h2', text: 'What changes with a single database' },
      {
        type: 'p',
        text:
          'Centralising scouting, physiology, attendance and calendar in one database gives the club three things a spreadsheet never delivers: history, consistency and query speed.',
      },
      { type: 'h3', text: 'History nobody can wipe out' },
      {
        type: 'p',
        text:
          'Every fitness test, every match, every minute on court is saved with a timestamp and an author. That changes the conversation with the athlete: instead of arguing from memory, you argue from the time series — "over the last five games your passing accuracy under pressure dropped from 82% to 64%, look here".',
      },
      { type: 'h3', text: 'Consistency between who writes and who reads' },
      {
        type: 'p',
        text:
          'The coach does not type the same name in two spellings, because the system forces the pick of the registered athlete. The fitness team does not create a third "HR table" because the schema is unified. The management report reads exactly the same data as the scout.',
      },
      { type: 'h3', text: 'Speed to ask hard questions' },
      {
        type: 'p',
        text:
          'The question shifts from "is it in the spreadsheet?" to "what do I actually want to know?". A database slices in seconds — you cross position, opponent, defensive system and match moment without opening five tabs.',
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'When a spreadsheet still works' },
      {
        type: 'p',
        text:
          'This is not a religion. Spreadsheets are still great for three things: a draft, a one-off report and prototyping a new metric. The mistake is making the spreadsheet the spine of the club. The spine has to be a database with explicit schema and permissions by role.',
      },
      { type: 'h2', text: 'How to migrate without stopping the operation' },
      {
        type: 'list',
        ordered: true,
        items: [
          'List the five questions the staff asks every week. Those are the ones the database has to answer in 10 seconds.',
          'Model only the minimum: athlete, match, scouting event, fitness evaluation. Do not migrate everything at once.',
          'Import the current spreadsheet exactly once and freeze it — from that point on, only the database writes.',
          'Build reports that close the weekly loop: what changed, who played less, whose load went up.',
          'Only then move to micro-metrics (quartets, possession, advanced physiology).',
        ],
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Where SCOUT 21 fits in',
        text:
          'SCOUT 21 is exactly this single database, with screens ready for scouting, physiology, calendar and management reporting. You don\u2019t build a schema: you open the platform, register the squad and record the first match.',
      },
      { type: 'h2', text: 'An honest definition of success' },
      {
        type: 'p',
        text:
          'If three months from now the head coach looks at the screen and says "I felt this, and the data shows something different", the migration was worth it. Because the data became stronger than the hunch — and the club starts to decide with more courage.',
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'competitive-week-routine',
    lang: 'en',
    title: 'How to run a competitive week with a thin squad',
    subtitle:
      'When the squad is short, improvisation is expensive. The week needs rhythm, shared visibility and decisions made between head coach, analyst and fitness staff.',
    date: '2026-04-08',
    updatedDate: '2026-04-20',
    readMinutes: 10,
    author: 'SCOUT21 editorial',
    heroEmoji: '📅',
    tags: ['routine', 'load', 'strength and conditioning', 'coaching staff'],
    coverImage: '/blog-covers/rotina-de-semana-competitiva-com-elenco-apertado.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Md Jawadur Rahman',
      photographerUrl: 'https://www.pexels.com/@srijonism',
      photoUrl: 'https://www.pexels.com/photo/men-playing-football-indoors-15818644/',
    },
    excerpt:
      'Load, recovery, selection and communication must live in the same flow. A well-drawn microcycle cuts friction and protects performance.',
    keywords: [
      'futsal weekly routine',
      'load management',
      'futsal strength and conditioning',
      'microcycle',
      'RPE',
      'competitive week',
    ],
    translations: {
      'pt-BR': 'rotina-de-semana-competitiva-com-elenco-apertado',
      es: 'rutina-semana-competitiva',
    },
    blocks: [
      {
        type: 'p',
        text:
          'A thin squad is the rule, not the exception. The staff that wins with 12 available athletes does the same thing every week: it turns uncertainty into rhythm. This is the skeleton that, in our experience, holds through a whole season — even with injuries, soreness and midweek travel.',
      },
      { type: 'h2', text: 'The principle: a week is a system, not a calendar' },
      {
        type: 'p',
        text:
          'The gap between an organised club and one that fights fires is that the first one can answer three questions any day of the week: who is available, at what load, and for what purpose. The calendar is just the projection of that in time.',
      },
      { type: 'h2', text: 'The 7-day skeleton' },
      { type: 'h3', text: 'Matchday (D-0)' },
      {
        type: 'p',
        text:
          'Focus on activation, a short tactical reminder and a fast call on who actually plays. The conversation with the athlete is objective: 1–10 feeling, pain points, confidence in the tactical role.',
      },
      { type: 'h3', text: 'D+1 — active recovery and honest logging' },
      {
        type: 'p',
        text:
          'Every athlete who played logs RPE, perceived duration and musculoskeletal complaints. That layer is the fuel for the next microcycle. Without it, the fitness coach is guessing.',
      },
      { type: 'h3', text: 'D+2 — high load (central)' },
      {
        type: 'p',
        text:
          'The most intense session of the week for athletes who accumulated fewer minutes on D-0. The ones who played heavy minutes do regenerative or compensatory work. That call has to be visible to the whole staff, not only the fitness team.',
      },
      { type: 'h3', text: 'D+3 — specific tactical work against the next opponent' },
      {
        type: 'p',
        text:
          'The opponent scout is already a study: systems, transitions, goalkeeper, set pieces. Training has context, it is not "play the pattern". Perceived quality of the session goes up, friction goes down.',
      },
      { type: 'h3', text: 'D+4 — medium load, small-sided game, real decisions' },
      {
        type: 'p',
        text:
          'The day to fine-tune roles. This is where you test the quartet and the flying goalkeeper. By the end, the staff should agree on a draft selection.',
      },
      { type: 'h3', text: 'D-1 — activation, set pieces, polish' },
      {
        type: 'p',
        text:
          'Short session, focused on set pieces and decisive situations. The athlete ends the day with absolute clarity on their role. Doubt on D-1 is a loss on D-0.',
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'The three holes that kill a week' },
      {
        type: 'list',
        items: [
          'RPE collected inconsistently becomes decorative; it stops being a decision tool.',
          'Opponent scout that lives only in the analyst\u2019s head never reaches the training pitch — sessions lose density.',
          'A selection announced in the locker room on D-0, with no draft on D+4, always creates noise with the squad.',
        ],
      },
      { type: 'h2', text: 'Communication: the silent multiplier' },
      {
        type: 'p',
        text:
          'The hardest thing about a thin squad is not the number of athletes — it is the number of decisions that must be taken quickly. When the whole staff sees the same data (RPE, availability, history), meetings stay short. When each person looks somewhere else, a 10-minute meeting becomes 40.',
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'A ritual worth gold',
        text:
          'Block 15 minutes every D+2 and D+4 with the full staff looking at the same screen. Single source, single decision, zero messages lost in WhatsApp.',
      },
      { type: 'h2', text: 'How this runs inside SCOUT 21' },
      {
        type: 'list',
        items: [
          'Programming centralises trainings and matches with auditable selection and attendance.',
          'Collective scouting feeds the microcycle report (perceived load × minutes × technical events).',
          'Physiology (Performance/Advanced plans) ties RPE and assessments to the athlete\u2019s evolution.',
        ],
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'scout-beyond-numbers',
    lang: 'en',
    title: 'Scout beyond numbers: the context a coach actually uses',
    subtitle:
      'Raw numbers answer very little. Coaches want to know when, against what system, with which quartet and from what kind of possession the play happened.',
    date: '2026-04-03',
    updatedDate: '2026-04-20',
    readMinutes: 8,
    author: 'SCOUT21 editorial',
    heroEmoji: '🎯',
    tags: ['scout', 'tactical analysis', 'context', 'coaching'],
    coverImage: '/blog-covers/scout-alem-dos-numeros-contexto-para-o-treinador.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Franco Monsalvo',
      photographerUrl: 'https://www.pexels.com/@franco-monsalvo-252430633',
      photoUrl: 'https://www.pexels.com/photo/soccer-coaches-discussing-strategy-outdoors-32101180/',
    },
    excerpt:
      'Real scouting is not counting. It is events with minute, system, quartet and origin so the staff can adjust training, reading and selection.',
    keywords: [
      'futsal scouting',
      'futsal tactical analysis',
      'scout context',
      'futsal quartet',
      'futsal transitions',
      'match analysis',
    ],
    translations: {
      'pt-BR': 'scout-alem-dos-numeros-contexto-para-o-treinador',
      es: 'scout-mas-alla-de-los-numeros',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Two numbers say very little. Shots and goals. The first can be a desperate kick, the second a lucky rebound. High-level scouting is not counting — it is structured context. That is the difference between a system that hands you a table and a system that helps you decide.',
      },
      { type: 'h2', text: 'The four dimensions that turn numbers into decisions' },
      { type: 'h3', text: '1. Moment of the match' },
      {
        type: 'p',
        text:
          'A goal conceded in the last three minutes of the first half has different tactical weight than one in the first three. That changes training, substitutions and even the head of the squad. If the scout does not log the minute, you lose that layer.',
      },
      { type: 'h3', text: '2. System on court' },
      {
        type: 'p',
        text:
          'The same play against 3x1 is one thing; against 4x0 it is another. When the scout logs the system at the moment of the event, the coach builds a "where we concede" map by opposing system. It focuses tactical training.',
      },
      { type: 'h3', text: '3. Quartet on court' },
      {
        type: 'p',
        text:
          'Performance is collective. Knowing which quartet was on court during every event changes the reading: twice an isolated pivot, three times the same holding player exposed. That becomes informed selection, not gut feeling.',
      },
      { type: 'h3', text: '4. Origin of the ball' },
      {
        type: 'p',
        text:
          'A goal from a quick transition teaches something different than a goal from a set piece. When the scout tags the origin (set piece, transition, pressure release, positional build-up), the tactical map becomes actionable.',
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'The danger of metrics without context' },
      {
        type: 'p',
        text:
          'A "who shoots most" ranking, with no filter for system and minute, rewards the player who takes low-risk shots from distance at the safest moments. It pollutes the conversation with the squad and pushes the coach to insist on solutions that do not decide matches.',
      },
      {
        type: 'quote',
        text:
          'Numbers without context convince, but they convince you of the wrong thing. A coach who decides with context earns trust and avoids the "rotate for the sake of rotating" cycle.',
        cite: 'U-20 coaching staff, SCOUT21 partner',
      },
      { type: 'h2', text: 'How to build a scout that carries context' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Define a closed event catalogue: shot, pass, tackle, recovery, loss, foul, set piece, assist, goal conceded.',
          'Every event must have: minute, quartet on court, own system, opposing system.',
          'High-risk events (goals conceded, losses during build-up) have a short free-text field describing the origin.',
          'Produce reports in two views: individual (for 1:1 with the athlete) and collective (for tactical adjustments).',
          'Review the catalogue every 10 matches — scouting has to evolve with the team.',
        ],
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Ready to use',
        text:
          'SCOUT 21 ships this structured catalogue with system, quartet, set pieces, possession and flying-goalkeeper scouting. You get context without building the schema.',
      },
      { type: 'h2', text: 'Honesty: what data will never tell you' },
      {
        type: 'p',
        text:
          'Data gives you the "what" and part of the "why". It never tells you "who is willing to take the risk on the next play". That is the coach\u2019s job. Good scouting does not replace craft: it frees the technical head from administrative noise so the coach can focus on what only they can do.',
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'high-performance-kpis-for-futsal-clubs',
    lang: 'en',
    title: 'High-performance KPIs for futsal clubs: the minimum kit of the staff',
    subtitle:
      'Dashboards do not need to impress. They need to answer quickly. The right minimum kit gets head coach, coordination and board looking at the same reality.',
    date: '2026-04-16',
    updatedDate: '2026-04-20',
    readMinutes: 8,
    author: 'SCOUT21 editorial',
    heroEmoji: '📊',
    tags: ['KPIs', 'metrics', 'high performance', 'dashboard'],
    coverImage: '/blog-covers/indicadores-de-alta-performance-para-clubes-de-futsal.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Ketut Subiyanto',
      photographerUrl: 'https://www.pexels.com/@ketut-subiyanto',
      photoUrl: 'https://www.pexels.com/photo/man-setting-smartwatch-before-exercise-5037319/',
    },
    excerpt:
      'Few metrics, read every week, with clear ownership. This is the set that helps futsal clubs decide without getting lost in nice-looking panels.',
    keywords: [
      'futsal KPI',
      'sports performance indicators',
      'club dashboard',
      'futsal BI',
      'sports management metrics',
    ],
    translations: {
      'pt-BR': 'indicadores-de-alta-performance-para-clubes-de-futsal',
      es: 'kpi-de-alto-rendimiento-para-clubes-de-futsal',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Most club dashboards suffer from the same problem: too many metrics. High-performance management is the opposite — few indicators, read every week, with clear ownership. This is the lean version we use with clubs from serious amateur to professional level.',
      },
      { type: 'h2', text: 'Operational KPIs (the shop floor)' },
      { type: 'h3', text: '1. Squad availability (%)' },
      {
        type: 'p',
        text:
          'Fit athletes ÷ squad size, weekly. Below 75% sustained availability, tactical planning simply collapses. It is the first signal of overload or of noise in medical communication.',
      },
      { type: 'h3', text: '2. Minute distribution' },
      {
        type: 'p',
        text:
          'Top 4 vs bottom 4 minutes. If the gap is above 3×, the club is playing with half a squad — accumulated fatigue and frustrated bench players become bad results by the end of the season.',
      },
      { type: 'h3', text: '3. Microcycle average RPE' },
      {
        type: 'p',
        text:
          'Perceived effort between D+1 and D-1. Below 5: training does not challenge anyone. Above 8: you are cooking the squad. The value only makes sense compared to itself across the season.',
      },
      { type: 'h2', text: 'Tactical KPIs (the coach\u2019s desk)' },
      { type: 'h3', text: '4. xG for and xG against' },
      {
        type: 'p',
        text:
          'Expected goals estimate goal likelihood from shot quality. If the club wins games with higher xG against than for, results will regress to the mean in a few rounds. Prepare for it.',
      },
      { type: 'h3', text: '5. Offensive efficiency per quartet' },
      {
        type: 'p',
        text:
          'Goals scored ÷ quartet minutes. Identifies combinations that actually create chances. Crossed with xG, it avoids rewarding luck.',
      },
      { type: 'h3', text: '6. Ball recovery in the attacking third' },
      {
        type: 'p',
        text:
          'Tackles and recoveries in the attacking third per 100 opponent possessions. The most underrated KPI: teams that recover high create without relying on set plays.',
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'Management KPIs (the board\u2019s desk)' },
      { type: 'h3', text: '7. Adherence to the technical plan' },
      {
        type: 'p',
        text:
          'Sessions delivered ÷ sessions planned. Under 85% sustained, the problem is structural: logistics, venue, staffing or unclear plan.',
      },
      { type: 'h3', text: '8. Time to close match data' },
      {
        type: 'p',
        text:
          'Time between the final whistle and the report closed in the system. The smaller the better. In practice, a club that takes more than 48h loses at least one full microcycle of decision time.',
      },
      {
        type: 'callout',
        kind: 'warn',
        title: 'Red flag',
        text:
          'If you cannot pull these eight numbers in 10 minutes every Monday, you are not in high performance yet — regardless of the name of the plan you bought.',
      },
      { type: 'h2', text: 'How SCOUT 21 delivers these KPIs' },
      {
        type: 'list',
        items: [
          'Availability and minute distribution: native in Team Management + Programming.',
          'RPE, quartet efficiency, recoveries: Scouting module (extended/complete collective).',
          'xG for and xG against: Advanced plan (management report).',
          'Adherence and closing time: derived from the system audit.',
        ],
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'how-to-build-an-individual-scouting-sheet-in-10-steps',
    lang: 'en',
    title: 'Individual scouting in futsal: turning observation into an evolution plan',
    subtitle:
      'An individual scout is only a tool when it helps you talk better with the athlete and produce clear goals. Without that, it becomes a dead file.',
    date: '2026-04-19',
    updatedDate: '2026-04-20',
    readMinutes: 7,
    author: 'SCOUT21 editorial',
    heroEmoji: '🧩',
    tags: ['individual scouting', 'assessment', 'feedback', 'athlete'],
    coverImage: '/blog-covers/como-montar-um-scout-individual-em-10-passos.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Anastasia Shuraeva',
      photographerUrl: 'https://www.pexels.com/@anastasia-shuraeva',
      photoUrl: 'https://www.pexels.com/photo/group-of-women-playing-football-9442068/',
    },
    excerpt:
      'A simple method to turn scattered observation into history, comparison and useful feedback for the athlete, the head coach and the staff.',
    keywords: [
      'individual scouting',
      'athlete assessment',
      'sports feedback',
      'athlete evolution',
      'performance management',
    ],
    translations: {
      'pt-BR': 'como-montar-um-scout-individual-em-10-passos',
      es: 'como-armar-un-scout-individual-en-10-pasos',
    },
    blocks: [
      {
        type: 'p',
        text:
          'An individual scout that lives only in the analyst\u2019s head decides nothing. This is the process we have seen work in futsal clubs that want to scale without hiring an analyst per athlete.',
      },
      { type: 'h2', text: 'The method, explicit' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Define the athlete\u2019s role inside the game model (e.g. wing-pivot who starts short build-up).',
          'List five observable behaviours that materialise that role (e.g. fixing the defender, diagonal runs, cover for the opposite wing).',
          'For each behaviour, define the scouting event that represents it (e.g. "successful fixing").',
          'Collect these events in every match, for 6–8 consecutive matches, no exceptions.',
          'Compare the athlete with themselves: last 3 matches vs historical trend.',
          'Compare the athlete with the club\u2019s position baseline (not the league top — that reference destroys morale).',
          'Book a 1:1 with the athlete and open the data together. The athlete sees, asks, disagrees if they want.',
          'Turn the 1:1 into two behavioural goals (not outcome goals) for the next three matches.',
          'Log the goals in the system — they enter the next evaluation cycle.',
          'Repeat. Individual scouting only works as a routine, never as an event.',
        ],
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'What not to do' },
      {
        type: 'list',
        items: [
          'Do not mix individual assessment with a public squad ranking — it destroys trust.',
          'Do not compare the athlete with the best player in the position. Use the group baseline.',
          'Do not use a 1–10 score without a behaviour behind it. That is opinion disguised as a number.',
        ],
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'Real time spent',
        text:
          'An organised staff takes about 20 minutes per athlete to prepare a monthly 1:1. Without a single database, it takes 2–3 hours — and that is why almost nobody does it.',
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'team-management-futsal-stop-running-it-from-whatsapp',
    lang: 'en',
    title: 'Team management in futsal: stop running the squad from WhatsApp and notebooks',
    subtitle:
      'Squad, attendance, minutes, fitness status and communication cannot live in five different places. Good management starts when everyone looks at the same base.',
    date: '2026-04-21',
    updatedDate: '2026-04-21',
    readMinutes: 9,
    author: 'SCOUT21 editorial',
    heroEmoji: '👥',
    tags: ['team management', 'squad', 'availability', 'organisation'],
    coverImage: '/blog-covers/gestao-de-equipe-no-futsal-como-parar-de-gerir-no-grupo.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: "César O'neill",
      photographerUrl: 'https://www.pexels.com/@cesar-o-neill-26650613',
      photoUrl: 'https://www.pexels.com/photo/team-unity-celebrated-in-pre-game-huddle-29811412/',
    },
    excerpt:
      'Most clubs lose clarity before they lose performance. When the squad is run from a group chat, a spreadsheet and memory, the staff works without a single view.',
    keywords: [
      'futsal team management',
      'futsal squad control',
      'futsal club software',
      'coaching staff organisation',
      'futsal sports management',
    ],
    translations: {
      'pt-BR': 'gestao-de-equipe-no-futsal-como-parar-de-gerir-no-grupo',
      es: 'gestion-de-equipo-futsal-sin-grupo-de-whatsapp',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Every staff knows the scene: the head coach asks who is available, the fitness coach says "almost everyone", the analyst remembers that two athletes left training early last session, and the coordination finds out at the last minute that a third one will not make it. Effort is not the issue. A single source of truth is.',
      },
      { type: 'h2', text: 'The problem is not communication. It is fragmentation.' },
      {
        type: 'p',
        text:
          'A WhatsApp group is for speed, not governance. A notebook is for local memory, not shared history. A spreadsheet is for calculation, not live operation. When squad, attendance, availability and notes sit in different places, the club starts deciding from gut feeling.',
      },
      {
        type: 'list',
        items: [
          'The coordination sees one version of the squad; the head coach sees another.',
          'Training attendance does not talk to match minutes.',
          'Fitness status is reported loosely, with no comparable history.',
          'An athlete\u2019s absence becomes a surprise, not processed data.',
        ],
      },
      { type: 'h2', text: 'What healthy team management must show' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Who is in the squad today, with clean profiles and a clear role.',
          'Who attended each training, match or meeting.',
          'Who is available, restricted or out of the session.',
          'Which athlete is accumulating more minutes and load.',
          'Which notes matter for the staff\u2019s next decision.',
        ],
      },
      { type: 'h2', text: 'How this shows up in SCOUT 21' },
      {
        type: 'p',
        text:
          'Inside the Team Management module, the club centralises squad, attendance, programming and operational history in the same environment. That is not admin detail: it is the base for selection, microcycle design, minute distribution and less noise between staff members.',
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Practical translation',
        text:
          'When team management is tight, the staff spends less energy remembering what happened and more energy choosing what to do next.',
      },
      { type: 'cta-newsletter', text: 'Want real examples of futsal coaching staff organisation?' },
      { type: 'h2', text: 'The gain is not only order. It is decision speed.' },
      {
        type: 'p',
        text:
          'Small and mid clubs cannot afford to spend an afternoon consolidating information before a match. The more centralised the management, the faster the staff closes the week, selects better and reaches the match with less improvisation.',
      },
      { type: 'cta-product', text: 'See the operational core of SCOUT 21 for running a squad without loose spreadsheets.' },
    ],
  },
  {
    slug: 'weekly-planning-trainings-matches-without-whatsapp',
    lang: 'en',
    title: 'Weekly training and match planning: how to run the week without depending on WhatsApp',
    subtitle:
      'A club\u2019s week changes too fast to live only in messages. Good planning must be visible, updatable and connected to the reality of the squad.',
    date: '2026-04-21',
    updatedDate: '2026-04-21',
    readMinutes: 8,
    author: 'SCOUT21 editorial',
    heroEmoji: '🗓️',
    tags: ['programming', 'training', 'matches', 'microcycle'],
    coverImage: '/blog-covers/programacao-semanal-de-treinos-e-jogos-sem-whatsapp.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Matheus Bertelli',
      photographerUrl: 'https://www.pexels.com/@bertellifotografia',
      photoUrl: 'https://www.pexels.com/photo/2025-desk-calendar-with-coffee-and-succulent-29509456/',
    },
    excerpt:
      'Programming is not just a calendar. It is the spine of the week. When it is unclear, the rest of the operation becomes lost messages and reactive decisions.',
    keywords: [
      'futsal weekly planning',
      'futsal training schedule',
      'futsal match organisation',
      'sports scheduling software',
      'futsal microcycle',
    ],
    translations: {
      'pt-BR': 'programacao-semanal-de-treinos-e-jogos-sem-whatsapp',
      es: 'programacion-semanal-entrenamientos-y-partidos-sin-whatsapp',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Many staffs think programming is "putting a training into the calendar". It is not. Good programming links session, objective, attendance, selection and competitive context. When that does not happen, the week exists on paper but governs nobody.',
      },
      { type: 'h2', text: 'What usually breaks the schedule' },
      {
        type: 'list',
        items: [
          'A time change that does not reach everyone at the same time.',
          'Training logged without a clear objective for that session.',
          'Selection closed outside the programme, in another channel.',
          'Staff looking at different agendas.',
        ],
      },
      { type: 'h2', text: 'Good programming answers four questions' },
      {
        type: 'list',
        ordered: true,
        items: [
          'What is happening today?',
          'Who needs to be here?',
          'What is the technical, physical or tactical goal of the session?',
          'How does this session change the next match?',
        ],
      },
      {
        type: 'p',
        text:
          'If the programme does not answer those with clarity for head coach, fitness coach, athlete and coordination, it is just a pretty agenda. And pretty agendas do not win matches.',
      },
      { type: 'h2', text: 'How the Programming module helps the staff' },
      {
        type: 'p',
        text:
          'Inside SCOUT 21, Programming does not live alone. It talks to attendance, squad and competitive routine. That turns the week into an auditable process: who came, what was done, what changed, and what is the next decision.',
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'Good practice',
        text:
          'If every D+2 and D+4 the staff looks at the same updated programme, the meeting becomes objective. When each person brings their own version, the week loses focus.',
      },
      { type: 'cta-newsletter', text: 'Get more practical writing on competitive routines and staff organisation.' },
      { type: 'h2', text: 'Organisation is a competitive advantage' },
      {
        type: 'p',
        text:
          'In clubs with tight budgets, organisation becomes performance. The right programme does not replace training quality, but it protects that quality from avoidable noise. It is one of the cheapest ways to improve the operation.',
      },
      { type: 'cta-product', text: 'See how SCOUT 21 turns the whole week into one coherent flow.' },
    ],
  },
  {
    slug: 'management-report-for-futsal-what-the-board-needs',
    lang: 'en',
    title: 'Management report in futsal: what the board needs to see without suffocating the staff',
    subtitle:
      'Board and coordination do not need 40 tabs. They need a few trustworthy signals about availability, load, performance and operational pace.',
    date: '2026-04-21',
    updatedDate: '2026-04-21',
    readMinutes: 8,
    author: 'SCOUT21 editorial',
    heroEmoji: '📄',
    tags: ['management report', 'board', 'coordination', 'dashboard'],
    coverImage: '/blog-covers/relatorio-gerencial-no-futsal-o-que-a-presidencia-precisa-ver.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'RDNE Stock project',
      photographerUrl: 'https://www.pexels.com/@rdne',
      photoUrl: 'https://www.pexels.com/photo/person-holding-white-printer-paper-7580792/',
    },
    excerpt:
      'A good management report does not police the staff: it reduces noise between the people running the day-to-day and the people who need to see the sporting health of the club.',
    keywords: [
      'futsal management report',
      'club board dashboard',
      'sports management indicators',
      'futsal sporting coordination',
      'BI for clubs',
    ],
    translations: {
      'pt-BR': 'relatorio-gerencial-no-futsal-o-que-a-presidencia-precisa-ver',
      es: 'informe-gerencial-futsal-que-necesita-la-directiva',
    },
    blocks: [
      {
        type: 'p',
        text:
          'The tension between staff and management almost never comes from bad intent. It comes from a lack of visibility. The board wants to understand what is going on. The staff wants to work without having to rebuild the whole week as a PDF every Monday.',
      },
      { type: 'h2', text: 'The common mistake: too much report, too little usefulness' },
      {
        type: 'p',
        text:
          'Many clubs produce long, pretty, nearly useless reports. They have colour, charts and text, but they do not answer the essentials: is the squad available? is load coherent? is performance sustained? is the operation closing on time?',
      },
      {
        type: 'list',
        items: [
          'Squad availability by cycle.',
          'Minute distribution and load concentration.',
          'Collective and individual performance trends.',
          'Adherence to the weekly plan.',
          'Time to close match data after the game.',
        ],
      },
      { type: 'h2', text: 'The role of the management report in SCOUT 21' },
      {
        type: 'p',
        text:
          'The Management Report module exists to shorten the distance between operation and management. It organises the signals that matter without forcing the staff to "build a dossier" every time somebody asks how the team is doing.',
      },
      { type: 'h2', text: 'When the report is good, the conversation improves' },
      {
        type: 'p',
        text:
          'The board stops asking from gut feeling. The staff stops defending itself in the dark. Coordination gets a cleaner view of what must be fixed: routine, load, process or performance.',
      },
      {
        type: 'quote',
        text:
          'A management report is not there to police the training. It is there to stop management from deciding without seeing the sporting reality.',
        cite: 'SCOUT21 editorial principle',
      },
      { type: 'cta-newsletter', text: 'Want more data-driven sports management writing?' },
      { type: 'h2', text: 'Less PowerPoint, more clarity' },
      {
        type: 'p',
        text:
          'In the end, a good report saves everyone\u2019s time. If it needs manual consolidation, screenshots and parallel explanations every week, it is not solving the operation. It is adding another layer of work.',
      },
      { type: 'cta-product', text: 'Discover the SCOUT 21 Management Report and reduce friction between management and staff.' },
    ],
  },
  {
    slug: 'physiological-monitoring-futsal-rpe-psr-wellness',
    lang: 'en',
    title: 'Physiological monitoring in futsal: using RPE, PSR and wellness without bloating the operation',
    subtitle:
      'Physiology does not have to become bureaucracy. The trick is to collect little, collect well, and tie those signals to what the staff actually decides.',
    date: '2026-04-21',
    updatedDate: '2026-04-21',
    readMinutes: 9,
    author: 'SCOUT21 editorial',
    heroEmoji: '❤️',
    tags: ['physiology', 'RPE', 'PSR', 'wellness'],
    coverImage: '/blog-covers/monitoramento-fisiologico-no-futsal-com-pse-psr-e-bem-estar.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'VO2 Master',
      photographerUrl: 'https://www.pexels.com/@vo2-master-1061578389',
      photoUrl: 'https://www.pexels.com/photo/man-with-training-date-on-tablet-20523364/',
    },
    excerpt:
      'RPE, PSR, daily wellness and fitness testing only pay off when they enter the staff\u2019s flow. Otherwise they are consequence-free forms.',
    keywords: [
      'futsal physiological monitoring',
      'futsal RPE',
      'futsal PSR',
      'daily wellness athlete',
      'futsal fitness assessment',
    ],
    translations: {
      'pt-BR': 'monitoramento-fisiologico-no-futsal-com-pse-psr-e-bem-estar',
      es: 'monitoreo-fisiologico-futsal-con-pse-psr-y-bienestar',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Collecting physiological data is easy. The hard part is making that data reach the staff\u2019s conversation. That is why so many clubs abandon it after a few weeks: they fill forms, export a spreadsheet, but decisions are still taken "by eye".',
      },
      { type: 'h2', text: 'The minimum that already changes the routine' },
      {
        type: 'list',
        items: [
          'Training and match RPE to see perceived load.',
          'PSR for recovery reading.',
          'Daily wellness to flag fatigue and sleep.',
          'Periodic fitness testing for evolution context.',
        ],
      },
      {
        type: 'p',
        text:
          'On their own those numbers are weak. Together they tell an operational story: who is accumulating fatigue, who tolerates the microcycle well, who needs adjustment before the problem shows up in the match.',
      },
      { type: 'h2', text: 'Where clubs get lost' },
      {
        type: 'list',
        items: [
          'They collect too much and nobody analyses.',
          'They collect well, but the head coach does not see it.',
          'They see it, but do not cross with attendance, minutes and scouting.',
          'They only look at the data when the athlete has already dropped in performance.',
        ],
      },
      { type: 'h2', text: 'How physiology talks to SCOUT 21' },
      {
        type: 'p',
        text:
          'The Physiology module of SCOUT 21 organises Physiological Monitoring, RPE, PSR, Daily Wellness and Fitness Assessment inside the same ecosystem as management and scouting. That shortens the distance between collection and action.',
      },
      {
        type: 'callout',
        kind: 'warn',
        title: 'Warning sign',
        text:
          'If the athlete answers the form but nothing changes because of it, the process is signalling disorganisation, not care.',
      },
      { type: 'cta-newsletter', text: 'Subscribe for practical writing on physiology and competitive routines.' },
      { type: 'h2', text: 'Useful physiology is integrated physiology' },
      {
        type: 'p',
        text:
          'The best scenario is not to have more data. It is to have enough data, collected well, inside the same conversation the staff already holds. When physiology enters the daily flow, the club protects load better, communicates care better and decides less in the dark.',
      },
      { type: 'cta-product', text: 'See how the SCOUT 21 Physiology module turns collection into decision.' },
    ],
  },
];
