import React, { useMemo, useState } from 'react';
import { LiveScoutCourt, type ShotZonePick } from './LiveScoutCourt';
import { ShotHeatMap } from './ShotHeatMap';
import {
  aggregateShotZoneHeat,
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

const OURS_RESULTS = [
  { id: 'inside', label: 'No gol' },
  { id: 'outside', label: 'Fora' },
  { id: 'post', label: 'Trave' },
  { id: 'blocked', label: 'Bloqueado' },
] as const;

/**
 * Harness visual em `vite` (`/dev/quadra`). A coleta real embute `LiveScoutCourt`
 * no miolo do `MatchScoutingWindow`. Esta tela não grava partida.
 */
export function QuadraScoutPreview() {
  const [running, setRunning] = useState(true);
  const [possession, setPossession] = useState<'com' | 'sem'>('com');
  const [picking, setPicking] = useState<ShotZonePick>(null);
  const [pendingZone, setPendingZone] = useState<ShotOriginZone | null>(null);
  const [events, setEvents] = useState<ShotHeatSource[]>([
    { type: 'shot', shotOriginZone: 'AT2_ESQ' },
    { type: 'shot', shotOriginZone: 'AT2_ESQ' },
    { type: 'shot', shotOriginZone: 'AT1_DIR' },
    { type: 'save', shotOriginZone: 'DF1_DIR' },
    { type: 'save', shotOriginZone: 'DF1_ESQ' },
  ]);

  const counts = useMemo(() => aggregateShotZoneHeat(events), [events]);

  const arm = (side: ShotZonePick) => {
    setPendingZone(null);
    setPicking(side);
  };

  const finish = (result: string) => {
    if (!pendingZone || !picking) return;
    setEvents((prev) => [
      ...prev,
      picking === 'ours'
        ? { type: 'shot', action: result, shotOriginZone: pendingZone }
        : { type: 'save', action: result, shotOriginZone: pendingZone },
    ]);
    setPendingZone(null);
    setPicking(null);
  };

  const stand = (active: boolean) =>
    `flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border-2 px-1 text-[11px] font-black uppercase ${
      active
        ? 'border-white bg-white/15 text-white'
        : 'border-white/15 bg-zinc-950 text-zinc-300'
    }`;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-3 px-3 py-4">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00f0ff]">Scout ao vivo</p>
          <h1 className="text-lg font-black uppercase">Quadra</h1>
        </header>

        <div className="flex gap-1">
          <button type="button" className={stand(possession === 'sem')} onClick={() => setPossession('sem')}>
            Sem posse
          </button>
          <button type="button" className={`${stand(false)} border-green-500/50 text-green-300`}>
            Gol
          </button>
          <button type="button" className={stand(possession === 'com')} onClick={() => setPossession('com')}>
            Com posse
          </button>
        </div>

        <div className="flex min-h-[460px] gap-1">
          <div className="flex w-[72px] flex-col gap-1">
            <button type="button" className={stand(false)}>Falta</button>
            <button type="button" className={stand(false)}>Escanteio</button>
          </div>
          <LiveScoutCourt
            className="min-h-[420px] flex-1"
            counts={counts}
            picking={pendingZone ? null : picking}
            selectedZone={pendingZone}
            onCancelPick={() => {
              setPicking(null);
              setPendingZone(null);
            }}
            onSelectZone={(zone) => setPendingZone(zone)}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#00f0ff]">
                {running ? '1º tempo' : 'Pausado'}
              </span>
              <span className="font-mono text-2xl font-black tabular-nums leading-none">08:14</span>
              <button
                type="button"
                onClick={() => setRunning((value) => !value)}
                className="w-full rounded-full border border-amber-400/80 bg-amber-500/20 py-1.5 text-[10px] font-black uppercase text-amber-100"
              >
                {running ? 'Pausar' : 'Continuar'}
              </button>
            </div>
          </LiveScoutCourt>
          <div className="flex w-[72px] flex-col gap-1">
            {possession === 'com' ? (
              <>
                <button type="button" className={stand(false)}>Passe</button>
                <button type="button" className={stand(picking === 'ours')} onClick={() => arm('ours')}>
                  Chute
                </button>
              </>
            ) : (
              <>
                <button type="button" className={stand(false)}>Desarme</button>
                <button
                  type="button"
                  className={stand(picking === 'conceded')}
                  onClick={() => arm('conceded')}
                >
                  Chute adv.
                </button>
                <button type="button" className={stand(false)}>Bloqueio</button>
              </>
            )}
          </div>
        </div>

        {pendingZone && (
          <div className="grid grid-cols-2 gap-1">
            {(picking === 'conceded'
              ? [
                  { id: 'simple', label: 'Defesa simples' },
                  { id: 'hard', label: 'Defesa difícil' },
                  { id: 'outside', label: 'Pra fora' },
                ]
              : OURS_RESULTS
            ).map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => finish(result.id)}
                className="rounded-2xl border border-white/20 bg-zinc-900 py-3 text-xs font-bold uppercase"
              >
                {result.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-1 text-[9px] font-black uppercase">
          {['Pênalti', 'Tiro livre', 'Lateral', 'Cartão'].map((label) => (
            <button key={label} type="button" className={`${stand(false)} min-h-[44px]`}>
              {label}
            </button>
          ))}
        </div>

        <ShotHeatMap events={events} />
      </div>
    </div>
  );
}
