export type Role = 'ADMIN' | 'COURIER';
export type ThemeMode = 'light' | 'dark';

export type SegmentType = 'BURGER' | 'PIZZERIA' | 'PHARMACY' | 'RESTAURANT' | 'MARKET';

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED';

export interface TenantStore {
  id: string;
  slug: string; // ex: 'hardbeerburguer', 'phyto-formula'
  name: string;
  segment: SegmentType;
  status: TenantStatus;
  plan: 'ESSENCIAL' | 'PRO' | 'ENTERPRISE';
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  calculationMode: 'KM_DRIVEN' | 'RADIAL' | 'FIXED_ZONES';
  defaultBaseFee: number;
  defaultKmRate: number;
  storePin: string; // Padrão '1234' para balcão
  adminPin: string; // Padrão '9876' para gestor
  createdAt: string;
  activeDeliveriesCount?: number;
  activeCouriersCount?: number;
}

export type DeliveryStatus =
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELED_BEFORE_DELIVERY' // Cancelado ANTES do motoboy entregar (taxa NÃO paga)
  | 'CANCELED_AFTER_DELIVERY'; // Cancelado APÓS a entrega / no local (taxa PAGA ao motoboy)

export type OrderSource = 'IFOOD' | 'KEETA' | '99FOOD' | 'BALCAO' | 'SISTEMA_LOCAL';

export type CancellationStage = 'BEFORE_DELIVERY' | 'AFTER_DELIVERY';

export type SettlementStatus = 'OPEN' | 'CLOSED' | 'PAID';

export type PixKeyType = 'CPF' | 'CNPJ' | 'PHONE' | 'EMAIL' | 'RANDOM';

export type AuthSessionRole = 'BALCAO' | 'ADMIN' | 'COURIER_PORTAL';

export interface SecuritySettings {
  balcaoPin: string; // Padrão '1234'
  adminPin: string;  // Padrão '9876'
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  isActive: boolean;
  vehiclePlate?: string;
  vehicleModel?: string;
  pixKeyType?: PixKeyType;
  pixKey?: string;
  accessToken?: string; // Token único seguro para URL exclusiva do motoboy
  activePin?: string;   // Código 2FA de 6 dígitos ativo para validação do motoboy
  authPin2FA?: string;  // Código de 6 dígitos para autenticação em dois fatores (compatibilidade)
  createdAt: string;
}

export interface DeliveryRateRange {
  id: string;
  minKm: number;
  maxKm: number;
  price: number;
  description: string;
  isActive: boolean;
  orderIndex: number;
}

export interface StoreConfig {
  id: string;
  storeName: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode?: string;
  cnpj?: string;
  phone?: string;
  latitude: number;
  longitude: number;
  fallbackRate: number;
  extraKmRate: number;
  maxDistanceKm: number;
}

export interface AddressCacheItem {
  id: string;
  normalizedQuery: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  durationMinutes: number;
  calculatedAt: string;
}

export interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: string[]; // Adicionais e customizações (ex: '+ Bacon Fatiado', 'Ponto: Ao ponto')
  notes?: string;     // Observações específicas do item
}

export interface Delivery {
  id: string;
  orderNumber: string;
  source: OrderSource;
  customerName: string;
  customerPhone?: string;
  street: string;
  number: string;
  neighborhood: string;
  complement?: string;
  city: string;
  state: string;
  postalCode?: string;
  destinationLat?: number;
  destinationLng?: number;
  distanceKm: number;
  durationMinutes: number;
  feeAmount: number;
  isManualOverride: boolean;
  overrideReason?: string;
  status: DeliveryStatus;
  cancellationStage?: CancellationStage;
  cancellationReason?: string;
  isFeePayable: boolean; // Se true, computa na remuneração do motoboy
  courierId?: string;
  settlementId?: string;
  paymentMethod?: 'ONLINE' | 'CARD' | 'CASH' | 'PIX';
  orderTotal?: number;
  subtotal?: number;
  customerDeliveryFee?: number;
  discountAmount?: number;
  customerNotes?: string;
  items?: OrderItem[];
  itemsSummary?: string;
  printedAt?: string;
  routeStopOrder?: number;
  batchRouteId?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookOrderPayload {
  orderNumber: string;
  source: OrderSource;
  courierIdentifier?: string; // Nome, ID ou placa do motoboy
  customer: {
    name: string;
    phone?: string;
  };
  deliveryAddress: {
    street: string;
    number: string;
    neighborhood: string;
    complement?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  status?: 'CREATED' | 'DISPATCHED' | 'DELIVERED';
}

export interface WebhookLogItem {
  id: string;
  receivedAt: string;
  source: OrderSource;
  orderNumber: string;
  courierNameMatched?: string;
  calculatedDistanceKm: number;
  calculatedFee: number;
  addressExtracted: string;
  status: 'SUCCESS' | 'ERROR';
  message: string;
}

export interface WeeklySettlement {
  id: string;
  courierId: string;
  startDate: string;
  endDate: string;
  weekLabel: string;
  totalDeliveries: number;
  totalAmount: number;
  bonusAmount: number;
  discountAmount: number;
  finalPayout: number;
  status: SettlementStatus;
  pixKeySnapshot?: string;
  pixTypeSnapshot?: PixKeyType;
  paidAt?: string;
  paidByUserName?: string;
  notes?: string;
  createdAt: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
  displayName: string;
}

export interface RouteCalculationResult {
  distanceKm: number;
  durationMinutes: number;
  source: 'cache' | 'osrm' | 'fallback';
  geoPoint?: GeoPoint;
}

export interface WhatsAppApiConfig {
  serverUrl: string;
  apiKey: string;
  instanceName: string;
  notifyOnDispatch: boolean;
  status: 'connected' | 'disconnected';
  lastTestedAt?: string;
}

export interface PlatformApiConfig {
  ifood: {
    clientId: string;
    clientSecret: string;
    merchantId: string;
    webhookSecret: string;
    environment: 'sandbox' | 'production';
    status: 'connected' | 'disconnected';
    lastTestedAt?: string;
  };
  food99: {
    appKey: string;
    appSecret: string;
    storeId: string;
    environment: 'sandbox' | 'production';
    status: 'connected' | 'disconnected';
    lastTestedAt?: string;
  };
  keeta: {
    partnerId: string;
    apiKey: string;
    storeCode: string;
    environment: 'sandbox' | 'production';
    status: 'connected' | 'disconnected';
    lastTestedAt?: string;
  };
  whatsapp?: WhatsAppApiConfig;
  localPdv: {
    systemName: string;
    apiKey: string;
    webhookSecret: string;
    status: 'connected' | 'disconnected';
    lastTestedAt?: string;
  };
}

export type ThermalPaperWidth = '58mm' | '72mm' | '80mm' | '112mm' | 'custom';
export type ThermalFontSize = 'compact' | 'standard' | 'large';

export interface ThermalPrinterSettings {
  paperWidth: ThermalPaperWidth;
  customWidthMm: number;
  printerModel: string;
  fontSize: ThermalFontSize;
  feedLines: number;
  autoPrintOnNewOrder: boolean;
  showStoreHeader: boolean;
  showCourierSection: boolean;
  showCustomerNotes: boolean;
  customHeaderNote: string;
  customFooterNote: string;
}
