import React, { useState } from 'react';
import { Check, ClipboardList, Loader2, PlayCircle, Sparkles, Table2, Users } from 'lucide-react';
import { Player, Position, User } from '../../types';
import { accountApi, playersApi } from '../../services/api';
import { ParsedPlayer, RosterPaste } from './RosterPaste';

/**
 * Wizard de primeiro acesso.
 *
 * Existe porque o cadastro sozinho leva a um dashboard vazio: sem elenco e sem
 * jogos, todo gráfico do SCOUT21 é uma caixa vazia e o usuário não consegue
 * avaliar nada. Ver docs/PLANO_MESTRE_TRIAL_30D.md (§4).
 *
 * Todos os passos são puláveis — nunca prender quem só quer olhar.
 */

type StepId = 1 | 2 | 3;
type RosterMode = 'quick' | 'paste' | 'demo';

interface WelcomeWizardProps {
  user: User;
  /** Destino escolhido no passo 3. */
  onFinish: (destination: 'live' | 'postmatch' | 'dashboard') => void;
  onSkip: () => void;
}

const POSITIONS: Position[] = ['Goleiro', 'Fixo', 'Ala', 'Pivô'];

interface QuickRow {
  name: string;
  jersey: string;
  position: Position;
}

const EMPTY_ROWS: QuickRow[] = Array.from({ length: 5 }, () => ({
  name: '',
  jersey: '',
  position: 'Ala',
}));

/** Converte o que o wizard coletou no shape que a API de jogadores espera. */
function toPlayer(entry: { name: string; jersey: number | null; position: Position }): Player {
  return {
    id: '',
    name: entry.name,
    nickname: entry.name.split(' ')[0] ?? entry.name,
    position: entry.position,
    jerseyNumber: entry.jersey ?? 0,
    dominantFoot: 'Destro',
    age: 0,
    height: 0,
  };
}

function normalizePosition(raw: string | null): Position {
  if (raw === 'Goleiro' || raw === 'Fixo' || raw === 'Ala' || raw === 'Pivô') return raw;
  return 'Ala';
}

const cardClass =
  'w-full text-left rounded-2xl border p-5 transition-all cursor-pointer ' +
  'hover:border-[#00f0ff]/60 hover:bg-[#00f0ff]/[0.04]';

export const WelcomeWizard: React.FC<WelcomeWizardProps> = ({ user, onFinish, onSkip }) => {
  const [step, setStep] = useState<StepId>(1);
  const [teamName, setTeamName] = useState(user.teamDisplayName ?? '');
  const [rosterMode, setRosterMode] = useState<RosterMode | null>(null);
  const [quickRows, setQuickRows] = useState<QuickRow[]>(EMPTY_ROWS);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState('');

  const goToStep = (next: StepId) => {
    setError('');
    setStep(next);
  };

  const savePlayers = async (players: Player[]) => {
    if (players.length === 0) {
      goToStep(3);
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Sequencial de propósito: a API de jogadores não tem endpoint em lote,
      // e disparar 30 requisições em paralelo no primeiro acesso é bom jeito
      // de tomar rate-limit e assustar o usuário com metade salva.
      let saved = 0;
      for (const player of players) {
        await playersApi.create(player);
        saved += 1;
        setSavedCount(saved);
      }
      goToStep(3);
    } catch {
      setError(
        savedCount > 0
          ? `Salvámos ${savedCount} atleta(s), mas houve falha no resto. Você pode completar o elenco depois.`
          : 'Não foi possível salvar o elenco. Você pode adicionar os atletas depois, pelo menu Elenco.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickSave = () => {
    const players = quickRows
      .filter((row) => row.name.trim().length > 1)
      .map((row) =>
        toPlayer({
          name: row.name.trim(),
          jersey: row.jersey ? parseInt(row.jersey, 10) : null,
          position: row.position,
        })
      );
    void savePlayers(players);
  };

  const handlePasteSave = (parsed: ParsedPlayer[]) => {
    const players = parsed.map((entry) =>
      toPlayer({
        name: entry.nome,
        jersey: entry.numero,
        position: normalizePosition(entry.funcao),
      })
    );
    void savePlayers(players);
  };

  const handleDemoData = async () => {
    setIsSaving(true);
    setError('');
    try {
      await accountApi.seedDemoData();
      goToStep(3);
    } catch {
      setError('Não foi possível carregar os dados de demonstração. Tente pelo painel depois.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTeamSave = async () => {
    // O nome da equipe já foi criado no cadastro; aqui só seguimos.
    // Editar o nome fica em Configurações, para não bloquear o fluxo.
    goToStep(2);
  };

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col">
      <header className="shrink-0 border-b border-zinc-900">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {([1, 2, 3] as StepId[]).map((n) => (
              <div
                key={n}
                className={`h-1.5 rounded-full transition-all ${
                  n === step ? 'w-8 bg-[#00f0ff]' : n < step ? 'w-8 bg-[#00f0ff]/40' : 'w-4 bg-zinc-800'
                }`}
              />
            ))}
            <span className="ml-2 text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
              Passo {step} de 3
            </span>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Pular
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 pb-16">
          {/* ── Passo 1: equipe ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00f0ff] mb-2">
                  Bem-vindo, {user.name.split(' ')[0]}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">
                  Sua equipe está criada
                </h1>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                  Confirme o nome abaixo. Categoria, escudo e temporada você ajusta depois em Configurações.
                </p>
              </div>

              <div>
                <label htmlFor="wizard-team" className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Nome da equipe
                </label>
                <input
                  id="wizard-team"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm
                             outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/40"
                />
              </div>

              <button
                type="button"
                onClick={handleTeamSave}
                className="w-full bg-[#00f0ff] hover:bg-[#00d4e6] text-black font-bold text-sm uppercase
                           tracking-wide rounded-xl py-3.5 transition-colors"
              >
                Continuar
              </button>
            </div>
          )}

          {/* ── Passo 2: elenco ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00f0ff] mb-2">
                  Passo 2
                </p>
                <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">
                  Monte seu elenco
                </h1>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                  Escolha o caminho mais rápido para você. Dá para completar depois.
                </p>
              </div>

              {!rosterMode && (
                <div className="space-y-3">
                  <button type="button" onClick={() => setRosterMode('paste')} className={`${cardClass} border-zinc-800 bg-zinc-950/60`}>
                    <div className="flex items-start gap-3">
                      <Table2 size={20} className="text-[#00f0ff] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-sm">Colar de uma planilha</p>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Já tem a lista no Excel ou Sheets? Cole aqui e reconhecemos nome, número e posição.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button type="button" onClick={() => setRosterMode('quick')} className={`${cardClass} border-zinc-800 bg-zinc-950/60`}>
                    <div className="flex items-start gap-3">
                      <Users size={20} className="text-[#00f0ff] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-sm">Digitar agora</p>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Cinco linhas rápidas, sem sair desta tela.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button type="button" onClick={() => setRosterMode('demo')} className={`${cardClass} border-zinc-800 bg-zinc-950/60`}>
                    <div className="flex items-start gap-3">
                      <Sparkles size={20} className="text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-sm">Ver com dados de demonstração</p>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Carrega um elenco e 6 jogos fictícios para você ver o sistema funcionando.
                          Remove tudo com um clique depois.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {rosterMode === 'paste' && (
                <div className="space-y-4">
                  <RosterPaste onParsed={handlePasteSave} disabled={isSaving} />
                  <button type="button" onClick={() => setRosterMode(null)} className="text-xs text-zinc-500 hover:text-zinc-300">
                    ← Escolher outro caminho
                  </button>
                </div>
              )}

              {rosterMode === 'quick' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {quickRows.map((row, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={row.jersey}
                          onChange={(e) => {
                            const next = [...quickRows];
                            next[index] = { ...row, jersey: e.target.value.replace(/\D/g, '').slice(0, 3) };
                            setQuickRows(next);
                          }}
                          placeholder="#"
                          className="w-14 bg-black/60 border border-zinc-700 rounded-lg px-2 py-2.5 text-white text-sm
                                     text-center font-mono outline-none focus:border-[#00f0ff]"
                        />
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => {
                            const next = [...quickRows];
                            next[index] = { ...row, name: e.target.value };
                            setQuickRows(next);
                          }}
                          placeholder={`Atleta ${index + 1}`}
                          className="flex-1 min-w-0 bg-black/60 border border-zinc-700 rounded-lg px-3 py-2.5
                                     text-white text-sm outline-none focus:border-[#00f0ff]"
                        />
                        <select
                          value={row.position}
                          onChange={(e) => {
                            const next = [...quickRows];
                            next[index] = { ...row, position: e.target.value as Position };
                            setQuickRows(next);
                          }}
                          className="w-24 bg-black/60 border border-zinc-700 rounded-lg px-2 py-2.5
                                     text-white text-xs outline-none focus:border-[#00f0ff]"
                        >
                          {POSITIONS.map((position) => (
                            <option key={position} value={position}>{position}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuickRows([...quickRows, { name: '', jersey: '', position: 'Ala' }])}
                    className="text-xs text-[#00f0ff] hover:underline"
                  >
                    + Adicionar linha
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickSave}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-[#00f0ff] hover:bg-[#00d4e6]
                               disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold text-sm
                               uppercase tracking-wide rounded-xl py-3 transition-colors"
                  >
                    {isSaving ? <><Loader2 size={16} className="animate-spin" /> Salvando {savedCount}...</> : 'Salvar elenco'}
                  </button>

                  <button type="button" onClick={() => setRosterMode(null)} className="text-xs text-zinc-500 hover:text-zinc-300">
                    ← Escolher outro caminho
                  </button>
                </div>
              )}

              {rosterMode === 'demo' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      Vamos criar <strong className="text-white">12 atletas</strong> e{' '}
                      <strong className="text-white">6 jogos</strong> fictícios na sua equipe, para você
                      ver os indicadores, o ranking e os gráficos preenchidos.
                    </p>
                    <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                      Estes dados ficam marcados como demonstração e não entram nas suas estatísticas
                      reais. Você remove tudo quando quiser.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDemoData}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300
                               disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold text-sm
                               uppercase tracking-wide rounded-xl py-3 transition-colors"
                  >
                    {isSaving ? <><Loader2 size={16} className="animate-spin" /> Carregando...</> : 'Carregar demonstração'}
                  </button>

                  <button type="button" onClick={() => setRosterMode(null)} className="text-xs text-zinc-500 hover:text-zinc-300">
                    ← Escolher outro caminho
                  </button>
                </div>
              )}

              {error && (
                <div role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
                  <p className="text-xs text-amber-200 leading-relaxed">{error}</p>
                </div>
              )}

              <button type="button" onClick={() => goToStep(3)} className="w-full text-xs text-zinc-500 hover:text-zinc-300 py-2">
                Pular este passo
              </button>
            </div>
          )}

          {/* ── Passo 3: ponto de partida ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-2 flex items-center gap-1.5">
                  <Check size={14} /> Tudo pronto
                </p>
                <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">
                  Por onde quer começar?
                </h1>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                  O valor do SCOUT21 aparece no primeiro jogo registado.
                </p>
              </div>

              <div className="space-y-3">
                <button type="button" onClick={() => onFinish('live')} className={`${cardClass} border-[#00f0ff]/40 bg-[#00f0ff]/[0.04]`}>
                  <div className="flex items-start gap-3">
                    <PlayCircle size={20} className="text-[#00f0ff] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Vou coletar um jogo ao vivo</p>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Cronómetro, atalhos e registo por toque, da beira da quadra.
                      </p>
                    </div>
                  </div>
                </button>

                <button type="button" onClick={() => onFinish('postmatch')} className={`${cardClass} border-zinc-800 bg-zinc-950/60`}>
                  <div className="flex items-start gap-3">
                    <ClipboardList size={20} className="text-[#00f0ff] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Tenho uma súmula para lançar</p>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Lançamento depois do jogo, com o tempo digitado.
                      </p>
                    </div>
                  </div>
                </button>

                <button type="button" onClick={() => onFinish('dashboard')} className={`${cardClass} border-zinc-800 bg-zinc-950/60`}>
                  <div className="flex items-start gap-3">
                    <Sparkles size={20} className="text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Quero explorar primeiro</p>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Ir para o painel e olhar com calma.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
