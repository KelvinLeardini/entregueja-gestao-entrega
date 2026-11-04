// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as verifyPinRoute } from '../../app/api/motoboy/verify-pin/route';
import { GET as getDeliveriesRoute } from '../../app/api/motoboy/deliveries/route';
import {
  hashPin,
  sha256,
  generateRandomToken,
  signCourierSession,
  verifyCourierSession,
  encryptSecret,
  decryptSecret,
} from '../../src/lib/crypto';
import { prisma } from '../../lib/prisma';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    courier: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

process.env.SESSION_SECRET = 'test-session-secret-at-least-32-characters-long';
process.env.WEBHOOK_ENCRYPTION_KEY = 'test-webhook-secret-at-least-32-characters-long';
process.env.AUTH_SECRET = 'test-auth-secret-at-least-32-characters-long';

describe('Segurança do Acesso do Motoboy (FASE 1)', () => {
  const plainToken = 'a'.repeat(64); // 32 bytes hex
  const tokenHash = sha256(plainToken);
  const correctPin = '123456';
  let pinHash: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    pinHash = await hashPin(correctPin);
  });

  it('deve gerar token seguro de no mínimo 32 bytes e hash SHA-256 correspondente', () => {
    const token = generateRandomToken(32);
    expect(token.length).toBe(64); // 32 bytes em formato hex = 64 chars
    const hash = sha256(token);
    expect(hash.length).toBe(64);
  });

  it('deve permitir acesso com PIN de 6 dígitos correto e retornar dados sanitizados (SEM hashes)', async () => {
    vi.mocked(prisma.courier.findUnique).mockResolvedValueOnce({
      id: 'courier-123',
      storeId: 'store-1',
      name: 'João Entregador',
      phone: '11999998888',
      vehiclePlate: 'XYZ9876',
      vehicleModel: 'Honda Fan',
      active: true,
      tokenHash,
      pinHash,
      pinFailedAttempts: 0,
      pinLockedUntil: null,
      sessionVersion: 1,
    } as any);

    vi.mocked(prisma.courier.update).mockResolvedValueOnce({} as any);

    const req = new NextRequest('http://localhost:3000/api/motoboy/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ token: plainToken, pin: correctPin }),
    });

    const res = await verifyPinRoute(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.courier.name).toBe('João Entregador');

    // Regra estrita: nenhuma resposta pode conter tokenHash, pinHash, pinFailedAttempts
    expect(body.tokenHash).toBeUndefined();
    expect(body.pinHash).toBeUndefined();
    expect(body.pinFailedAttempts).toBeUndefined();
    expect(body.courier.tokenHash).toBeUndefined();
    expect(body.courier.pinHash).toBeUndefined();
    expect(body.courier.pinFailedAttempts).toBeUndefined();

    // Cookie httpOnly emitido
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('moto_session=');
    expect(setCookie).toContain('HttpOnly');
  });

  it('deve bloquear motoboy desativado mesmo que o token ou PIN estejam corretos', async () => {
    vi.mocked(prisma.courier.findUnique).mockResolvedValueOnce({
      id: 'courier-disabled',
      storeId: 'store-1',
      name: 'Entregador Inativo',
      active: false, // DESATIVADO
      tokenHash,
      pinHash,
      pinFailedAttempts: 0,
      pinLockedUntil: null,
      sessionVersion: 1,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/motoboy/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ token: plainToken, pin: correctPin }),
    });

    const res = await verifyPinRoute(req);
    // Padronizado para 401 Unauthorized
    expect(res.status).toBe(401);
  });

  it('deve aplicar bloqueio de 15 minutos no banco após 5 tentativas de PIN incorretas', async () => {
    // 4 falhas anteriores
    vi.mocked(prisma.courier.findUnique).mockResolvedValueOnce({
      id: 'courier-123',
      storeId: 'store-1',
      name: 'João Entregador',
      active: true,
      tokenHash,
      pinHash,
      pinFailedAttempts: 4,
      pinLockedUntil: null,
      sessionVersion: 1,
    } as any);

    let updateData: any = null;
    // 1º update: incremento atômico no banco retornando pinFailedAttempts = 5
    // 2º update: aplicação do bloqueio de 15 minutos
    vi.mocked(prisma.courier.update)
      .mockResolvedValueOnce({ pinFailedAttempts: 5 } as any)
      .mockImplementationOnce((async ({ data }: any) => {
        updateData = data;
        return {} as any;
      }) as any);

    const req = new NextRequest('http://localhost:3000/api/motoboy/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ token: plainToken, pin: '000000' }), // PIN Errado (5ª tentativa)
    });

    const res = await verifyPinRoute(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toContain('Limite de 5 tentativas atingido');
    expect(updateData).not.toBeNull();
    // Bloqueio gravado no banco com timestamp futuro de 15 minutos
    expect(updateData.pinLockedUntil).toBeInstanceOf(Date);
    expect(updateData.pinLockedUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it('deve rejeitar tentativas enquanto o bloqueio de 15 minutos estiver ativo', async () => {
    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // Bloqueado por mais 10 min
    vi.mocked(prisma.courier.findUnique).mockResolvedValueOnce({
      id: 'courier-123',
      storeId: 'store-1',
      name: 'João Entregador',
      active: true,
      tokenHash,
      pinHash,
      pinFailedAttempts: 5,
      pinLockedUntil: lockedUntil,
      sessionVersion: 1,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/motoboy/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ token: plainToken, pin: correctPin }),
    });

    const res = await verifyPinRoute(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain('PIN bloqueado');
  });

  it('deve invalidar sessões antigas quando sessionVersion for incrementada (regeneração do token)', async () => {
    // 1. Emite sessão para sessionVersion = 1
    const oldSessionToken = await signCourierSession({
      courierId: 'courier-123',
      storeId: 'store-1',
      sessionVersion: 1,
    });

    // 2. No banco de dados, o token foi regenerado e sessionVersion foi para 2
    vi.mocked(prisma.courier.findUnique).mockResolvedValueOnce({
      id: 'courier-123',
      storeId: 'store-1',
      active: true,
      sessionVersion: 2, // NOVO sessionVersion
      deliveries: [],
      store: { name: 'Loja Teste' },
    } as any);

    const req = new NextRequest('http://localhost:3000/api/motoboy/deliveries');
    req.cookies.set('moto_session', oldSessionToken);
    const res = await getDeliveriesRoute(req);

    // Deve ser rejeitado com 401 porque sessionVersion não coincide
    expect(res.status).toBe(401);
  });

  it('deve criptografar e descriptografar segredos de webhook com AES-256-GCM', () => {
    const secret = 'whsec_test_secret_for_external_webhook_12345';
    const ciphertext = encryptSecret(secret);

    expect(ciphertext).not.toBe(secret);
    expect(ciphertext.split(':').length).toBe(3); // iv:authTag:ciphertext

    const decrypted = decryptSecret(ciphertext);
    expect(decrypted).toBe(secret);
  });
});
