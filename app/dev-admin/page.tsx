import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Database, Plus, Wrench, ExternalLink, PlayCircle } from 'lucide-react';

export const metadata = {
  title: 'Super Admin Dev · EntregueJá SaaS',
  description: 'Painel restrito de desenvolvedor para suporte, monitoramento e gestão de comércios.',
};

export default async function DevAdminPage() {
  // Busca todos os tenants registrados no banco de dados via Prisma
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          orders: true,
          couriers: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Dev Admin Console</h1>
              <p className="text-xs text-slate-400">Gestão Multi-Tenant via Prisma ORM</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dev-admin/sandbox"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5"
            >
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              <span>Sandbox de Testes</span>
            </Link>
          </div>
        </header>

        {/* Tabela de Lojas Registradas */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Comércio / Rota</th>
                <th className="py-3 px-4">Segmento</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Motoboys / Pedidos</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Magic Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-slate-750">
                  <td className="py-3 px-4 font-bold text-white">
                    {store.name}
                    <span className="block font-mono text-[11px] text-amber-400">/{store.slug}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{store.segment}</td>
                  <td className="py-3 px-4 text-slate-300">{store.ownerName}</td>
                  <td className="py-3 px-4 font-mono-numbers text-slate-200">
                    {store._count.couriers} motoboys · {store._count.orders} pedidos
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {store.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/${store.slug}?devSuperAdmin=true`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                    >
                      <span>Acessar</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
