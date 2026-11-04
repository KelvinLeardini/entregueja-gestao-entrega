import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from './crypto';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        let user = null;
        try {
          user = await prisma.user.findUnique({
            where: { email },
            include: { store: true },
          });
        } catch (err) {
          console.warn('Banco de dados indisponível no login:', err);
          return null;
        }

        // Mensagem genérica se usuário não existe ou inativo
        if (!user || !user.active) {
          return null;
        }

        // Limite de tentativas no login: bloqueio temporário após 5 falhas
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('Conta bloqueada temporariamente. Tente novamente mais tarde.');
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          const failed = user.failedLoginAttempts + 1;
          const lockedUntil = failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: failed >= 5 ? 0 : failed,
              lockedUntil,
            },
          });
          return null;
        }

        // Sucesso: zera tentativas de falha
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          storeId: user.storeId,
          storeSlug: user.store.slug,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.storeId = (user as any).storeId;
        token.storeSlug = (user as any).storeSlug;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).storeId = token.storeId;
        (session.user as any).storeSlug = token.storeSlug;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET,
});

export interface AuthenticatedUserResult {
  user: {
    id: string;
    email: string;
    role: string;
    storeId: string;
    active: boolean;
  };
  storeId: string;
}

/**
 * Autorização defensiva em nível de banco de dados para CADA Route Handler protegido do lojista.
 * Consulta User.active e storeId em tempo real no banco, rejeitando usuários desativados mesmo com token válido.
 */
export async function getAuthenticatedUser(
  allowedRoles?: Array<'OWNER' | 'OPERATOR'>
): Promise<AuthenticatedUserResult | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      storeId: true,
      active: true,
    },
  });

  if (!user || !user.active) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return {
    user,
    storeId: user.storeId,
  };
}
