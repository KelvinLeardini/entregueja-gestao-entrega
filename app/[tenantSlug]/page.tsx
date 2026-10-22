import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BalcaoView } from '@/components/BalcaoView';

interface TenantPageProps {
  params: {
    tenantSlug: string;
  };
  searchParams: {
    devSuperAdmin?: string;
  };
}

export async function generateMetadata({ params }: TenantPageProps) {
  const store = await prisma.store.findUnique({
    where: { slug: params.tenantSlug },
    select: { name: true, originAddress: true },
  });

  if (!store) return { title: 'Comércio não encontrado · EntregueJá' };

  return {
    title: `${store.name} - Balcão & Gestão de Entregas · EntregueJá`,
    description: `Painel operacional de expedição e acerto de motoboys para ${store.name} em ${store.originAddress}.`,
  };
}

export default async function TenantStorePage({ params, searchParams }: TenantPageProps) {
  const { tenantSlug } = params;
  const isDeveloperImpersonating = searchParams.devSuperAdmin === 'true';

  // 1. Busca segura do Comércio com isolamento absoluto no Prisma
  const store = await prisma.store.findUnique({
    where: { slug: tenantSlug },
    include: {
      couriers: {
        where: { active: true },
        orderBy: { name: 'asc' },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
      rateRules: {
        orderBy: { orderIndex: 'asc' },
      },
      addressCaches: true,
    },
  });

  if (!store) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Banner de Suporte Técnico Dev */}
      {isDeveloperImpersonating && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between">
          <span>MODO SUPORTE TÉCNICO (DEV ADMIN) · Acesso irrestrito a /{store.slug}</span>
          <a
            href="/dev-admin"
            className="bg-slate-950 text-white px-2.5 py-0.5 rounded text-[11px] font-semibold hover:bg-slate-800"
          >
            Voltar ao Dev Admin
          </a>
        </div>
      )}

      {/* Renderiza o Balcão Operacional Scoped */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{store.name}</h1>
          <p className="text-xs text-slate-500">{store.originAddress} · Rota /{store.slug}</p>
        </div>

        {/* Componente Operacional Conectado */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Balcão operacional ativo. {store.orders.length} pedidos carregados do banco de dados Prisma para o comércio {store.name}.
          </p>
        </div>
      </main>
    </div>
  );
}
