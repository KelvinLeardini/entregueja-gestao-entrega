import React from 'react';
import Link from 'next/link';
import {
  Bike,
  ShieldCheck,
  Calculator,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Lock,
  Store,
  Pill,
  ExternalLink,
} from 'lucide-react';

export default function SaaSGrandLandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-600">
      {/* 1. Header do SaaS */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm shadow-amber-500/20">
              <Bike className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Entregue<span className="text-amber-500">Já</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#solucao" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              Solução
            </a>
            <a href="#como-funciona" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              Como Funciona
            </a>
            <a href="#demonstracao" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              Lojas Demo
            </a>
            <a href="#planos" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              Planos
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dev-admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              Dev Admin
            </Link>

            <Link
              href="/hardbeerburguer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm shadow-amber-500/20 transition-all"
            >
              Ver Loja Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-16 pb-20 sm:pt-24 sm:pb-32 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>SaaS Multi-Tenant de Gestão Logística e Fechamento Semanal</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight text-balance">
            Zere os erros e discussões no acerto financeiro dos seus motoboys
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Roteamento viário OSRM preciso sem faturas surpresa de API, fechamento semanal consolidado com PIX e portal individual com 2FA biométrico para cada entregador.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/hardbeerburguer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>Acessar Hamburgueria (/hardbeerburguer)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/phyto-formula"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Pill className="w-4 h-4 text-emerald-500" />
              <span>Ver Farmácia (/phyto-formula)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} EntregueJá SaaS · Next.js 14 App Router & Prisma Multi-Tenant</p>
      </footer>
    </div>
  );
}
