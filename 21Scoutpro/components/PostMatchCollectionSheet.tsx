import React, { useState } from 'react';
import { Save, ArrowLeft, Calendar, Plus, Trash2 } from 'lucide-react';
import { MatchRecord, MatchStats, Player, PostMatchAction, PostMatchEvent } from '../types';

export interface PostMatchMatchContext {
  id: string;
  opponent: string;
  date: string;
  competition?: string;
}

interface FormData {
  time: string;
  period: '1T' | '2T';
  playerId: string;
  action: PostMatchAction | '';
}

interface PostMatchCollectionSheetProps {
  match: PostMatchMatchContext;
  players: Player[];
  onSave: (match: MatchRecord) => void;
  onBack: () => void;
  /** Usuário que está registrando as ações (para auditoria: quem fez/registrou cada ação) */
  recordedByUser?: { id?: string; name: string };
}

const ACTION_GROUPS: { group: string; options: { value: PostMatchAction; label: string }[] }[] = [
  {
    group: 'Gols / Assistências',
    options: [
      { value: 'goal', label: 'Gol' },
      { value: 'assist', label: 'Assistência' },
    ],
  },
  {
    group: 'Passes',
    options: [
      { value: 'passCorrect', label: 'Certos' },
      { value: 'passWrong', label: 'Errados' },
      { value: 'passTransicao', label: 'Que geraram transição' },
      { value: 'passProgressao', label: 'Em progressão' },
    ],
  },
  {
    group: 'Finalizações',
    options: [
      { value: 'shotOn', label: 'No gol' },
      { value: 'shotOff', label: 'Pra fora' },
      { value: 'shotZonaChute', label: 'Zona de chute' },
    ],
  },
  {
    group: 'Faltas',
    options: [{ value: 'falta', label: 'Falta' }],
  },
  {
    group: 'Desarmes',
    options: [
      { value: 'tackleWithBall', label: 'Com posse' },
      { value: 'tackleWithoutBall', label: 'Sem posse' },
      { value: 'tackleCounter', label: 'Que geraram contra-ataque' },
    ],
  },
];

const DEFESAS_ACTION: { value: PostMatchAction; label: string } = { value: 'save', label: 'Defesa' };

/** Mapeamento ação → tipo + subtipo para exibição e dashboard. */
const ACTION_TIPO_SUBTIPO: Record<PostMatchAction, { tipo: string; subtipo: string }> = {
  goal: { tipo: 'Gol', subtipo: 'A favor' },
  assist: { tipo: 'Assistência', subtipo: '' },
  passCorrect: { tipo: 'Passe', subtipo: 'Certo' },
  passWrong: { tipo: 'Passe', subtipo: 'Errado' },
  passTransicao: { tipo: 'Passe', subtipo: 'Transição' },
  passProgressao: { tipo: 'Passe', subtipo: 'Progressão' },
  shotOn: { tipo: 'Finalização', subtipo: 'No gol' },
  shotOff: { tipo: 'Finalização', subtipo: 'Pra fora' },
  shotZonaChute: { tipo: 'Finalização', subtipo: 'Zona de chute' },
  falta: { tipo: 'Falta', subtipo: '' },
  tackleWithBall: { tipo: 'Desarme', subtipo: 'Com posse' },
  tackleWithoutBall: { tipo: 'Desarme', subtipo: 'Sem posse' },
  tackleCounter: { tipo: 'Desarme', subtipo: 'Contra-ataque' },
  save: { tipo: 'Defesa', subtipo: '' },
};

function getTipoSubtipo(action: PostMatchAction): { tipo: string; subtipo: string } {
  return ACTION_TIPO_SUBTIPO[action] ?? { tipo: action, subtipo: '' };
}

function formatActionDisplay(tipo: string, subtipo: string): string {
  return subtipo ? `${tipo} - ${subtipo}` : tipo;
}

const emptyStats = (): MatchStats => ({
  goals: 0,
  assists: 0,
  passesCorrect: 0,
  passesWrong: 0,
  shotsOnTarget: 0,
  shotsOffTarget: 0,
  tacklesWithBall: 0,
  tacklesWithoutBall: 0,
  tacklesCounterAttack: 0,
  transitionErrors: 0,
  passesTransition: 0,
  passesProgression: 0,
  shotsShootZone: 0,
  fouls: 0,
  saves: 0,
});

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
};

const defaultFormData: FormData = {
  time: '',
  period: '1T',
  playerId: '',
  action: '',
};

/**
 * Formata apenas dígitos para MM:SS (ex.: "0100" → "01:00").
 * Usado no input em tempo real; exibe formato parcial enquanto digita.
 */
function formatDigitsToMMSS(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 4);
  if (d.length === 0) return '';
  if (d.length === 1) return `00:0${d}`;
  if (d.length === 2) return `${d}:`; // aguardando segundos
  if (d.length === 3) return `0${d[0]}:${d.slice(1)}`;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

/**
 * Normaliza tempo para MM:SS (apenas dígitos, ex.: "0100" → "01:00").
 * Usado ao adicionar evento e na exibição na tabela.
 */
function normalizeTime(digits: string): string | null {
  const d = digits.trim().replace(/\D/g, '');
  if (d.length === 0) return null;
  if (d.length === 1) {
    const sec = parseInt(d[0], 10);
    if (sec < 0 || sec > 59) return null;
    return `00:0${sec}`;
  }
  if (d.length === 2) {
    const m = parseInt(d, 10);
    if (m < 0 || m > 59) return null;
    return `${String(m).padStart(2, '0')}:00`;
  }
  if (d.length === 3) {
    const m = parseInt(d[0], 10);
    const sec = parseInt(d.slice(1), 10);
    if (m < 0 || m > 59 || sec < 0 || sec > 59) return null;
    return `0${m}:${String(sec).padStart(2, '0')}`;
  }
  const m = parseInt(d.slice(0, 2), 10);
  const sec = parseInt(d.slice(2, 4), 10);
  if (m < 0 || m > 59 || sec < 0 || sec > 59) return null;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export const PostMatchCollectionSheet: React.FC<PostMatchCollectionSheetProps> = ({
  match,
  players,
  onSave,
  onBack,
  recordedByUser,
}) => {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [events, setEvents] = useState<PostMatchEvent[]>([]);

  const updateForm = (field: keyof FormData, value: string | '1T' | '2T') => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getPlayer = (playerId: string) => players.find((p) => String(p.id).trim() === playerId);
  const isGoalkeeper = (playerId: string) => getPlayer(playerId)?.position === 'Goleiro';

  const handleTimeInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    updateForm('time', digits);
  };

  const handleAddEvent = () => {
    const t = normalizeTime(formData.time);
    if (!t) {
      alert('Informe o tempo (apenas números, ex.: 0100 para 01:00, 125 para 01:25).');
      return;
    }
    if (!formData.playerId.trim()) {
      alert('Selecione o jogador.');
      return;
    }
    if (!formData.action) {
      alert('Selecione a ação.');
      return;
    }
    const action = formData.action as PostMatchAction;
    const { tipo, subtipo } = getTipoSubtipo(action);
    const newEvent: PostMatchEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      time: t,
      period: formData.period,
      playerId: formData.playerId.trim(),
      action,
      tipo,
      subtipo,
    };
    setEvents((prev) => [...prev, newEvent]);
    setFormData({ ...defaultFormData });
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = () => {
    if (events.length === 0) {
      alert('Adicione pelo menos um evento antes de salvar.');
      return;
    }

    const teamStats = { ...emptyStats() };
    const playerStats: Record<string, MatchStats> = {};

    for (const e of events) {
      if (!playerStats[e.playerId]) {
        playerStats[e.playerId] = { ...emptyStats() };
      }
      const ps = playerStats[e.playerId];
      switch (e.action) {
        case 'goal':
          ps.goals += 1;
          teamStats.goals += 1;
          break;
        case 'assist':
          ps.assists += 1;
          teamStats.assists += 1;
          break;
        case 'passCorrect':
          ps.passesCorrect += 1;
          teamStats.passesCorrect += 1;
          break;
        case 'passWrong':
          ps.passesWrong += 1;
          teamStats.passesWrong += 1;
          break;
        case 'passTransicao':
          ps.passesTransition = (ps.passesTransition ?? 0) + 1;
          teamStats.passesTransition = (teamStats.passesTransition ?? 0) + 1;
          break;
        case 'passProgressao':
          ps.passesProgression = (ps.passesProgression ?? 0) + 1;
          teamStats.passesProgression = (teamStats.passesProgression ?? 0) + 1;
          break;
        case 'shotOn':
          ps.shotsOnTarget += 1;
          teamStats.shotsOnTarget += 1;
          break;
        case 'shotOff':
          ps.shotsOffTarget += 1;
          teamStats.shotsOffTarget += 1;
          break;
        case 'shotZonaChute':
          ps.shotsShootZone = (ps.shotsShootZone ?? 0) + 1;
          teamStats.shotsShootZone = (teamStats.shotsShootZone ?? 0) + 1;
          break;
        case 'falta':
          ps.fouls = (ps.fouls ?? 0) + 1;
          teamStats.fouls = (teamStats.fouls ?? 0) + 1;
          break;
        case 'tackleWithBall':
          ps.tacklesWithBall += 1;
          teamStats.tacklesWithBall += 1;
          break;
        case 'tackleWithoutBall':
          ps.tacklesWithoutBall += 1;
          teamStats.tacklesWithoutBall += 1;
          break;
        case 'tackleCounter':
          ps.tacklesCounterAttack += 1;
          teamStats.tacklesCounterAttack += 1;
          break;
        case 'save':
          ps.saves = (ps.saves ?? 0) + 1;
          teamStats.saves = (teamStats.saves ?? 0) + 1;
          break;
      }
    }

    const result: 'V' | 'D' | 'E' = 'E';
    const postMatchEventLogWithRecordedBy = recordedByUser
      ? events.map((e) => ({
          ...e,
          recordedByUserId: recordedByUser.id,
          recordedByName: recordedByUser.name,
        }))
      : events;
    const savedMatch: MatchRecord = {
      id: match.id,
      opponent: match.opponent,
      date: match.date,
      result,
      goalsFor: teamStats.goals,
      goalsAgainst: 0,
      competition: match.competition,
      playerStats,
      teamStats,
      postMatchEventLog: postMatchEventLogWithRecordedBy,
    };

    onSave(savedMatch);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
          Planilha pós-jogo
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-bold uppercase text-xs px-3 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={events.length === 0}
            className={`flex items-center gap-2 font-black uppercase text-xs px-4 py-2 rounded-xl transition-colors ${
              events.length > 0
                ? 'bg-[#00f0ff] hover:bg-[#00d9e6] text-black shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>

      <div className="bg-black rounded-3xl border border-zinc-900 p-4 shadow-lg">
        <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2">
          <Calendar className="text-[#00f0ff]" size={16} /> {match.opponent || 'Adversário'} · {formatDate(match.date)}
          {match.competition && ` · ${match.competition}`}
        </h3>
      </div>

      {/* Formulário de inserção */}
      <div className="bg-black rounded-3xl border border-zinc-900 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-zinc-800">
          <p className="text-zinc-400 text-xs font-bold uppercase mb-3">Inserir evento</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[100px]">
              <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Tempo (apenas números)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="ex. 0100 → 01:00"
                value={formatDigitsToMMSS(formData.time)}
                onChange={(e) => handleTimeInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white text-xs outline-none focus:border-[#00f0ff] font-mono tabular-nums"
              />
            </div>
            <div className="min-w-[110px]">
              <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Período</label>
              <select
                value={formData.period}
                onChange={(e) => updateForm('period', e.target.value as '1T' | '2T')}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white text-xs outline-none focus:border-[#00f0ff]"
              >
                <option value="1T">1º tempo</option>
                <option value="2T">2º tempo</option>
              </select>
            </div>
            <div className="min-w-[180px]">
              <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Jogador</label>
              <select
                value={formData.playerId}
                onChange={(e) => updateForm('playerId', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white text-xs outline-none focus:border-[#00f0ff]"
              >
                <option value="">Selecionar...</option>
                {players.map((p) => (
                  <option key={p.id} value={String(p.id).trim()}>
                    #{p.jerseyNumber} {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Ação</label>
              <select
                value={formData.action}
                onChange={(e) => updateForm('action', e.target.value as PostMatchAction | '')}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white text-xs outline-none focus:border-[#00f0ff]"
              >
                <option value="">Selecionar...</option>
                {ACTION_GROUPS.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
                {isGoalkeeper(formData.playerId) && (
                  <optgroup label="Defesas">
                    <option value={DEFESAS_ACTION.value}>{DEFESAS_ACTION.label}</option>
                  </optgroup>
                )}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddEvent}
              className="flex items-center gap-2 bg-[#00f0ff] hover:bg-[#00d9e6] text-black font-bold uppercase text-xs px-4 py-2 rounded-xl transition-colors h-[34px]"
            >
              <Plus size={16} /> Adicionar evento
            </button>
          </div>
        </div>

        {/* Tabela de eventos (somente leitura) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-zinc-950 text-[10px] text-zinc-400 uppercase tracking-wider font-bold border-b border-zinc-800">
                <th className="p-3 border-r border-zinc-800 w-24">Tempo (MM:SS)</th>
                <th className="p-3 border-r border-zinc-800 w-28">Período</th>
                <th className="p-3 border-r border-zinc-800 min-w-[160px]">Jogador</th>
                <th className="p-3 border-r border-zinc-800 min-w-[180px]">Ação</th>
                <th className="p-3 w-20 text-center">Remover</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => {
                const p = getPlayer(evt.playerId);
                return (
                  <tr key={evt.id} className="border-b border-zinc-800 hover:bg-zinc-950/50">
                    <td className="p-3 border-r border-zinc-800 text-white text-xs font-mono">
                      {evt.time}
                    </td>
                    <td className="p-3 border-r border-zinc-800 text-zinc-300 text-xs">
                      {evt.period === '1T' ? '1º tempo' : '2º tempo'}
                    </td>
                    <td className="p-3 border-r border-zinc-800 text-white text-xs font-bold">
                      {p ? `#${p.jerseyNumber} ${p.name}` : '?'}
                    </td>
                    <td className="p-3 border-r border-zinc-800 text-zinc-300 text-xs">
                      {formatActionDisplay(evt.tipo, evt.subtipo)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeEvent(evt.id)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 border border-zinc-700 hover:border-red-500 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Remover evento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {events.length === 0 && (
          <div className="p-8 text-center text-zinc-500 text-sm">
            Nenhum evento adicionado. Preencha o formulário acima e clique em &quot;Adicionar evento&quot;.
          </div>
        )}
      </div>
    </div>
  );
};
