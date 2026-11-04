import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sha256, verifyPin, signCourierSession } from '@/src/lib/crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, pin } = body;

    if (!token || typeof token !== 'string' || !pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'Token e PIN de 6 dígitos são obrigatórios.' }, { status: 400 });
    }

    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: 'O PIN deve conter exatamente 6 dígitos numéricos.' }, { status: 400 });
    }

    const tokenHash = sha256(token);

    const courier = await prisma.courier.findUnique({
      where: { tokenHash },
    });

    if (!courier || !courier.active) {
      return NextResponse.json({ error: 'Link de acesso inválido ou entregador desativado.' }, { status: 401 });
    }

    // Verifica bloqueio de 15 minutos
    if (courier.pinLockedUntil && courier.pinLockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((courier.pinLockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `PIN bloqueado por tentativas incorretas. Tente novamente em ${remainingMinutes} minuto(s).` },
        { status: 429 }
      );
    }

    const isMatch = await verifyPin(pin, courier.pinHash);

    if (!isMatch) {
      // 1. Incremento atômico direto no banco de dados (previne race conditions)
      const updatedCourier = await prisma.courier.update({
        where: { id: courier.id },
        data: {
          pinFailedAttempts: {
            increment: 1,
          },
        },
        select: {
          pinFailedAttempts: true,
        },
      });

      const currentAttempts = updatedCourier.pinFailedAttempts;

      // 2. Ao atingir 5 falhas, bloqueia por 15 minutos
      if (currentAttempts >= 5) {
        await prisma.courier.update({
          where: { id: courier.id },
          data: {
            pinFailedAttempts: 0,
            pinLockedUntil: new Date(Date.now() + 15 * 60 * 1000),
          },
        });

        return NextResponse.json(
          { error: 'Limite de 5 tentativas atingido. Acesso bloqueado por 15 minutos.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `PIN incorreto. Restam ${5 - currentAttempts} tentativa(s).` },
        { status: 401 }
      );
    }

    // Sucesso no PIN: zera contador e emite sessão
    await prisma.courier.update({
      where: { id: courier.id },
      data: {
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      },
    });

    const sessionJwt = await signCourierSession({
      courierId: courier.id,
      storeId: courier.storeId,
      sessionVersion: courier.sessionVersion,
    });

    const response = NextResponse.json({
      success: true,
      courier: {
        id: courier.id,
        name: courier.name,
        phone: courier.phone,
        vehiclePlate: courier.vehiclePlate,
        vehicleModel: courier.vehicleModel,
      },
    });

    response.cookies.set({
      name: 'moto_session',
      value: sessionJwt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60, // 12 horas
    });

    return response;
  } catch (err: any) {
    console.error('Erro na validação do PIN do motoboy:', err);
    return NextResponse.json({ error: 'Falha interna ao autenticar entregador.' }, { status: 500 });
  }
}
