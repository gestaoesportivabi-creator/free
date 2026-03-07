import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Users, User as UserIcon, LogOut, HeartPulse, MonitorPlay, Settings, Table2, Shirt, Trophy, Ruler, CalendarClock, ChevronDown, ChevronRight, Dumbbell, Activity, Moon, RefreshCw, X } from 'lucide-react';
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
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, currentUser, open = false, onClose, onNavigate }) => {
  const isAthlete = currentUser?.role === 'Atleta';
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['gestao', 'performance', 'fisiologia']));

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
      ]
    },
    {
      id: 'fisiologia',
      label: 'Fisiologia',
      icon: HeartPulse,
      items: [
        { id: 'physical', label: 'Monitoramento Fisiológico', icon: HeartPulse, restricted: isAthlete },
        { id: 'pse', label: 'PSE (Treinos e Jogos)', icon: Activity, restricted: isAthlete },
        { id: 'psr', label: 'PSR (Treinos e Jogos)', icon: RefreshCw, restricted: isAthlete },
        { id: 'qualidade-sono', label: 'Qualidade de sono', icon: Moon, restricted: isAthlete },
        { id: 'assessment', label: 'Avaliação Física', icon: Ruler, restricted: isAthlete },
        { id: 'academia', label: 'Musculação', icon: Dumbbell, restricted: isAthlete },
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
      className={`sidebar-drawer w-64 bg-black h-screen fixed left-0 top-0 text-zinc-400 flex flex-col border-r border-zinc-900 z-50 shadow-2xl font-sans print:hidden transition-transform duration-300 ease-out md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      role="navigation"
      aria-label="Menu principal"
    >
      {/* Brand Header com Logo Oficial + botão fechar (mobile) */}
      <div className="h-24 flex items-center justify-between gap-4 px-4 pr-2 border-b border-zinc-900 bg-black shrink-0">
        <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 border-2 border-white rounded-xl flex items-center justify-center bg-black shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.1)] overflow-hidden">
             <img 
                src={LOGO_IMAGE} 
                alt="SCOUT21PRO" 
                className="w-full h-full object-contain p-1.5"
             />
        </div>
        <div className="flex flex-col min-w-0">
            <h2 className="text-lg font-black text-white tracking-tighter italic leading-none whitespace-nowrap">SCOUT 21</h2>
            <p className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-[0.2em] mt-1 glow-text whitespace-nowrap">Pro Analytics</p>
        </div>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-[#00f0ff] focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Fechar menu"
        >
          <X size={24} />
        </button>
      </div>

      <div className="px-6 pt-8 pb-2">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold whitespace-nowrap">Menu Principal</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar pb-4">
          {/* Itens standalone (Visão Geral, Configurações) */}
          {visibleStandaloneItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.id);
            return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); onNavigate?.(); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group overflow-hidden ${
                    isActive
                      ? 'bg-[#00f0ff] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                      : 'text-zinc-500 hover:bg-zinc-900 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon size={20} className={`shrink-0 ${isActive ? 'text-black' : 'text-zinc-600 group-hover:text-[#00f0ff]'}`} />
                  <span className={`text-xs uppercase tracking-wider whitespace-nowrap text-ellipsis overflow-hidden ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
                </button>
            );
          })}

          {/* Categorias com subcategorias */}
          {visibleCategories.map((category) => {
            const CategoryIcon = category.icon;
            const isExpanded = isCategoryExpanded(category.id);
            const hasActiveItem = isCategoryActive(category);
            
            return (
              <div key={category.id} className="space-y-1">
                {/* Botão da categoria */}
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

                {/* Subcategorias */}
                {isExpanded && (
                  <div className="ml-4 space-y-1 border-l border-zinc-800 pl-2">
                    {category.items.map((item) => {
                      const ItemIcon = item.icon || CategoryIcon;
                      const isActive = isItemActive(item.id);
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
                          <ItemIcon size={18} className={`shrink-0 ${isActive ? 'text-black' : 'text-zinc-600 group-hover:text-[#00f0ff]'}`} />
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
          })}
      </nav>

      {/* User Footer */}
      <div className="p-6 border-t border-zinc-900 bg-black">
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
        <button 
          onClick={() => { setActiveTab('settings'); onNavigate?.(); }}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 mb-3 text-zinc-400 hover:bg-zinc-900 hover:text-[#00f0ff] border border-zinc-900 hover:border-[#00f0ff]/30 transition-colors text-xs font-bold rounded-lg uppercase tracking-wide whitespace-nowrap"
        >
          <Settings size={14} />
          <span>Configurações</span>
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-zinc-500 hover:bg-zinc-900 hover:text-red-500 border border-zinc-900 hover:border-red-900/30 transition-colors text-xs font-bold rounded-lg uppercase tracking-wide whitespace-nowrap"
        >
          <LogOut size={14} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};