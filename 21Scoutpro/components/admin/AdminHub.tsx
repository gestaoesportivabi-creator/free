import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Server,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { User } from '../../types';
import { AdminPanel } from '../AdminPanel';
import {
  platformAdminApi,
  type AssistantActivityRow,
  type PlatformOverview,
  type PlatformTenant,
} from '../../services/api';

export type AdminSection =
  | 'overview'
  | 'users'
  | 'tenants'
  | 'assistant'
  | 'insights'
  | 'system';

interface AdminHubProps {
  currentUser: User | null;
  initialSection?: AdminSection;
  initialInsightsUserId?: string | null;
}

const NAV: { id: AdminSection; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'tenants', label: 'Técnicos & clubes', icon: Building2 },
  { id: 'assistant', label: 'Assistente', icon: Bot },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'system', label: 'Sistema', icon: Server },
];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

function OverviewSection() {
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await platformAdminApi.getOverview());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-zinc-500 text-sm">Carregando visão geral…</p>;
  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Usuários ativos" value={data.totalUsers} sub={data.maxUsers ? `${data.remainingSlots} vagas` : undefined} />
        <StatCard label="Equipes" value={data.equipeCount} />
        <StatCard label="Atletas cadastrados" value={data.jogadorCount} />
        <StatCard label="Leads (30d)" value={data.leadsLast30d} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Bot Telegram (técnicos)" value={data.telegramCoachLinked} />
        <StatCard label="Portal atleta" value={data.athletePortalLinked} />
        <StatCard label="Assistente web" value={data.webAssistantEnabled ? 'Online' : 'Off'} />
        <StatCard label="Chamadas assistente (24h)" value={data.assistant.callsLast24h} sub={`Web: ${data.assistant.webCallsLast24h}`} />
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h3 className="text-sm font-bold text-white mb-3">Usuários por plano</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.usersByPlan).map(([plan, count]) => (
            <span key={plan} className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-300">
              {plan}: <strong className="text-[#00f0ff]">{count}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TenantsSection({ onViewInsights }: { onViewInsights: (userId: string) => void }) {
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    platformAdminApi.getTenants().then(setTenants).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-zinc-500 text-sm">Carregando tenants…</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase">
          <tr>
            <th className="text-left p-3">Nome</th>
            <th className="text-left p-3">Plano</th>
            <th className="text-left p-3">Equipes</th>
            <th className="text-left p-3">Jogadores</th>
            <th className="text-left p-3">Telegram</th>
            <th className="text-left p-3">Último login</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.userId} className="border-t border-zinc-800 hover:bg-zinc-900/50">
              <td className="p-3">
                <div className="font-medium text-white">{t.name}</div>
                <div className="text-xs text-zinc-500">{t.email}</div>
              </td>
              <td className="p-3 text-zinc-300">{t.plan}</td>
              <td className="p-3 text-zinc-300">{t.equipeCount}</td>
              <td className="p-3 text-zinc-300">{t.jogadorCount}</td>
              <td className="p-3">
                {t.telegramCoachChatId ? (
                  <span className="text-emerald-400 text-xs">Bot ✓</span>
                ) : (
                  <span className="text-zinc-600 text-xs">—</span>
                )}
              </td>
              <td className="p-3 text-zinc-500 text-xs">{fmtDate(t.lastLoginAt)}</td>
              <td className="p-3">
                <button
                  type="button"
                  onClick={() => onViewInsights(t.userId)}
                  className="text-xs text-[#00f0ff] hover:underline"
                >
                  Insights
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssistantSection({ onViewInsights }: { onViewInsights: (userId: string) => void }) {
  const [activity, setActivity] = useState<AssistantActivityRow[]>([]);
  const [staff, setStaff] = useState<{ userId: string; name: string; plan: string }[]>([]);
  const [source, setSource] = useState<'all' | 'web' | 'telegram'>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await platformAdminApi.getAssistantActivity({
        limit: 80,
        source: source === 'all' ? undefined : source,
      });
      setActivity(data.activity);
      setStaff(data.staffUsers.map((s) => ({ userId: s.userId, name: s.name, plan: s.plan })));
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {(['all', 'web', 'telegram'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              source === s
                ? 'border-[#00f0ff]/50 bg-[#00f0ff]/15 text-[#00f0ff]'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            {s === 'all' ? 'Todos' : s === 'web' ? 'Dashboard web' : 'Telegram'}
          </button>
        ))}
        <button type="button" onClick={() => void load()} className="ml-auto p-2 text-zinc-400 hover:text-white">
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Carregando atividade…</p>
      ) : (
        <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar">
          {activity.length === 0 && (
            <p className="text-zinc-500 text-sm">Nenhuma atividade registrada ainda.</p>
          )}
          {activity.map((row) => (
            <div key={row.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    row.source === 'web' ? 'bg-[#00f0ff]/15 text-[#00f0ff]' : 'bg-violet-500/15 text-violet-300'
                  }`}
                >
                  {row.source}
                </span>
                <span className="text-zinc-500 text-xs">{fmtDate(row.createdAt)}</span>
                <span className="text-zinc-600 text-xs">{row.method} {row.endpoint}</span>
                {row.statusCode != null && (
                  <span className={`text-xs ${row.statusCode < 400 ? 'text-emerald-500' : 'text-red-400'}`}>
                    {row.statusCode}
                  </span>
                )}
              </div>
              <p className="text-zinc-300 font-medium">{row.userName ?? '—'}</p>
              {row.question && (
                <p className="text-zinc-400 mt-1 line-clamp-2">{row.question}</p>
              )}
              {row.userId && (
                <button
                  type="button"
                  onClick={() => onViewInsights(row.userId!)}
                  className="mt-2 text-xs text-[#00f0ff] hover:underline"
                >
                  Ver insights do técnico
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 p-4">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <MessageSquare size={16} className="text-[#00f0ff]" /> Staff com assistente
        </h3>
        <div className="flex flex-wrap gap-2">
          {staff.map((s) => (
            <button
              key={s.userId}
              type="button"
              onClick={() => onViewInsights(s.userId)}
              className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:border-[#00f0ff]/40"
            >
              {s.name} <span className="text-zinc-600">({s.plan})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightsSection({
  userId,
  onSelectUser,
}: {
  userId: string | null;
  onSelectUser: (id: string | null) => void;
}) {
  const [selected, setSelected] = useState(userId ?? '');
  const [pack, setPack] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) setSelected(userId);
  }, [userId]);

  const load = async () => {
    if (!selected.trim()) return;
    setLoading(true);
    setError('');
    try {
      setPack(await platformAdminApi.getUserInsights(selected.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
      setPack(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected.trim()) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const readiness = pack?.readiness as { teamScore?: number; sessionRecommendation?: string } | undefined;
  const lastMatch = pack?.lastMatch as { match?: { opponent?: string; result?: string; date?: string } } | undefined;
  const rosterArr = pack?.roster as { status?: string }[] | undefined;
  const rosterAvailable = rosterArr?.filter((p) => p.status === 'available').length;
  const rosterTotal = rosterArr?.filter((p) => p.status !== 'transferred').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            onSelectUser(e.target.value || null);
          }}
          placeholder="UUID do usuário (técnico/clube)"
          className="flex-1 min-w-[200px] bg-black border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || !selected.trim()}
          className="px-4 py-2 rounded-xl bg-[#00f0ff] text-black text-sm font-bold disabled:opacity-40"
        >
          Carregar
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {loading && <p className="text-zinc-500 text-sm">Consultando Scout21…</p>}
      {pack && !loading && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="font-bold text-white">{String(pack.userName ?? '—')}</h3>
            <p className="text-sm text-zinc-500">{String(pack.email ?? '')} · {String(pack.roleName ?? '')}</p>
            {pack.message && <p className="text-amber-400 text-sm mt-2">{String(pack.message)}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard
              label="Prontidão equipe"
              value={readiness?.teamScore != null ? `${readiness.teamScore}/100` : '—'}
              sub={readiness?.sessionRecommendation}
            />
            <StatCard
              label="Último jogo"
              value={lastMatch?.match?.opponent ?? '—'}
              sub={lastMatch?.match?.result ? `${lastMatch.match.result} · ${lastMatch.match.date}` : undefined}
            />
            <StatCard
              label="Elenco disponível"
              value={rosterAvailable != null ? `${rosterAvailable}/${rosterTotal ?? '?'}` : '—'}
            />
          </div>
          <details className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <summary className="cursor-pointer text-sm font-bold text-zinc-300">JSON completo (debug)</summary>
            <pre className="mt-3 text-xs text-zinc-500 overflow-x-auto max-h-96 custom-scrollbar">
              {JSON.stringify(pack, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

function SystemSection() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    platformAdminApi.getSystemHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  if (!health) return <p className="text-zinc-500 text-sm">Carregando status…</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Object.entries(health).map(([key, val]) => (
        <div key={key} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between">
          <span className="text-sm text-zinc-400">{key}</span>
          <span
            className={`text-sm font-bold ${
              val === true || val === 'ok' ? 'text-emerald-400' : val === false ? 'text-red-400' : 'text-white'
            }`}
          >
            {String(val)}
          </span>
        </div>
      ))}
    </div>
  );
}

export const AdminHub: React.FC<AdminHubProps> = ({
  currentUser,
  initialSection = 'overview',
  initialInsightsUserId = null,
}) => {
  const [section, setSection] = useState<AdminSection>(initialSection);
  const [insightsUserId, setInsightsUserId] = useState<string | null>(initialInsightsUserId);

  const goInsights = (userId: string) => {
    setInsightsUserId(userId);
    setSection('insights');
  };

  if (!currentUser?.isPlatformAdmin && currentUser?.planName !== 'ADMINISTRADOR') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center">
        <AlertTriangle className="w-14 h-14 text-red-500 mb-4" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-white uppercase tracking-wide mb-2">Acesso Restrito</h2>
        <p className="text-zinc-400 text-sm max-w-md">Área exclusiva para administradores da plataforma.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="text-[#00f0ff]" size={28} />
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">Painel Admin Scout21</h1>
        </div>
        <p className="text-sm text-zinc-500">
          Visão completa da plataforma — usuários, assistente, insights dos técnicos e status do sistema.
        </p>
      </header>

      <nav className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-zinc-800 custom-scrollbar">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${
              section === id
                ? 'bg-zinc-900 text-[#00f0ff] border-b-2 border-[#00f0ff]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="min-h-[400px]">
        {section === 'overview' && <OverviewSection />}
        {section === 'users' && <AdminPanel currentUser={currentUser} embedded />}
        {section === 'tenants' && <TenantsSection onViewInsights={goInsights} />}
        {section === 'assistant' && <AssistantSection onViewInsights={goInsights} />}
        {section === 'insights' && (
          <InsightsSection userId={insightsUserId} onSelectUser={setInsightsUserId} />
        )}
        {section === 'system' && <SystemSection />}
      </div>
    </div>
  );
};
