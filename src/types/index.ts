export type OrderSource = 'IFOOD' | '99FOOD' | 'KEETA' | 'BALCAO' | 'WHATSAPP';

export type DeliveryStatus =
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELED_BEFORE_DELIVERY'
  | 'CANCELED_AFTER_DELIVERY';

export type CancellationStage = 'BEFORE_DELIVERY' | 'AFTER_DELIVERY';

export type PixKeyType = 'CPF' | 'PHONE' | 'EMAIL' | 'RANDOM';

export type SegmentType =
  | 'BURGER'
  | 'PIZZA'
  | 'JAPANESE'
  | 'PASTA'
  | 'BRAZILIAN'
  | 'ICE_CREAM'
  | 'OTHER';

export type Role = 'ADMIN' | 'OPERATOR' | 'COURIER';

export type AuthSessionRole =
  | 'SUPERADMIN'
  | 'DONO'
  | 'GERENTE'
  | 'OPERADOR'
  | 'COURIER'
  | 'ADMIN'
  | 'BALCAO';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface TenantStore {
  id: string;
  slug: string;
  name: string;
  segment?: string;
  status?: string;
  plan?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  originAddress: string;
  originLat?: number | null;
  originLng?: number | null;
  defaultBaseFee?: number;
  defaultKmRate?: number;
  cnpjCpf?: string;
  calculationMode?: string;
  storePin?: string;
  adminPin?: string;
  trialEndsAt?: string;
  createdAt?: string;
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  billingMethod?: string;
  billingStatus?: string;
}

export interface SecuritySettings {
  allowAutoPrint?: boolean;
  lockdownOnFiveFails?: boolean;
  pinLockoutMinutes?: number;
  balcaoPin?: string;
  adminPin?: string;
}

export interface PlatformApiConfig {
  provider?: 'IFOOD' | '99FOOD' | 'KEETA' | 'WHATSAPP' | string;
  active?: boolean;
  clientId?: string;
  clientSecret?: string;
  merchantId?: string;
  [key: string]: any;
}

export interface WebhookOrderPayload {
  orderNumber: string;
  source: OrderSource;
  orderId?: string;
  customer: {
    name: string;
    phone?: string;
  };
  deliveryAddress: {
    street: string;
    number: string;
    neighborhood: string;
    city?: string;
    state?: string;
    postalCode?: string;
    complement?: string;
  };
  courierIdentifier?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  orderTotal?: number;
}

export interface WebhookLogItem {
  id: string;
  receivedAt?: string;
  source?: string;
  orderNumber?: string;
  courierNameMatched?: string;
  calculatedDistanceKm?: number;
  calculatedFee?: number;
  addressExtracted?: string;
  status: 'SUCCESS' | 'PROCESSED' | 'ERROR' | 'IGNORED';
  message?: string;
  storeSlug?: string;
  platform?: string;
  payload?: any;
  errorMessage?: string;
  createdAt?: string;
}

export interface DeliveryRateRange {
  id: string;
  minDistanceKm: number;
  maxDistanceKm: number;
  feeAmount: number;
  label?: string;
  minKm?: number;
  maxKm?: number;
  feeCents?: number;
  price?: number;
  description?: string;
  isActive?: boolean;
  orderIndex?: number;
}

export interface StoreConfig {
  id?: string;
  storeName: string;
  storeSlug?: string;
  cnpj?: string;
  phone?: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  fallbackRate: number;
  extraKmRate: number;
  maxDistanceKm?: number;
  headerMessage?: string;
  footerMessage?: string;
}

export interface User {
  id: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'OPERATOR' | 'COURIER';
  isActive: boolean;
  vehiclePlate?: string;
  vehicleModel?: string;
  pixKeyType?: PixKeyType;
  pixKey?: string;
  accessToken?: string;
  activePin?: string;
  authPin2FA?: string;
  createdAt?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: string[];
  notes?: string;
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
  distanceKm: number;
  durationMinutes: number;
  feeAmount: number;
  isManualOverride: boolean;
  overrideReason?: string;
  status: DeliveryStatus;
  courierId?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  canceledAt?: string;
  cancellationReason?: string;
  cancellationStage?: CancellationStage;
  isFeePayable: boolean;
  paymentMethod?: 'ONLINE' | 'CARD' | 'CASH' | 'PIX';
  orderTotal?: number;
  subtotal?: number;
  customerDeliveryFee?: number;
  discountAmount?: number;
  items?: OrderItem[];
  itemsSummary?: string;
  createdAt: string;
  updatedAt: string;
  destinationLat?: number;
  destinationLng?: number;
  customerNotes?: string;
}

export interface WeeklySettlement {
  id: string;
  courierId: string;
  courierName: string;
  pixKeyType: PixKeyType;
  pixKey: string;
  periodStart: string;
  periodEnd: string;
  totalDeliveries: number;
  totalFeeAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  netPayableAmount: number;
  status: 'PENDING' | 'PAID';
  paidAt?: string;
  paidByUserId?: string;
  deliveryIds: string[];
  notes?: string;
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

export interface ThermalPrinterSettings {
  paperWidth: '58mm' | '80mm' | 'custom';
  customWidthMm?: number;
  cutBlankLines?: number;
  fontSizeScale?: 'compact' | 'normal' | 'large';
  fontSize?: string;
  feedLines?: number;
  autoPrintOnNewOrder?: boolean;
  autoPrintOnDispatch?: boolean;
  showStoreHeader?: boolean;
  showCourierSection?: boolean;
  showCustomerPhone?: boolean;
  showCustomerNotes?: boolean;
  showItemDetails?: boolean;
  printerModel?: string;
  customHeaderNote?: string;
  customFooterNote?: string;
}
