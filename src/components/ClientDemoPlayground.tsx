import React, { useState } from 'react';
import { Header } from './Header';
import { BalcaoView } from './BalcaoView';
import { FechamentoSemanalView } from './FechamentoSemanalModal';
import { TabelaTaxasView } from './TabelaTaxasModal';
import { MotoboysView } from './MotoboysModal';
import { WebhookSimulatorView } from './WebhookSimulatorModal';
import { ScopeDocumentationView } from './ScopeDocumentationView';
import { SettingsModal } from './SettingsModal';
import {
  Delivery,
  User,
  StoreConfig,
  DeliveryRateRange,
  WeeklySettlement,
  AddressCacheItem,
  WebhookLogItem,
  PlatformApiConfig,
  AuthSessionRole,
  Role,
  DeliveryStatus,
  CancellationStage,
  PixKeyType,
  ThemeMode,
  TenantStore,
  ThermalPrinterSettings,
} from '../types';
import { playNewOrderChime, playDispatchSuccessChime } from '../services/soundEffects';
import { loadPlatformConfig, loadPrinterSettings, savePrinterSettings, DEMO_INITIAL_COURIERS, syncTenantToServer } from '../services/storage';

interface ClientDemoPlaygroundProps {
  onBackToHome: () => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

// Configuração do Tenant de Demonstração Exclusivo (100% Isolado dos Clientes Reais)
const DEMO_TENANT: TenantStore = {
  id: 'store_demo_sandbox',
  slug: 'demo',
  name: 'Loja Demonstração (Ambiente de Testes)',
  segment: 'BURGER',
  status: 'ACTIVE',
  plan: 'PRO',
  ownerName: 'Visitante / Testador',
  ownerPhone: '(11) 90000-0000',
  ownerEmail: 'demo@entregueja.com.br',
  originAddress: 'Av. Paulista, 1500 - Bela Vista, São Paulo - SP',
  originLat: -23.5614,
  originLng: -46.6559,
  calculationMode: 'KM_DRIVEN',
  defaultBaseFee: 6.0,
  defaultKmRate: 1.5,
  storePin: '1234',
  adminPin: '9876',
  createdAt: new Date().toISOString(),
  activeDeliveriesCount: 4,
  activeCouriersCount: 3,
};

const DEMO_INITIAL_STORE_CONFIG: StoreConfig = {
  id: 'store_demo_sandbox',
  storeName: 'Loja Demonstração (Ambiente de Testes)',
  street: 'Av. Paulista',
  number: '1500',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  postalCode: '01310-200',
  latitude: -23.5614,
  longitude: -46.6559,
  fallbackRate: 6.0,
  extraKmRate: 1.5,
  maxDistanceKm: 25.0,
};

const DEMO_INITIAL_RATE_RANGES: DeliveryRateRange[] = [
  { id: 'demo_rr_1', minKm: 0.0, maxKm: 3.0, price: 6.0, description: 'Raio Curto (Bela Vista / Consolação)', isActive: true, orderIndex: 1 },
  { id: 'demo_rr_2', minKm: 3.1, maxKm: 5.5, price: 9.0, description: 'Raio Médio (Jardins / Centro)', isActive: true, orderIndex: 2 },
  { id: 'demo_rr_3', minKm: 5.6, maxKm: 8.0, price: 13.0, description: 'Raio Longo (Pinheiros / Vila Mariana)', isActive: true, orderIndex: 3 },
  { id: 'demo_rr_4', minKm: 8.1, maxKm: 12.0, price: 18.0, description: 'Regiões Distantes (Perdizes / Moema)', isActive: true, orderIndex: 4 },
];


const buildDemoInitialDeliveries = (): Delivery[] => {
  const now = Date.now();
  return [
    {
      id: 'demo_del_1',
      orderNumber: 'IFOOD-4192',
      source: 'IFOOD',
      customerName: 'Mariana Duarte',
      customerPhone: '11998765432',
      street: 'Rua Augusta',
      number: '1420',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01304-001',
      distanceKm: 1.8,
      durationMinutes: 6,
      feeAmount: 6.0,
      isManualOverride: false,
      status: 'PENDING',
      isFeePayable: false,
      subtotal: 82.5,
      customerDeliveryFee: 7.0,
      discountAmount: 5.0,
      orderTotal: 84.5,
      paymentMethod: 'ONLINE',
      customerNotes: 'Apto 71, Torre Sul. Tocar o interfone e deixar com o porteiro.',
      items: [
        {
          name: 'Smash Duplo Cheddar Bacon Artesanal',
          quantity: 1,
          unitPrice: 38.9,
          totalPrice: 38.9,
          options: [
            'Ponto: Ao Ponto',
            '+ Bacon Fatiado Crocante (R$ 5,00)',
            'Pão: Brioche Selado na Manteiga',
          ],
          notes: 'Mandar bastante maionese verde da casa!',
        },
        {
          name: 'Batata Rústica Alecrim & Páprica',
          quantity: 1,
          unitPrice: 19.9,
          totalPrice: 19.9,
          options: ['Molho: Barbecue Artesanal'],
        },
        {
          name: 'Milkshake de Nutella com Ninho 400ml',
          quantity: 1,
          unitPrice: 23.7,
          totalPrice: 23.7,
          options: ['Chantilly: Sim'],
        },
      ],
      itemsSummary: '1x Smash Duplo Cheddar + 1x Batata Rústica + 1x Milkshake Nutella',
      createdAt: new Date(now - 12 * 60000).toISOString(),
      updatedAt: new Date(now - 12 * 60000).toISOString(),
    },
    {
      id: 'demo_del_2',
      orderNumber: '99-5281',
      source: '99FOOD',
      customerName: 'Beatriz Fonseca',
      customerPhone: '11993334455',
      street: 'Rua Oscar Freire',
      number: '820',
      neighborhood: 'Cerqueira César',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01426-001',
      distanceKm: 2.6,
      durationMinutes: 9,
      feeAmount: 6.0,
      isManualOverride: false,
      status: 'PENDING',
      isFeePayable: false,
      subtotal: 122.0,
      customerDeliveryFee: 8.0,
      discountAmount: 10.0,
      orderTotal: 120.0,
      paymentMethod: 'CARD',
      customerNotes: 'Entregar na recepção da clínica.',
      items: [
        {
          name: 'Combo Almoço 99Food: 2x Burger Clássico + Fritas',
          quantity: 1,
          unitPrice: 68.0,
          totalPrice: 68.0,
          options: ['Burger 1: Ao ponto', 'Burger 2: Bem passado', 'Fritas: Batata Crinkle'],
        },
        {
          name: 'Onion Rings Crocantes com Molho Especial',
          quantity: 2,
          unitPrice: 22.0,
          totalPrice: 44.0,
        },
        {
          name: 'Coca-Cola Zero Lata 350ml',
          quantity: 2,
          unitPrice: 5.0,
          totalPrice: 10.0,
        },
      ],
      itemsSummary: '1x Combo Almoço (2x Burger + Fritas) + 2x Onion Rings + 2x Coca Zero',
      createdAt: new Date(now - 8 * 60000).toISOString(),
      updatedAt: new Date(now - 8 * 60000).toISOString(),
    },
    {
      id: 'demo_del_3',
      orderNumber: 'KEETA-810',
      source: 'KEETA',
      customerName: 'Rodrigo Pires',
      customerPhone: '11992223344',
      street: 'Rua Vergueiro',
      number: '1200',
      neighborhood: 'Paraíso',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '04101-000',
      distanceKm: 3.2,
      durationMinutes: 10,
      feeAmount: 9.0,
      isManualOverride: false,
      status: 'IN_TRANSIT',
      isFeePayable: false,
      courierId: 'demo_courier_1',
      subtotal: 62.0,
      customerDeliveryFee: 6.0,
      discountAmount: 3.0,
      orderTotal: 65.0,
      paymentMethod: 'PIX',
      customerNotes: 'Portão social ao lado da garagem.',
      items: [
        {
          name: 'Keeta Smash Salad Burger 180g',
          quantity: 1,
          unitPrice: 34.0,
          totalPrice: 34.0,
          options: ['Ponto: Bem Passado', '+ Queijo Cheddar Fatiado (R$ 3,00)'],
          notes: 'Sem cebola crua.',
        },
        {
          name: 'Batata Frita Palito Média',
          quantity: 1,
          unitPrice: 16.0,
          totalPrice: 16.0,
        },
        {
          name: 'Suco de Laranja Natural 500ml',
          quantity: 1,
          unitPrice: 12.0,
          totalPrice: 12.0,
        },
      ],
      itemsSummary: '1x Smash Salad Burger + 1x Batata Frita + 1x Suco Laranja',
      dispatchedAt: new Date(now - 15 * 60000).toISOString(),
      createdAt: new Date(now - 25 * 60000).toISOString(),
      updatedAt: new Date(now - 15 * 60000).toISOString(),
    },
    {
      id: 'demo_del_4',
      orderNumber: 'WHATS-204',
      source: 'BALCAO',
      customerName: 'Camila Morais',
      customerPhone: '11997778899',
      street: 'Alameda Santos',
      number: '600',
      neighborhood: 'Cerqueira César',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01418-000',
      distanceKm: 1.1,
      durationMinutes: 5,
      feeAmount: 6.0,
      isManualOverride: false,
      status: 'IN_TRANSIT',
      isFeePayable: false,
      courierId: 'demo_courier_2',
      subtotal: 42.0,
      customerDeliveryFee: 6.0,
      discountAmount: 0.0,
      orderTotal: 48.0,
      paymentMethod: 'CASH',
      customerNotes: 'Cliente pediu troco para R$ 100,00.',
      items: [
        {
          name: 'X-Burger Artesanal com Queijo Prato',
          quantity: 1,
          unitPrice: 28.0,
          totalPrice: 28.0,
          options: ['Pão Francês Redondo', 'Ponto: Ao Ponto'],
        },
        {
          name: 'Cerveja Artesanal Long Neck',
          quantity: 1,
          unitPrice: 14.0,
          totalPrice: 14.0,
        },
      ],
      itemsSummary: '1x X-Burger Artesanal + 1x Cerveja Artesanal',
      dispatchedAt: new Date(now - 10 * 60000).toISOString(),
      createdAt: new Date(now - 20 * 60000).toISOString(),
      updatedAt: new Date(now - 10 * 60000).toISOString(),
    },
    {
      id: 'demo_del_5',
      orderNumber: 'IFOOD-4188',
      source: 'IFOOD',
      customerName: 'Felipe Santana',
      customerPhone: '11995556677',
      street: 'Rua Teodoro Sampaio',
      number: '1400',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '05406-100',
      distanceKm: 4.8,
      durationMinutes: 13,
      feeAmount: 9.0,
      isManualOverride: false,
      status: 'DELIVERED',
      isFeePayable: true,
      courierId: 'demo_courier_1',
      subtotal: 92.0,
      customerDeliveryFee: 9.0,
      discountAmount: 5.0,
      orderTotal: 96.0,
      paymentMethod: 'ONLINE',
      items: [
        {
          name: 'Trufado Burger Premium 200g',
          quantity: 2,
          unitPrice: 38.0,
          totalPrice: 76.0,
          options: ['Gouda maçaricado', 'Maionese trufada'],
        },
        {
          name: 'Batata Crinkle com Alecrim',
          quantity: 1,
          unitPrice: 16.0,
          totalPrice: 16.0,
        },
      ],
      itemsSummary: '2x Trufado Burger Premium + 1x Batata Crinkle',
      dispatchedAt: new Date(now - 55 * 60000).toISOString(),
      deliveredAt: new Date(now - 30 * 60000).toISOString(),
      createdAt: new Date(now - 60 * 60000).toISOString(),
      updatedAt: new Date(now - 30 * 60000).toISOString(),
    },
  ];
};

export const ClientDemoPlayground: React.FC<ClientDemoPlaygroundProps> = ({
  onBackToHome,
  theme = 'light',
  onToggleTheme,
}) => {
  // Estado idêntico ao de uma loja real em produção
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEMO_INITIAL_STORE_CONFIG);
  const [rateRanges, setRateRanges] = useState<DeliveryRateRange[]>(DEMO_INITIAL_RATE_RANGES);
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('tenant_demo_users') : null;
      return raw ? JSON.parse(raw) : DEMO_INITIAL_COURIERS;
    } catch {
      return DEMO_INITIAL_COURIERS;
    }
  });
  const [deliveries, setDeliveries] = useState<Delivery[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('tenant_demo_deliveries') : null;
      return raw ? JSON.parse(raw) : buildDemoInitialDeliveries();
    } catch {
      return buildDemoInitialDeliveries();
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('tenant_demo_users', JSON.stringify(users));
      syncTenantToServer('demo', undefined, users);
    } catch (e) {}
  }, [users]);

  React.useEffect(() => {
    try {
      localStorage.setItem('tenant_demo_deliveries', JSON.stringify(deliveries));
      syncTenantToServer('demo', undefined, undefined, deliveries);
    } catch (e) {}
  }, [deliveries]);
  const [settlements, setSettlements] = useState<WeeklySettlement[]>([]);
  const [addressCache, setAddressCache] = useState<AddressCacheItem[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>([]);
  const [platformConfig, setPlatformConfig] = useState<PlatformApiConfig>(loadPlatformConfig);
  const [printerSettings, setPrinterSettings] = useState<ThermalPrinterSettings>(loadPrinterSettings);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Navegação idêntica de abas da loja
  const [activeTab, setActiveTab] = useState<
    'balcao' | 'fechamento' | 'taxas' | 'motoboys' | 'api_webhook' | 'escopo'
  >('balcao');
  const [currentRole, setCurrentRole] = useState<Role>('ADMIN');
  const [currentAuthRole, setCurrentAuthRole] = useState<AuthSessionRole>('ADMIN');

  const couriers = users.filter((u) => u.role === 'COURIER');
  const [selectedCourierId, setSelectedCourierId] = useState<string>(couriers[0]?.id || '');



  // Handlers operacionais reais da loja
  const handleAddDelivery = (newDelivery: Delivery) => {
    setDeliveries((prev) => [newDelivery, ...prev]);
    playNewOrderChime();
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
        const isFeePayable = status === 'DELIVERED' || status === 'CANCELED_AFTER_DELIVERY';

        return {
          ...d,
          status,
          isFeePayable,
          cancellationStage: cancellationStage || d.cancellationStage,
          cancellationReason: cancellationReason || d.cancellationReason,
          courierId: courierId !== undefined ? courierId : d.courierId,
          dispatchedAt: status === 'IN_TRANSIT' && !d.dispatchedAt ? now : d.dispatchedAt,
          deliveredAt: status === 'DELIVERED' ? now : d.deliveredAt,
          canceledAt: status.startsWith('CANCELED') ? now : d.canceledAt,
          updatedAt: now,
        };
      })
    );

    if (status === 'IN_TRANSIT') {
      playDispatchSuccessChime();
    }
  };

  const handleUpdateCourierPix = (courierId: string, pixKeyType: PixKeyType, pixKey: string) => {
    setUsers((prev) => prev.map((u) => (u.id === courierId ? { ...u, pixKeyType, pixKey } : u)));
  };

  const handleAddCourier = (newCourier: User) => {
    setUsers((prev) => [...prev, newCourier]);
  };

  const handleUpdateCourier = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const handleDeleteCourier = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header Oficial da Loja */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        currentAuthRole={currentAuthRole}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        selectedCourierId={selectedCourierId}
        setSelectedCourierId={setSelectedCourierId}
        couriers={couriers}
        theme={theme}
        onToggleTheme={onToggleTheme || (() => {})}
        currentTenant={DEMO_TENANT}
        isDeveloperImpersonating={false}
        onNavigateHome={onBackToHome}
        onNavigateToDevAdmin={() => {}}
      />

      {/* Conteúdo Operacional das Abas */}
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

        {activeTab === 'fechamento' && (
          <FechamentoSemanalView
            couriers={couriers}
            deliveries={deliveries}
            settlements={settlements}
            storeConfig={storeConfig}
            onSaveSettlement={handleSaveSettlement}
          />
        )}

        {activeTab === 'taxas' && (
          <TabelaTaxasView
            rateRanges={rateRanges}
            storeConfig={storeConfig}
            onSaveRateRanges={setRateRanges}
            onSaveStoreConfig={setStoreConfig}
          />
        )}

        {activeTab === 'motoboys' && (
          <MotoboysView
            couriers={couriers}
            onAddCourier={handleAddCourier}
            onUpdateCourier={handleUpdateCourier}
            onDeleteCourier={handleDeleteCourier}
          />
        )}

        {activeTab === 'api_webhook' && (
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
            onUpdateDelivery={(up) =>
              setDeliveries((prev) => prev.map((d) => (d.id === up.id ? up : d)))
            }
            onUpdateCache={handleUpdateAddressCache}
            onAddLog={handleAddWebhookLog}
          />
        )}

        {activeTab === 'escopo' && (
          <ScopeDocumentationView
            deliveries={deliveries}
            couriers={couriers}
            rateRanges={rateRanges}
            storeConfig={storeConfig}
          />
        )}
      </main>

      {/* Modal Centralizado de Configurações */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        printerSettings={printerSettings}
        onSavePrinterSettings={(newSettings) => {
          setPrinterSettings(newSettings);
          savePrinterSettings(newSettings);
        }}
        platformConfig={platformConfig}
        onSavePlatformConfig={setPlatformConfig}
        storeConfig={storeConfig}
        onSaveStoreConfig={setStoreConfig}
        tenantSlug="demo"
      />



      {/* Rodapé da Loja Modelo */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {DEMO_TENANT.name} ({DEMO_TENANT.originAddress})
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Ambiente de Demonstração Funcional · EntregueJá SaaS
          </span>
        </div>
      </footer>
    </div>
  );
};
