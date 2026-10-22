import {
  Delivery,
  User,
  StoreConfig,
  DeliveryRateRange,
  AddressCacheItem,
  WebhookOrderPayload,
  WebhookLogItem,
  CancellationStage,
} from '../types';
import { geocodeAddress, normalizeAddressQuery } from './nominatim';
import { calculateDrivingRoute } from './osrm';
import { calculateDeliveryFee } from './feeCalculator';

export interface IngestionResult {
  success: boolean;
  delivery?: Delivery;
  log: WebhookLogItem;
}

/**
 * Mapeia o identificador enviado pelo sistema da hamburgueria (nome, placa, telefone ou ID)
 * para um dos motoboys cadastrados no nosso sistema.
 */
export function matchCourier(identifier: string | undefined, couriers: User[]): User | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();

  // 1. Busca exata por ID
  const byId = couriers.find((c) => c.id.toLowerCase() === clean);
  if (byId) return byId;

  // 2. Busca por placa
  const byPlate = couriers.find(
    (c) => c.vehiclePlate && c.vehiclePlate.toLowerCase().replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, '')
  );
  if (byPlate) return byPlate;

  // 3. Busca por telefone
  const byPhone = couriers.find(
    (c) => c.phone.replace(/\D/g, '') === clean.replace(/\D/g, '')
  );
  if (byPhone) return byPhone;

  // 4. Busca por nome / apelido aproximado
  const byName = couriers.find((c) => {
    const cName = c.name.toLowerCase();
    return cName.includes(clean) || clean.includes(cName);
  });
  if (byName) return byName;

  return undefined;
}

/**
 * Processa a ingestão automática de um pedido vindo de API externa (iFood, Keeta, 99Food ou PDV local)
 * sem necessidade de digitação humana no balcão.
 */
export async function processWebhookOrder(
  payload: WebhookOrderPayload,
  storeConfig: StoreConfig,
  rateRanges: DeliveryRateRange[],
  couriers: User[],
  addressCache: AddressCacheItem[],
  onUpdateCache: (item: AddressCacheItem) => void
): Promise<IngestionResult> {
  const { orderNumber, source, customer, deliveryAddress, courierIdentifier } = payload;
  const street = deliveryAddress.street.trim();
  const number = deliveryAddress.number.trim();
  const neighborhood = deliveryAddress.neighborhood.trim();
  const city = deliveryAddress.city?.trim() || storeConfig.city;
  const state = deliveryAddress.state?.trim() || storeConfig.state;

  const matchedCourier = matchCourier(courierIdentifier, couriers);

  // 1. Normalização e Verificação de Cache
  const normalized = normalizeAddressQuery({
    street,
    number,
    neighborhood,
    city,
    state,
  });

  let distanceKm = 0;
  let durationMinutes = 0;
  let geoLat = 0;
  let geoLng = 0;

  const cached = addressCache.find((c) => c.normalizedQuery === normalized);

  if (cached) {
    distanceKm = cached.distanceKm;
    durationMinutes = cached.durationMinutes;
    geoLat = cached.latitude;
    geoLng = cached.longitude;
  } else {
    // 2. Geocodificação a partir da hamburgueria (R. Dr. Fábio Montenegro, 32 - Vila Guilhermina)
    const geoPoint = await geocodeAddress({
      street,
      number,
      neighborhood,
      city,
      state,
    });

    if (geoPoint) {
      geoLat = geoPoint.latitude;
      geoLng = geoPoint.longitude;

      // 3. Rota viária OSRM
      const route = await calculateDrivingRoute(
        { latitude: storeConfig.latitude, longitude: storeConfig.longitude },
        { latitude: geoPoint.latitude, longitude: geoPoint.longitude }
      );

      distanceKm = route.distanceKm;
      durationMinutes = route.durationMinutes;

      // Salva no cache
      onUpdateCache({
        id: `cache_${Date.now()}`,
        normalizedQuery: normalized,
        latitude: geoLat,
        longitude: geoLng,
        distanceKm,
        durationMinutes,
        calculatedAt: new Date().toISOString(),
      });
    } else {
      // Fallback em caso de rua nova
      distanceKm = 3.5;
      durationMinutes = 10;
    }
  }

  // 4. Aplica tabela de faixas de KM
  const feeResult = calculateDeliveryFee(
    distanceKm,
    rateRanges,
    storeConfig.fallbackRate,
    storeConfig.extraKmRate
  );

  const newDelivery: Delivery = {
    id: `del_api_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    orderNumber: orderNumber || `API-${Math.floor(Math.random() * 9000 + 1000)}`,
    source: source || 'SISTEMA_LOCAL',
    customerName: customer.name || 'Cliente App',
    customerPhone: customer.phone,
    street,
    number,
    neighborhood,
    complement: deliveryAddress.complement,
    city,
    state,
    postalCode: deliveryAddress.postalCode,
    destinationLat: geoLat,
    destinationLng: geoLng,
    distanceKm,
    durationMinutes,
    feeAmount: feeResult.fee,
    isManualOverride: false,
    status: matchedCourier ? 'IN_TRANSIT' : 'PENDING',
    isFeePayable: true,
    courierId: matchedCourier?.id,
    dispatchedAt: matchedCourier ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const log: WebhookLogItem = {
    id: `log_${Date.now()}`,
    receivedAt: new Date().toISOString(),
    source: payload.source,
    orderNumber: payload.orderNumber,
    courierNameMatched: matchedCourier?.name,
    calculatedDistanceKm: distanceKm,
    calculatedFee: feeResult.fee,
    addressExtracted: `${street}, ${number} - ${neighborhood}, ${city}`,
    status: 'SUCCESS',
    message: matchedCourier
      ? `Distância: ${distanceKm} km · Taxa: R$ ${feeResult.fee.toFixed(2)} · Atribuído a: ${matchedCourier.name}`
      : `Distância: ${distanceKm} km · Taxa: R$ ${feeResult.fee.toFixed(2)} · Aguardando motoboy no balcão`,
  };

  return {
    success: true,
    delivery: newDelivery,
    log,
  };
}

/**
 * Aplica cancelamento discriminando se ocorreu ANTES ou DEPOIS da entrega
 */
export function applyCancellation(
  delivery: Delivery,
  stage: CancellationStage,
  reason: string
): Delivery {
  const isAfter = stage === 'AFTER_DELIVERY';

  return {
    ...delivery,
    status: isAfter ? 'CANCELED_AFTER_DELIVERY' : 'CANCELED_BEFORE_DELIVERY',
    cancellationStage: stage,
    cancellationReason: reason,
    // SE CANCELOU DEPOIS: o motoboy se deslocou, portanto a taxa é PAGA a ele (isFeePayable = true)
    // SE CANCELOU ANTES: a moto não fez a viagem, portanto NÃO recebe taxa (isFeePayable = false)
    isFeePayable: isAfter,
    canceledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
