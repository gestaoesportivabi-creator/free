import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Users, User as UserIcon, LogOut, HeartPulse, Brain, MonitorPlay, Settings, Table2, Shirt, Trophy, Ruler, CalendarClock, ChevronDown, ChevronRight, ChevronLeft, Dumbbell, Activity, RefreshCw, X, Lock, ShieldCheck, Zap, FileText, BookOpen } from 'lucide-react';
import { User } from '../types';

// Importação explícita da logo oficial
const LOGO_IMAGE = '/public-logo.png.png';

interface MenuItem {
  id: string;
  label: string;
  icon?: any;
  restricted: boolean;
}

interface Category {
  id: string;
  label: string;
  icon: any;
  items: MenuItem[];
}

/** Abas com cadeado no menu e conteúdo bloqueado (Em breve) — Quarteto, Atletas (fisiologia), Musculação */
const LOCKED_MENU_TAB_IDS = new Set(['quarteto', 'athletes-physio', 'academia']);

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  currentUser: User | null;
  /** Controla o drawer em mobile; em desktop é ignorado */
  open?: boolean;
  onClose?: () => void;
  /** Chamado ao navegar (ex.: fechar drawer em mobile) */
  onNavigate?: () => void;
  /** Desktop: true = recolhida (só ícones), false = expandida */
  retracted?: boolean;
  /** Desktop: alternar recolhida/expandida */
  onToggleRetract?: () => void;
  /** Plano free: Scout Individual mostra cadeado */
  isFreePlan?: boolean;
  /** Performance / admin: Fisiologia sem ícone de cadeado no menu */
  fisiologiaUnlocked?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, currentUser, open = false, onClose, onNavigate, retracted = false, onToggleRetract, isFreePlan = false, fisiologiaUnlocked = false }) => {
  const canAccessAdminPanel = Boolean(
    currentUser?.isPlatformAdmin || currentUser?.planName === 'ADMINISTRADOR'
  );
  const isAthlete = currentUser?.role === 'Atleta';
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['gestao', 'performance']));

  // Estrutura hierárquica de categorias
  const categories: Category[] = [
    {
      id: 'gestao',
      label: 'Gestão de Equipe',
      icon: Shirt,
      items: [
        { id: 'team', label: 'Elenco', icon: Shirt, restricted: isAthlete },
        { id: 'schedule', label: 'Programação', icon: CalendarClock, restricted: isAthlete },
        { id: 'championship', label: 'Tabela de Campeonato', icon: Trophy, restricted: isAthlete },
        { id: 'management-report', label: 'Relatório gerencial', icon: FileText, restricted: isAthlete },
      ]
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: Table2,
      items: [
        { id: 'table', label: 'Dados do Jogo', icon: Table2, restricted: isAthlete },
        { id: 'general', label: 'Scout Coletivo', icon: Users, restricted: isAthlete },
        { id: 'individual', label: 'Scout Individual', icon: UserIcon, restricted: false },
        { id: 'ranking', label: 'Ranking', icon: Trophy, restricted: false },
        { id: 'quarteto', label: 'Quarteto Alta Performance', icon: Zap, restricted: false },
      ]
    },
    {
      id: 'fisiologia',
      label: 'Fisiologia',
      icon: HeartPulse,
      items: [
        { id: 'physical', label: 'Monitoramento Fisiológico', icon: HeartPulse, restricted: false },
        { id: 'athletes-physio', label: 'Atletas', icon: Users, restricted: false },
        { id: 'pse', label: 'PSE (Treinos e Jogos)', icon: Activity, restricted: false },
        { id: 'psr', label: 'PSR (Treinos e Jogos)', icon: RefreshCw, restricted: false },
        { id: 'wellness', label: 'Bem-Estar Diário', icon: Brain, restricted: false },
        { id: 'assessment', label: 'Avaliação Física', icon: Ruler, restricted: false },
        { id: 'academia', label: 'Musculação', icon: Dumbbell, restricted: false },
      ]
    }
  ];

  // Itens que não pertencem a categorias
  const standaloneItems: MenuItem[] = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, restricted: false },
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const isCategoryExpanded = (categoryId: string) => expandedCategories.has(categoryId);
  const isItemActive = (itemId: string) => activeTab === itemId;
  const isCategoryActive = (category: Category) => category.items.some(item => activeTab === item.id && !item.restricted);

  const visibleCategories = categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => !item.restricted)
  })).filter(cat => cat.items.length > 0);

  const visibleStandaloneItems = standaloneItems.filter(item => !item.restricted);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  return (
    <div
      className={`sidebar-drawer w-64 bg-black h-screen fixed left-0 top-0 text-zinc-400 flex flex-col border-r border-zinc-900 z-50 shadow-2xl print:hidden transition-all duration-300 ease-out md:translate-x-0 ${retracted ? 'md:w-16' : 'md:w-64'} ${open ? 'translate-x-0' : '-translate-x-full'}`}
      role="navigation"
      aria-label="Menu principal"
    >
      {/* Brand Header com Logo Oficial + botão fechar (mobile) + toggle retrátil (desktop) */}
      <div className={`h-24 flex items-center justify-between gap-4 border-b border-zinc-900 bg-black shrink-0 ${retracted ? 'px-2 md:flex-col md:justify-center md:gap-1' : 'px-4 pr-2'}`}>
        <div className={`flex items-center gap-4 min-w-0 ${retracted ? 'md:flex-col md:gap-1' : ''}`}>
        <img
          src={LOGO_IMAGE}
          alt="SCOUT21"
          className={`shrink-0 object-contain object-left ${retracted ? 'h-9 w-auto max-w-[2.75rem]' : 'h-11 md:h-12 w-auto'}`}
        />
        {!retracted && (
        <div className="flex flex-col min-w-0">
            <h2 className="text-lg font-black text-white tracking-tighter italic leading-none whitespace-nowrap">SCOUT 21</h2>
            <p className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-[0.2em] mt-1 glow-text whitespace-nowrap">Pro Analytics</p>
        </div>
        )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onToggleRetract?.()}
          className="hidden md:flex p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#00f0ff] focus:ring-offset-2 focus:ring-offset-black"
          aria-label={retracted ? 'Expandir menu' : 'Recolher menu'}
        >
          {retracted ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#00f0ff] focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Fechar menu"
        >
          <X size={24} />
        </button>
        </div>
      </div>

      {!retracted && (
      <div className="px-6 pt-8 pb-2">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold whitespace-nowrap">Menu Principal</p>
      </div>
      )}
      
      <nav className={`flex-1 overflow-y-auto custom-scrollbar pb-4 ${retracted ? 'px-2 pt-4 space-y-1' : 'px-4 pt-2 space-y-2'}`}>
          <a
            href="/blog"
            title="Blog"
            onClick={() => onNavigate?.()}
            className={`w-full flex items-center rounded-xl transition-all duration-200 text-zinc-500 hover:bg-zinc-900 hover:text-[#00f0ff] border border-transparent ${
              retracted ? 'justify-center p-2.5' : 'space-x-3 px-4 py-3'
            }`}
          >
            <BookOpen size={20} className="shrink-0 text-zinc-600" />
            {!retracted && (
              <span className="text-xs uppercase tracking-wider font-bold whitespace-nowrap">Blog</span>
            )}
          </a>
          {/* Itens standalone (Visão Geral, Configurações) */}
          {visibleStandaloneItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.id);
            return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); onNavigate?.(); }}
                  title={retracted ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl transition-all duration-200 group overflow-hidden ${
                    retracted ? 'justify-center p-2.5' : 'space-x-3 px-4 py-3'
                  } ${
                    isActive
                      ? 'bg-[#00f0ff] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                      : 'text-zinc-500 hover:bg-zinc-900 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon size={20} className={`shrink-0 ${isActive ? 'text-black' : 'text-zinc-600 group-hover:text-[#00f0ff]'}`} />
                  {!retracted && (
                  <span className={`text-xs uppercase tracking-wider whitespace-nowrap text-ellipsis overflow-hidden ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
                  )}
                </button>
            );
          })}

          {/* Categorias com subcategorias */}
          {retracted ? (
            /* Modo recolhido: lista plana de ícones */
            visibleCategories.flatMap((category) =>
              category.items.map((item) => {
                const ItemIcon = item.icon || category.icon;
                const isActive = isItemActive(item.id);
                const showLock =
                  LOCKED_MENU_TAB_IDS.has(item.id) ||
                  (category.id === 'fisiologia' && !fisiologiaUnlocked) ||
                  (item.id === 'individual' && isFreePlan);
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); onNavigate?.(); }}
                    title={item.label}
                    className={`w-full flex justify-center p-2.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    {showLock ? (
                      <Lock size={20} className={`shrink-0 ${isActive ? 'text-black' : 'text-zinc-600 group-hover:text-[#00f0ff]'}`} />
                    ) : (
                      <ItemIcon size={20} className={`shrink-0 ${isActive ? 'text-black' : 'text-zinc-600 group-hover:text-[#00f0ff]'}`} />
                    )}
                  </button>
                );
              })
            )
          ) : (
            visibleCategories.map((category) => {
              const CategoryIcon = category.icon;
              const isExpanded = isCategoryExpanded(category.id);
              const hasActiveItem = isCategoryActive(category);
              
              return (
                <div key={category.id} className="space-y-1">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                      hasActiveItem
                        ? 'bg-zinc-900 text-white border border-zinc-800'
                        : 'text-zinc-500 hover:bg-zinc-900 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CategoryIcon size={20} className={`shrink-0 ${hasActiveItem ? 'text-[#00f0ff]' : 'text-zinc-600 group-hover:text-[#00f0ff]'}`} />
                      <span className={`text-xs uppercase tracking-wider whitespace-nowrap font-bold ${hasActiveItem ? 'text-white' : ''}`}>
                        {category.label}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-zinc-600 group-hover:text-[#00f0ff]" />
                    ) : (
                      <ChevronRight size={16} className="text-zinc-600 group-hover:text-[#00f0ff]" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-4 space-y-1 border-l border-zinc-800 pl-2">
                      {category.items.map((item) => {
                        const ItemIcon = item.icon || CategoryIcon;
                        const isActive = isItemActive(item.id);
                        const showLock =
                          LOCKED_MENU_TAB_IDS.has(item.id) ||
                          (category.id === 'fisiologia' && !fisiologiaUnlocked) ||
                          (item.id === 'individual' && isFreePlan);
                        return (
                          <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); onNavigate?.(); }}
                            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                              isActive
                                ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                                : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'
                            }`}
                          >
                            {showLock ? (
                              <Lock size={18} className={`shrink-0 ${isActive ? 'text-black' : 'text-zinc-600 group-hover:text-[#00f0ff]'}`} />
                            ) : (
                              <ItemIcon size={18} className={`shrink-0 ${isActive ? 'text-black' : 'text-zinc-600 group-hover:text-[#00f0ff]'}`} />
                            )}
                            <span className={`text-xs uppercase tracking-wider whitespace-nowrap text-ellipsis overflow-hidden ${isActive ? 'font-black' : 'font-medium'}`}>
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
      </nav>

      {/* User Footer */}
      <div className={`border-t border-zinc-900 bg-black shrink-0 ${retracted ? 'p-3' : 'p-6'}`}>
        {!retracted && (
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-zinc-900 rounded-full shrink-0 overflow-hidden border-2 border-[#00f0ff]">
               {currentUser?.photoUrl ? (
                   <img src={currentUser.photoUrl} alt="User" className="w-full h-full object-cover" />
               ) : (
                   <span className="text-xs font-bold text-white flex items-center justify-center h-full w-full">{currentUser?.name?.substring(0, 2)}</span>
               )}
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate whitespace-nowrap">
                    {currentUser?.name || 'Usuário'}
                </p>
                <p className="text-[10px] text-[#00f0ff] font-bold uppercase tracking-wider truncate whitespace-nowrap">
                    {currentUser?.role || 'Visitante'}
                </p>
            </div>
        </div>
        )}
        {canAccessAdminPanel && (
        <button 
          onClick={() => { setActiveTab('admin'); onNavigate?.(); }}
          title={retracted ? 'Todos os Usuários' : undefined}
          className={`w-full flex items-center transition-colors font-bold rounded-lg uppercase tracking-wide whitespace-nowrap ${retracted ? 'justify-center p-2.5 mb-2' : 'justify-center space-x-2 px-3 py-2 mb-2 text-xs'} ${
            activeTab === 'admin'
              ? 'bg-[#00f0ff] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)] border border-[#00f0ff]'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-[#00f0ff] border border-zinc-900 hover:border-[#00f0ff]/30'
          }`}
        >
          <ShieldCheck size={retracted ? 20 : 14} />
          {!retracted && <span>Todos os Usuários</span>}
        </button>
        )}
        <button 
          onClick={() => { setActiveTab('settings'); onNavigate?.(); }}
          title={retracted ? 'Configurações' : undefined}
          className={`w-full flex items-center text-zinc-400 hover:bg-zinc-900 hover:text-[#00f0ff] border border-zinc-900 hover:border-[#00f0ff]/30 transition-colors font-bold rounded-lg uppercase tracking-wide whitespace-nowrap ${retracted ? 'justify-center p-2.5 mb-2' : 'justify-center space-x-2 px-3 py-2 mb-3 text-xs'}`}
        >
          <Settings size={retracted ? 20 : 14} />
          {!retracted && <span>Configurações</span>}
        </button>
        <button 
          onClick={onLogout}
          title={retracted ? 'Sair' : undefined}
          className={`w-full flex items-center text-zinc-500 hover:bg-zinc-900 hover:text-red-500 border border-zinc-900 hover:border-red-900/30 transition-colors font-bold rounded-lg uppercase tracking-wide whitespace-nowrap ${retracted ? 'justify-center p-2.5' : 'justify-center space-x-2 px-3 py-2 text-xs'}`}
        >
          <LogOut size={retracted ? 20 : 14} />
          {!retracted && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
};