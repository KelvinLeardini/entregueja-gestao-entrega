export const DELIVERY_STATUSES = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const CANCELLATION_TYPES = ['BEFORE_DEPARTURE', 'ON_SITE'] as const;
export type CancellationType = (typeof CANCELLATION_TYPES)[number];

// Transições permitidas. Estados finais (DELIVERED e CANCELLED) não têm saída.
const TRANSITIONS: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: DeliveryStatus,
    public readonly to: DeliveryStatus,
  ) {
    super(`Transição inválida: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export function canTransition(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: DeliveryStatus, to: DeliveryStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

/**
 * Cancelamento. A taxa do motoboy é calculada aqui, em centavos inteiros.
 * - BEFORE_DEPARTURE (antes da saída, PENDING ou ASSIGNED): taxa 0.
 * - ON_SITE (no local, IN_TRANSIT): taxa integral.
 */
export function cancelDelivery(
  from: DeliveryStatus,
  type: CancellationType,
  feeCents: number,
): { status: 'CANCELLED'; feeOwedCents: number } {
  if (!Number.isSafeInteger(feeCents) || feeCents < 0) {
    throw new RangeError('feeCents deve ser inteiro não negativo');
  }

  assertTransition(from, 'CANCELLED');

  if (type === 'BEFORE_DEPARTURE') {
    if (from !== 'PENDING' && from !== 'ASSIGNED') {
      throw new InvalidTransitionError(from, 'CANCELLED');
    }
    return { status: 'CANCELLED', feeOwedCents: 0 };
  }

  if (from !== 'IN_TRANSIT') {
    throw new InvalidTransitionError(from, 'CANCELLED');
  }
  return { status: 'CANCELLED', feeOwedCents: feeCents };
}