import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/dev/tenants -> Lista todos os comércios do banco com contagens
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            orders: true,
            couriers: true,
            settlements: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, stores });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao listar comércios do banco de dados.', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/dev/tenants -> Cria dinamicamente um novo tenant com tabela de taxas padrão
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      slug,
      name,
      segment,
      ownerName,
      ownerPhone,
      ownerEmail,
      originAddress,
      originLat,
      originLng,
      defaultBaseFee,
      defaultKmRate,
      storePin,
      adminPin,
      plan,
    } = body;

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    if (!cleanSlug || !name || !originAddress) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: slug, name ou originAddress.' },
        { status: 400 }
      );
    }

    const existing = await prisma.store.findUnique({
      where: { slug: cleanSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Já existe um comércio registrado com o link /${cleanSlug}. Escolha outro slug.` },
        { status: 409 }
      );
    }

    // Cria o tenant e injeta regras de taxa padrão no PostgreSQL via transação Prisma
    const newStore = await prisma.store.create({
      data: {
        slug: cleanSlug,
        name,
        segment: segment || 'BURGER',
        status: 'ACTIVE',
        plan: plan || 'PRO',
        ownerName: ownerName || 'Proprietário',
        ownerPhone: ownerPhone || '',
        ownerEmail: ownerEmail || `${cleanSlug}@entregueja.com.br`,
        originAddress,
        originLat: originLat || null,
        originLng: originLng || null,
        defaultBaseFee: Number(defaultBaseFee) || 6.0,
        defaultKmRate: Number(defaultKmRate) || 1.5,
        storePin: storePin || '1234',
        adminPin: adminPin || '9876',
        rateRules: {
          create: [
            { minKm: 0.0, maxKm: 3.0, price: Number(defaultBaseFee) || 6.0, description: 'Raio Imediato / Bairro', orderIndex: 1 },
            { minKm: 3.1, maxKm: 6.0, price: (Number(defaultBaseFee) || 6.0) + 3.0, description: 'Bairros Vizinhos', orderIndex: 2 },
            { minKm: 6.1, maxKm: 10.0, price: (Number(defaultBaseFee) || 6.0) + 7.0, description: 'Região Expandida', orderIndex: 3 },
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Comércio "${newStore.name}" cadastrado com sucesso! Acessível em /${newStore.slug}.`,
      store: newStore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Falha ao criar novo comércio no PostgreSQL.', details: error.message },
      { status: 500 }
    );
  }
}
