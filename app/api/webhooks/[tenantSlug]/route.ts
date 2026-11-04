import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActorType, DeliverySource } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;

  try {
    const store = await prisma.store.findUnique({
      where: { slug: tenantSlug },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Comércio não encontrado ou inativo.' },
        { status: 404 }
      );
    }

    const payload = await req.json();

    const createdDelivery = await prisma.delivery.create({
      data: {
        storeId: store.id,
        orderNumber: payload.orderNumber || 'PED-' + Math.floor(1000 + Math.random() * 9000),
        source: DeliverySource.IFOOD,
        externalId: payload.externalId || payload.orderId || null,
        customerName: payload.customer?.name || 'Cliente App',
        customerPhone: payload.customer?.phone || null,
        street: payload.deliveryAddress?.street || 'Rua Principal',
        number: payload.deliveryAddress?.number || 'S/N',
        neighborhood: payload.deliveryAddress?.neighborhood || 'Bairro',
        city: payload.deliveryAddress?.city || 'São Paulo',
        state: payload.deliveryAddress?.state || 'SP',
        distanceKm: Number(payload.distanceKm) || 2.5,
        feeAmountCents: Math.round((Number(payload.feeAmount) || 6.0) * 100),
        status: 'PENDING',
        isFeePayable: false,
      },
    });

    await prisma.auditEvent.create({
      data: {
        storeId: store.id,
        actorType: ActorType.SYSTEM,
        actorId: 'webhook-ingestion',
        action: 'WEBHOOK_DELIVERY_CREATED',
        entityType: 'Delivery',
        entityId: createdDelivery.id,
        metadata: {
          source: 'IFOOD',
          orderNumber: createdDelivery.orderNumber,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Entrega ${createdDelivery.orderNumber} integrada ao comércio ${store.name}`,
      deliveryId: createdDelivery.id,
    });
  } catch (error: any) {
    console.error('Erro no webhook multi-tenant:', error);
    return NextResponse.json(
      { error: 'Falha interna ao processar webhook.', details: error.message },
      { status: 500 }
    );
  }
}
