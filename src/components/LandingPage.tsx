import React, { useState } from 'react';
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
  DollarSign,
  Sun,
  Moon,
  MessageCircle,
  PlayCircle,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToDemo: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToDemo,
  theme,
  onToggleTheme,
}) => {
  // Calculadora interativa de ROI para donos de delivery
  const [dailyDeliveries, setDailyDeliveries] = useState(40);
  const [courierCount, setCourierCount] = useState(4);

  // Estimativa baseada em mercado:
  // - Evita divergências manuais médias de R$ 0,65 por entrega (km errado, arredondamentos "no olho")
  // - Economiza 3.5 horas semanais por motoboy gastas fechando caderninho e calculando comanda a comanda
  const monthlyDeliveries = dailyDeliveries * 26;
  const estimatedMoneySaved = Math.round(monthlyDeliveries * 0.65);
  const hoursSavedPerMonth = Math.round(courierCount * 3.5);

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-amber-500/20 selection:text-amber-600">
      {/* 1. Header do SaaS - Contrato Estrito de 3 Zonas (Zero links para lojas / Zero links admin) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zona 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm shadow-amber-500/20">
              <Bike className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight whitespace-nowrap">
              Entregue<span className="text-amber-500">Já</span>
            </span>
          </div>

          {/* Zona 2: Links de Navegação */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => handleScrollToSection('solucao')}
              className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Solução
            </button>
            <button
              onClick={() => handleScrollToSection('como-funciona')}
              className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Como Funciona
            </button>
            <button
              onClick={() => handleScrollToSection('calculadora')}
              className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Simulador ROI
            </button>
            <button
              onClick={() => handleScrollToSection('planos')}
              className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Planos
            </button>
            <button
              onClick={() => handleScrollToSection('faq')}
              className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Dúvidas
            </button>
          </nav>

          {/* Zona 3: Ação Primária (Testar Demonstração Grátis) + Toggle de Tema */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onToggleTheme}
              aria-label="Alternar tema"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onNavigateToDemo}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-lg shadow-sm shadow-amber-500/20 transition-all whitespace-nowrap"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Testar Demonstração Grátis</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section de Alta Conversão B2B */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Software para Hamburguerias, Pizzarias, Farmácias e Restaurantes</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance leading-tight">
              Zere os erros e discussões no acerto financeiro dos seus motoboys
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              O EntregueJá automatiza o cálculo de taxas por KM real via OSRM sem cobranças caras do Google, consolida o fechamento semanal em 1 clique com PIX e oferece um portal com código PIN para o entregador auditar cada corrida no celular dele.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onNavigateToDemo}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Testar Demonstração do Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleScrollToSection('calculadora')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Calculator className="w-4 h-4 text-amber-500" />
                <span>Calcular Quanto Vou Economizar</span>
              </button>
            </div>

            {/* Metadados Limpos (Zero-Pill Discipline) */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Zero taxa por corrida</span>
              <span aria-hidden="true">·</span>
              <span>Roteamento viário OSRM gratuito</span>
              <span aria-hidden="true">·</span>
              <span>Portal com PIN 2FA para o Motoboy</span>
              <span aria-hidden="true">·</span>
              <span>Fechamento PIX em segundos</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Dores do Dono de Delivery vs Solução do EntregueJá */}
      <section id="solucao" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Por que o caderninho e as planilhas estão custando caro?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              O acerto manual de entregas desgasta o relacionamento com seus motoboys e consome horas que você deveria usar para faturar mais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Fim do Domingo Fechando Comandas
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Chega de somar 500 canhotos de papel e discutir comanda por comanda. O sistema agrupa todas as entregas por motoboy automaticamente com relatórios claros.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cálculo Real de Rota Viária
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Roteamento por KM viário real (não linha reta). Acabe de vez com o motoboy reclamando que "tal bairro é mais longe do que o valor pago".
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Transparência com Portal Exclusivo
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Cada motoboy recebe um link único protegido por código de 6 dígitos. Ele audita cada entrega concluída e sabe exatamente quanto tem a receber.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Como Funciona (O Fluxo em 4 Etapas) */}
      <section id="como-funciona" className="py-16 sm:py-24 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Simples, rápido e feito para a correria do balcão
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Desenvolvido para operar em noites de pico sem travar sua expedição de pedidos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <span className="text-3xl font-extrabold text-amber-500 font-mono-numbers">01.</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Entrada do Pedido</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                O pedido chega pelo iFood, 99Food ou balcão manual. O endereço é geocodificado no mapa imediatamente.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-3xl font-extrabold text-amber-500 font-mono-numbers">02.</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cálculo Preciso da Taxa</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                O motor OSRM calcula a quilometragem viária exata e aplica a tabela de taxas configurada para o seu estabelecimento.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-3xl font-extrabold text-amber-500 font-mono-numbers">03.</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Despacho ao Motoboy</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                O operador seleciona o motoboy na fila. O entregador recebe a corrida no link exclusivo dele com confirmação por código.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-3xl font-extrabold text-amber-500 font-mono-numbers">04.</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fechamento PIX em 1 Clique</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                No dia de pagamento, abra o Fechamento Semanal. O sistema gera a folha completa com o valor exato e botão para copiar a chave PIX.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={onNavigateToDemo}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all shadow-sm shadow-amber-500/20"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Ver Este Fluxo Funcionando no Teste Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Calculadora de Economia e ROI */}
      <section id="calculadora" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
                  <Calculator className="w-4 h-4" />
                  <span>Simulador de Retorno do Investimento</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Quanto tempo e dinheiro você recupera todo mês?
                </h3>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium">
                Cálculo em tempo real
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
              {/* Sliders de Entrada */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-slate-700 dark:text-slate-300">Entregas por dia (média):</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono-numbers">{dailyDeliveries} pedidos/dia</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="5"
                    value={dailyDeliveries}
                    onChange={(e) => setDailyDeliveries(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono-numbers">
                    <span>10/dia</span>
                    <span>75/dia</span>
                    <span>150+/dia</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-slate-700 dark:text-slate-300">Quantidade de motoboys ativos:</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono-numbers">{courierCount} motoboys</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={courierCount}
                    onChange={(e) => setCourierCount(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono-numbers">
                    <span>1</span>
                    <span>7</span>
                    <span>15+</span>
                  </div>
                </div>
              </div>

              {/* Indicadores de Resultado */}
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-6 border border-slate-100 dark:border-slate-800 flex flex-col justify-center space-y-6">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Economia Estimada por Mês
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono-numbers mt-1">
                    R$ {estimatedMoneySaved.toLocaleString('pt-BR')},00
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Evitando divergências de KM e erros de fechamento manual em {monthlyDeliveries} entregas.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Tempo Economizado no Fechamento
                  </span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono-numbers mt-1">
                    ~{hoursSavedPerMonth} horas livres / mês
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Horas recuperadas para você focar nas vendas e na gestão do seu comércio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Planos de Assinatura */}
      <section id="planos" className="py-16 sm:py-24 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Assinatura fixa sem cobrança por pedido
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Diferente de outras plataformas, você não paga nenhuma comissão sobre suas taxas de entrega.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Plano Essencial */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Iniciante</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Essencial</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">R$ 89</span>
                  <span className="text-xs text-slate-500">/mês</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Para deliverys de bairro em crescimento.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Até 3 motoboys ativos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Cálculo de rota OSRM ilimitado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Fechamento semanal com PIX</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onNavigateToDemo}
                className="mt-8 w-full py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Testar na Demonstração
              </button>
            </div>

            {/* Plano Pro (Destaque) */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-500 shadow-md shadow-amber-500/10 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">
                Mais Escolhido
              </div>

              <div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Operação Completa</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Profissional</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">R$ 149</span>
                  <span className="text-xs text-slate-500">/mês</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Para deliverys de alto volume diário.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span><strong>Motoboys ilimitados</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span><strong>Portal Exclusivo com 2FA</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Integrações iFood, 99Food e PDVs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Separação de Balcão e Admin</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onNavigateToDemo}
                className="mt-8 w-full py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-sm transition-all"
              >
                Testar Grátis Agora
              </button>
            </div>

            {/* Plano Redes / Enterprise */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Multi-Unidades</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Franquias & Redes</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">R$ 279</span>
                  <span className="text-xs text-slate-500">/mês</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Para redes e franquias com múltiplas lojas.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Multi-lojas centralizadas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Suporte direto via WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Setup assistido pelo desenvolvedor</span>
                  </li>
                </ul>
              </div>

              <a
                href="https://wa.me/5511999990000?text=Olá,%20tenho%20interesse%20no%20EntregueJá%20para%20minha%20rede%20de%20lojas."
                target="_blank"
                rel="noreferrer"
                className="mt-8 w-full py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors text-center block"
              >
                Falar com Especialista
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Perguntas frequentes
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Tudo o que você precisa saber antes de implantar no seu comércio.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Como meu comércio é cadastrado no sistema?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                O provisionamento da sua loja é feito diretamente pelo nosso time técnico. Você recebe um link exclusivo e seguro (exemplo: www.entregueja.com/seu-comercio) com todo o setup de taxas, endereço de partida e motoboys já configurado.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                O motoboy precisa instalar algum aplicativo pesado no celular?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Não. Ele acessa uma página web leve através do link exclusivo dele, autentica com o código PIN de 6 dígitos dele e já visualiza as entregas atribuídas, histórico de taxas e o valor total acumulado no dia.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                O cálculo de rota cobra taxa do Google Maps?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Não. Utilizamos o motor viário OSRM e OpenStreetMap, que é 100% gratuito e calcula a quilometragem real percorrida por vias públicas, sem gerar surpresas na sua fatura.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Rodapé Institucional Sem Links Internos Secretos */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bike className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-900 dark:text-white">EntregueJá</span>
            <span>· Hub de Logística e Acerto de Motoboys</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => handleScrollToSection('solucao')} className="hover:text-amber-500 transition-colors">
              Solução
            </button>
            <button onClick={() => handleScrollToSection('calculadora')} className="hover:text-amber-500 transition-colors">
              Simulador
            </button>
            <button onClick={onNavigateToDemo} className="hover:text-amber-500 font-semibold transition-colors">
              Testar Demonstração
            </button>
          </div>

          <div>
            © {new Date().getFullYear()} EntregueJá. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};
