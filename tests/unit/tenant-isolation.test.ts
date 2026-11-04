// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../../middleware';
import { encode } from 'next-auth/jwt';

const AUTH_SECRET = 'segredo-de-teste-muito-seguro-de-32-chars-long!';
const COOKIE_NAME = 'authjs.session-token';

describe('Isolamento Multi-Tenant e Middleware com JWT Real (next-auth/jwt encode)', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = AUTH_SECRET;
  });

  it('1. token válido da loja A em /loja-b → 404 (e NUNCA 403)', async () => {
    const tokenLojaA = await encode({
      token: {
        id: 'user-loja-a',
        email: 'dono@loja-a.com.br',
        role: 'OWNER',
        storeId: 'store-a-uuid',
        storeSlug: 'loja-a',
      },
      secret: AUTH_SECRET,
      salt: COOKIE_NAME,
    });

    const req = new NextRequest('http://localhost:3000/loja-b/pedidos');
    req.cookies.set(COOKIE_NAME, tokenLojaA);

    const res = await middleware(req);

    // Regra estrita: 404 stealth
    expect(res.status).toBe(404);
  });

  it('2. token assinado com outro segredo → rejeitado (307 redirect para /login)', async () => {
    const tokenOutroSegredo = await encode({
      token: {
        id: 'user-1',
        email: 'dono@loja-a.com.br',
        role: 'OWNER',
        storeId: 'store-a-uuid',
        storeSlug: 'loja-a',
      },
      secret: 'outro-segredo-completamente-diferente-32-chars!',
      salt: COOKIE_NAME,
    });

    const req = new NextRequest('http://localhost:3000/loja-a/pedidos');
    req.cookies.set(COOKIE_NAME, tokenOutroSegredo);

    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('3. token expirado → rejeitado (307 redirect para /login)', async () => {
    const tokenExpirado = await encode({
      token: {
        id: 'user-1',
        email: 'dono@loja-a.com.br',
        role: 'OWNER',
        storeId: 'store-a-uuid',
        storeSlug: 'loja-a',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expirado há 1 hora
      },
      secret: AUTH_SECRET,
      salt: COOKIE_NAME,
      maxAge: -3600,
    });

    const req = new NextRequest('http://localhost:3000/loja-a/pedidos');
    req.cookies.set(COOKIE_NAME, tokenExpirado);

    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('4. token de OPERATOR em rota de OWNER (/loja-a/configuracoes) → 404 stealth', async () => {
    const tokenOperator = await encode({
      token: {
        id: 'user-operador',
        email: 'operador@loja-a.com.br',
        role: 'OPERATOR',
        storeId: 'store-a-uuid',
        storeSlug: 'loja-a',
      },
      secret: AUTH_SECRET,
      salt: COOKIE_NAME,
    });

    const req = new NextRequest('http://localhost:3000/loja-a/configuracoes');
    req.cookies.set(COOKIE_NAME, tokenOperator);

    const res = await middleware(req);

    expect(res.status).toBe(404);
  });

  it('5. token válido na própria loja (/loja-a/pedidos) → liberado com 200', async () => {
    const tokenLojaA = await encode({
      token: {
        id: 'user-loja-a',
        email: 'dono@loja-a.com.br',
        role: 'OWNER',
        storeId: 'store-a-uuid',
        storeSlug: 'loja-a',
      },
      secret: AUTH_SECRET,
      salt: COOKIE_NAME,
    });

    const req = new NextRequest('http://localhost:3000/loja-a/pedidos');
    req.cookies.set(COOKIE_NAME, tokenLojaA);

    const res = await middleware(req);

    expect(res.status).toBe(200);
  });

  it('6. APIs protegidas de lojista não comparam slug e passam com 200 com token válido', async () => {
    const tokenLojaA = await encode({
      token: {
        id: 'user-loja-a',
        email: 'dono@loja-a.com.br',
        role: 'OWNER',
        storeId: 'store-a-uuid',
        storeSlug: 'loja-a',
      },
      secret: AUTH_SECRET,
      salt: COOKIE_NAME,
    });

    // Chamada de API: não há verificação de slug na URL pelo middleware
    const req = new NextRequest('http://localhost:3000/api/pedidos/despachar');
    req.cookies.set(COOKIE_NAME, tokenLojaA);

    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it('7. APIs protegidas sem token respondem 401 JSON imediato', async () => {
    const req = new NextRequest('http://localhost:3000/api/pedidos/despachar');
    const res = await middleware(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Não autorizado.');
  });

  it('8. rotas públicas (/motoboy/*, /api/motoboy/*, /login) liberadas sem sessão', async () => {
    const reqToken = new NextRequest('http://localhost:3000/motoboy/0123456789abcdef0123456789abcdef');
    expect((await middleware(reqToken)).status).toBe(200);

    const reqClean = new NextRequest('http://localhost:3000/motoboy');
    expect((await middleware(reqClean)).status).toBe(200);

    const reqPin = new NextRequest('http://localhost:3000/api/motoboy/verify-pin');
    expect((await middleware(reqPin)).status).toBe(200);

    const reqDeliv = new NextRequest('http://localhost:3000/api/motoboy/deliveries');
    expect((await middleware(reqDeliv)).status).toBe(200);

    const reqLogin = new NextRequest('http://localhost:3000/login');
    expect((await middleware(reqLogin)).status).toBe(200);
  });
});
