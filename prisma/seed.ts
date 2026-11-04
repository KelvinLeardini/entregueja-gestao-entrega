import { PrismaClient } from '@prisma/client';
import { hashPassword, hashPin, sha256, generateRandomToken } from '../src/lib/crypto';

const prisma = new PrismaClient();

export async function main() {
  console.log('🌱 Semeando dados para o EntregueJá (FASE 1)...');

  // 1. Loja Demo: Hard Beer Burguer
  const store = await prisma.store.upsert({
    where: { slug: 'hardbeerburguer' },
    update: {
      name: 'Hard Beer Burguer',
      phone: '11998765432',
      originAddress: 'Rua Cantagalo, 1500 - Tatuapé, São Paulo - SP',
      originLat: -23.5412,
      originLng: -46.5684,
    },
    create: {
      slug: 'hardbeerburguer',
      name: 'Hard Beer Burguer',
      cnpj: '12.345.678/0001-90',
      phone: '11998765432',
      originAddress: 'Rua Cantagalo, 1500 - Tatuapé, São Paulo - SP',
      originLat: -23.5412,
      originLng: -46.5684,
    },
  });

  // 2. Usuário OWNER (Dono da loja)
  const ownerPlainPassword = 'DonoHardBeer@2026';
  const ownerPasswordHash = await hashPassword(ownerPlainPassword);
  const owner = await prisma.user.upsert({
    where: { email: 'dono@hardbeerburguer.com.br' },
    update: {
      passwordHash: ownerPasswordHash,
      role: 'OWNER',
      active: true,
      storeId: store.id,
    },
    create: {
      email: 'dono@hardbeerburguer.com.br',
      passwordHash: ownerPasswordHash,
      role: 'OWNER',
      active: true,
      storeId: store.id,
    },
  });

  // 3. Usuário OPERATOR (Operador de balcão/expedição)
  const operatorPlainPassword = 'OperadorHardBeer@2026';
  const operatorPasswordHash = await hashPassword(operatorPlainPassword);
  const operator = await prisma.user.upsert({
    where: { email: 'operador@hardbeerburguer.com.br' },
    update: {
      passwordHash: operatorPasswordHash,
      role: 'OPERATOR',
      active: true,
      storeId: store.id,
    },
    create: {
      email: 'operador@hardbeerburguer.com.br',
      passwordHash: operatorPasswordHash,
      role: 'OPERATOR',
      active: true,
      storeId: store.id,
    },
  });

  // 4. Motoboy de Teste
  const courierPlainToken = generateRandomToken(32); // 64 hex chars (32 bytes de entropia)
  const courierTokenHash = sha256(courierPlainToken);
  const courierPlainPin = '741258';
  const courierPinHash = await hashPin(courierPlainPin);

  // Remove motoboy de teste anterior se existir pelo telefone para criar novo link limpo
  const existingCourier = await prisma.courier.findFirst({
    where: { storeId: store.id, phone: '11988887777' },
  });

  let courier;
  if (existingCourier) {
    courier = await prisma.courier.update({
      where: { id: existingCourier.id },
      data: {
        tokenHash: courierTokenHash,
        pinHash: courierPinHash,
        active: true,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
        sessionVersion: existingCourier.sessionVersion + 1,
      },
    });
  } else {
    courier = await prisma.courier.create({
      data: {
        storeId: store.id,
        name: 'Carlos Silva (Motoboy Teste)',
        phone: '11988887777',
        vehiclePlate: 'ABC1D23',
        vehicleModel: 'Honda CG 160 Titan',
        pixKeyType: 'PHONE',
        pixKey: '11988887777',
        tokenHash: courierTokenHash,
        pinHash: courierPinHash,
        active: true,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
        sessionVersion: 1,
      },
    });
  }

  // 5. Regras de taxas exemplo (em centavos)
  const existingRules = await prisma.rateRule.count({ where: { storeId: store.id } });
  if (existingRules === 0) {
    await prisma.rateRule.createMany({
      data: [
        { storeId: store.id, minKm: 0.0, maxKm: 3.0, feeCents: 600, orderIndex: 1 },
        { storeId: store.id, minKm: 3.01, maxKm: 5.0, feeCents: 900, orderIndex: 2 },
        { storeId: store.id, minKm: 5.01, maxKm: 8.0, feeCents: 1300, orderIndex: 3 },
      ],
    });
  }

  console.log('\n======================================================');
  console.log('✅ SEED EXECUTADO COM SUCESSO');
  console.log('======================================================');
  console.log(`Loja: ${store.name} (Slug: ${store.slug})`);
  console.log('------------------------------------------------------');
  console.log('🔑 CREDENCIAIS DO LOJISTA (OWNER):');
  console.log(`   E-mail: ${owner.email}`);
  console.log(`   Senha:  ${ownerPlainPassword}`);
  console.log('------------------------------------------------------');
  console.log('🔑 CREDENCIAIS DO OPERADOR (OPERATOR):');
  console.log(`   E-mail: ${operator.email}`);
  console.log(`   Senha:  ${operatorPlainPassword}`);
  console.log('------------------------------------------------------');
  console.log('🛵 ACESSO DO MOTOBOY DE TESTE:');
  console.log(`   Nome:        ${courier.name}`);
  console.log(`   Link Direto: /motoboy/${courierPlainToken}`);
  console.log(`   PIN Secreto: ${courierPlainPin} (6 dígitos)`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
