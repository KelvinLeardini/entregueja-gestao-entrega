import React, { useState } from 'react';
import {
  PlayCircle,
  ArrowLeft,
  Navigation,
  Send,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Zap,
  Trash2,
  Layers,
  MapPin,
  Clock,
  Bike,
} from 'lucide-react';
import { TenantStore, Delivery, OrderSource } from '../types';
import { calculateRouteWithOSRM } from '../services/osrm';

interface DevSandboxViewProps {
  tenants: TenantStore[];
  onBackToDevAdmin: () => void;
  onSeedOrders: (targetSlug: string, count: number) => void;
  onClearOrders: (targetSlug: string) => void;
  onSimulateWebhook: (payload: {
    targetSlug: string;
    source: OrderSource;
    customerName: string;
    address: string;
    orderNumber: string;
  }) => void;
}

export const DevSandboxView: React.FC<DevSandboxViewProps> = ({
  tenants,
  onBackToDevAdmin,
  onSeedOrders,
  onClearOrders,
  onSimulateWebhook,
}) => {
  const [selectedSlug, setSelectedSlug] = useState<string>(tenants[0]?.slug || 'hardbeerburguer');

  // Testador OSRM
  const [testOrigin, setTestOrigin] = useState('R. Dr. Fábio Montenegro, 32 - Vila Guilhermina, São Paulo - SP');
  const [testDestination, setTestDestination] = useState('Av. Paulista, 1578 - Bela Vista, São Paulo - SP');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [osrmResult, setOsrmResult] = useState<{
    distanceKm: number;
    durationMinutes: number;
    source: string;
    calculatedFee: number;
  } | null>(null);

  // Disparador de Webhook
  const [webhookSource, setWebhookSource] = useState<OrderSource>('IFOOD');
  const [customerName, setCustomerName] = useState('Juliana Paes (Cliente Sandbox)');
  const [deliveryAddress, setDeliveryAddress] = useState('Rua Apucarana, 900 - Tatuapé, São Paulo - SP');
  const [orderNumber, setOrderNumber] = useState(() => 'SB-' + Math.floor(1000 + Math.random() * 9000));
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  // Status de Seeding
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  const currentTenant = tenants.find((t) => t.slug === selectedSlug) || tenants[0];

  const handleTestOSRM = async () => {
    setIsCalculatingRoute(true);
    setOsrmResult(null);
    try {
      // Coordenadas simuladas de teste (Origem: Vila Guilhermina / Destino: Tatuapé)
      const res = await calculateRouteWithOSRM(
        { latitude: currentTenant?.originLat || -23.5334, longitude: currentTenant?.originLng || -46.5153 },
        { latitude: -23.5412, longitude: -46.5654 }
      );

      const fee =
        (currentTenant?.defaultBaseFee || 6.0) +
        res.distanceKm * (currentTenant?.defaultKmRate || 1.5);

      setOsrmResult({
        distanceKm: res.distanceKm,
        durationMinutes: res.durationMinutes,
        source: res.source,
        calculatedFee: Math.max(fee, currentTenant?.defaultBaseFee || 6.0),
      });
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleTriggerWebhook = () => {
    onSimulateWebhook({
      targetSlug: selectedSlug,
      source: webhookSource,
      customerName,
      address: deliveryAddress,
      orderNumber,
    });
    setWebhookStatus(`Pedido ${orderNumber} despachado com sucesso para a loja /${selectedSlug}!`);
    setOrderNumber('SB-' + Math.floor(1000 + Math.random() * 9000));
    setTimeout(() => setWebhookStatus(null), 4000);
  };

  const handleSeed = (count: number) => {
    onSeedOrders(selectedSlug, count);
    setSeedStatus(`Sucesso! ${count} entregas geradas no banco do comércio /${selectedSlug}.`);
    setTimeout(() => setSeedStatus(null), 4000);
  };

  const handleClear = () => {
    if (confirm(`Tem certeza que deseja limpar os pedidos de teste da loja /${selectedSlug}?`)) {
      onClearOrders(selectedSlug);
      setSeedStatus(`Pedidos da loja /${selectedSlug} limpos com sucesso.`);
      setTimeout(() => setSeedStatus(null), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDevAdmin}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <span>Sandbox de Testes do Desenvolvedor</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ambiente Isolado
                </span>
              </h1>
              <span className="text-xs text-slate-400">
                Disparo de Ações, Simulação OSRM e Gerador de Dados Fake
              </span>
            </div>
          </div>
        </div>

        {/* Seletor do Tenant Alvo da Sandbox */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Comércio Alvo:</span>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-amber-400 font-bold focus:outline-none"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name} (/{t.slug})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Grid de Ferramentas de Teste */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ferramenta 1: Testador de Rotas OSRM */}
        <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
            <Navigation className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="font-bold text-sm text-white">1. Testador de Rotas e Taxas OSRM</h2>
              <span className="text-xs text-slate-400">Valide o cálculo viário real vs tabela de faixas</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Ponto de Origem (Expedição)</label>
              <input
                type="text"
                value={testOrigin}
                onChange={(e) => setTestOrigin(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Ponto de Destino (Cliente)</label>
              <input
                type="text"
                value={testDestination}
                onChange={(e) => setTestDestination(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
              />
            </div>

            <button
              onClick={handleTestOSRM}
              disabled={isCalculatingRoute}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isCalculatingRoute ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calculando Rota no Motor OSRM...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Disparar Cálculo de Rota OSRM</span>
                </>
              )}
            </button>

            {osrmResult && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Rota Viária Calculada
                  </span>
                  <span className="font-mono text-[11px] uppercase">{osrmResult.source}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono-numbers">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Distância</span>
                    <div className="text-base font-bold text-white">{osrmResult.distanceKm} km</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Tempo Médio</span>
                    <div className="text-base font-bold text-white">{osrmResult.durationMinutes} min</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Taxa Calculada</span>
                    <div className="text-base font-bold text-emerald-400">
                      R$ {osrmResult.calculatedFee.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ferramenta 2: Disparador de Webhooks Fictícios */}
        <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
            <Send className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold text-sm text-white">2. Disparador de Webhooks (iFood / 99 / WhatsApp)</h2>
              <span className="text-xs text-slate-400">Simule a chegada de um pedido na expedição</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Origem do Pedido</label>
                <select
                  value={webhookSource}
                  onChange={(e) => setWebhookSource(e.target.value as OrderSource)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="IFOOD">iFood (ORDER_PLACED)</option>
                  <option value="99FOOD">99Food Partner API</option>
                  <option value="KEETA">Keeta Delivery</option>
                  <option value="SISTEMA_LOCAL">WhatsApp / Pedido Direto</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nº Comanda</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nome do Cliente</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Endereço de Entrega</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <button
              onClick={handleTriggerWebhook}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Forçar Disparo de Webhook para /{selectedSlug}</span>
            </button>

            {webhookStatus && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{webhookStatus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ferramenta 3: Gerador de Dados Fake & Reset (Data Seeder) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
            <Database className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="font-bold text-sm text-white">3. Gerador de Massa de Dados (Data Seeder)</h2>
              <span className="text-xs text-slate-400">
                Popule entregas aleatórias para simular pico de expedição e fechar acertos
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button
              onClick={() => handleSeed(5)}
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Popular +5 Entregas Rápidas</span>
            </button>

            <button
              onClick={() => handleSeed(15)}
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold flex items-center gap-2 transition-colors"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Simular Pico Noturno (+15 Pedidos)</span>
            </button>

            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800 text-red-300 font-semibold flex items-center gap-2 transition-colors ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>Resetar Pedidos da Loja /{selectedSlug}</span>
            </button>
          </div>

          {seedStatus && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{seedStatus}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
