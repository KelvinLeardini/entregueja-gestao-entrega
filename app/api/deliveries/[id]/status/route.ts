import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getAuthenticatedUser } from '@/src/lib/auth';
import { InvalidTransitionError } from '@/src/lib/delivery-status';
import {
  changeDeliveryStatus,
  statusInputSchema,
  DeliveryNotFoundError,
  CourierUnavailableError,
  ConcurrencyError,
  type StatusInput,
} from '@/src/lib/delivery-status-service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUser(['OWNER', 'OPERATOR']);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await params;

  let input: StatusInput;
  try {
    input = statusInputSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  try {
    const result = await changeDeliveryStatus(
      prisma,
      { storeId: auth.storeId, actorId: auth.user.id, deliveryId: id },
      input,
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof DeliveryNotFoundError) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }
    if (err instanceof CourierUnavailableError) {
      return NextResponse.json({ error: 'Motoboy indisponível.' }, { status: 422 });
    }
    if (err instanceof InvalidTransitionError) {
      return NextResponse.json(
        { error: 'Mudança de status não permitida para o estado atual.' },
        { status: 409 },
      );
    }
    if (err instanceof ConcurrencyError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    // Não devolve detalhes do erro nem do banco ao cliente
    console.error('[deliveries/status] erro inesperado:', err instanceof Error ? err.name : 'desconhecido');
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}