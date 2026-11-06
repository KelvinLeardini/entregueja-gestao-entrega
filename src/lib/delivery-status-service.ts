import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  assertTransition,
  cancelDelivery,
  type CancellationType,
  type DeliveryStatus,
} from './delivery-status';

// .strict() rejeita campos extras. Assim, feeAmountCents enviado pelo cliente é recusado.
export const statusInputSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('ASSIGN'), courierId: z.string().min(1).max(64) }).strict(),
  z.object({ action: z.literal('START') }).strict(),
  z.object({ action: z.literal('DELIVER') }).strict(),
  z
    .object({
      action: z.literal('CANCEL'),
      cancellationType: z.enum(['BEFORE_DEPARTURE', 'ON_SITE']),
    })
    .strict(),
]);

export type StatusInput = z.infer<typeof statusInputSchema>;

export class DeliveryNotFoundError extends Error {
  name = 'DeliveryNotFoundError';
}
export class CourierUnavailableError extends Error {
  name = 'CourierUnavailableError';
}
export class ConcurrencyError extends Error {
  name = 'ConcurrencyError';
}

export interface StatusContext {
  storeId: string;
  actorId: string;
  deliveryId: string;
}

type DeliveryPatch = {
  status: DeliveryStatus;
  courierId?: string;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationType?: CancellationType;
  isFeePayable?: boolean;
};

export async function changeDeliveryStatus(
  db: PrismaClient,
  ctx: StatusContext,
  input: StatusInput,
) {
  const now = new Date();

  return db.$transaction(async (tx) => {
    // Filtra pela loja da sessão. Pedido de outra loja não é encontrado.
    const delivery = await tx.delivery.findFirst({
      where: { id: ctx.deliveryId, storeId: ctx.storeId },
      select: { status: true, feeAmountCents: true },
    });
    if (!delivery) {
      throw new DeliveryNotFoundError('Pedido não encontrado.');
    }

    const from = delivery.status as DeliveryStatus;
    let patch: DeliveryPatch;
    let auditMeta: Record<string, string | number> = { from };

    switch (input.action) {
      case 'ASSIGN': {
        assertTransition(from, 'ASSIGNED');
        const courier = await tx.courier.findFirst({
          where: { id: input.courierId, storeId: ctx.storeId, active: true },
          select: { id: true },
        });
        if (!courier) {
          throw new CourierUnavailableError('Motoboy indisponível.');
        }
        patch = { status: 'ASSIGNED', courierId: courier.id };
        break;
      }
      case 'START': {
        assertTransition(from, 'IN_TRANSIT');
        patch = { status: 'IN_TRANSIT' };
        break;
      }
      case 'DELIVER': {
        assertTransition(from, 'DELIVERED');
        patch = { status: 'DELIVERED', deliveredAt: now };
        break;
      }
      case 'CANCEL': {
        // A taxa vem do pedido no banco, nunca do corpo da requisição.
        const result = cancelDelivery(from, input.cancellationType, delivery.feeAmountCents);
        patch = {
          status: 'CANCELLED',
          cancelledAt: now,
          cancellationType: input.cancellationType,
          isFeePayable: result.feeOwedCents > 0,
        };
        auditMeta = { ...auditMeta, feeOwedCents: result.feeOwedCents };
        break;
      }
      default:
        throw new Error('Ação desconhecida.');
    }

    // Só atualiza se o status ainda for o que foi lido. Evita cancelar duas vezes em cliques simultâneos.
    const { count } = await tx.delivery.updateMany({
      where: { id: ctx.deliveryId, storeId: ctx.storeId, status: from },
      data: patch,
    });
    if (count !== 1) {
      throw new ConcurrencyError('O pedido foi alterado por outra ação. Recarregue a página.');
    }

    await tx.auditEvent.create({
      data: {
        storeId: ctx.storeId,
        actorType: 'USER',
        actorId: ctx.actorId,
        action: `DELIVERY_${input.action}`,
        entityType: 'Delivery',
        entityId: ctx.deliveryId,
        metadata: { ...auditMeta, to: patch.status },
      },
    });

    return { id: ctx.deliveryId, from, to: patch.status };
  });
}