/**
 * Dossiês de adversários — Assistant API (bot técnico)
 * Combina: cadastro DB + histórico Scout21 + perfis estáticos Série Prata
 */

import prisma from '../../config/database';
import type { TenantInfo } from '../../utils/tenant.helper';

function requireEquipeIds(tenantInfo: TenantInfo): string[] {
  const ids = tenantInfo.equipe_ids ?? [];
  if (ids.length === 0) throw new Error('Nenhuma equipe vinculada ao tenant');
  return ids;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function opponentKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function namesMatch(a: string, b: string): boolean {
  const ka = opponentKey(a);
  const kb = opponentKey(b);
  if (ka === kb) return true;
  if (ka.includes(kb) || kb.includes(ka)) return true;
  return false;
}

export interface OpponentHeadToHead {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface OpponentListItem {
  key: string;
  name: string;
  competition: string | null;
  hasAnalysis: boolean;
  hasVideo: boolean;
  videoCount: number;
  monitorado: boolean;
  headToHead: OpponentHeadToHead;
  lastMeeting: {
    date: string;
    result: string | null;
    goalsFor: number;
    goalsAgainst: number;
  } | null;
  source: 'db' | 'matches' | 'catalog';
}

export interface OpponentVideoLink {
  id?: string;
  label: string;
  url: string;
  date: string | null;
  fromMatch: boolean;
  source?: string;
  opponentKey?: string;
  opponentName?: string;
}

export interface OpponentDetail {
  key: string;
  name: string;
  competition: string | null;
  tecnicoNome: string | null;
  monitorado: boolean;
  headToHead: OpponentHeadToHead;
  meetings: Array<{
    id: string;
    date: string;
    result: string | null;
    goalsFor: number;
    goalsAgainst: number;
    competition: string | null;
    location: string | null;
    videoUrl: string | null;
  }>;
  pontosFortes: string | null;
  pontosFracos: string | null;
  analiseTexto: string | null;
  analiseAtualizadaEm: string | null;
  videos: OpponentVideoLink[];
  youtubeChannels: Array<{ label: string; url: string; tipo: string }>;
  proximoJogo: { date: string | null; local: string | null };
  observacoes: string | null;
  scout21Note: string | null;
}

/** Catálogo Série Prata 2026 + dossiês estáticos (P0 — sem depender de web scrape) */
const SERIE_PRATA_CATALOG = [
  'Pinhalense',
  'Adaf Saudades',
  'Maravilha',
  'AD Cunha Porã',
  'Palmitos',
  'Xaxim',
  'Joaçaba',
  'Catanduvas',
  'Rio do Sul',
  'Marcílio Dias',
] as const;

type StaticProfile = {
  names: string[];
  tecnicoNome?: string;
  competicao?: string;
  videoUrl?: string;
  youtubeChannelUrl?: string;
  pontosFortes?: string;
  pontosFracos?: string;
  analiseTexto: string;
};

const STATIC_OPPONENT_PROFILES: StaticProfile[] = [
  {
    names: ['Palmitos', 'Palmitos Futsal'],
    tecnicoNome: 'Duda',
    competicao: 'Série Prata 2026',
    videoUrl: 'https://www.youtube.com/watch?v=Ke2HAQHl1EY',
    youtubeChannelUrl: 'https://www.youtube.com/@federaocatarinensedefutsal',
    pontosFortes:
      'Escanteios ensaiados; transição Camargo–Rodrigo–Caixa/Vitinho; pressão alta no 2T; goleiro-linha treinado; fator casa.',
    pontosFracos:
      'Sistema defensivo em bola parada; concentração após sofrer gol; escanteios defensivos; 6ª falta mal aproveitada.',
    analiseTexto: `PALMITOS — Análise adversário (vídeo FCFS 04/06/2026, 3×3)

Contexto: visitante Catanduvas em Palmitos/SC, 3ª rodada Série Prata. Intervalo 3×1 Catanduvas; Palmitos buscou empate no 2T.

Escalação inicial Palmitos: Camargo #18 (C), Vitinho #15, Rodrigo #20, Caixa #12, GK Luciano.

Gols Palmitos: Vitinho (~43' escanteio); Vitinho (~1h17' individual); Caixa (~1h48' goleiro-linha, assist Rodrigo).

Ameaças: Vitinho (2 gols, cobranças); Camargo (liderança + finalização); Caixa na área; goleiro-linha no fim.

Cartões Palmitos: Vitinho, Gimariga, Camargo.

Recomendações: marcação agressiva na 1ª linha; reforçar defesa de escanteio/falta; atenção ao goleiro-linha nos acréscimos; explorar transição quando errarem passe.`,
  },
  {
    names: ['Pinhalense'],
    competicao: 'Série Prata 2026',
    pontosFortes: 'Liderança na competição (imprensa local); ataque vertical.',
    pontosFracos: 'Validar com scout Scout21 — último jogo AFC 1×3 (09/05).',
    analiseTexto: `PINHALENSE — Último confronto Scout21: 09/05/2026, 1×3 (derrota visitante).

Scout AFC: 6 chutes no gol, 22 desarmes equipe; artilheiro Fabiano (1 gol).

Nota: imprensa local reportou 4×2 Pinhalense em outro contexto — citar cadastro Scout21 como fonte interna.`,
  },
  {
    names: ['Marcílio Dias', 'Marcilio Dias'],
    competicao: 'Série Prata 2026',
    analiseTexto: `MARCÍLIO DIAS — Estreia Série Prata AFC: 21/03/2026, 0×4 fora (derrota).`,
  },
  {
    names: ['Adaf Saudades', 'Adaf-Saudades'],
    competicao: 'Série Prata 2026',
    analiseTexto: `ADAF SAUDADES — 29/03/2026, 4×7 mandante (derrota).`,
  },
];

function findStaticProfile(name: string): StaticProfile | null {
  return STATIC_OPPONENT_PROFILES.find((p) => p.names.some((n) => namesMatch(n, name))) ?? null;
}

function emptyH2H(): OpponentHeadToHead {
  return { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
}

function computeH2H(
  meetings: Array<{ resultado: string | null; golsPro: number; golsContra: number }>
): OpponentHeadToHead {
  const h = emptyH2H();
  for (const m of meetings) {
    h.played += 1;
    h.goalsFor += m.golsPro;
    h.goalsAgainst += m.golsContra;
    if (m.resultado === 'V') h.wins += 1;
    else if (m.resultado === 'E') h.draws += 1;
    else if (m.resultado === 'D') h.losses += 1;
  }
  return h;
}

const DEFAULT_YOUTUBE_CHANNELS = [
  {
    label: 'FCFS / Inova (oficial Série Prata)',
    url: 'https://www.youtube.com/@federaocatarinensedefutsal',
    tipo: 'oficial',
  },
];

function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, '');
    return host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com';
  } catch {
    return false;
  }
}

export function normalizeYouTubeUrl(url: string): string {
  const trimmed = url.trim();
  if (!isYouTubeUrl(trimmed)) {
    throw new Error('URL invalida — use um link do YouTube (youtube.com ou youtu.be)');
  }
  return trimmed.split('&')[0];
}

async function findOrCreateAdversario(equipeId: string, name: string) {
  const existing = await prisma.adversario.findFirst({
    where: { equipeId, nome: { equals: name, mode: 'insensitive' } },
  });
  if (existing) return existing;

  const stat = findStaticProfile(name);
  return prisma.adversario.create({
    data: {
      equipeId,
      nome: name,
      apelidos: stat ? stat.names.filter((n) => !namesMatch(n, name)) : [],
      competicao: stat?.competicao ?? 'Série Prata 2026',
      tecnicoNome: stat?.tecnicoNome,
      youtubeChannelUrl: stat?.youtubeChannelUrl,
      videoUrl: stat?.videoUrl,
      pontosFortes: stat?.pontosFortes,
      pontosFracos: stat?.pontosFracos,
      analiseTexto: stat?.analiseTexto,
      analiseAtualizadaEm: stat?.analiseTexto ? new Date() : undefined,
    },
  });
}

async function resolveAdversarioForKey(tenantInfo: TenantInfo, keyOrName: string) {
  const equipeIds = requireEquipeIds(tenantInfo);
  const primaryEquipeId = equipeIds[0];
  await ensureDefaultOpponentSeeds(primaryEquipeId);

  const list = await listOpponents(tenantInfo);
  const normalized = opponentKey(keyOrName);
  const item =
    list.opponents.find((o) => o.key === normalized || namesMatch(o.name, keyOrName)) ??
    list.opponents.find((o) => opponentKey(o.name).includes(normalized) || normalized.includes(o.key));

  if (!item) return null;

  const row = await findOrCreateAdversario(primaryEquipeId, item.name);
  return { row, item };
}

async function getMeetingsForOpponent(equipeIds: string[], opponentName: string) {
  const all = await prisma.jogo.findMany({
    where: { equipeId: { in: equipeIds } },
    orderBy: { data: 'desc' },
    include: { competicao: { select: { nome: true } } },
  });
  return all.filter((j) => namesMatch(j.adversario, opponentName));
}

export async function listOpponents(tenantInfo: TenantInfo) {
  const equipeIds = requireEquipeIds(tenantInfo);
  const primaryEquipeId = equipeIds[0];

  const [dbRows, allMatches, youtubeRows] = await Promise.all([
    prisma.adversario.findMany({
      where: { equipeId: { in: equipeIds } },
      orderBy: [{ monitorado: 'desc' }, { nome: 'asc' }],
      include: { _count: { select: { videos: true } } },
    }),
    prisma.jogo.findMany({
      where: { equipeId: { in: equipeIds } },
      orderBy: { data: 'desc' },
      select: {
        adversario: true,
        data: true,
        resultado: true,
        golsPro: true,
        golsContra: true,
        videoUrl: true,
        campeonato: true,
      },
    }),
    prisma.youtubeCanal.findMany({
      where: { equipeId: { in: equipeIds } },
      orderBy: { label: 'asc' },
    }),
  ]);

  const nameSet = new Map<string, OpponentListItem>();

  const upsert = (name: string, source: OpponentListItem['source']) => {
    const key = opponentKey(name);
    const existing = nameSet.get(key);
    const meetings = allMatches.filter((m) => namesMatch(m.adversario, name));
    const h2h = computeH2H(meetings);
    const last = meetings[0];
    const db = dbRows.find((r) => namesMatch(r.nome, name));
    const stat = findStaticProfile(name);
    const dbVideoCount = db?._count?.videos ?? 0;
    const matchVideoCount = meetings.filter((m) => m.videoUrl).length;
    const staticVideoCount = stat?.videoUrl ? 1 : 0;
    const videoCount = dbVideoCount + matchVideoCount + (db?.videoUrl && !stat?.videoUrl ? 1 : 0);
    const hasVideoFlag = videoCount > 0 || staticVideoCount > 0;

    const lastMeeting = last
      ? {
          date: formatDate(last.data),
          result: last.resultado,
          goalsFor: last.golsPro,
          goalsAgainst: last.golsContra,
        }
      : existing?.lastMeeting ?? null;

    const item: OpponentListItem = {
      key,
      name: db?.nome ?? existing?.name ?? name,
      competition: db?.competicao ?? stat?.competicao ?? last?.campeonato ?? existing?.competition ?? null,
      hasAnalysis: Boolean(db?.analiseTexto || stat?.analiseTexto),
      hasVideo: hasVideoFlag,
      videoCount: Math.max(videoCount, staticVideoCount),
      monitorado: db?.monitorado ?? existing?.monitorado ?? false,
      headToHead: h2h,
      lastMeeting,
      source: existing?.source === 'db' ? 'db' : existing?.source === 'matches' ? 'matches' : source,
    };
    nameSet.set(key, item);
  };

  for (const row of dbRows) {
    upsert(row.nome, 'db');
  }

  const matchOpponents = new Set(allMatches.map((m) => m.adversario));
  for (const name of matchOpponents) {
    upsert(name, 'matches');
  }

  for (const name of SERIE_PRATA_CATALOG) {
    if (namesMatch(name, 'Catanduvas')) continue;
    upsert(name, 'catalog');
  }

  const opponents = [...nameSet.values()].sort((a, b) => {
    if (a.monitorado !== b.monitorado) return a.monitorado ? -1 : 1;
    if (a.headToHead.played !== b.headToHead.played) return b.headToHead.played - a.headToHead.played;
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  const youtubeChannels =
    youtubeRows.length > 0
      ? youtubeRows.map((c) => ({ label: c.label, url: c.channelUrl, tipo: c.tipo }))
      : DEFAULT_YOUTUBE_CHANNELS;

  return {
    total: opponents.length,
    opponents,
    seriePrataCatalog: SERIE_PRATA_CATALOG.filter((n) => !namesMatch(n, 'Catanduvas')),
    youtubeChannels,
    primaryEquipeId,
  };
}

export async function getOpponentDetail(tenantInfo: TenantInfo, keyOrName: string): Promise<OpponentDetail | null> {
  const equipeIds = requireEquipeIds(tenantInfo);
  const list = await listOpponents(tenantInfo);
  const normalized = opponentKey(keyOrName);

  const item =
    list.opponents.find((o) => o.key === normalized || namesMatch(o.name, keyOrName)) ??
    list.opponents.find((o) => opponentKey(o.name).includes(normalized) || normalized.includes(o.key));

  if (!item) return null;

  const [dbRow, meetings] = await Promise.all([
    prisma.adversario.findFirst({
      where: {
        equipeId: { in: equipeIds },
        nome: { equals: item.name, mode: 'insensitive' },
      },
      include: {
        videos: { orderBy: { createdAt: 'desc' } },
      },
    }),
    getMeetingsForOpponent(equipeIds, item.name),
  ]);

  const stat = findStaticProfile(item.name);
  const h2h = computeH2H(meetings);

  const videos: OpponentVideoLink[] = [];
  const seenUrls = new Set<string>();

  const pushVideo = (
    label: string,
    url: string,
    date: string | null,
    fromMatch: boolean,
    meta?: { id?: string; source?: string }
  ) => {
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    videos.push({
      label,
      url,
      date,
      fromMatch,
      id: meta?.id,
      source: meta?.source,
      opponentKey: item.key,
      opponentName: dbRow?.nome ?? item.name,
    });
  };

  if (stat?.videoUrl) pushVideo('Transmissão FCFS (análise)', stat.videoUrl, '2026-06-04', false, { source: 'static' });
  if (dbRow?.videoUrl) pushVideo('Vídeo principal', dbRow.videoUrl, null, false, { source: 'cadastro' });
  if (dbRow?.videos) {
    for (const v of dbRow.videos) {
      pushVideo(v.label || 'Vídeo cadastrado', v.url, v.dataJogo ? formatDate(v.dataJogo) : null, false, {
        id: v.id,
        source: v.fonte,
      });
    }
  }
  for (const m of meetings) {
    if (m.videoUrl) {
      pushVideo(`Jogo ${formatDate(m.data)}`, m.videoUrl, formatDate(m.data), true);
    }
  }

  const youtubeChannels = [...list.youtubeChannels];
  const advChannel = dbRow?.youtubeChannelUrl ?? stat?.youtubeChannelUrl;
  if (advChannel && !youtubeChannels.some((c) => c.url === advChannel)) {
    youtubeChannels.push({ label: `Canal ${item.name}`, url: advChannel, tipo: 'adversario' });
  }

  let scout21Note: string | null = null;
  if (meetings.length === 0 && stat) {
    scout21Note = 'Sem confronto cadastrado no Scout21 — análise baseada em vídeo/transmissão externa.';
  } else if (meetings.length === 0) {
    scout21Note = 'Sem histórico no Scout21 para este adversário.';
  }

  return {
    key: item.key,
    name: dbRow?.nome ?? item.name,
    competition: dbRow?.competicao ?? stat?.competicao ?? item.competition,
    tecnicoNome: dbRow?.tecnicoNome ?? stat?.tecnicoNome ?? null,
    monitorado: dbRow?.monitorado ?? false,
    headToHead: h2h,
    meetings: meetings.map((m) => ({
      id: m.id,
      date: formatDate(m.data),
      result: m.resultado,
      goalsFor: m.golsPro,
      goalsAgainst: m.golsContra,
      competition: m.campeonato || m.competicao?.nome || null,
      location: m.local,
      videoUrl: m.videoUrl,
      observacoes: (m as { observacoes?: string | null }).observacoes ?? null,
    })),
    pontosFortes: dbRow?.pontosFortes ?? stat?.pontosFortes ?? null,
    pontosFracos: dbRow?.pontosFracos ?? stat?.pontosFracos ?? null,
    analiseTexto: dbRow?.analiseTexto ?? stat?.analiseTexto ?? null,
    analiseAtualizadaEm: dbRow?.analiseAtualizadaEm?.toISOString() ?? null,
    videos,
    youtubeChannels,
    proximoJogo: {
      date: dbRow?.proximoJogoData ? formatDate(dbRow.proximoJogoData) : null,
      local: dbRow?.proximoJogoLocal ?? null,
    },
    observacoes: dbRow?.observacoes ?? null,
    scout21Note,
  };
}

/** Garante registro DB do Palmitos na equipe (idempotente) — só AFC Catanduvas */
export async function ensureDefaultOpponentSeeds(equipeId: string) {
  const equipe = await prisma.equipe.findUnique({ where: { id: equipeId }, select: { nome: true } });
  if (!equipe || !/catanduvas|afc/i.test(equipe.nome)) return;

  const palmitos = STATIC_OPPONENT_PROFILES.find((p) => p.names.includes('Palmitos'));
  if (!palmitos) return;

  const existing = await prisma.adversario.findFirst({
    where: { equipeId, nome: { equals: 'Palmitos', mode: 'insensitive' } },
  });
  if (existing) return;

  await prisma.adversario.create({
    data: {
      equipeId,
      nome: 'Palmitos',
      apelidos: ['Palmitos Futsal'],
      competicao: palmitos.competicao,
      tecnicoNome: palmitos.tecnicoNome,
      youtubeChannelUrl: palmitos.youtubeChannelUrl,
      videoUrl: palmitos.videoUrl,
      pontosFortes: palmitos.pontosFortes,
      pontosFracos: palmitos.pontosFracos,
      analiseTexto: palmitos.analiseTexto,
      analiseAtualizadaEm: new Date(),
    },
  });
}

export async function listOpponentsWithSeed(tenantInfo: TenantInfo) {
  const equipeIds = requireEquipeIds(tenantInfo);
  for (const equipeId of equipeIds) {
    await ensureDefaultOpponentSeeds(equipeId);
  }
  return listOpponents(tenantInfo);
}

export async function getOpponentDetailWithSeed(tenantInfo: TenantInfo, keyOrName: string) {
  const equipeIds = requireEquipeIds(tenantInfo);
  for (const equipeId of equipeIds) {
    await ensureDefaultOpponentSeeds(equipeId);
  }
  return getOpponentDetail(tenantInfo, keyOrName);
}

export async function addOpponentVideo(
  tenantInfo: TenantInfo,
  keyOrName: string,
  input: { url: string; label?: string; gameDate?: string; fonte?: string; opponentName?: string }
) {
  let resolved = await resolveAdversarioForKey(tenantInfo, keyOrName);

  if (!resolved && input.opponentName?.trim()) {
    const equipeId = requireEquipeIds(tenantInfo)[0];
    const name = input.opponentName.trim();
    const row = await findOrCreateAdversario(equipeId, name);
    resolved = {
      row,
      item: {
        key: opponentKey(name),
        name,
        competition: null,
        hasAnalysis: false,
        hasVideo: false,
        videoCount: 0,
        monitorado: false,
        headToHead: emptyH2H(),
        lastMeeting: null,
        source: 'catalog' as const,
      },
    };
  }

  if (!resolved) {
    throw new Error('Adversário não encontrado');
  }

  const url = normalizeYouTubeUrl(input.url);
  const gameDate = input.gameDate?.trim()
    ? new Date(input.gameDate.trim() + 'T12:00:00.000Z')
    : null;

  const video = await prisma.adversarioVideo.upsert({
    where: {
      adversarioId_url: { adversarioId: resolved.row.id, url },
    },
    create: {
      adversarioId: resolved.row.id,
      url,
      label: input.label?.trim() || null,
      dataJogo: gameDate,
      fonte: input.fonte?.trim() || 'telegram',
    },
    update: {
      label: input.label?.trim() || undefined,
      dataJogo: gameDate ?? undefined,
    },
  });

  await prisma.adversario.update({
    where: { id: resolved.row.id },
    data: { updatedAt: new Date() },
  });

  const detail = await getOpponentDetail(tenantInfo, resolved.item.key);
  return {
    video: {
      id: video.id,
      url: video.url,
      label: video.label,
      date: video.dataJogo ? formatDate(video.dataJogo) : null,
      opponentKey: resolved.item.key,
      opponentName: resolved.item.name,
    },
    opponent: detail,
  };
}

export async function listVideoRegistry(tenantInfo: TenantInfo) {
  const equipeIds = requireEquipeIds(tenantInfo);

  const rows = await prisma.adversarioVideo.findMany({
    where: { adversario: { equipeId: { in: equipeIds } } },
    orderBy: { createdAt: 'desc' },
    include: {
      adversario: { select: { nome: true, id: true } },
    },
  });

  const matchVideos = await prisma.jogo.findMany({
    where: { equipeId: { in: equipeIds }, videoUrl: { not: null } },
    orderBy: { data: 'desc' },
    select: {
      id: true,
      adversario: true,
      data: true,
      videoUrl: true,
      resultado: true,
      golsPro: true,
      golsContra: true,
    },
  });

  const saved = rows.map((v) => ({
    id: v.id,
    type: 'adversario' as const,
    opponentName: v.adversario.nome,
    opponentKey: opponentKey(v.adversario.nome),
    label: v.label || 'Vídeo cadastrado',
    url: v.url,
    date: v.dataJogo ? formatDate(v.dataJogo) : null,
    source: v.fonte,
    createdAt: v.createdAt.toISOString(),
  }));

  const fromMatches = matchVideos
    .filter((m) => m.videoUrl)
    .map((m) => ({
      id: m.id,
      type: 'jogo' as const,
      opponentName: m.adversario,
      opponentKey: opponentKey(m.adversario),
      label: `Jogo Scout21 ${formatDate(m.data)}`,
      url: m.videoUrl!,
      date: formatDate(m.data),
      source: 'scout21',
      result: m.resultado,
      score: `${m.golsPro}x${m.golsContra}`,
      createdAt: null,
    }));

  return {
    total: saved.length + fromMatches.length,
    savedVideos: saved,
    matchVideos: fromMatches,
  };
}

export async function addYoutubeChannel(
  tenantInfo: TenantInfo,
  input: { label: string; channelUrl: string; tipo?: string }
) {
  const equipeId = requireEquipeIds(tenantInfo)[0];
  const url = input.channelUrl.trim();
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    throw new Error('URL invalida — informe um canal ou link do YouTube');
  }

  const existing = await prisma.youtubeCanal.findFirst({
    where: { equipeId, channelUrl: url },
  });
  if (existing) {
    return { channel: existing, created: false };
  }

  const channel = await prisma.youtubeCanal.create({
    data: {
      equipeId,
      label: input.label.trim() || 'Canal YouTube',
      channelUrl: url,
      tipo: input.tipo?.trim() || 'custom',
    },
  });

  return { channel, created: true };
}

/** Salva link YouTube — infere adversário do último jogo se omitido */
export async function addVideoFromPaste(
  tenantInfo: TenantInfo,
  input: { url: string; opponentName?: string; label?: string }
) {
  const { getLastMatchSummary } = await import('./coachInsights.service');
  let opponentName = input.opponentName?.trim();
  if (!opponentName) {
    const last = await getLastMatchSummary(tenantInfo);
    opponentName = last.match?.opponent ?? undefined;
  }
  if (!opponentName) {
    throw new Error('Informe o adversário junto com o link do YouTube');
  }
  const key = opponentKey(opponentName);
  return addOpponentVideo(tenantInfo, key, {
    url: input.url,
    label: input.label,
    opponentName,
    fonte: 'web-dashboard',
  });
}
