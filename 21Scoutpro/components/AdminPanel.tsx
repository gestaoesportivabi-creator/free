import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { adminApi, RegisteredUser, AdminStats } from '../services/api';
import { ShieldCheck, Users, UserCheck, RefreshCw, AlertTriangle, Pencil, X, UserPlus } from 'lucide-react';

interface AdminPanelProps {
  currentUser: User | null;
}

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  ESSENCIAL: 'Essencial',
  COMPETICAO: 'Competição',
  PERFORMANCE: 'Performance',
};

const PLAN_OPTIONS: { value: string; label: string }[] = [
  { value: 'ESSENCIAL', label: 'Essencial' },
  { value: 'COMPETICAO', label: 'Competição' },
  { value: 'PERFORMANCE', label: 'Performance' },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editUser, setEditUser] = useState<RegisteredUser | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPasswordConfirm, setFormPasswordConfirm] = useState('');
  const [formRole, setFormRole] = useState('ESSENCIAL');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createPasswordConfirm, setCreatePasswordConfirm] = useState('');
  const [createRole, setCreateRole] = useState('ESSENCIAL');
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, statsData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getStats(),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setStats(statsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('403') || msg.includes('Acesso restrito')) {
        setError('Acesso negado. Apenas administradores podem ver esta página.');
      } else {
        setError('Erro ao carregar dados. Tente novamente.');
      }
      console.error('Erro ao carregar painel admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEdit = (u: RegisteredUser) => {
    setEditUser(u);
    setFormEmail(u.email);
    setFormPassword('');
    setFormPasswordConfirm('');
    setFormRole(u.role);
    setFormError('');
    setFormSuccess('');
  };

  const closeEdit = () => {
    if (saving) return;
    setEditUser(null);
    setFormError('');
    setFormSuccess('');
  };

  const openCreate = () => {
    setEditUser(null);
    setCreateName('');
    setCreateEmail('');
    setCreatePassword('');
    setCreatePasswordConfirm('');
    setCreateRole('ESSENCIAL');
    setCreateError('');
    setShowCreate(true);
  };

  const closeCreate = () => {
    if (createSaving) return;
    setShowCreate(false);
    setCreateError('');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    const nameTrim = createName.trim();
    const emailTrim = createEmail.trim();
    if (!nameTrim || !emailTrim) {
      setCreateError('Nome e e-mail são obrigatórios.');
      return;
    }
    if (createPassword.length < 6) {
      setCreateError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (createPassword !== createPasswordConfirm) {
      setCreateError('As senhas não coincidem.');
      return;
    }
    setCreateSaving(true);
    try {
      await adminApi.createUser({
        name: nameTrim,
        email: emailTrim,
        password: createPassword,
        roleName: createRole,
      });
      await loadData();
      closeCreate();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao cadastrar.');
    } finally {
      setCreateSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setFormError('');
    setFormSuccess('');

    if (formPassword || formPasswordConfirm) {
      if (formPassword.length < 6) {
        setFormError('A nova senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (formPassword !== formPasswordConfirm) {
        setFormError('A confirmação da senha não confere.');
        return;
      }
    }

    const emailTrim = formEmail.trim();
    if (!emailTrim) {
      setFormError('O e-mail é obrigatório.');
      return;
    }

    const payload: { email?: string; password?: string; roleName?: string } = {};
    if (emailTrim !== editUser.email) payload.email = emailTrim;
    if (formRole !== editUser.role) payload.roleName = formRole;
    if (formPassword) payload.password = formPassword;

    if (Object.keys(payload).length === 0) {
      setFormError('Nada foi alterado.');
      return;
    }

    setSaving(true);
    try {
      await adminApi.updateUser(editUser.id, payload);
      setFormSuccess('Alterações salvas com sucesso.');
      await loadData();
      setTimeout(() => {
        closeEdit();
      }, 800);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser?.isPlatformAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center">
        <AlertTriangle className="w-14 h-14 text-red-500 mb-4" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-white uppercase tracking-wide mb-2">Acesso Restrito</h2>
        <p className="text-zinc-400 text-sm max-w-md">
          Esta área é exclusiva para administradores da plataforma.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center">
        <AlertTriangle className="w-14 h-14 text-amber-500 mb-4" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-white uppercase tracking-wide mb-2">Erro</h2>
        <p className="text-zinc-400 text-sm max-w-md mb-4">{error}</p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 bg-[#00f0ff] hover:bg-[#00d4e0] text-black px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide transition-colors"
        >
          <RefreshCw size={14} /> Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Modal cadastrar usuário */}
      {showCreate && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-create-title"
        >
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 id="admin-create-title" className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                <UserPlus className="text-[#00f0ff]" size={20} /> Novo usuário
              </h3>
              <button
                type="button"
                onClick={closeCreate}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 space-y-4">
              <p className="text-xs text-zinc-500">
                Escolha o plano (Essencial, Competição ou Performance). Não é possível cadastrar administrador por aqui.
              </p>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Nome completo</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl text-white px-3 py-2.5 text-sm outline-none focus:border-[#00f0ff]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">E-mail</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl text-white px-3 py-2.5 text-sm outline-none focus:border-[#00f0ff]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Plano</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl text-white px-3 py-2.5 text-sm outline-none focus:border-[#00f0ff]"
                >
                  {PLAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Senha inicial</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl text-white px-3 py-2.5 text-sm outline-none focus:border-[#00f0ff]"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Confirmar senha</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={createPasswordConfirm}
                  onChange={(e) => setCreatePasswordConfirm(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl text-white px-3 py-2.5 text-sm outline-none focus:border-[#00f0ff]"
                  required
                />
              </div>

              {createError && (
                <div className="text-red-400 text-sm font-medium bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {createError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCreate}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 font-bold text-sm uppercase hover:bg-zinc-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createSaving}
                  className="flex-1 py-2.5 rounded-xl bg-[#00f0ff] text-black font-black text-sm uppercase hover:bg-[#00d4e0] disabled:opacity-50"
                >
                  {createSaving ? 'Cadastrando…' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar usuário */}
      {editUser && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-edit-title"
        >
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 id="admin-edit-title" className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                <Pencil className="text-[#00f0ff]" size={20} /> Editar conta
              </h3>
              <button
                type="button"
                onClick={closeEdit}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-4 space-y-4">
              <p className="text-sm text-zinc-500">
                <span className="text-zinc-300 font-semibold">{editUser.name}</span>
              </p>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">E-mail</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl text-white px-3 py-2.5 text-sm outline-none focus:border-[#00f0ff]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Plano</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl text-white px-3 py-2.5 text-sm outline-none focus:border-[#00f0ff]"
                >
                  {PLAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-600 mt-1">
                  Trocar plano pode exigir que o usuário não tenha equipes vinculadas ao cadastro anterior.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Nova senha (opcional)</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Deixe em branco para manter"
                  className="w-full bg-black border border-zinc-800 rounded-xl text-white px-3 py-2.5 text-sm outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Confirmar nova senha</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={formPasswordConfirm}
                  onChange={(e) => setFormPasswordConfirm(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl text-white px-3 py-2.5 text-sm outline-none focus:border-[#00f0ff]"
                />
              </div>

              {formError && (
                <div className="text-red-400 text-sm font-medium bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="text-emerald-400 text-sm font-medium bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                  {formSuccess}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 font-bold text-sm uppercase hover:bg-zinc-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#00f0ff] text-black font-black text-sm uppercase hover:bg-[#00d4e0] disabled:opacity-50"
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-black p-6 rounded-3xl border border-zinc-800 shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-wide">
            <ShieldCheck className="text-[#00f0ff]" /> Todos os Usuários
          </h2>
          <p className="text-zinc-500 text-sm mt-1 font-medium">
            Gestão de contas e acesso da plataforma.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/20 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wide transition-colors"
          >
            <UserPlus size={18} /> Novo usuário
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 text-zinc-400 hover:text-[#00f0ff] transition-colors p-2 rounded-lg hover:bg-zinc-900"
            title="Atualizar dados"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-black p-5 rounded-2xl border border-zinc-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Users size={20} className="text-[#00f0ff]" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total de Usuários</span>
            </div>
            <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
          </div>
          <div className="bg-black p-5 rounded-2xl border border-zinc-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck size={20} className="text-[#10b981]" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Limite de Cadastro</span>
            </div>
            <p className="text-3xl font-black text-white">
              {stats.maxUsers != null ? stats.maxUsers : '∞'}
            </p>
            {stats.remainingSlots != null && (
              <p className="text-xs text-zinc-500 mt-1">
                {stats.remainingSlots} vaga{stats.remainingSlots !== 1 ? 's' : ''} restante{stats.remainingSlots !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="bg-black p-5 rounded-2xl border border-zinc-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw size={20} className="text-amber-400" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cadastros (30 dias)</span>
            </div>
            <p className="text-3xl font-black text-white">
              {Object.values(stats.registrationsByDay).reduce((a, b) => a + b, 0)}
            </p>
          </div>
        </div>
      )}

      {/* Registrations by Day (compact) */}
      {stats && Object.keys(stats.registrationsByDay).length > 0 && (
        <div className="bg-black p-6 rounded-3xl border border-zinc-800 shadow-xl">
          <h3 className="text-white font-bold uppercase text-sm tracking-widest mb-4 flex items-center gap-2">
            Cadastros por Dia (últimos 30 dias)
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.registrationsByDay)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([day, count]) => (
                <span key={day} className="bg-zinc-900 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-800">
                  <span className="text-zinc-400">{new Date(day + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                  <span className="text-[#00f0ff] ml-2">+{count}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-black p-6 rounded-3xl border border-zinc-800 shadow-xl">
        <h3 className="text-white font-bold uppercase text-sm tracking-widest mb-4 flex items-center gap-2">
          <Users size={16} className="text-[#00f0ff]" /> Usuários Cadastrados
        </h3>

        {loading && users.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-8">Carregando...</p>
        ) : users.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-8">Nenhum usuário encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-3 font-bold">Nome</th>
                  <th className="text-left py-3 px-3 font-bold">E-mail</th>
                  <th className="text-left py-3 px-3 font-bold">Plano / Papel</th>
                  <th className="text-left py-3 px-3 font-bold">Cadastro</th>
                  <th className="text-left py-3 px-3 font-bold">Último Login</th>
                  <th className="text-right py-3 px-3 font-bold w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3 px-3 text-white font-medium">{u.name}</td>
                    <td className="py-3 px-3 text-[#00f0ff]">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-bold text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded-full border border-[#10b981]/20">
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="py-3 px-3 text-zinc-400">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-[#00f0ff] hover:text-white border border-[#00f0ff]/40 hover:border-[#00f0ff] rounded-lg px-2 py-1.5 transition-colors"
                      >
                        <Pencil size={14} /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-zinc-600 text-xs mt-3 text-right">{users.length} usuário(s)</p>
          </div>
        )}
      </div>
    </div>
  );
};
