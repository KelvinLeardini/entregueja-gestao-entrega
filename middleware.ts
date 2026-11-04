import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Lista explícita de arquivos estáticos raiz
const EXPLICIT_STATIC_FILES = new Set([
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.webmanifest',
]);

// Extensões de arquivos estáticos permitidas
const STATIC_ASSET_REGEX = /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot|map)$/i;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Liberação de arquivos estáticos reais (sem "includes('.')")
  if (
    request.nextUrl.pathname.startsWith('/_next/static/') ||
    request.nextUrl.pathname.startsWith('/_next/image') ||
    EXPLICIT_STATIC_FILES.has(pathname) ||
    STATIC_ASSET_REGEX.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Rotas públicas da aplicação acessíveis sem sessão de lojista
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/motoboy' ||
    pathname.startsWith('/motoboy/') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/motoboy') ||
    pathname.startsWith('/api/webhooks')
  ) {
    return NextResponse.next();
  }

  // 3. Validação estrita do segredo: aplicação falha com erro claro se AUTH_SECRET estiver ausente
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    throw new Error('Configuração fatal: Variável de ambiente AUTH_SECRET não definida.');
  }

  // Valida o token JWT/JWE da sessão Auth.js de forma compatível com Edge runtime
  const token = await getToken({
    req: request,
    secret: authSecret,
  });

  // Rejeição para não autenticados
  if (!token || !token.id) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Regra para Rotas de API do Lojista:
  // APIs NUNCA são comparadas com slug de URL no middleware.
  // A autorização é baseada no storeId da sessão do usuário dentro de cada Route Handler.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 5. Regra para Páginas do Lojista (/[tenantSlug]/*):
  // O slug na URL é o identificador visual da loja e DEVE bater com token.storeSlug
  const segments = pathname.split('/').filter(Boolean);
  const routeSlug = segments[0];
  const userStoreSlug = token.storeSlug as string;

  if (routeSlug && routeSlug !== userStoreSlug) {
    return new NextResponse(null, { status: 404 });
  }

  // Restrição de papel para páginas administrativas: OPERATOR bloqueado com 404
  const subRoute = segments[1];
  const ownerOnlyRoutes = ['configuracoes', 'taxas', 'fechamento', 'webhooks'];
  if (subRoute && ownerOnlyRoutes.includes(subRoute)) {
    if (token.role === 'OPERATOR') {
      return new NextResponse(null, { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
