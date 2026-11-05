// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';

const SECRET = 'teste-local-somente-com-mais-de-32-caracteres';
const COOKIE_NAME = 'authjs.session-token';

type MiddlewareFn = (req: NextRequest) => Response | Promise<Response>;
let middleware: MiddlewareFn;

async function cookieFor(payload: Record<string, unknown>, secret = SECRET) {
  const token = await encode({ token: payload, secret, salt: COOKIE_NAME });
  return `${COOKIE_NAME}=${token}`;
}

function makeRequest(path: string, cookie?: string) {
  const headers: Record<string, string> = {};
  if (cookie) headers.cookie = cookie;
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

const owner = { sub: 'user-owner', id: 'user-owner', role: 'OWNER', storeId: 'store-1', storeSlug: 'hardbeerburguer' };
const operator = { sub: 'user-op', id: 'user-op', role: 'OPERATOR', storeId: 'store-1', storeSlug: 'hardbeerburguer' };

beforeAll(async () => {
  process.env.AUTH_SECRET = SECRET;
  const mod = (await import('../../middleware')) as unknown as Record<string, unknown>;
  middleware = (mod.middleware ?? mod.default) as MiddlewareFn;
});

describe('middleware: rotas exclusivas do OWNER', () => {
  for (const area of ['configuracoes', 'taxas', 'fechamento', 'webhooks']) {
    it(`OPERATOR recebe 404 em /hardbeerburguer/${area}`, async () => {
      const res = await middleware(makeRequest(`/hardbeerburguer/${area}`, await cookieFor(operator)));
      expect(res.status).toBe(404);
    });

    it(`OWNER não é bloqueado em /hardbeerburguer/${area}`, async () => {
      const res = await middleware(makeRequest(`/hardbeerburguer/${area}`, await cookieFor(owner)));
      expect(res.status).not.toBe(404);
      expect(res.headers.get('location')).toBeNull();
    });
  }
});

describe('middleware: isolamento entre lojas', () => {
  it('usuário de uma loja recebe 404 na loja de outro tenant', async () => {
    const res = await middleware(makeRequest('/outra-loja/taxas', await cookieFor(owner)));
    expect(res.status).toBe(404);
  });
});

describe('middleware: autenticação', () => {
  it('sem cookie, página privada redireciona para /login', async () => {
    const res = await middleware(makeRequest('/hardbeerburguer/taxas'));
    expect(res.headers.get('location')).toContain('/login');
  });

  it('cookie assinado com outro segredo é rejeitado', async () => {
    const forged = await cookieFor(owner, 'segredo-falso-com-mais-de-32-caracteres-xx');
    const res = await middleware(makeRequest('/hardbeerburguer/taxas', forged));
    expect(res.headers.get('location')).toContain('/login');
  });

  it('OPERATOR acessa a página normal da própria loja', async () => {
    const res = await middleware(makeRequest('/hardbeerburguer', await cookieFor(operator)));
    expect(res.status).not.toBe(404);
  });
});