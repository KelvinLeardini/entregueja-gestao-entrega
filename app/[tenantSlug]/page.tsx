import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/src/lib/auth';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface TenantPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: TenantPageProps) {
  const { tenantSlug } = await params;
  try {
    const store = await prisma.store.findUnique({
      where: { slug: tenantSlug },
      select: { name: true, originAddress: true },
    });

    if (!store) return { title: 'Comércio não encontrado · EntregueJá' };

    return {
      title: `${store.name} - Balcão & Gestão de Entregas · EntregueJá`,
      description: `Painel operacional de expedição e acerto de motoboys para ${store.name} em ${store.originAddress}.`,
    };
  } catch {
    return { title: 'EntregueJá · Gestão de Entregas' };
  }
}

export default async function TenantStorePage({ params }: TenantPageProps) {
  const { tenantSlug } = await params;

  // 1. Defesa em profundidade: valida no banco se usuário está autenticado e ativo
  const authSession = await getAuthenticatedUser();
  if (!authSession) {
    notFound();
  }

  // 2. Consulta restrita: filtra obrigatoriamente pelo storeId da sessão do usuário
  let store = null;
  try {
    store = await prisma.store.findFirst({
      where: {
        id: authSession.storeId,
        slug: tenantSlug,
      },
      include: {
        couriers: {
          where: { active: true, storeId: authSession.storeId },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            phone: true,
            vehiclePlate: true,
            vehicleModel: true,
            pixKeyType: true,
            pixKey: true,
            active: true,
            sessionVersion: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        deliveries: {
          where: { storeId: authSession.storeId },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        rateRules: {
          where: { storeId: authSession.storeId },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  } catch (err) {
    console.warn('Prisma database access pending database connection:', err);
  }

  // Se a loja não corresponder ao storeId autenticado, responde 404 (stealth)
  if (!store) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{store.name}</h1>
          <p className="text-xs text-slate-500">{store.originAddress} · Rota /{store.slug}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Balcão operacional ativo. {store.deliveries.length} entregas cadastradas para o comércio {store.name}.
          </p>
        </div>
      </main>
    </div>
  );
}
