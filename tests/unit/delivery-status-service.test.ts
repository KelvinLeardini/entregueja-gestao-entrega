import { describe, it, expect } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import {
  changeDeliveryStatus,
  statusInputSchema,
  DeliveryNotFoundError,
  CourierUnavailableError,
  ConcurrencyError,
} from '../../src/lib/delivery-status-service';
import { InvalidTransitionError } from '../../src/lib/delivery-status';

// Banco falso em memória: testa as regras, não o SQL real do Postgres.
const STORE = 'store-a';
const OTHER = 'store-b';

function base() {
  return {
    deliveries: [
      { id: 'd1', storeId: STORE, status: 'PENDING', feeAmountCents: 800 },
      { id: 'd2', storeId: STORE, status: 'ASSIGNED', feeAmountCents: 800 },
      { id: 'd3', storeId: STORE, status: 'IN_TRANSIT', feeAmountCents: 800 },
      { id: 'd4', storeId: STORE, status: 'DELIVERED', feeAmountCents: 800 },
      { id: 'x1', storeId: OTHER, status: 'PENDING', feeAmountCents: 800 },
    ] as { id: string; storeId: string; status: string; feeAmountCents: number; courierId?: string; isFeePayable?: boolean }[],
    couriers: [
      { id: 'c1', storeId: STORE, active: true },
      { id: 'c2', storeId: OTHER, active: true },
      { id: 'c3', storeId: STORE, active: false },
    ],
  };
}

function makeFakeDb(forceConflict = false) {
  const seed = base();
  const deliveries = seed.deliveries;
  const audits: { metadata: Record<string, unknown>; action: string }[] = [];

  const fake = {
    delivery: {
      async findFirst({ where }: { where: { id: string; storeId: string } }) {
        const d = deliveries.find((x) => x.id === where.id && x.storeId === where.storeId);
        return d ? { status: d.status, feeAmountCents: d.feeAmountCents } : null;
      },
      async updateMany({
        where,
        data,
      }: {
        where: { id: string; storeId: string; status: string };
        data: Record<string, unknown>;
      }) {
        if (forceConflict) return { count: 0 };
        const d = deliveries.find(
          (x) => x.id === where.id && x.storeId === where.storeId && x.status === where.status,
        );
        if (!d) return { count: 0 };
        Object.assign(d, data);
        return { count: 1 };
      },
    },
    courier: {
      async findFirst({ where }: { where: { id: string; storeId: string; active: boolean } }) {
        const c = seed.couriers.find(
          (x) => x.id === where.id && x.storeId === where.storeId && x.active === where.active,
        );
        return c ? { id: c.id } : null;
      },
    },
    auditEvent: {
      async create({ data }: { data: { metadata: Record<string, unknown>; action: string } }) {
        audits.push(data);
        return data;
      },
    },
    async $transaction<T>(fn: (tx: unknown) => Promise<T>) {
      return fn(this);
    },
  };

  return { db: fake as unknown as PrismaClient, deliveries, audits };
}

const ctx = (deliveryId: string) => ({ storeId: STORE, actorId: 'user-1', deliveryId });

describe('ações de status', () => {
  it('ASSIGN de PENDING para ASSIGNED com motoboy da mesma loja', async () => {
    const { db, deliveries, audits } = makeFakeDb();
    await changeDeliveryStatus(db, ctx('d1'), { action: 'ASSIGN', courierId: 'c1' });
    expect(deliveries[0].status).toBe('ASSIGNED');
    expect(deliveries[0].courierId).toBe('c1');
    expect(audits[0].action).toBe('DELIVERY_ASSIGN');
  });

  it('ASSIGN com motoboy de outra loja é recusado', async () => {
    const { db, deliveries, audits } = makeFakeDb();
    await expect(
      changeDeliveryStatus(db, ctx('d1'), { action: 'ASSIGN', courierId: 'c2' }),
    ).rejects.toBeInstanceOf(CourierUnavailableError);
    expect(deliveries[0].status).toBe('PENDING');
    expect(audits).toHaveLength(0);
  });

  it('ASSIGN com motoboy desativado é recusado', async () => {
    const { db } = makeFakeDb();
    await expect(
      changeDeliveryStatus(db, ctx('d1'), { action: 'ASSIGN', courierId: 'c3' }),
    ).rejects.toBeInstanceOf(CourierUnavailableError);
  });

  it('START em pedido PENDING é transição inválida', async () => {
    const { db, deliveries, audits } = makeFakeDb();
    await expect(changeDeliveryStatus(db, ctx('d1'), { action: 'START' })).rejects.toBeInstanceOf(
      InvalidTransitionError,
    );
    expect(deliveries[0].status).toBe('PENDING');
    expect(audits).toHaveLength(0);
  });

  it('DELIVER em pedido ASSIGNED é transição inválida (precisa passar por IN_TRANSIT)', async () => {
    const { db } = makeFakeDb();
    await expect(changeDeliveryStatus(db, ctx('d2'), { action: 'DELIVER' })).rejects.toBeInstanceOf(
      InvalidTransitionError,
    );
  });

  it('pedido de outra loja não é encontrado', async () => {
    const { db, deliveries } = makeFakeDb();
    await expect(changeDeliveryStatus(db, ctx('x1'), { action: 'ASSIGN', courierId: 'c1' })).rejects.toBeInstanceOf(
      DeliveryNotFoundError,
    );
    expect(deliveries.find((d) => d.id === 'x1')?.status).toBe('PENDING');
  });
});

describe('cancelamento', () => {
  it('antes da saída (PENDING) não gera taxa a pagar', async () => {
    const { db, deliveries, audits } = makeFakeDb();
    await changeDeliveryStatus(db, ctx('d1'), { action: 'CANCEL', cancellationType: 'BEFORE_DEPARTURE' });
    expect(deliveries[0].status).toBe('CANCELLED');
    expect(deliveries[0].isFeePayable).toBe(false);
    expect(audits[0].metadata).toMatchObject({ feeOwedCents: 0 });
  });

  it('no local (IN_TRANSIT) gera taxa integral a pagar', async () => {
    const { db, deliveries, audits } = makeFakeDb();
    await changeDeliveryStatus(db, ctx('d3'), { action: 'CANCEL', cancellationType: 'ON_SITE' });
    expect(deliveries[2].status).toBe('CANCELLED');
    expect(deliveries[2].isFeePayable).toBe(true);
    expect(audits[0].metadata).toMatchObject({ feeOwedCents: 800 });
  });

  it('ON_SITE em pedido ainda não saiu é recusado', async () => {
    const { db } = makeFakeDb();
    await expect(
      changeDeliveryStatus(db, ctx('d2'), { action: 'CANCEL', cancellationType: 'ON_SITE' }),
    ).rejects.toBeInstanceOf(InvalidTransitionError);
  });

  it('pedido já entregue não pode ser cancelado', async () => {
    const { db } = makeFakeDb();
    await expect(
      changeDeliveryStatus(db, ctx('d4'), { action: 'CANCEL', cancellationType: 'ON_SITE' }),
    ).rejects.toBeInstanceOf(InvalidTransitionError);
  });

  it('conflito de concorrência não altera o pedido', async () => {
    const { db } = makeFakeDb(true);
    await expect(
      changeDeliveryStatus(db, ctx('d1'), { action: 'CANCEL', cancellationType: 'BEFORE_DEPARTURE' }),
    ).rejects.toBeInstanceOf(ConcurrencyError);
  });
});

describe('validação da entrada', () => {
  it('rejeita taxa enviada pelo cliente', () => {
    const r = statusInputSchema.safeParse({
      action: 'CANCEL',
      cancellationType: 'ON_SITE',
      feeAmountCents: 0,
    });
    expect(r.success).toBe(false);
  });

  it('rejeita ação fora da lista', () => {
    expect(statusInputSchema.safeParse({ action: 'PREPARING' }).success).toBe(false);
  });

  it('aceita ASSIGN com courierId', () => {
    expect(statusInputSchema.safeParse({ action: 'ASSIGN', courierId: 'c1' }).success).toBe(true);
  });
});