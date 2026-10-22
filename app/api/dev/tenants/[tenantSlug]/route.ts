import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/dev/tenants/[tenantSlug] -> Remove o tenant e faz cascata no PostgreSQL
export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const { tenantSlug } = params;

  try {
    const store = await prisma.store.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            orders: true,
            couriers: true,
            settlements: true,
            rateRules: true,
            webhookLogs: true,
            addressCaches: true,
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Comércio não encontrado para exclusão.' },
        { status: 404 }
      );
    }

    // A deleção em cascata (onDelete: Cascade) no schema.prisma remove
    // automaticamente todas as ordens, motoboys, fechamentos e logs associados
    await prisma.store.delete({
      where: { id: store.id },
    });

    return NextResponse.json({
      success: true,
      message: `Comércio "${store.name}" e todos os dados associados (${store._count.orders} pedidos, ${store._count.couriers} motoboys) foram excluídos permanentemente do banco PostgreSQL.`,
      deletedStats: store._count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Falha ao excluir comércio do banco de dados.', details: error.message },
      { status: 500 }
    );
  }
}
