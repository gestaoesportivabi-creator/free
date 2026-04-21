import type { BlogPost } from './types';

export const POSTS_EN: BlogPost[] = [
  {
    slug: 'why-database-beats-spreadsheet',
    lang: 'en',
    title: 'Why a real database beats another spreadsheet for your squad',
    date: '2026-04-12',
    readMinutes: 4,
    author: 'SCOUT21',
    keywords: ['futsal analytics', 'squad management', 'sports database', 'coaching staff software'],
    excerpt:
      'Spreadsheets work until they do not. A single source of truth removes version chaos and gives coaching staff real history.',
    paragraphs: [
      'Spreadsheets and shared notes work — until they do not. Someone overwrites a cell, an old version bounces around WhatsApp, and nobody knows which file is the truth. A real database gives every row context: availability, schedule, and post-match reads feed each other instead of being re-typed.',
      'For the coordinator the gain is not "more tech", it is less duplicate work. The same row drives availability, the weekly plan and in-game decisions.',
      'SCOUT21 is built on that idea: one history per squad, readable for the people who actually decide — not only for spreadsheet fans.',
    ],
    translations: { 'pt-BR': 'por-que-dados-no-banco', es: 'por-que-datos-en-la-base' },
  },
  {
    slug: 'competitive-week-routine',
    lang: 'en',
    title: 'Running a competitive week with a thin squad',
    date: '2026-04-08',
    readMinutes: 5,
    author: 'SCOUT21',
    keywords: ['futsal training week', 'load management', 'coaching routine'],
    excerpt:
      'A busy week is a chain of decisions: load, availability, staff communication. Without a shared view each person improvises.',
    paragraphs: [
      'A packed week tends to be a chain of linked decisions: who trains hard, who manages load, who gets minute limits at the weekend. Without a shared view the staff improvises separately — and the athletes pay the inconsistency tax.',
      'A healthy routine mixes a clear calendar, a live squad state (injury, availability, recent minutes) and tight communication between staff.',
      'Tools help when they remove copy-paste and show the same information to everyone who decides.',
    ],
    translations: { 'pt-BR': 'rotina-semana-competitiva', es: 'rutina-semana-competitiva' },
  },
  {
    slug: 'scout-beyond-numbers',
    lang: 'en',
    title: 'Scout beyond numbers: the context a coach actually needs',
    date: '2026-04-03',
    readMinutes: 4,
    author: 'SCOUT21',
    keywords: ['match analysis futsal', 'contextual stats', 'tactical scouting'],
    excerpt:
      'Raw stats are useful, but coaches ask "when?" and "against what system?". Context turns numbers into decisions.',
    paragraphs: [
      'Raw stats — shots, passes, distance — are useful, but rarely enough on their own. A coach asks when in the game this happened, against which opposing system, with which players on court.',
      'Good teams tie events to moments and players: not only "how many", but "when and why".',
      'SCOUT21 aims to bring the record closer to the reality of the bench: the same game feeds the collective read and the individual one.',
    ],
    translations: { 'pt-BR': 'scout-alem-dos-numeros', es: 'scout-mas-alla-de-los-numeros' },
  },
];
