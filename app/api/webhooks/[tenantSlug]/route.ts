import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const { tenantSlug } = params;

  try {
    // 1. Localiza a loja no banco pelo tenantSlug
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

    // 2. Registra o log de webhook no Prisma
    await prisma.webhookLog.create({
      data: {
        storeId: store.id,
        source: payload.source || 'IFOOD',
        payload: payload,
        status: 'SUCCESS',
      },
    });

    // 3. Processa e cria o pedido vinculado exclusivamente a esse storeId
    const createdOrder = await prisma.order.create({
      data: {
        storeId: store.id,
        orderNumber: payload.orderNumber || 'PED-' + Math.floor(1000 + Math.random() * 9000),
        customerName: payload.customer?.name || 'Cliente iFood',
        customerPhone: payload.customer?.phone || null,
        destination: payload.deliveryAddress?.street
          ? `${payload.deliveryAddress.street}, ${payload.deliveryAddress.number} - ${payload.deliveryAddress.neighborhood}`
          : 'Endereço Balcão',
        distanceKm: Number(payload.distanceKm) || 0,
        feeAmount: Number(payload.feeAmount) || store.defaultBaseFee,
        platform: payload.source || 'IFOOD',
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Pedido ${createdOrder.orderNumber} integrado ao comércio ${store.name}`,
      orderId: createdOrder.id,
    });
  } catch (error: any) {
    console.error('Erro no webhook multi-tenant:', error);
    return NextResponse.json(
      { error: 'Falha interna ao processar webhook.', details: error.message },
      { status: 500 }
    );
  }
}
