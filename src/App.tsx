import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BalcaoView } from './components/BalcaoView';
import { MotoboyPortalView } from './components/MotoboyPortalView';
import { FechamentoSemanalView } from './components/FechamentoSemanalModal';
import { TabelaTaxasView } from './components/TabelaTaxasModal';
import { MotoboysView } from './components/MotoboysModal';
import { ScopeDocumentationView } from './components/ScopeDocumentationView';
import { WebhookSimulatorView } from './components/WebhookSimulatorModal';
import { LoginGateModal } from './components/LoginGateModal';
import { SettingsModal } from './components/SettingsModal';
import { LandingPage } from './components/LandingPage';
import { ClientDemoPlayground } from './components/ClientDemoPlayground';
import { DevAdminView } from './components/DevAdminView';
import { DevSandboxView } from './components/DevSandboxView';
import {
  User,
  Delivery,
  DeliveryRateRange,
  StoreConfig,
  WeeklySettlement,
  AddressCacheItem,
  WebhookLogItem,
  Role,
  DeliveryStatus,
  CancellationStage,
  PixKeyType,
  ThemeMode,
  PlatformApiConfig,
  AuthSessionRole,
  SecuritySettings,
  TenantStore,
  OrderSource,
  ThermalPrinterSettings,
} from './types';
import {
  loadStoreConfig,
  saveStoreConfig,
  loadRateRanges,
  saveRateRanges,
  loadUsers,
  saveUsers,
  loadDeliveries,
  saveDeliveries,
  loadSettlements,
  saveSettlements,
  loadAddressCache,
  saveAddressCache,
  loadWebhookLogs,
  saveWebhookLogs,
  loadPlatformConfig,
  savePlatformConfig,
  loadPrinterSettings,
  savePrinterSettings,
  loadSecuritySettings,
  saveSecuritySettings,
  loadActiveAuthSession,
  saveActiveAuthSession,
  loadTenants,
  getTenantBySlug,
  loadTenantScopedData,
  saveTenantScopedDeliveries,
  saveTenantScopedUsers,
  saveTenantScopedConfig,
  findCourierAcrossAllSources,
  fetchCourierFromServer,
} from './services/storage';

export default function App() {
  // Lista de Tenants Cadastrados no Banco
  const [tenants, setTenants] = useState<TenantStore[]>(loadTenants);

  // Resolução do Pathname Atual e Parâmetros
  const [currentPath, setCurrentPath] = useState<string>(() => {
    try {
      const p = window.location.pathname;
      return p && p !== '/' ? p : '/';
    } catch {
      return '/';
    }
  });

  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    try {
      return new URLSearchParams(window.location.search);
    } catch {
      return new URLSearchParams();
    }
  });

  const urlMotoToken = React.useMemo(() => {
    const fromSearch = searchParams.get('motoToken') || searchParams.get('token');
    if (fromSearch) return fromSearch.trim();

    const parts = currentPath.split('?')[0].split('/').filter(Boolean);
    if ((parts[0] === 'motoboy' || parts[0] === 'portal' || parts[0] === 'entregador') && parts[1]) {
      return parts[1].trim();
    }
    return null;
  }, [searchParams, currentPath]);

  const urlPin = searchParams.get('pin')?.trim() || null;

  const [remoteCourierData, setRemoteCourierData] = useState<{
    courier: User;
    deliveries: Delivery[];
    tenantSlug?: string;
  } | null>(null);
  const [isFetchingRemoteCourier, setIsFetchingRemoteCourier] = useState(false);

  useEffect(() => {
    if (urlMotoToken && !users.some(u => u.accessToken === urlMotoToken)) {
      const local = findCourierAcrossAllSources(urlMotoToken);
      if (!local) {
        setIsFetchingRemoteCourier(true);
        fetchCourierFromServer(urlMotoToken).then(res => {
          if (res) {
            setRemoteCourierData(res);
          }
          setIsFetchingRemoteCourier(false);
        }).catch(() => setIsFetchingRemoteCourier(false));
      }
    }
  }, [urlMotoToken]);
  const isDevSuperAdmin = searchParams.get('devSuperAdmin') === 'true';

  // Identificação do Tenant Ativo se estiver numa rota /[tenantSlug]
  const currentTenantSlug = React.useMemo(() => {
    if (
      currentPath === '/' ||
      currentPath === '/demo' ||
      currentPath.startsWith('/dev-admin')
    ) {
      return null;
    }
    const slug = currentPath.replace(/^\//, '').split('/')[0].split('?')[0];
    return slug || null;
  }, [currentPath]);

  const activeTenant = React.useMemo(() => {
    if (!currentTenantSlug) return null;
    return getTenantBySlug(currentTenantSlug) || tenants.find((t) => t.slug === currentTenantSlug) || null;
  }, [currentTenantSlug, tenants]);

  // Navegador interno transparente
  const navigateTo = (path: string, search: string = '') => {
    setCurrentPath(path);
    const newSearch = new URLSearchParams(search);
    setSearchParams(newSearch);
    try {
      const fullUrl = search ? `${path}?${search}` : path;
      window.history.pushState({}, '', fullUrl);
    } catch (e) {
      console.error(e);
    }
  };

  // Carregamento de dados com isolamento estrito por tenant
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(() => {
    if (activeTenant) {
      return loadTenantScopedData(activeTenant.slug).config;
    }
    return loadStoreConfig();
  });

  const [rateRanges, setRateRanges] = useState<DeliveryRateRange[]>(() => {
    if (activeTenant) {
      return loadTenantScopedData(activeTenant.slug).rateRanges;
    }
    return loadRateRanges();
  });

  const [users, setUsers] = useState<User[]>(() => {
    if (activeTenant) {
      return loadTenantScopedData(activeTenant.slug).users;
    }
    return loadUsers();
  });

  const [deliveries, setDeliveries] = useState<Delivery[]>(() => {
    if (activeTenant) {
      return loadTenantScopedData(activeTenant.slug).deliveries;
    }
    return loadDeliveries();
  });

  // Atualiza estado ao alternar tenant
  useEffect(() => {
    if (activeTenant) {
      const scoped = loadTenantScopedData(activeTenant.slug);
      setStoreConfig(scoped.config);
      setRateRanges(scoped.rateRanges);
      setUsers(scoped.users);
      setDeliveries(scoped.deliveries);
    }
  }, [activeTenant?.slug]);

  const [settlements, setSettlements] = useState<WeeklySettlement[]>(loadSettlements);
  const [addressCache, setAddressCache] = useState<AddressCacheItem[]>(loadAddressCache);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>(loadWebhookLogs);
  const [platformConfig, setPlatformConfig] = useState<PlatformApiConfig>(loadPlatformConfig);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(loadSecuritySettings);
  const [printerSettings, setPrinterSettings] = useState<ThermalPrinterSettings>(loadPrinterSettings);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Perfis de Acesso Segregados (Balcão vs Admin da Loja)
  const [currentAuthRole, setCurrentAuthRole] = useState<AuthSessionRole>(loadActiveAuthSession);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Tema Claro / Escuro
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('burger_route_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('burger_route_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Controle de navegação interna do lojista
  const [currentRole, setCurrentRole] = useState<Role>('ADMIN');
  const [activeTab, setActiveTab] = useState<
    'balcao' | 'fechamento' | 'taxas' | 'motoboys' | 'api_webhook' | 'escopo'
  >('balcao');

  // Se estiver em modo BALCAO, força aba operacional
  useEffect(() => {
    if (currentAuthRole === 'BALCAO' && activeTab !== 'balcao') {
      setActiveTab('balcao');
    }
  }, [currentAuthRole, activeTab]);

  const couriers = users.filter((u) => u.role === 'COURIER');
  const [selectedCourierId, setSelectedCourierId] = useState<string>(
    couriers[0]?.id || ''
  );

  // Sincronização automática com armazenamento por tenant
  useEffect(() => {
    if (activeTenant) {
      saveTenantScopedConfig(activeTenant.slug, storeConfig);
    } else {
      saveStoreConfig(storeConfig);
    }
  }, [storeConfig, activeTenant]);

  useEffect(() => {
    if (activeTenant) {
      saveTenantScopedUsers(activeTenant.slug, users);
    } else {
      saveUsers(users);
    }
  }, [users, activeTenant]);

  useEffect(() => {
    if (activeTenant) {
      saveTenantScopedDeliveries(activeTenant.slug, deliveries);
    } else {
      saveDeliveries(deliveries);
    }
  }, [deliveries, activeTenant]);

  useEffect(() => {
    saveRateRanges(rateRanges);
  }, [rateRanges]);

  useEffect(() => {
    saveSettlements(settlements);
  }, [settlements]);

  useEffect(() => {
    saveAddressCache(addressCache);
  }, [addressCache]);

  useEffect(() => {
    saveWebhookLogs(webhookLogs);
  }, [webhookLogs]);

  // Ações de Entrega
  const handleAddDelivery = (newDelivery: Delivery) => {
    setDeliveries((prev) => [newDelivery, ...prev]);
  };

  const handleUpdateDelivery = (updatedDelivery: Delivery) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === updatedDelivery.id ? updatedDelivery : d))
    );
  };

  const handleUpdateDeliveryStatus = (
    id: string,
    status: DeliveryStatus,
    courierId?: string,
    cancellationStage?: CancellationStage,
    cancellationReason?: string
  ) => {
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const now = new Date().toISOString();
        const isFeePayable =
          status === 'DELIVERED' || status === 'CANCELED_AFTER_DELIVERY';

        return {
          ...d,
          status,
          isFeePayable,
          cancellationStage: cancellationStage || d.cancellationStage,
          cancellationReason: cancellationReason || d.cancellationReason,
          courierId: courierId !== undefined ? courierId : d.courierId,
          dispatchedAt:
            status === 'IN_TRANSIT' && !d.dispatchedAt ? now : d.dispatchedAt,
          deliveredAt: status === 'DELIVERED' ? now : d.deliveredAt,
          canceledAt: status.startsWith('CANCELED') ? now : d.canceledAt,
          updatedAt: now,
        };
      })
    );
  };

  const handleConfirmDeliveryFromMobile = (deliveryId: string) => {
    handleUpdateDeliveryStatus(deliveryId, 'DELIVERED');
  };

  const handleUpdateCourierPix = (
    courierId: string,
    pixKeyType: PixKeyType,
    pixKey: string
  ) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === courierId ? { ...u, pixKeyType, pixKey } : u))
    );
  };

  const handleAddCourier = (newCourier: User) => {
    setUsers((prev) => {
      const next = [...prev, newCourier];
      if (activeTenant) {
        saveTenantScopedUsers(activeTenant.slug, next);
      } else {
        saveUsers(next);
      }
      return next;
    });
  };

  const handleUpdateCourier = (updated: User) => {
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === updated.id ? updated : u));
      if (activeTenant) {
        saveTenantScopedUsers(activeTenant.slug, next);
      } else {
        saveUsers(next);
      }
      return next;
    });
  };

  const handleDeleteCourier = (id: string) => {
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== id);
      if (activeTenant) {
        saveTenantScopedUsers(activeTenant.slug, next);
      } else {
        saveUsers(next);
      }
      return next;
    });
    setDeliveries((prev) =>
      prev.map((d) => (d.courierId === id ? { ...d, courierId: undefined, status: 'PENDING' } : d))
    );
  };

  const handleSaveSettlement = (settlement: WeeklySettlement) => {
    setSettlements((prev) => {
      const idx = prev.findIndex((s) => s.id === settlement.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = settlement;
        return next;
      }
      return [settlement, ...prev];
    });
  };

  const handleUpdateAddressCache = (item: AddressCacheItem) => {
    setAddressCache((prev) => {
      const exists = prev.some((c) => c.normalizedQuery === item.normalizedQuery);
      if (exists) return prev;
      return [item, ...prev];
    });
  };

  const handleAddWebhookLog = (log: WebhookLogItem) => {
    setWebhookLogs((prev) => [log, ...prev]);
  };

  // CASO 1: SE O MOTOBOY ACESSOU A PÁGINA COM SEU LINK EXCLUSIVO (?motoToken=...)
  // RENDERIZA EXCLUSIVAMENTE O PORTAL DO MOTOBOY (100% ISOLADO DO BALCÃO E DO ADMIN)
  if (urlMotoToken) {
    if (isFetchingRemoteCourier) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-300">Conectando ao Portal do Motoboy...</p>
          </div>
        </div>
      );
    }

    let matchingCourier = users.find((u) => u.accessToken === urlMotoToken);
    let portalDeliveries = deliveries;
    let courierTenantSlug = activeTenant?.slug;

    if (!matchingCourier) {
      const resolved = findCourierAcrossAllSources(urlMotoToken) || remoteCourierData;
      if (resolved) {
        matchingCourier = resolved.courier;
        portalDeliveries = resolved.deliveries;
        courierTenantSlug = resolved.tenantSlug;
      }
    }

    if (matchingCourier) {
      const handleCourierDeliveryConfirm = (deliveryId: string) => {
        if (courierTenantSlug) {
          const currentDel = loadTenantScopedData(courierTenantSlug).deliveries;
          const updatedDel = currentDel.map((d) =>
            d.id === deliveryId
              ? {
                  ...d,
                  status: 'DELIVERED' as DeliveryStatus,
                  isFeePayable: true,
                  deliveredAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : d
          );
          saveTenantScopedDeliveries(courierTenantSlug, updatedDel);
          setDeliveries(updatedDel);
        } else {
          handleConfirmDeliveryFromMobile(deliveryId);
        }

        // Sincroniza confirmação com o servidor remoto
        fetch(`/api/couriers/${encodeURIComponent(urlMotoToken)}/confirm/${deliveryId}`, {
          method: 'POST',
        }).catch(() => {});
      };

      const handleCourierPixUpdate = (
        courierId: string,
        pixKeyType: PixKeyType,
        pixKey: string
      ) => {
        if (courierTenantSlug) {
          const currentU = loadTenantScopedData(courierTenantSlug).users;
          const updatedU = currentU.map((u) =>
            u.id === courierId ? { ...u, pixKeyType, pixKey } : u
          );
          saveTenantScopedUsers(courierTenantSlug, updatedU);
          setUsers(updatedU);
        } else {
          handleUpdateCourierPix(courierId, pixKeyType, pixKey);
        }

        fetch(`/api/couriers/${encodeURIComponent(urlMotoToken)}/pix`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pixKeyType, pixKey }),
        }).catch(() => {});
      };

      return (
        <MotoboyPortalView
          courier={matchingCourier}
          deliveries={portalDeliveries}
          onConfirmDelivery={handleCourierDeliveryConfirm}
          onUpdateCourierPix={handleCourierPixUpdate}
          initialPin={urlPin}
        />
      );
    }

    // Se o token foi informado na URL mas não existe no banco/servidor
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center text-2xl font-bold">
            🏍️
          </div>
          <h1 className="text-lg font-bold text-white">Portal do Motoboy</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            O link de acesso exclusivo não foi localizado no sistema ou ainda não foi sincronizado com este servidor.
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-left">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Token:</span>
            <span className="text-xs font-mono font-bold text-amber-400 break-all">{urlMotoToken}</span>
          </div>
          <p className="text-xs text-slate-500">
            Solicite ao balcão da sua loja para reenviar o seu link atualizado pelo WhatsApp.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigateTo('/')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors border border-slate-700"
            >
              Ir para o Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CASO 2: ROTA DO SUPER ADMIN DEV EXCLUSIVO (/dev-admin-portal)
  if (currentPath === '/dev-admin-portal' || currentPath === '/dev-admin') {
    return (
      <DevAdminView
        tenants={tenants}
        onRefreshTenants={() => setTenants(loadTenants())}
        onNavigateToTenant={(slug, devSuperAdmin) => {
          navigateTo(`/${slug}`, devSuperAdmin ? 'devSuperAdmin=true' : '');
        }}
        onNavigateToSandbox={() => navigateTo('/dev-admin-portal/sandbox')}
        onNavigateHome={() => navigateTo('/')}
      />
    );
  }

  // CASO 3: ROTA DE TESTE INTERATIVO PARA POTENCIAIS CLIENTES (/demo)
  if (currentPath === '/demo') {
    return (
      <ClientDemoPlayground
        onBackToHome={() => navigateTo('/')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // CASO 4: ROTA RAIZ (/) -> LANDING PAGE SAAS (Página institucional de anúncio)
  if (currentPath === '/' || !activeTenant) {
    return (
      <LandingPage
        onNavigateToDemo={() => navigateTo('/demo')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // CASO 5: ROTA DINÂMICA DO COMÉRCIO CLIENTE (/[tenantSlug], ex: /hardbeerburguer)
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      {/* Barra de Navegação Superior da Loja */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        currentAuthRole={currentAuthRole}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        selectedCourierId={selectedCourierId}
        setSelectedCourierId={setSelectedCourierId}
        couriers={couriers}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentTenant={activeTenant}
        isDeveloperImpersonating={isDevSuperAdmin}
        onNavigateHome={() => navigateTo('/')}
        onNavigateToDevAdmin={() => navigateTo('/dev-admin-portal')}
      />

      {/* Conteúdo Principal da Loja Selecionada */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        {activeTab === 'balcao' && (
          <BalcaoView
            deliveries={deliveries}
            couriers={couriers}
            storeConfig={storeConfig}
            rateRanges={rateRanges}
            addressCache={addressCache}
            printerSettings={printerSettings}
            onAddDelivery={handleAddDelivery}
            onUpdateDeliveryStatus={handleUpdateDeliveryStatus}
            onUpdateAddressCache={handleUpdateAddressCache}
          />
        )}

        {activeTab === 'api_webhook' && currentAuthRole === 'ADMIN' && (
          <WebhookSimulatorView
            storeConfig={storeConfig}
            rateRanges={rateRanges}
            couriers={couriers}
            deliveries={deliveries}
            addressCache={addressCache}
            webhookLogs={webhookLogs}
            platformConfig={platformConfig}
            onUpdatePlatformConfig={setPlatformConfig}
            onAddDelivery={handleAddDelivery}
            onUpdateDelivery={handleUpdateDelivery}
            onUpdateCache={handleUpdateAddressCache}
            onAddLog={handleAddWebhookLog}
          />
        )}

        {activeTab === 'fechamento' && currentAuthRole === 'ADMIN' && (
          <FechamentoSemanalView
            couriers={couriers}
            deliveries={deliveries}
            settlements={settlements}
            storeConfig={storeConfig}
            onSaveSettlement={handleSaveSettlement}
          />
        )}

        {activeTab === 'motoboys' && currentAuthRole === 'ADMIN' && (
          <MotoboysView
            couriers={couriers}
            onAddCourier={handleAddCourier}
            onUpdateCourier={handleUpdateCourier}
            onDeleteCourier={handleDeleteCourier}
          />
        )}

        {activeTab === 'taxas' && currentAuthRole === 'ADMIN' && (
          <TabelaTaxasView
            rateRanges={rateRanges}
            storeConfig={storeConfig}
            onSaveRateRanges={setRateRanges}
            onSaveStoreConfig={setStoreConfig}
          />
        )}

        {activeTab === 'escopo' && currentAuthRole === 'ADMIN' && (
          <ScopeDocumentationView
            deliveries={deliveries}
            couriers={couriers}
            rateRanges={rateRanges}
            storeConfig={storeConfig}
          />
        )}
      </main>

      {/* Modal de Seleção e Validação de PIN (Balcão vs Admin) */}
      <LoginGateModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        securitySettings={securitySettings}
        currentAuthRole={currentAuthRole}
        onSelectRole={(role) => {
          setCurrentAuthRole(role);
          saveActiveAuthSession(role);
          if (role === 'BALCAO') {
            setActiveTab('balcao');
          }
        }}
      />

      {/* Modal Centralizado de Configurações (Impressora Térmica, APIs e Dados da Loja) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        printerSettings={printerSettings}
        onSavePrinterSettings={(newSettings) => {
          setPrinterSettings(newSettings);
          savePrinterSettings(newSettings);
        }}
        platformConfig={platformConfig}
        onSavePlatformConfig={(newConfig) => {
          setPlatformConfig(newConfig);
          savePlatformConfig(newConfig);
        }}
        storeConfig={storeConfig}
        onSaveStoreConfig={(newConfig) => {
          setStoreConfig(newConfig);
          if (activeTenant) {
            saveTenantScopedConfig(activeTenant.slug, newConfig);
          } else {
            saveStoreConfig(newConfig);
          }
        }}
        tenantSlug={activeTenant?.slug}
      />

      {/* Rodapé Dinâmico da Loja */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {activeTenant.name} ({activeTenant.originAddress})
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Roteamento viário OSRM · EntregueJá SaaS
          </span>
        </div>
      </footer>
    </div>
  );
}
