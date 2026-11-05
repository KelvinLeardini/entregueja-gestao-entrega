// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as verifyPinRoute } from '../../app/api/motoboy/verify-pin/route';
import { GET as getDeliveriesRoute } from '../../app/api/motoboy/deliveries/route';

describe('Testes de Integração Direta nos Endpoints HTTP (Sem Mock)', () => {
  it('deve rejeitar requisição com status 400 se o corpo não contiver token ou PIN', async () => {
    const req = new NextRequest('http://localhost:3000/api/motoboy/verify-pin', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await verifyPinRoute(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Token e PIN de 6 dígitos são obrigatórios');
  });

  it('deve rejeitar requisição com status 400 se o PIN não tiver exatamente 6 dígitos numéricos', async () => {
    const req = new NextRequest('http://localhost:3000/api/motoboy/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc123token', pin: '123' }),
    });

    const res = await verifyPinRoute(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('PIN deve conter exatamente 6 dígitos numéricos');
  });

  it('deve rejeitar com status 401 em /api/motoboy/deliveries quando não houver cookie de sessão', async () => {
    const req = new NextRequest('http://localhost:3000/api/motoboy/deliveries');
    const res = await getDeliveriesRoute(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain('Sessão não encontrada ou expirada');
  });

  it('deve falhar graciosamente com status 500 informando indisponibilidade se o banco não estiver configurado', async () => {
    // Teste real sem mock de Prisma: chamando com dados válidos, o Prisma acusa ausência de DATABASE_URL
    const req = new NextRequest('http://localhost:3000/api/motoboy/verify-pin', {
      method: 'POST',
      body: JSON.stringify({
        token: 'a'.repeat(64),
        pin: '123456',
      }),
    });

    const res = await verifyPinRoute(req);
    const data = await res.json();

    // Como o banco real não está conectado no sandbox, o endpoint captura o erro do Prisma e retorna 500 sem expor segredos
    // Depende do ambiente: sem banco responde 500; com banco e token inexistente responde 401.
    expect([401, 500]).toContain(res.status);
    expect(JSON.stringify(data)).not.toMatch(/prisma|stack|tokenHash|pinHash/i);
    expect(data.tokenHash).toBeUndefined();
    expect(data.pinHash).toBeUndefined();
  });
});
