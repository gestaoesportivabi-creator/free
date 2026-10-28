import React, { useMemo, useState } from 'react';
import { LiveScoutCourt } from './LiveScoutCourt';
import { ShotHeatMap } from './ShotHeatMap';
import {
  aggregateShotZoneHeat,
  eventTypeUsesCourtZone,
  shotOriginZoneLabel,
  type ShotHeatSource,
  type ShotOriginZone,
} from '../../utils/shotCourtZones';

/** Só na máquina local. O build de produção deste repo deixa `import.meta.env.DEV` ligado, então a rota não pode depender disso. */
export function isLocalQuadraPreview(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (host !== 'localhost' && host !== '127.0.0.1') return false;
  return window.location.pathname.replace(/\/$/, '') === '/dev/quadra';
}

const SEED: ShotHeatSource[] = [
  { type: 'shot', shotOriginZone: 'AREA_ADV' },
  { type: 'shot', shotOriginZone: 'AREA_ADV' },
  { type: 'shot', shotOriginZone: 'ENTRE_ADV' },
  { type: 'shot', shotOriginZone: 'LAT_AT_DIR' },
  { type: 'shot', shotOriginZone: 'FAIXA_AT' },
  { type: 'save', shotOriginZone: 'AREA_DEF' },
  { type: 'save', shotOriginZone: 'AREA_DEF' },
  { type: 'save', shotOriginZone: 'ENTRE_DEF' },
  { type: 'shot' },
];

type PendingAction = {
  action: string;
  label: string;
  results: readonly { id: string; label: string }[];
};

const SHOT_RESULTS = [
  { id: 'inside', label: 'No gol' },
  { id: 'outside', label: 'Fora' },
  { id: 'post', label: 'Trave' },
  { id: 'blocked', label: 'Bloqueado' },
] as const;

const SAVE_RESULTS = [
  { id: 'simple', label: 'Defesa simples' },
  { id: 'hard', label: 'Defesa difícil' },
  { id: 'outside', label: 'Pra fora' },
] as const;

const PASS_RESULTS = [
  { id: 'correct', label: 'Certo' },
  { id: 'wrong', label: 'Errado' },
] as const;

const FOUL_RESULTS = [
  { id: 'for', label: 'Nossa' },
  { id: 'against', label: 'Adversário' },
] as const;

const TACKLE_RESULTS = [
  { id: 'withBall', label: 'Com bola' },
  { id: 'withoutBall', label: 'Sem bola' },
  { id: 'counter', label: 'Contra-ataque' },
] as const;

type PreviewAthlete = { id: string; number: number; name: string; gk?: boolean };

const PREVIEW_COURT: PreviewAthlete[] = [
  { id: '1', number: 1, name: 'Dudu', gk: true },
  { id: '7', number: 7, name: 'Bia' },
  { id: '10', number: 10, name: 'Léo' },
  { id: '8', number: 8, name: 'Nina' },
  { id: '4', number: 4, name: 'Caio' },
];

const PREVIEW_BENCH: PreviewAthlete[] = [
  { id: '2', number: 2, name: 'Rafa' },
  { id: '3', number: 3, name: 'Mel' },
  { id: '5', number: 5, name: 'Ivo' },
  { id: '6', number: 6, name: 'Ana' },
  { id: '9', number: 9, name: 'Tom' },
  { id: '11', number: 11, name: 'Lia' },
];

/**
 * Harness visual em `vite` (`/dev/quadra`). A coleta real embute `LiveScoutCourt`
 * no miolo do `MatchScoutingWindow`. Esta tela não grava partida.
 */
export function QuadraScoutPreview() {
  const [running, setRunning] = useState(true);
  const [possession, setPossession] = useState<'com' | 'sem'>('com');
  const [zone, setZone] = useState<ShotOriginZone | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const [events, setEvents] = useState<ShotHeatSource[]>([]);
  const [athleteId, setAthleteId] = useState<string | null>(null);

  const heatEvents = useMemo(() => [...SEED, ...events], [events]);
  const liveHeat = useMemo(() => aggregateShotZoneHeat(events), [events]);

  const finish = (action: string, actionLabel: string, resultLabel: string | null) => {
    const located = eventTypeUsesCourtZone(action);
    const place = located && zone ? shotOriginZoneLabel(zone) : 'sem região';
    const athlete = [...PREVIEW_COURT, ...PREVIEW_BENCH].find((item) => item.id === athleteId);
    if ((action === 'shot' || action === 'save') && zone) {
      setEvents((prev) => [...prev, { type: action, shotOriginZone: zone }]);
    }
    setLast(`${actionLabel}${resultLabel ? ` · ${resultLabel}` : ''} · ${place}${athlete ? ` · #${athlete.number} ${athlete.name}` : ''}`);
    setZone(null);
    setPending(null);
  };

  const chooseAction = (action: string, label: string, results: readonly { id: string; label: string }[]) => {
    if (!eventTypeUsesCourtZone(action)) {
      finish(action, label, null);
      return;
    }
    if (results.length === 0) {
      finish(action, label, null);
      return;
    }
    setPending({ action, label, results });
  };

  const stand = (active: boolean) =>
    `flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border-2 px-1 text-center text-[11px] font-black uppercase leading-tight lg:h-24 lg:flex-none lg:text-sm ${
      active
        ? 'border-white bg-white/15 text-white'
        : 'border-white/15 bg-zinc-950 text-zinc-200 hover:border-white/40'
    }`;

  const athleteButton = (athlete: PreviewAthlete, place: 'court' | 'bench') => {
    const selected = athleteId === athlete.id;
    return (
      <button
        key={athlete.id}
        type="button"
        data-testid={`preview-athlete-${athlete.id}`}
        onClick={() => setAthleteId((current) => (current === athlete.id ? null : athlete.id))}
        className={`relative flex shrink-0 items-center justify-center font-black ${
          place === 'court'
            ? 'h-14 min-w-0 flex-1 flex-col gap-0.5 rounded-2xl text-base lg:h-12 lg:w-full lg:flex-none lg:flex-row lg:justify-start lg:gap-2 lg:rounded-xl lg:px-2 lg:text-sm'
            : 'h-10 w-10 rounded-full text-sm'
        } ${
          selected
            ? 'border-2 border-[#00f0ff] bg-[#00f0ff]/25 text-white shadow-[0_0_12px_rgba(0,240,255,0.35)]'
            : place === 'court'
              ? 'border-2 border-green-500/70 bg-green-500/15 text-white'
              : 'border-2 border-zinc-600 bg-zinc-900 text-zinc-200'
        }`}
      >
        <span className="tabular-nums leading-none">{athlete.number}</span>
        {place === 'court' && (
          <span className="max-w-[3.2rem] truncate text-[9px] font-bold leading-none normal-case lg:max-w-none lg:text-left lg:text-[11px]">{athlete.name}</span>
        )}
        {athlete.gk && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[9px] ring-1 ring-amber-500/80" aria-hidden>🥅</span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white lg:h-dvh lg:overflow-hidden">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-3 py-3 lg:h-full lg:flex-row lg:items-stretch lg:gap-4 lg:px-5 lg:py-4">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <header className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00f0ff]">Scout ao vivo</p>
              <h1 className="text-lg font-black uppercase leading-none">Quadra</h1>
            </div>
            <p className="hidden text-right text-[11px] text-zinc-500 lg:block">
              Região primeiro. O evento vem em seguida.
            </p>
          </header>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-stretch">
          <aside
            data-testid="preview-athletes"
            className="shrink-0 rounded-2xl border border-zinc-800 bg-black p-2 lg:flex lg:w-56 lg:flex-col"
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">Em quadra · 5/5</p>
            <div className="flex gap-1.5 lg:flex-col">
              {PREVIEW_COURT.map((athlete) => athleteButton(athlete, 'court'))}
            </div>
            <p className="mb-1 mt-2 text-[10px] font-bold uppercase tracking-wide text-zinc-400">Banco · {PREVIEW_BENCH.length}</p>
            <div className="flex flex-wrap gap-1.5">
              {PREVIEW_BENCH.map((athlete) => athleteButton(athlete, 'bench'))}
            </div>
          </aside>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <div className="flex gap-1">
            <button type="button" className={stand(possession === 'sem')} onClick={() => setPossession('sem')}>
              Sem posse
            </button>
            <button
              type="button"
              className={`${stand(false)} border-green-500/50 text-green-300`}
              onClick={() => chooseAction('goal', 'Gol', [])}
            >
              Gol
            </button>
            <button type="button" className={stand(possession === 'com')} onClick={() => setPossession('com')}>
              Com posse
            </button>
          </div>

          <div className="flex h-[min(42dvh,460px)] min-h-[260px] gap-1 lg:h-auto lg:min-h-0 lg:flex-1">
            <div className="flex w-[4.6rem] flex-col gap-1 sm:w-28 lg:w-32 lg:justify-center lg:gap-3">
              <button type="button" className={stand(pending?.action === 'foul')} onClick={() => chooseAction('foul', 'Falta', FOUL_RESULTS)}>
                Falta
              </button>
              <button type="button" className={stand(false)} onClick={() => chooseAction('corner', 'Escanteio', [])}>
                Escanteio
              </button>
            </div>
            <LiveScoutCourt
              className="min-h-0 min-w-0 flex-1"
              counts={liveHeat}
              selectedZone={zone}
              onClearZone={() => {
                setZone(null);
                setPending(null);
              }}
              onSelectZone={(next) => {
                if (pending) return;
                setZone((current) => (current === next ? null : next));
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="min-w-0 text-center">
                  <span className="block text-[8px] font-black uppercase tracking-[0.12em] text-[#00f0ff]">
                    {running ? '1º tempo' : 'Pausado'}
                  </span>
                  <span className="font-mono text-xl font-black tabular-nums leading-none lg:text-2xl">08:14</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRunning((value) => !value)}
                  className="h-9 w-9 shrink-0 rounded-full border border-amber-300/80 bg-amber-500/25 text-[9px] font-black uppercase leading-none text-amber-50"
                >
                  {running ? 'Pausa' : 'Vai'}
                </button>
              </div>
            </LiveScoutCourt>
            <div className="flex w-[4.6rem] flex-col gap-1 sm:w-28 lg:w-32 lg:justify-center lg:gap-3">
              {possession === 'com' ? (
                <>
                  <button type="button" className={stand(pending?.action === 'pass')} onClick={() => chooseAction('pass', 'Passe', PASS_RESULTS)}>
                    Passe
                  </button>
                  <button
                    type="button"
                    data-testid="preview-shot"
                    className={stand(pending?.action === 'shot')}
                    onClick={() => chooseAction('shot', 'Chute', SHOT_RESULTS)}
                  >
                    Chute
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className={stand(pending?.action === 'tackle')} onClick={() => chooseAction('tackle', 'Desarme', TACKLE_RESULTS)}>
                    Desarme
                  </button>
                  <button
                    type="button"
                    data-testid="preview-save"
                    className={stand(pending?.action === 'save')}
                    onClick={() => chooseAction('save', 'Chute adversário', SAVE_RESULTS)}
                  >
                    Chute adv.
                  </button>
                  <button type="button" className={stand(false)} onClick={() => chooseAction('block', 'Bloqueio', [])}>
                    Bloqueio
                  </button>
                </>
              )}
            </div>
          </div>

          {pending ? (
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4" data-testid="preview-results">
              {pending.results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => finish(pending.action, pending.label, result.label)}
                  className="rounded-2xl border border-white/20 bg-zinc-900 py-3 text-xs font-bold uppercase"
                >
                  {result.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1 text-[9px] font-black uppercase sm:text-[11px]">
              <button type="button" className={`${stand(false)} min-h-[44px]`} onClick={() => chooseAction('penalty', 'Pênalti', [])}>
                Pênalti
              </button>
              <button type="button" className={`${stand(false)} min-h-[44px]`} onClick={() => chooseAction('freeKick', 'Tiro livre', [])}>
                Tiro livre
              </button>
              <button type="button" className={`${stand(false)} min-h-[44px]`} onClick={() => chooseAction('lateral', 'Lateral', [])}>
                Lateral
              </button>
              <button type="button" className={`${stand(false)} min-h-[44px]`} onClick={() => chooseAction('card', 'Cartão', [])}>
                Cartão
              </button>
            </div>
          )}

          <p
            data-testid="preview-last-event"
            className={`min-h-[1.25rem] text-center text-[11px] font-bold uppercase tracking-wide ${
              last ? 'text-emerald-200' : 'text-zinc-600'
            }`}
          >
            {last ? `Último lance: ${last}` : 'Nenhum lance nesta tela'}
          </p>
          </div>
          </div>
        </section>

        <aside className="lg:w-[340px] lg:shrink-0 lg:overflow-y-auto">
          <ShotHeatMap events={heatEvents} />
        </aside>
      </div>
    </div>
  );
}
