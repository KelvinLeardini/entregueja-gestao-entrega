import React from 'react';
import {
  Bike,
  Sun,
  Moon,
  DollarSign,
  Users,
  Compass,
  Wrench,
  ArrowLeft,
  Pill,
  UtensilsCrossed,
  Settings,
} from 'lucide-react';
import { Role, ThemeMode, AuthSessionRole, TenantStore } from '../types';

interface HeaderProps {
  activeTab: 'balcao' | 'fechamento' | 'taxas' | 'motoboys' | 'api_webhook' | 'escopo';
  setActiveTab: (tab: 'balcao' | 'fechamento' | 'taxas' | 'motoboys' | 'api_webhook' | 'escopo') => void;
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  currentAuthRole: AuthSessionRole;
  onOpenLoginModal?: () => void;
  onOpenSettings?: () => void;
  selectedCourierId: string;
  setSelectedCourierId: (id: string) => void;
  couriers: Array<{ id: string; name: string }>;
  theme: ThemeMode;
  onToggleTheme: () => void;
  currentTenant?: TenantStore;
  isDeveloperImpersonating?: boolean;
  onNavigateHome?: () => void;
  onNavigateToDevAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  currentAuthRole,
  onOpenLoginModal,
  onOpenSettings,
  selectedCourierId,
  setSelectedCourierId,
  couriers,
  theme,
  onToggleTheme,
  currentTenant,
  isDeveloperImpersonating,
  onNavigateHome,
  onNavigateToDevAdmin,
}) => {
  const allNavItems = [
    {
      id: 'balcao' as const,
      label: 'Balcão & Fila Geral',
      shortLabel: 'Balcão & Fila',
      icon: Bike,
      adminOnly: false,
    },
    {
      id: 'fechamento' as const,
      label: 'Fechamento Semanal (Pix)',
      shortLabel: 'Fechamento Pix',
      icon: DollarSign,
      adminOnly: true,
    },
    {
      id: 'motoboys' as const,
      label: 'Motoboys & 2FA',
      shortLabel: 'Motoboys & 2FA',
      icon: Users,
      adminOnly: true,
    },
    {
      id: 'taxas' as const,
      label: 'Tabela de KM & Taxas',
      shortLabel: 'Tabela KM',
      icon: Compass,
      adminOnly: true,
    },
  ];

  // Se o login for BALCAO, mostra estritamente a aba do balcão para não sobrecarregar
  const visibleNavItems = currentAuthRole === 'BALCAO'
    ? allNavItems.filter((item) => !item.adminOnly)
    : allNavItems;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      {/* Banner de Desenvolvedor se acessado via Magic Link */}
      {isDeveloperImpersonating && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5" />
            <span>MODO SUPORTE TÉCNICO (DEV ADMIN) · Acesso irrestrito a /{currentTenant?.slug}</span>
          </div>
          {onNavigateToDevAdmin && (
            <button
              onClick={onNavigateToDevAdmin}
              className="bg-slate-950 text-white px-2.5 py-0.5 rounded text-[11px] font-semibold hover:bg-slate-800 transition-colors"
            >
              Voltar ao Dev Admin
            </button>
          )}
        </div>
      )}

      {/* LINHA 1: Top Bar com Marca, Controles de Modo e Tema */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Marca / Logo do Comércio */}
          <div className="flex items-center gap-2.5 shrink-0">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1"
                title="Voltar ao EntregueJá SaaS"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-sm shadow-amber-500/20 font-bold">
              {currentTenant?.segment === 'PHARMACY' ? (
                <Pill className="w-5 h-5 text-slate-950" />
              ) : currentTenant?.segment === 'BURGER' ? (
                <UtensilsCrossed className="w-5 h-5 text-slate-950" />
              ) : (
                <Bike className="w-5 h-5 text-slate-950" />
              )}
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
                {currentTenant?.name || 'Comércio'}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium font-mono">
                /{currentTenant?.slug || 'tenant'} · EntregueJá SaaS
              </span>
            </div>
          </div>

          {/* Ações do Topo: Configurações e Tema */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Botão de Configurações (Impressora Térmica, APIs e Loja) */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-2.5 sm:px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-xs font-bold shadow-2xs group"
                title="Configurações da Loja (Impressora Térmica, APIs e Dados)"
                aria-label="Abrir Configurações da Loja"
              >
                <Settings className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
                <span className="hidden sm:inline">Configurações</span>
              </button>
            )}

            {/* Botão de Modo Claro / Escuro */}
            <button
              onClick={onToggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-xs font-semibold"
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              aria-label="Alternar tema claro/escuro"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* LINHA 2: BARRA DE NAVEGAÇÃO DE CATEGORIAS */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <nav
            aria-label="Categorias principais"
            className="flex items-center gap-1.5 py-1.5 sm:py-2 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && currentRole === 'ADMIN';

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentRole('ADMIN');
                    setActiveTab(item.id);
                  }}
                  className={`px-3 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-xs scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive
                        ? 'text-slate-950'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  <span className="inline sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}

            {/* Aviso no modo Balcão */}
            {currentAuthRole === 'BALCAO' && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 italic pl-3 border-l border-slate-200 dark:border-slate-700">
                Modo Balcão ativo: Fila e despacho em tempo real.
              </span>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
