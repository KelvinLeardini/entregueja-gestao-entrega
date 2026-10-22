export const DEMO_INITIAL_COURIERS: User[] = [
  {
    id: 'demo_courier_1',
    name: 'Marcos Oliveira (Piloto Demo 1)',
    phone: '11990001111',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'DEM-0001',
    vehicleModel: 'CG 160 Fan',
    pixKeyType: 'PHONE',
    pixKey: '11990001111',
    accessToken: 'mb_demo_marcos',
    activePin: '112233',
    authPin2FA: '112233',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'demo_courier_2',
    name: 'Alexandre Souza (Piloto Demo 2)',
    phone: '11990002222',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'DEM-0002',
    vehicleModel: 'Titan 160',
    pixKeyType: 'CPF',
    pixKey: '12345678900',
    accessToken: 'mb_demo_alexandre',
    activePin: '223344',
    authPin2FA: '223344',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'demo_courier_3',
    name: 'Gabriel Santos (Piloto Demo 3)',
    phone: '11990003333',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'DEM-0003',
    vehicleModel: 'Fazer 250',
    pixKeyType: 'EMAIL',
    pixKey: 'gabriel.demo@entregueja.com.br',
    accessToken: 'mb_demo_gabriel',
    activePin: '334455',
    authPin2FA: '334455',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

import {
  User,
  Delivery,
  DeliveryRateRange,
  StoreConfig,
  WeeklySettlement,
  AddressCacheItem,
  WebhookLogItem,
  PlatformApiConfig,
  SecuritySettings,
  AuthSessionRole,
  TenantStore,
  ThermalPrinterSettings,
} from '../types';

export function generateCourierAccessToken(): string {
  return 'mb_' + Math.random().toString(36).substring(2, 9) + '_' + Math.random().toString(36).substring(2, 9);
}

export function generateCourier2FAPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const STORAGE_KEYS = {
  STORE_CONFIG: 'burger_route_store_config',
  RATE_RANGES: 'burger_route_rate_ranges',
  USERS: 'burger_route_users',
  DELIVERIES: 'burger_route_deliveries',
  SETTLEMENTS: 'burger_route_settlements',
  ADDRESS_CACHE: 'burger_route_address_cache',
  WEBHOOK_LOGS: 'burger_route_webhook_logs',
  PLATFORM_CONFIG: 'burger_route_platform_config',
  SECURITY_SETTINGS: 'burger_route_security_settings',
  ACTIVE_AUTH_SESSION: 'burger_route_active_auth_session',
  PRINTER_SETTINGS: 'burger_route_thermal_printer_settings',
};

// Endereço EXATO da Hamburgueria fornecido pelo usuário
export const DEFAULT_STORE_CONFIG: StoreConfig = {
  id: 'store_default',
  storeName: 'Hamburgueria Vila Guilhermina',
  street: 'R. Dr. Fábio Montenegro',
  number: '32',
  neighborhood: 'Vila Guilhermina',
  city: 'São Paulo',
  state: 'SP',
  latitude: -23.5334,
  longitude: -46.5153,
  fallbackRate: 7.0,
  extraKmRate: 1.5,
  maxDistanceKm: 25.0,
};

// Faixas de KM padrão alinhadas com o modelo de negócio
export const DEFAULT_RATE_RANGES: DeliveryRateRange[] = [
  {
    id: 'range_1',
    minKm: 0.0,
    maxKm: 3.0,
    price: 6.0,
    description: 'Vila Guilhermina e Imediatos',
    isActive: true,
    orderIndex: 1,
  },
  {
    id: 'range_2',
    minKm: 3.1,
    maxKm: 5.0,
    price: 9.0,
    description: 'Vila Matilde / Artur Alvim / Penha',
    isActive: true,
    orderIndex: 2,
  },
  {
    id: 'range_3',
    minKm: 5.1,
    maxKm: 8.0,
    price: 13.0,
    description: 'Tatuapé / Itaquera / Vila Ré',
    isActive: true,
    orderIndex: 3,
  },
  {
    id: 'range_4',
    minKm: 8.1,
    maxKm: 12.0,
    price: 18.0,
    description: 'Regiões Distantes ZL',
    isActive: true,
    orderIndex: 4,
  },
];

// Motoboys Cadastrados
export const DEFAULT_USERS: User[] = [
  {
    id: 'admin_1',
    name: 'Caixa / Expedição',
    phone: '11999990001',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'courier_1',
    name: 'Carlos Silva (Carlão)',
    phone: '11991234567',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'ABC-1D23',
    vehicleModel: 'CG 160 Fan Preta',
    pixKeyType: 'PHONE',
    pixKey: '11991234567',
    accessToken: 'mb_carlao_vilaguilhermina',
    activePin: '784129',
    authPin2FA: '784129',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'courier_2',
    name: 'Roberto Almeida (Beto)',
    phone: '11988776655',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'BRA-2E45',
    vehicleModel: 'Titan 160 Azul',
    pixKeyType: 'CPF',
    pixKey: '34567891011',
    accessToken: 'mb_beto_vilamatilde',
    activePin: '529301',
    authPin2FA: '529301',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'courier_3',
    name: 'Lucas Santos',
    phone: '11977665544',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'DEF-3G67',
    vehicleModel: 'Fazer 250 Vermelha',
    pixKeyType: 'EMAIL',
    pixKey: 'lucas.motoboy@gmail.com',
    accessToken: 'mb_lucas_tatuape',
    activePin: '318492',
    authPin2FA: '318492',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'courier_4',
    name: 'Felipe Oliveira',
    phone: '11996554433',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'GHI-4J89',
    vehicleModel: 'Biz 125 Branca',
    pixKeyType: 'RANDOM',
    pixKey: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    accessToken: 'mb_felipe_arturalvim',
    activePin: '904615',
    authPin2FA: '904615',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

// Helper para calcular datas recentes
const now = new Date();
const daysAgo = (days: number, hours: number = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(now.getHours() - hours);
  return d.toISOString();
};

// Pedidos pré-semeados com endereços reais da Zona Leste de SP ao redor de Vila Guilhermina
export const DEFAULT_DELIVERIES: Delivery[] = [
  {
    id: 'del_201',
    orderNumber: 'IFOOD-4192',
    source: 'IFOOD',
    customerName: 'Mariana Duarte',
    customerPhone: '11991112233',
    street: 'Rua Maciel Monteiro',
    number: '420',
    neighborhood: 'Artur Alvim',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '03566-000',
    destinationLat: -23.541,
    destinationLng: -46.485,
    distanceKm: 3.4,
    durationMinutes: 9,
    feeAmount: 9.0,
    isManualOverride: false,
    status: 'DELIVERED',
    isFeePayable: true,
    courierId: 'courier_1',
    subtotal: 78.8,
    customerDeliveryFee: 7.99,
    discountAmount: 10.0,
    orderTotal: 76.79,
    paymentMethod: 'ONLINE',
    customerNotes: 'Apartamento 42, Bloco C. Deixar na portaria com o porteiro.',
    items: [
      {
        name: 'Smash Burger Duplo Cheddar & Bacon',
        quantity: 1,
        unitPrice: 38.9,
        totalPrice: 38.9,
        options: ['Ponto: Ao Ponto', 'Pão Brioche Selado', '+ Bacon Artesanal Crocante'],
        notes: 'Sem cebola crua',
      },
      {
        name: 'Batata Rústica com Alecrim e Páprica',
        quantity: 1,
        unitPrice: 19.9,
        totalPrice: 19.9,
        options: ['Molho: Maionese Verde da Casa'],
      },
      {
        name: 'Refrigerante Lata 350ml',
        quantity: 2,
        unitPrice: 10.0,
        totalPrice: 20.0,
        options: ['1x Coca-Cola Zero', '1x Guaraná Antarctica'],
      },
    ],
    itemsSummary: '1x Smash Duplo Cheddar + 1x Batata Rústica + 2x Refrigerante',
    dispatchedAt: daysAgo(3, 4),
    deliveredAt: daysAgo(3, 3),
    createdAt: daysAgo(3, 4),
    updatedAt: daysAgo(3, 3),
  },
  {
    id: 'del_202',
    orderNumber: 'KEETA-810',
    source: 'KEETA',
    customerName: 'Rodrigo Pires',
    customerPhone: '11992223344',
    street: 'Rua Itinguçu',
    number: '1250',
    neighborhood: 'Vila Ré',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '03658-001',
    destinationLat: -23.524,
    destinationLng: -46.502,
    distanceKm: 2.2,
    durationMinutes: 7,
    feeAmount: 6.0,
    isManualOverride: false,
    status: 'DELIVERED',
    isFeePayable: true,
    courierId: 'courier_1',
    subtotal: 44.9,
    customerDeliveryFee: 5.0,
    discountAmount: 5.0,
    orderTotal: 44.9,
    paymentMethod: 'ONLINE',
    customerNotes: 'Casa 2 no fundo, interfone com defeito, chamar no portão.',
    items: [
      {
        name: 'Classic Smash Cheese Salada',
        quantity: 1,
        unitPrice: 28.9,
        totalPrice: 28.9,
        options: ['Pão Australiano', 'Queijo Prato Especial'],
      },
      {
        name: 'Batata Palito Individual',
        quantity: 1,
        unitPrice: 16.0,
        totalPrice: 16.0,
      },
    ],
    itemsSummary: '1x Classic Smash Cheese + 1x Batata Palito',
    dispatchedAt: daysAgo(2, 5),
    deliveredAt: daysAgo(2, 4),
    createdAt: daysAgo(2, 5),
    updatedAt: daysAgo(2, 4),
  },
  {
    id: 'del_203',
    orderNumber: '99-5231',
    source: '99FOOD',
    customerName: 'Beatriz Fonseca',
    customerPhone: '11993334455',
    street: 'Rua Padre Adelino',
    number: '1800',
    neighborhood: 'Tatuapé',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '03303-000',
    destinationLat: -23.545,
    destinationLng: -46.578,
    distanceKm: 6.8,
    durationMinutes: 19,
    feeAmount: 13.0,
    isManualOverride: false,
    status: 'DELIVERED',
    isFeePayable: true,
    courierId: 'courier_2',
    subtotal: 62.0,
    customerDeliveryFee: 8.0,
    discountAmount: 0.0,
    orderTotal: 70.0,
    paymentMethod: 'CARD',
    items: [
      {
        name: 'Monster Burger Triplo Blend 240g',
        quantity: 1,
        unitPrice: 42.0,
        totalPrice: 42.0,
        options: ['Ponto da Carne: Ao Ponto', '+ Queijo Cheddar Inglês (R$ 4,00)'],
      },
      {
        name: 'Onion Rings Crocantes com Barbecue',
        quantity: 1,
        unitPrice: 20.0,
        totalPrice: 20.0,
        options: ['Molho Barbecue Artesanal Incluso'],
      },
    ],
    itemsSummary: '1x Monster Burger Triplo + 1x Onion Rings',
    dispatchedAt: daysAgo(2, 3),
    deliveredAt: daysAgo(2, 2),
    createdAt: daysAgo(2, 3),
    updatedAt: daysAgo(2, 2),
  },
  {
    id: 'del_204',
    orderNumber: 'IFOOD-7714',
    source: 'IFOOD',
    customerName: 'André Guimarães',
    customerPhone: '11994445566',
    street: 'Av. Waldemar Carlos Pereira',
    number: '780',
    neighborhood: 'Vila Matilde',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '03533-001',
    destinationLat: -23.538,
    destinationLng: -46.529,
    distanceKm: 1.9,
    durationMinutes: 6,
    feeAmount: 6.0,
    isManualOverride: false,
    status: 'CANCELED_AFTER_DELIVERY',
    cancellationStage: 'AFTER_DELIVERY',
    cancellationReason: 'Cliente recusou pedido na porta (lanche errado pelo app). Viagem concluída pelo motoboy.',
    isFeePayable: true,
    courierId: 'courier_2',
    subtotal: 54.0,
    customerDeliveryFee: 6.0,
    discountAmount: 0.0,
    orderTotal: 60.0,
    paymentMethod: 'ONLINE',
    items: [
      {
        name: 'Smash Burger Bacon Melt',
        quantity: 1,
        unitPrice: 35.0,
        totalPrice: 35.0,
        options: ['Ponto: Bem Passado'],
      },
      {
        name: 'Suco Natural Laranja 500ml',
        quantity: 1,
        unitPrice: 10.0,
        totalPrice: 10.0,
      },
      {
        name: 'Pudim de Leite Condensado Artesanal',
        quantity: 1,
        unitPrice: 9.0,
        totalPrice: 9.0,
      },
    ],
    itemsSummary: '1x Smash Bacon Melt + 1x Suco Laranja + 1x Pudim',
    dispatchedAt: daysAgo(1, 6),
    deliveredAt: daysAgo(1, 5),
    canceledAt: daysAgo(1, 5),
    createdAt: daysAgo(1, 6),
    updatedAt: daysAgo(1, 5),
  },
  {
    id: 'del_205',
    orderNumber: 'KEETA-905',
    source: 'KEETA',
    customerName: 'Carla Vasconcelos',
    customerPhone: '11995556677',
    street: 'Av. Amador Bueno da Veiga',
    number: '2100',
    neighborhood: 'Penha',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '03636-100',
    destinationLat: -23.518,
    destinationLng: -46.528,
    distanceKm: 4.5,
    durationMinutes: 13,
    feeAmount: 9.0,
    isManualOverride: false,
    status: 'CANCELED_BEFORE_DELIVERY',
    cancellationStage: 'BEFORE_DELIVERY',
    cancellationReason: 'Cliente cancelou pelo iFood antes da moto sair do balcão. Sem deslocamento.',
    isFeePayable: false,
    courierId: 'courier_1',
    subtotal: 46.0,
    customerDeliveryFee: 6.0,
    discountAmount: 0.0,
    orderTotal: 52.0,
    paymentMethod: 'ONLINE',
    items: [
      {
        name: 'Combo Smash Individual',
        quantity: 1,
        unitPrice: 46.0,
        totalPrice: 46.0,
        options: ['Smash Burger Clássico', 'Fritas Pequena', 'Coca-Cola 350ml'],
      },
    ],
    itemsSummary: '1x Combo Smash Individual',
    canceledAt: daysAgo(1, 3),
    createdAt: daysAgo(1, 3),
    updatedAt: daysAgo(1, 3),
  },
  {
    id: 'del_206',
    orderNumber: '99-8820',
    source: '99FOOD',
    customerName: 'Thiago Nogueira',
    customerPhone: '11996667788',
    street: 'Rua Serra de Bragança',
    number: '1120',
    neighborhood: 'Vila Gomes Cardim',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '03318-000',
    destinationLat: -23.541,
    destinationLng: -46.561,
    distanceKm: 5.4,
    durationMinutes: 15,
    feeAmount: 13.0,
    isManualOverride: false,
    status: 'DELIVERED',
    isFeePayable: true,
    courierId: 'courier_3',
    subtotal: 92.0,
    customerDeliveryFee: 9.0,
    discountAmount: 10.0,
    orderTotal: 91.0,
    paymentMethod: 'ONLINE',
    customerNotes: 'Por favor, não tocar a campainha, bebê dormindo. Chamar no interfone 11.',
    items: [
      {
        name: 'Combo Duplo Burger Família',
        quantity: 1,
        unitPrice: 76.0,
        totalPrice: 76.0,
        options: ['1x Smash Salad', '1x Smash Bacon', '1x Batata Rústica Grande'],
      },
      {
        name: 'Mini Coxinhas de Frango c/ Catupiry (8 un)',
        quantity: 1,
        unitPrice: 16.0,
        totalPrice: 16.0,
      },
    ],
    itemsSummary: '1x Combo Duplo Burger + 1x Mini Coxinhas',
    dispatchedAt: daysAgo(0, 4),
    deliveredAt: daysAgo(0, 3),
    createdAt: daysAgo(0, 4),
    updatedAt: daysAgo(0, 3),
  },
  {
    id: 'del_207',
    orderNumber: 'IFOOD-9102',
    source: 'IFOOD',
    customerName: 'Camila Morais',
    customerPhone: '11997778899',
    street: 'Rua Astorga',
    number: '310',
    neighborhood: 'Vila Guilhermina',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '03542-000',
    destinationLat: -23.535,
    destinationLng: -46.517,
    distanceKm: 0.9,
    durationMinutes: 4,
    feeAmount: 6.0,
    isManualOverride: false,
    status: 'IN_TRANSIT',
    isFeePayable: true,
    courierId: 'courier_1',
    subtotal: 39.9,
    customerDeliveryFee: 6.0,
    discountAmount: 0.0,
    orderTotal: 45.9,
    paymentMethod: 'ONLINE',
    customerNotes: 'Portaria principal do condomínio.',
    items: [
      {
        name: 'Smash Gorgonzola & Cebola Caramelizada',
        quantity: 1,
        unitPrice: 39.9,
        totalPrice: 39.9,
        options: ['Pão Brioche', 'Queijo Gorgonzola Cremoso', 'Cebola Caramelizada'],
        notes: 'Caprichar no molho especial',
      },
    ],
    itemsSummary: '1x Smash Gorgonzola & Cebola Caramelizada',
    dispatchedAt: daysAgo(0, 1),
    createdAt: daysAgo(0, 1),
    updatedAt: daysAgo(0, 1),
  },
  {
    id: 'del_208',
    orderNumber: 'BALCAO-304',
    source: 'BALCAO',
    customerName: 'Eduardo Ramos',
    customerPhone: '11998889900',
    street: 'Rua Toledo Barbosa',
    number: '450',
    neighborhood: 'Belenzinho',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '03061-000',
    destinationLat: -23.539,
    destinationLng: -46.592,
    distanceKm: 8.2,
    durationMinutes: 22,
    feeAmount: 18.0,
    isManualOverride: false,
    status: 'PENDING',
    isFeePayable: true,
    courierId: 'courier_2',
    subtotal: 82.0,
    customerDeliveryFee: 6.0,
    discountAmount: 0.0,
    orderTotal: 88.0,
    paymentMethod: 'PIX',
    customerNotes: 'Pedido via WhatsApp. Cliente pagará via PIX na maquininha ou chave PIX.',
    items: [
      {
        name: 'X-Tudo Artesanal Especial 180g',
        quantity: 2,
        unitPrice: 35.0,
        totalPrice: 70.0,
        options: ['Ovo estalado', 'Bacon crocante', 'Queijo mussarela derretido'],
      },
      {
        name: 'Refrigerante Guaraná Antarctica 2 Litros',
        quantity: 1,
        unitPrice: 12.0,
        totalPrice: 12.0,
      },
    ],
    itemsSummary: '2x X-Tudo Artesanal + 1x Guaraná 2L',
    createdAt: daysAgo(0, 0),
    updatedAt: daysAgo(0, 0),
  },
];

// Carregamento e sincronização com LocalStorage
export function loadStoreConfig(): StoreConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STORE_CONFIG);
    if (!raw) return DEFAULT_STORE_CONFIG;
    const parsed = JSON.parse(raw);
    // Assegura que o endereço de R. Dr. Fábio Montenegro prevaleça
    if (!parsed.street?.includes('Fábio Montenegro')) {
      return DEFAULT_STORE_CONFIG;
    }
    return parsed;
  } catch {
    return DEFAULT_STORE_CONFIG;
  }
}

export function saveStoreConfig(config: StoreConfig): void {
  localStorage.setItem(STORAGE_KEYS.STORE_CONFIG, JSON.stringify(config));
}

export function loadRateRanges(): DeliveryRateRange[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RATE_RANGES);
    return raw ? JSON.parse(raw) : DEFAULT_RATE_RANGES;
  } catch {
    return DEFAULT_RATE_RANGES;
  }
}

export function saveRateRanges(ranges: DeliveryRateRange[]): void {
  localStorage.setItem(STORAGE_KEYS.RATE_RANGES, JSON.stringify(ranges));
}

export function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: User[] = raw ? JSON.parse(raw) : DEFAULT_USERS;
    let hasChanges = false;

    const mapped = users.map((u) => {
      if (u.role === 'COURIER') {
        const defaultMatch = DEFAULT_USERS.find((d) => d.id === u.id);
        const resolvedPin =
          u.activePin ||
          u.authPin2FA ||
          defaultMatch?.activePin ||
          defaultMatch?.authPin2FA ||
          '123456';

        const resolvedToken =
          u.accessToken ||
          defaultMatch?.accessToken ||
          `mb_${u.id}`;

        if (
          u.activePin !== resolvedPin ||
          u.authPin2FA !== resolvedPin ||
          u.accessToken !== resolvedToken
        ) {
          hasChanges = true;
        }

        return {
          ...u,
          accessToken: resolvedToken,
          activePin: resolvedPin,
          authPin2FA: resolvedPin,
        };
      }
      return u;
    });

    if (hasChanges && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mapped));
      } catch (e) {
        console.error(e);
      }
    }

    return mapped;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function loadDeliveries(): Delivery[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELIVERIES);
    const parsed: Delivery[] = raw ? JSON.parse(raw) : DEFAULT_DELIVERIES;

    // Garante que todo pedido carregado tenha itens detalhados discriminados para impressão
    return parsed.map((d) => {
      if (d.items && d.items.length > 0) return d;
      const defaultItem = DEFAULT_DELIVERIES.find((def) => def.id === d.id);
      if (defaultItem?.items && defaultItem.items.length > 0) {
        return {
          ...d,
          items: defaultItem.items,
          subtotal: defaultItem.subtotal ?? d.subtotal,
          customerDeliveryFee: defaultItem.customerDeliveryFee ?? d.customerDeliveryFee,
          discountAmount: defaultItem.discountAmount ?? d.discountAmount,
          orderTotal: defaultItem.orderTotal ?? d.orderTotal,
          paymentMethod: defaultItem.paymentMethod ?? d.paymentMethod,
          customerNotes: defaultItem.customerNotes ?? d.customerNotes,
        };
      }
      return {
        ...d,
        items: [
          {
            name: d.itemsSummary || '1x Combo Smash Artesanal Especial',
            quantity: 1,
            unitPrice: d.orderTotal ? Math.max(0, d.orderTotal - d.feeAmount) : 38.0,
            totalPrice: d.orderTotal ? Math.max(0, d.orderTotal - d.feeAmount) : 38.0,
            options: ['Pão Brioche Selado', 'Ponto da Carne: Ao Ponto'],
          },
        ],
        subtotal: d.orderTotal ? Math.max(0, d.orderTotal - 6.0) : 38.0,
        customerDeliveryFee: 6.0,
        discountAmount: 0,
        orderTotal: d.orderTotal || 44.0,
        paymentMethod: d.paymentMethod || 'ONLINE',
      };
    });
  } catch {
    return DEFAULT_DELIVERIES;
  }
}

export function saveDeliveries(deliveries: Delivery[]): void {
  localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
}

export function loadSettlements(): WeeklySettlement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTLEMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSettlements(settlements: WeeklySettlement[]): void {
  localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
}

export function loadAddressCache(): AddressCacheItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADDRESS_CACHE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAddressCache(cache: AddressCacheItem[]): void {
  localStorage.setItem(STORAGE_KEYS.ADDRESS_CACHE, JSON.stringify(cache));
}

export function loadWebhookLogs(): WebhookLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEBHOOK_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWebhookLogs(logs: WebhookLogItem[]): void {
  localStorage.setItem(STORAGE_KEYS.WEBHOOK_LOGS, JSON.stringify(logs));
}

export const DEFAULT_PLATFORM_CONFIG: PlatformApiConfig = {
  ifood: {
    clientId: '',
    clientSecret: '',
    merchantId: '',
    webhookSecret: '',
    environment: 'production',
    status: 'disconnected',
  },
  food99: {
    appKey: '',
    appSecret: '',
    storeId: '',
    environment: 'production',
    status: 'disconnected',
  },
  keeta: {
    partnerId: '',
    apiKey: '',
    storeCode: '',
    environment: 'production',
    status: 'disconnected',
  },
  localPdv: {
    systemName: 'Sistema Local / PDV',
    apiKey: 'hbg_secret_token_123',
    webhookSecret: '',
    status: 'connected',
  },
  whatsapp: {
    serverUrl: 'https://api.evolution-whatsapp.local',
    apiKey: '',
    instanceName: 'balcao-entregas',
    notifyOnDispatch: true,
    status: 'disconnected',
  },
};

export function loadPlatformConfig(): PlatformApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLATFORM_CONFIG);
    if (!raw) return DEFAULT_PLATFORM_CONFIG;
    return { ...DEFAULT_PLATFORM_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PLATFORM_CONFIG;
  }
}

export function savePlatformConfig(config: PlatformApiConfig): void {
  localStorage.setItem(STORAGE_KEYS.PLATFORM_CONFIG, JSON.stringify(config));
}

export const DEFAULT_PRINTER_SETTINGS: ThermalPrinterSettings = {
  paperWidth: '80mm',
  customWidthMm: 80,
  printerModel: 'Epson TM-T20X / Bematech MP-4200 (80mm)',
  fontSize: 'standard',
  feedLines: 3,
  autoPrintOnNewOrder: false,
  showStoreHeader: true,
  showCourierSection: true,
  showCustomerNotes: true,
  customHeaderNote: 'Obrigado pela preferência! Bom apetite.',
  customFooterNote: 'EntregueJá · Controle e Expedição de Pedidos',
};

export function loadPrinterSettings(): ThermalPrinterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRINTER_SETTINGS);
    if (!raw) return DEFAULT_PRINTER_SETTINGS;
    return { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRINTER_SETTINGS;
  }
}

export function savePrinterSettings(settings: ThermalPrinterSettings): void {
  localStorage.setItem(STORAGE_KEYS.PRINTER_SETTINGS, JSON.stringify(settings));
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  balcaoPin: '1234',
  adminPin: '9876',
};

export function loadSecuritySettings(): SecuritySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECURITY_SETTINGS);
    if (!raw) return DEFAULT_SECURITY_SETTINGS;
    return { ...DEFAULT_SECURITY_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SECURITY_SETTINGS;
  }
}

export function saveSecuritySettings(settings: SecuritySettings): void {
  localStorage.setItem(STORAGE_KEYS.SECURITY_SETTINGS, JSON.stringify(settings));
}

export function loadActiveAuthSession(): AuthSessionRole {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_AUTH_SESSION);
    if (raw === 'BALCAO' || raw === 'ADMIN') return raw;
    return 'ADMIN'; // Padrão inicial
  } catch {
    return 'ADMIN';
  }
}

export function saveActiveAuthSession(role: AuthSessionRole | null): void {
  if (role) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_AUTH_SESSION, role);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_AUTH_SESSION);
  }
}

// ==========================================
// MÓDULO MULTI-TENANT SAAS ("EntregueJá")
// ==========================================

// ==========================================
// MÓDULO MULTI-TENANT SAAS ("EntregueJá")
// ==========================================

export const INITIAL_TENANTS: TenantStore[] = [
  {
    id: 'store_hardbeerburguer',
    slug: 'hardbeerburguer',
    name: 'Hard Beer Burguer',
    segment: 'BURGER',
    status: 'ACTIVE',
    plan: 'PRO',
    ownerName: 'Ricardo Mendonça',
    ownerPhone: '11988887777',
    ownerEmail: 'ricardo@hardbeerburguer.com.br',
    originAddress: 'R. Dr. Fábio Montenegro, 32 - Vila Guilhermina, São Paulo - SP',
    originLat: -23.5334,
    originLng: -46.5153,
    calculationMode: 'KM_DRIVEN',
    defaultBaseFee: 6.0,
    defaultKmRate: 1.5,
    storePin: '1234',
    adminPin: '9876',
    createdAt: '2026-01-15T10:00:00Z',
  },
];

const TENANTS_STORAGE_KEY = 'entregueja_tenants_registry';
const DEV_CREDENTIALS_KEY = 'entregueja_dev_credentials';

export const DEFAULT_DEV_CREDENTIALS = {
  email: 'kelvinleardini@gmail.com',
  password: 'DevMaster@2026',
};

export function loadDevCredentials(): { email: string; password: string } {
  try {
    const raw = localStorage.getItem(DEV_CREDENTIALS_KEY);
    if (!raw) return DEFAULT_DEV_CREDENTIALS;
    return { ...DEFAULT_DEV_CREDENTIALS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DEV_CREDENTIALS;
  }
}

export function saveDevCredentials(email: string, password: string): void {
  localStorage.setItem(DEV_CREDENTIALS_KEY, JSON.stringify({ email, password }));
}

export function verifyDevCredentials(email: string, password: string): boolean {
  const creds = loadDevCredentials();
  return (
    email.trim().toLowerCase() === creds.email.trim().toLowerCase() &&
    password.trim() === creds.password.trim()
  );
}

export function loadTenants(): TenantStore[] {
  try {
    const raw = localStorage.getItem(TENANTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(INITIAL_TENANTS));
      return INITIAL_TENANTS;
    }
    const parsed: TenantStore[] = JSON.parse(raw);
    // Remove Phyto se ainda existir no localStorage do navegador do usuário
    const sanitized = parsed.filter((t) => t.slug !== 'phyto-formula');
    
    // Garantir que a Hard Beer Burguer sempre exista
    if (!sanitized.some((t) => t.slug === 'hardbeerburguer')) {
      sanitized.unshift(INITIAL_TENANTS[0]);
    }
    
    if (sanitized.length !== parsed.length) {
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch {
    return INITIAL_TENANTS;
  }
}

export function saveTenants(tenants: TenantStore[]): void {
  localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
}

export function getTenantBySlug(slug: string): TenantStore | undefined {
  const tenants = loadTenants();
  return tenants.find((t) => t.slug.toLowerCase() === slug.toLowerCase());
}

export function createTenant(newTenant: TenantStore): void {
  const current = loadTenants();
  const exists = current.some((t) => t.slug.toLowerCase() === newTenant.slug.toLowerCase());
  if (exists) {
    throw new Error('Já existe um comércio com esse link exclusivo.');
  }
  const updated = [...current, newTenant];
  saveTenants(updated);
}

export function deleteTenant(slug: string): void {
  const current = loadTenants();
  const updated = current.filter((t) => t.slug.toLowerCase() !== slug.toLowerCase());
  saveTenants(updated);
  
  // Limpeza profunda em cascata de todos os dados associados à loja
  try {
    const s = slug.toLowerCase();
    localStorage.removeItem(`tenant_${s}_deliveries`);
    localStorage.removeItem(`tenant_${s}_users`);
    localStorage.removeItem(`tenant_${s}_config`);
    localStorage.removeItem(`tenant_${s}_rates`);
    localStorage.removeItem(`tenant_${s}_settlements`);
    localStorage.removeItem(`tenant_${s}_address_cache`);
    localStorage.removeItem(`tenant_${s}_webhook_logs`);
    localStorage.removeItem(`tenant_${s}_active_auth_session`);
  } catch (e) {
    console.error('[deleteTenant cascade error]:', e);
  }
}

export function getTenantStats(slug: string): { couriersCount: number; ordersCount: number; totalVolume: number } {
  try {
    const data = loadTenantScopedData(slug);
    const couriersCount = data.users.filter((u: User) => u.role === 'COURIER').length;
    const ordersCount = data.deliveries.length;
    const totalVolume = data.deliveries.reduce((acc: number, curr: Delivery) => acc + (curr.feeAmount || 0), 0);
    return { couriersCount, ordersCount, totalVolume };
  } catch {
    return { couriersCount: 0, ordersCount: 0, totalVolume: 0 };
  }
}

// Carregadores isolados por tenant
export function loadTenantScopedData(slug: string): {
  config: StoreConfig;
  users: User[];
  deliveries: Delivery[];
  rateRanges: DeliveryRateRange[];
} {
  const prefix = `tenant_${slug.toLowerCase()}_`;
  const rawUsers = localStorage.getItem(prefix + 'users');
  const rawDeliveries = localStorage.getItem(prefix + 'deliveries');
  const rawRates = localStorage.getItem(prefix + 'rates');
  const rawConfig = localStorage.getItem(prefix + 'config');

  if (slug.toLowerCase() === 'hardbeerburguer') {
    // Para a Hard Beer Burguer: limpa dados de teste acumulados caso o usuário queira uma base limpa
    const cleanConfig: StoreConfig = {
      id: 'store_hardbeerburguer',
      storeName: 'Hard Beer Burguer',
      street: 'R. Dr. Fábio Montenegro',
      number: '32',
      neighborhood: 'Vila Guilhermina',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '03544-040',
      latitude: -23.5334,
      longitude: -46.5153,
      fallbackRate: 6.0,
      extraKmRate: 1.5,
      maxDistanceKm: 25.0,
    };

    return {
      config: rawConfig ? JSON.parse(rawConfig) : cleanConfig,
      users: rawUsers ? JSON.parse(rawUsers) : DEFAULT_USERS,
      deliveries: rawDeliveries ? JSON.parse(rawDeliveries) : DEFAULT_DELIVERIES,
      rateRanges: rawRates ? JSON.parse(rawRates) : DEFAULT_RATE_RANGES,
    };
  }

  return {
    config: rawConfig ? JSON.parse(rawConfig) : loadStoreConfig(),
    users: rawUsers ? JSON.parse(rawUsers) : DEFAULT_USERS,
    deliveries: rawDeliveries ? JSON.parse(rawDeliveries) : loadDeliveries(),
    rateRanges: rawRates ? JSON.parse(rawRates) : loadRateRanges(),
  };
}

export function saveTenantScopedDeliveries(slug: string, deliveries: Delivery[]) {
  localStorage.setItem(`tenant_${slug.toLowerCase()}_deliveries`, JSON.stringify(deliveries));
  syncTenantToServer(slug, undefined, undefined, deliveries);
}

export function saveTenantScopedUsers(slug: string, users: User[]) {
  localStorage.setItem(`tenant_${slug.toLowerCase()}_users`, JSON.stringify(users));
  syncTenantToServer(slug, undefined, users);
}

export function saveTenantScopedConfig(slug: string, config: StoreConfig) {
  localStorage.setItem(`tenant_${slug.toLowerCase()}_config`, JSON.stringify(config));
  syncTenantToServer(slug, config);
}

export function saveTenantScopedRates(slug: string, rates: DeliveryRateRange[]) {
  localStorage.setItem(`tenant_${slug.toLowerCase()}_rates`, JSON.stringify(rates));
}

export function syncTenantToServer(slug: string, config?: StoreConfig, users?: User[], deliveries?: Delivery[], rateRanges?: DeliveryRateRange[]) {
  if (typeof window === 'undefined') return;
  try {
    const scoped = loadTenantScopedData(slug);
    fetch(`/api/sync/${slug.toLowerCase()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: config || scoped.config,
        users: users || scoped.users,
        deliveries: deliveries || scoped.deliveries,
        rateRanges: rateRanges || scoped.rateRanges,
      }),
    }).catch(() => {});
  } catch (e) {
    // Ignore network errors in local/offline mode
  }
}

export async function fetchCourierFromServer(token: string): Promise<{ courier: User; tenantSlug?: string; deliveries: Delivery[] } | null> {
  if (typeof window === 'undefined' || !token) return null;
  try {
    const res = await fetch(`/api/couriers/${encodeURIComponent(token.trim())}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.courier) {
        const slug = data.tenantSlug || 'hardbeerburguer';
        const existingUsers = loadTenantScopedData(slug).users;
        const exists = existingUsers.some((u: User) => u.id === data.courier.id);
        const updatedUsers = exists
          ? existingUsers.map((u: User) => (u.id === data.courier.id ? data.courier : u))
          : [...existingUsers, data.courier];
        try {
          localStorage.setItem(`tenant_${slug.toLowerCase()}_users`, JSON.stringify(updatedUsers));
        } catch (e) {}
        return {
          courier: data.courier,
          tenantSlug: data.tenantSlug,
          deliveries: data.deliveries || [],
        };
      }
    }
  } catch (e) {
    // Network error
  }

  return null;
}

export function findCourierAcrossAllSources(tokenOrId: string): { courier: User; tenantSlug?: string; deliveries: Delivery[] } | null {
  if (!tokenOrId) return null;
  const clean = tokenOrId.trim();

  const tenants = loadTenants();
  for (const tenant of tenants) {
    try {
      const scoped = loadTenantScopedData(tenant.slug);
      const found = scoped.users.find(
        (u) => u.accessToken === clean || u.id === clean
      );
      if (found) {
        return {
          courier: found,
          tenantSlug: tenant.slug,
          deliveries: scoped.deliveries,
        };
      }
    } catch (e) {
      console.error(e);
    }
  }

  const globalUsers = loadUsers();
  const globalFound = globalUsers.find(
    (u) => u.accessToken === clean || u.id === clean
  );
  if (globalFound) {
    return {
      courier: globalFound,
      deliveries: loadDeliveries(),
    };
  }

  const defaultFound = DEFAULT_USERS.find(
    (u) => u.accessToken === clean || u.id === clean
  );
  if (defaultFound) {
    return {
      courier: defaultFound,
      deliveries: DEFAULT_DELIVERIES,
    };
  }

  // 4. Procurar nos couriers do ambiente Demo
  try {
    const rawDemo = typeof window !== 'undefined' ? localStorage.getItem('tenant_demo_users') : null;
    const demoUsers: User[] = rawDemo ? JSON.parse(rawDemo) : DEMO_INITIAL_COURIERS;
    const demoMatch = demoUsers.find(
      (u) => u.accessToken === clean || u.id === clean
    );
    if (demoMatch) {
      const rawDemoDel = typeof window !== 'undefined' ? localStorage.getItem('tenant_demo_deliveries') : null;
      const demoDeliveries: Delivery[] = rawDemoDel ? JSON.parse(rawDemoDel) : [];
      return {
        courier: demoMatch,
        tenantSlug: 'demo',
        deliveries: demoDeliveries,
      };
    }
  } catch (e) {
    console.error(e);
  }

  return null;
}

export function getLatestCourier(courierId: string, accessToken?: string): User | null {
  const tenants = loadTenants();
  for (const tenant of tenants) {
    try {
      const raw = localStorage.getItem(`tenant_${tenant.slug.toLowerCase()}_users`);
      if (raw) {
        const users: User[] = JSON.parse(raw);
        const match = users.find(
          (u) => u.id === courierId || (accessToken && u.accessToken === accessToken)
        );
        if (match) return match;
      }
    } catch (e) {
      console.error(e);
    }
  }

  const globalUsers = loadUsers();
  const globalMatch = globalUsers.find(
    (u) => u.id === courierId || (accessToken && u.accessToken === accessToken)
  );
  if (globalMatch) return globalMatch;

  // Checa nos couriers Demo
  try {
    const rawDemo = typeof window !== 'undefined' ? localStorage.getItem('tenant_demo_users') : null;
    const demoUsers: User[] = rawDemo ? JSON.parse(rawDemo) : DEMO_INITIAL_COURIERS;
    const demoMatch = demoUsers.find(
      (u) => u.id === courierId || (accessToken && u.accessToken === accessToken)
    );
    if (demoMatch) return demoMatch;
  } catch (e) {}

  return (
    DEFAULT_USERS.find(
      (u) => u.id === courierId || (accessToken && u.accessToken === accessToken)
    ) || null
  );
}


