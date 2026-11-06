import { describe, it, expect } from 'vitest';
import {
  DELIVERY_STATUSES,
  canTransition,
  assertTransition,
  cancelDelivery,
  InvalidTransitionError,
  type DeliveryStatus,
} from '../../src/lib/delivery-status';

const ALLOWED: [DeliveryStatus, DeliveryStatus][] = [
  ['PENDING', 'ASSIGNED'],
  ['ASSIGNED', 'IN_TRANSIT'],
  ['IN_TRANSIT', 'DELIVERED'],
  ['PENDING', 'CANCELLED'],
  ['ASSIGNED', 'CANCELLED'],
  ['IN_TRANSIT', 'CANCELLED'],
];

describe('transições de status', () => {
  for (const [from, to] of ALLOWED) {
    it(`permite ${from} → ${to}`, () => {
      expect(canTransition(from, to)).toBe(true);
      expect(() => assertTransition(from, to)).not.toThrow();
    });
  }

  it('rejeita todas as outras combinações', () => {
    for (const from of DELIVERY_STATUSES) {
      for (const to of DELIVERY_STATUSES) {
        const isAllowed = ALLOWED.some(([a, b]) => a === from && b === to);
        if (!isAllowed) {
          expect(canTransition(from, to), `${from} → ${to} deveria ser proibida`).toBe(false);
        }
      }
    }
  });

  it('pedido cancelado nunca volta a DELIVERED', () => {
    expect(() => assertTransition('CANCELLED', 'DELIVERED')).toThrow(InvalidTransitionError);
  });

  it('pedido entregue não pode ser cancelado', () => {
    expect(() => assertTransition('DELIVERED', 'CANCELLED')).toThrow(InvalidTransitionError);
  });

  it('não pula etapa: PENDING não vai direto para DELIVERED', () => {
    expect(() => assertTransition('PENDING', 'DELIVERED')).toThrow(InvalidTransitionError);
  });
});

describe('cancelamento e taxa do motoboy', () => {
  it('antes da saída (PENDING) gera taxa zero', () => {
    expect(cancelDelivery('PENDING', 'BEFORE_DEPARTURE', 800)).toEqual({
      status: 'CANCELLED',
      feeOwedCents: 0,
    });
  });

  it('antes da saída (ASSIGNED) gera taxa zero', () => {
    expect(cancelDelivery('ASSIGNED', 'BEFORE_DEPARTURE', 800).feeOwedCents).toBe(0);
  });

  it('no local (IN_TRANSIT) gera taxa integral', () => {
    expect(cancelDelivery('IN_TRANSIT', 'ON_SITE', 800)).toEqual({
      status: 'CANCELLED',
      feeOwedCents: 800,
    });
  });

  it('cancelamento "no local" de pedido que não saiu é rejeitado', () => {
    expect(() => cancelDelivery('ASSIGNED', 'ON_SITE', 800)).toThrow(InvalidTransitionError);
  });

  it('cancelamento "antes da saída" de pedido em trânsito é rejeitado', () => {
    expect(() => cancelDelivery('IN_TRANSIT', 'BEFORE_DEPARTURE', 800)).toThrow(InvalidTransitionError);
  });

  it('pedido já entregue não pode ser cancelado', () => {
    expect(() => cancelDelivery('DELIVERED', 'ON_SITE', 800)).toThrow(InvalidTransitionError);
  });

  it('rejeita taxa com centavos fracionados ou negativa', () => {
    expect(() => cancelDelivery('IN_TRANSIT', 'ON_SITE', 8.5)).toThrow(RangeError);
    expect(() => cancelDelivery('IN_TRANSIT', 'ON_SITE', -100)).toThrow(RangeError);
  });
});