import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyCourierSession } from '@/src/lib/crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('moto_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Sessão não encontrada ou expirada.' }, { status: 401 });
    }

    const payload = await verifyCourierSession(sessionCookie);
    if (!payload) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }

    // Valida no banco: checa se motoboy está ativo e se sessionVersion coincide
    const courier = await prisma.courier.findUnique({
      where: { id: payload.courierId },
      include: {
        store: {
          select: {
            name: true,
            slug: true,
            phone: true,
            originAddress: true,
          },
        },
        deliveries: {
          where: {
            // Entregas ativas ou recentes
            status: { in: ['ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!courier || !courier.active || courier.sessionVersion !== payload.sessionVersion) {
      return NextResponse.json(
        { error: 'Entregador desativado ou sessão invalidada.' },
        { status: 401 }
      );
    }

    // Regra estrita: nunca expor hashes ou contadores de falhas
    return NextResponse.json({
      courier: {
        id: courier.id,
        name: courier.name,
        phone: courier.phone,
        vehiclePlate: courier.vehiclePlate,
        vehicleModel: courier.vehicleModel,
        pixKeyType: courier.pixKeyType,
        pixKey: courier.pixKey,
        store: courier.store,
      },
      deliveries: courier.deliveries.map((d) => ({
        id: d.id,
        orderNumber: d.orderNumber,
        customerName: d.customerName,
        customerPhone: d.customerPhone,
        street: d.street,
        number: d.number,
        neighborhood: d.neighborhood,
        city: d.city,
        state: d.state,
        distanceKm: Number(d.distanceKm),
        feeAmountCents: d.feeAmountCents,
        status: d.status,
        deliveredAt: d.deliveredAt,
      })),
    });
  } catch (err) {
    console.error('Erro ao buscar dados do motoboy:', err);
    return NextResponse.json({ error: 'Erro ao processar requisição.' }, { status: 500 });
  }
}
