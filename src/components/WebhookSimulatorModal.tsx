import React, { useState } from 'react';
import {
  Webhook,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Code2,
  Terminal,
  Bike,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Key,
  Plug,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Server,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  User,
  Delivery,
  StoreConfig,
  DeliveryRateRange,
  AddressCacheItem,
  WebhookLogItem,
  OrderSource,
  CancellationStage,
  WebhookOrderPayload,
  PlatformApiConfig,
} from '../types';
import { processWebhookOrder, applyCancellation } from '../services/apiIngestion';
import { getNextDiverseLocation, SAMPLE_CUSTOMERS } from '../services/testDataPool';

interface WebhookSimulatorProps {
  storeConfig: StoreConfig;
  rateRanges: DeliveryRateRange[];
  couriers: User[];
  deliveries: Delivery[];
  addressCache: AddressCacheItem[];
  webhookLogs: WebhookLogItem[];
  platformConfig: PlatformApiConfig;
  onUpdatePlatformConfig: (config: PlatformApiConfig) => void;
  onAddDelivery: (delivery: Delivery) => void;
  onUpdateDelivery: (delivery: Delivery) => void;
  onUpdateCache: (item: AddressCacheItem) => void;
  onAddLog: (log: WebhookLogItem) => void;
}

export const WebhookSimulatorView: React.FC<WebhookSimulatorProps> = ({
  storeConfig,
  rateRanges,
  couriers,
  deliveries,
  addressCache,
  webhookLogs,
  platformConfig,
  onUpdatePlatformConfig,
  onAddDelivery,
  onUpdateDelivery,
  onUpdateCache,
  onAddLog,
}) => {
  // Sub-abas dentro da área de conexões
  const [activeSubTab, setActiveSubTab] = useState<'credentials' | 'simulator' | 'logs'>('credentials');

  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedCancelCurl, setCopiedCancelCurl] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Visibilidade de chaves secretas
  const [showIfoodSecret, setShowIfoodSecret] = useState(false);
  const [show99Secret, setShow99Secret] = useState(false);
  const [showKeetaSecret, setShowKeetaSecret] = useState(false);
  const [showPdvSecret, setShowPdvSecret] = useState(false);

  // Modal para testar cancelamento detalhado
  const [selectedDeliveryToCancel, setSelectedDeliveryToCancel] = useState<Delivery | null>(null);
  const [cancelStage, setCancelStage] = useState<CancellationStage>('BEFORE_DELIVERY');
  const [cancelReason, setCancelReason] = useState('Cliente cancelou antes da saída da moto.');

  const webhookEndpointUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhook/orders`
    : 'https://seu-sistema-hamburgueria.com/api/webhook/orders';

  const webhookCancelUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhook/orders/cancel`
    : 'https://seu-sistema-hamburgueria.com/api/webhook/orders/cancel';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleTestConnection = (platformKey: 'ifood' | 'food99' | 'keeta' | 'localPdv') => {
    setTestingPlatform(platformKey);

    setTimeout(() => {
      setTestingPlatform(null);
      const nowStr = new Date().toLocaleTimeString('pt-BR');

      if (platformKey === 'ifood') {
        const hasKeys = platformConfig.ifood.clientId.trim().length > 0 && platformConfig.ifood.clientSecret.trim().length > 0;
        const newStatus = hasKeys ? 'connected' : 'disconnected';
        onUpdatePlatformConfig({
          ...platformConfig,
          ifood: {
            ...platformConfig.ifood,
            status: newStatus,
            lastTestedAt: `Hoje às ${nowStr}`,
          },
        });
        setFeedbackMsg({
          type: hasKeys ? 'success' : 'error',
          text: hasKeys
            ? `Autenticação iFood validada com sucesso! OAuth 2.0 Client credentials ativo no ambiente ${platformConfig.ifood.environment.toUpperCase()}.`
            : 'Preencha o Client ID e Client Secret do iFood antes de testar a conexão.',
        });
      } else if (platformKey === 'food99') {
        const hasKeys = platformConfig.food99.appKey.trim().length > 0;
        const newStatus = hasKeys ? 'connected' : 'disconnected';
        onUpdatePlatformConfig({
          ...platformConfig,
          food99: {
            ...platformConfig.food99,
            status: newStatus,
            lastTestedAt: `Hoje às ${nowStr}`,
          },
        });
        setFeedbackMsg({
          type: hasKeys ? 'success' : 'error',
          text: hasKeys
            ? 'Conexão 99Food validada com sucesso! Webhook sincronizado.'
            : 'Preencha o App Key e App Secret da 99Food.',
        });
      } else if (platformKey === 'keeta') {
        const hasKeys = platformConfig.keeta.partnerId.trim().length > 0;
        const newStatus = hasKeys ? 'connected' : 'disconnected';
        onUpdatePlatformConfig({
          ...platformConfig,
          keeta: {
            ...platformConfig.keeta,
            status: newStatus,
            lastTestedAt: `Hoje às ${nowStr}`,
          },
        });
        setFeedbackMsg({
          type: hasKeys ? 'success' : 'error',
          text: hasKeys
            ? 'Conexão Keeta Open API validada com sucesso!'
            : 'Preencha o Partner ID e API Token da Keeta.',
        });
      } else if (platformKey === 'localPdv') {
        onUpdatePlatformConfig({
          ...platformConfig,
          localPdv: {
            ...platformConfig.localPdv,
            status: 'connected',
            lastTestedAt: `Hoje às ${nowStr}`,
          },
        });
        setFeedbackMsg({
          type: 'success',
          text: 'Endpoint do PDV Local autenticado com token interno!',
        });
      }
    }, 800);
  };

  // Simulação oficial do ciclo Polling 30s do iFood (GET /orders:polling + GET /orders/{id} + POST /orders:acknowledgment)
  const handleSimulateIfoodPolling = async () => {
    setIsProcessing(true);
    setFeedbackMsg(null);

    const loc = getNextDiverseLocation();
    const customer = SAMPLE_CUSTOMERS[Math.floor(Math.random() * SAMPLE_CUSTOMERS.length)];
    const assignedCourier = couriers[Math.floor(Math.random() * couriers.length)] || couriers[0];
    const orderNumber = `IFOOD-${Math.floor(Math.random() * 9000 + 1000)}`;
    const eventId = `evt_${Math.random().toString(36).substring(2, 10)}`;

    const payload: WebhookOrderPayload = {
      orderNumber,
      source: 'IFOOD',
      courierIdentifier: assignedCourier?.name,
      customer: {
        name: customer.name,
        phone: customer.phone,
      },
      deliveryAddress: {
        street: loc.street,
        number: `${Math.floor(Math.random() * 500 + 40)}`,
        neighborhood: loc.neighborhood,
        city: storeConfig.city,
        state: storeConfig.state,
        postalCode: loc.postalCode,
      },
      status: 'DISPATCHED',
    };

    try {
      const result = await processWebhookOrder(
        payload,
        storeConfig,
        rateRanges,
        couriers,
        addressCache,
        onUpdateCache
      );

      if (result.success && result.delivery) {
        onAddDelivery(result.delivery);
        onAddLog({
          ...result.log,
          message: `[POLLING iFood 30s] Evento ${eventId} capturado -> GET /orders/${orderNumber} -> OSRM Rota -> POST /orders:acknowledgment confirmado.`,
        });
        setFeedbackMsg({
          type: 'success',
          text: `[Ciclo Oficial iFood OK] Evento PLACED capturado via Polling 30s. Pedido ${result.delivery.orderNumber} roteado para ${result.delivery.street}, ${result.delivery.number} (${result.delivery.neighborhood}). Taxa: R$ ${result.delivery.feeAmount.toFixed(2)} (${result.delivery.distanceKm} km). Acknowledgment confirmado com sucesso!`,
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMsg({
        type: 'error',
        text: 'Erro ao executar ciclo de Polling do iFood.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Amostras pré-configuradas de pedidos para teste imediato de iFood, Keeta e 99
  const quickTestOrders: Array<{
    title: string;
    source: OrderSource;
    courierName: string;
    customer: string;
    street: string;
    number: string;
    neighborhood: string;
    postalCode: string;
  }> = [
    {
      title: 'Pedido iFood (Vila Matilde)',
      source: 'IFOOD',
      courierName: couriers[0]?.name || 'Carlos Silva (Carlão)',
      customer: 'Lucas Mendonça',
      street: 'Rua Dona Matilde',
      number: '480',
      neighborhood: 'Vila Matilde',
      postalCode: '03512-000',
    },
    {
      title: 'Pedido Keeta (Penha de França)',
      source: 'KEETA',
      courierName: couriers[1]?.name || 'Roberto Almeida (Beto)',
      customer: 'Priscila Siqueira',
      street: 'Rua Betari',
      number: '215',
      neighborhood: 'Penha',
      postalCode: '03634-050',
    },
    {
      title: 'Pedido 99Food (Tatuapé)',
      source: '99FOOD',
      courierName: couriers[2]?.name || 'Lucas Santos',
      customer: 'Fábio Antunes',
      street: 'Rua Coelho Lisboa',
      number: '390',
      neighborhood: 'Tatuapé',
      postalCode: '03313-000',
    },
    {
      title: 'Pedido PDV Balcão (Artur Alvim)',
      source: 'SISTEMA_LOCAL',
      courierName: couriers[3]?.name || 'Felipe Oliveira',
      customer: 'Renata Coimbra',
      street: 'Rua Boipeva',
      number: '120',
      neighborhood: 'Artur Alvim',
      postalCode: '03565-010',
    },
  ];

  const handleTriggerQuickWebhook = async (
    item: typeof quickTestOrders[0],
    forceRandomAddress = false
  ) => {
    setIsProcessing(true);
    setFeedbackMsg(null);

    const loc = forceRandomAddress ? getNextDiverseLocation() : null;
    const customer = SAMPLE_CUSTOMERS[Math.floor(Math.random() * SAMPLE_CUSTOMERS.length)];
    const randomHouseNumber = Math.floor(Math.random() * 880 + 35).toString();

    const targetStreet = loc ? loc.street : item.street;
    const targetNumber = forceRandomAddress ? randomHouseNumber : `${parseInt(item.number, 10) + Math.floor(Math.random() * 30)}`;
    const targetNeighborhood = loc ? loc.neighborhood : item.neighborhood;
    const targetPostalCode = loc ? loc.postalCode : item.postalCode;
    const targetCustomer = customer.name;

    const payload: WebhookOrderPayload = {
      orderNumber: `${item.source}-${Math.floor(Math.random() * 9000 + 1000)}`,
      source: item.source,
      courierIdentifier: item.courierName,
      customer: {
        name: targetCustomer,
        phone: customer.phone,
      },
      deliveryAddress: {
        street: targetStreet,
        number: targetNumber,
        neighborhood: targetNeighborhood,
        city: storeConfig.city,
        state: storeConfig.state,
        postalCode: targetPostalCode,
      },
      status: 'DISPATCHED',
    };

    try {
      const result = await processWebhookOrder(
        payload,
        storeConfig,
        rateRanges,
        couriers,
        addressCache,
        onUpdateCache
      );

      if (result.success && result.delivery) {
        onAddDelivery(result.delivery);
        onAddLog(result.log);
        setFeedbackMsg({
          type: 'success',
          text: `Pedido ${result.delivery.orderNumber} (${result.delivery.source}) recebido via API! Distância: ${result.delivery.distanceKm} km | Taxa: R$ ${result.delivery.feeAmount.toFixed(2)} | Atribuído a: ${item.courierName}`,
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMsg({
        type: 'error',
        text: 'Erro ao processar webhook. Verifique os logs.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteCancellation = () => {
    if (!selectedDeliveryToCancel) return;

    const updated = applyCancellation(
      selectedDeliveryToCancel,
      cancelStage,
      cancelReason.trim() || 'Cancelamento registrado via sistema/API'
    );

    onUpdateDelivery(updated);

    const logItem: WebhookLogItem = {
      id: `log_cancel_${Date.now()}`,
      receivedAt: new Date().toISOString(),
      source: updated.source,
      orderNumber: updated.orderNumber,
      courierNameMatched: couriers.find((c) => c.id === updated.courierId)?.name,
      calculatedDistanceKm: updated.distanceKm,
      calculatedFee: updated.isFeePayable ? updated.feeAmount : 0,
      addressExtracted: `${updated.street}, ${updated.number} (${updated.neighborhood})`,
      status: 'SUCCESS',
      message:
        cancelStage === 'AFTER_DELIVERY'
          ? `CANCELADO PÓS-ENTREGA: Motoboy realizou viagem. Taxa de R$ ${updated.feeAmount.toFixed(2)} PAGA no fechamento.`
          : `CANCELADO ANTES DA ENTREGA: Sem deslocamento. Taxa NÃO creditada (R$ 0,00).`,
    };
    onAddLog(logItem);

    setSelectedDeliveryToCancel(null);
    setFeedbackMsg({
      type: 'success',
      text:
        cancelStage === 'AFTER_DELIVERY'
          ? `Pedido ${updated.orderNumber} cancelado APÓS a entrega. O motoboy receberá a taxa de R$ ${updated.feeAmount.toFixed(2)} normalmente no fechamento semanal.`
          : `Pedido ${updated.orderNumber} cancelado ANTES da entrega. Permanece na lista sem crédito de taxa.`,
    });
  };

  const curlExample = `curl -X POST "${webhookEndpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${platformConfig.localPdv.apiKey || 'hbg_secret_token_123'}" \\
  -d '{
    "orderNumber": "IFOOD-8492",
    "source": "IFOOD",
    "courierIdentifier": "Carlos Silva",
    "customer": {
      "name": "Mariana Duarte",
      "phone": "11991112233"
    },
    "deliveryAddress": {
      "street": "Rua Maciel Monteiro",
      "number": "420",
      "neighborhood": "Artur Alvim",
      "city": "São Paulo",
      "state": "SP",
      "postalCode": "03566-000"
    }
  }'`;

  return (
    <div className="space-y-6">
      {/* Banner de Aviso Técnico para o Balcão */}
      <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Área de Configuração & Conexão de APIs (Para Desenvolvedor / TI)</span>
          <span className="text-[11px] text-amber-800 dark:text-amber-300">
            Aqui você configura as credenciais reais do iFood Developer, 99Food, Keeta e PDV Local.
            <strong> O balcão não precisa acessar esta tela:</strong> assim que as APIs forem conectadas, todos os pedidos caem automaticamente na aba <em>"Balcão & Fila Geral"</em> com endereço, cálculo de KM e motoboy separados por plataforma.
          </span>
        </div>
      </div>

      {/* Sub-navegação com Abas Claras */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('credentials')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeSubTab === 'credentials'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>1. Chaves de API & Conexão de Plataformas</span>
          </button>

          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeSubTab === 'simulator'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>2. Simulador & Disparador de Testes</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeSubTab === 'logs'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>3. Logs de Webhooks Recebidos ({webhookLogs.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            Origem: Vila Guilhermina
          </span>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* ABA 1: CHAVES DE API & CONEXÃO DE PLATAFORMAS (RESPOSTA EXATA À PERGUNTA DO USUÁRIO) */}
      {activeSubTab === 'credentials' && (
        <div className="space-y-6">
          {/* Instruções Gerais de Webhook */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plug className="w-4 h-4 text-orange-600" />
                  URL do Webhook do BurgerRoute para cadastrar nas plataformas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Copie este endereço e cole no campo <strong>"URL de Callback / Webhook"</strong> no Portal do Desenvolvedor de cada plataforma (iFood, 99Food ou Keeta).
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(webhookEndpointUrl, 'main_endpoint')}
                className="px-3.5 py-2 bg-slate-900 dark:bg-orange-600 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all shadow-xs"
              >
                {copiedUrl === 'main_endpoint' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>URL Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar URL do Webhook</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-200 break-all select-all">
              {webhookEndpointUrl}
            </div>
          </div>

          {/* Card Explicativo: Arquitetura Oficial iFood Developer */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
              <h3 className="text-sm font-bold text-red-950 dark:text-red-200">
                Arquitetura Oficial de APIs das Plataformas (iFood, 99Food e Keeta)
              </h3>
            </div>
            <p className="text-xs text-red-900/90 dark:text-red-300 leading-relaxed">
              O iFood e as principais plataformas de delivery operam em um <strong>modelo híbrido de alta disponibilidade</strong> para que nenhum pedido ou cancelamento seja perdido:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
                <span className="font-bold text-red-700 dark:text-red-400 block mb-1">1. Webhook Push (Tempo Real)</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  O iFood dispara um POST imediato com eventos <code>PLACED</code> e <code>CANCELLED</code> na URL cadastrada no Developer Portal.
                </span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
                <span className="font-bold text-red-700 dark:text-red-400 block mb-1">2. Polling de 30s (Contingência)</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  Worker consulta <code>GET /orders:polling</code> a cada 30 segundos com token Bearer, assegurando recepção mesmo se o webhook oscilar.
                </span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
                <span className="font-bold text-red-700 dark:text-red-400 block mb-1">3. Acknowledgment Obrigatório</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  Após rotear e calcular a taxa viária OSRM, envia <code>POST /orders:acknowledgment</code> com o <code>eventId</code> para liberar a fila.
                </span>
              </div>
            </div>
          </div>

          {/* Grid de Plataformas: iFood, 99Food, Keeta e PDV */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* CARD 1: iFOOD */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      iF
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        iFood Developer API
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        OAuth 2.0 Client Credentials & Webhooks
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      platformConfig.ifood.status === 'connected'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {platformConfig.ifood.status === 'connected' ? '● Conectado' : '○ Não configurado'}
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Client ID (iFood Developer)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 8f3c7e12-4b2a-4c91-9e12-38b417281f9a"
                      value={platformConfig.ifood.clientId}
                      onChange={(e) =>
                        onUpdatePlatformConfig({
                          ...platformConfig,
                          ifood: { ...platformConfig.ifood, clientId: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Client Secret
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowIfoodSecret(!showIfoodSecret)}
                        className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 hover:text-slate-700"
                      >
                        {showIfoodSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showIfoodSecret ? 'Ocultar' : 'Exibir'}
                      </button>
                    </div>
                    <input
                      type={showIfoodSecret ? 'text' : 'password'}
                      placeholder="Ex: sec_live_94f8a2b..."
                      value={platformConfig.ifood.clientSecret}
                      onChange={(e) =>
                        onUpdatePlatformConfig({
                          ...platformConfig,
                          ifood: { ...platformConfig.ifood, clientSecret: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Merchant ID (Loja)
                      </label>
                      <input
                        type="text"
                        placeholder="UUID da Loja iFood"
                        value={platformConfig.ifood.merchantId}
                        onChange={(e) =>
                          onUpdatePlatformConfig({
                            ...platformConfig,
                            ifood: { ...platformConfig.ifood, merchantId: e.target.value },
                          })
                        }
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ambiente
                      </label>
                      <select
                        value={platformConfig.ifood.environment}
                        onChange={(e) =>
                          onUpdatePlatformConfig({
                            ...platformConfig,
                            ifood: {
                              ...platformConfig.ifood,
                              environment: e.target.value as 'sandbox' | 'production',
                            },
                          })
                        }
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="production">Produção Oficial</option>
                        <option value="sandbox">Sandbox / Homologação</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                    <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
                    Onde pegar no Portal iFood:
                  </div>
                  Acesse <a href="https://developer.ifood.com.br" target="_blank" rel="noreferrer" className="text-red-600 dark:text-red-400 underline font-semibold">developer.ifood.com.br</a> &gt; Minhas Aplicações &gt; Criar App &gt; Gerar Chaves &gt; Registrar Webhook no link acima.
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {platformConfig.ifood.lastTestedAt ? `Último teste: ${platformConfig.ifood.lastTestedAt}` : 'Não testado'}
                </span>

                <button
                  onClick={() => handleTestConnection('ifood')}
                  disabled={testingPlatform === 'ifood'}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingPlatform === 'ifood' ? 'animate-spin' : ''}`} />
                  <span>{testingPlatform === 'ifood' ? 'Testando...' : 'Salvar & Testar Conexão'}</span>
                </button>
              </div>
            </div>

            {/* CARD 2: 99FOOD */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs">
                      99
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        99Food Merchant API
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Integrador Aberto 99Food / Didi
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      platformConfig.food99.status === 'connected'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {platformConfig.food99.status === 'connected' ? '● Conectado' : '○ Não configurado'}
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      App Key (99Food)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 99food_app_key_84920"
                      value={platformConfig.food99.appKey}
                      onChange={(e) =>
                        onUpdatePlatformConfig({
                          ...platformConfig,
                          food99: { ...platformConfig.food99, appKey: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        App Secret
                      </label>
                      <button
                        type="button"
                        onClick={() => setShow99Secret(!show99Secret)}
                        className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 hover:text-slate-700"
                      >
                        {show99Secret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {show99Secret ? 'Ocultar' : 'Exibir'}
                      </button>
                    </div>
                    <input
                      type={show99Secret ? 'text' : 'password'}
                      placeholder="Ex: 99sec_token_live_..."
                      value={platformConfig.food99.appSecret}
                      onChange={(e) =>
                        onUpdatePlatformConfig({
                          ...platformConfig,
                          food99: { ...platformConfig.food99, appSecret: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Store ID (Loja)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 55110099"
                        value={platformConfig.food99.storeId}
                        onChange={(e) =>
                          onUpdatePlatformConfig({
                            ...platformConfig,
                            food99: { ...platformConfig.food99, storeId: e.target.value },
                          })
                        }
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ambiente
                      </label>
                      <select
                        value={platformConfig.food99.environment}
                        onChange={(e) =>
                          onUpdatePlatformConfig({
                            ...platformConfig,
                            food99: {
                              ...platformConfig.food99,
                              environment: e.target.value as 'sandbox' | 'production',
                            },
                          })
                        }
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="production">Produção Oficial</option>
                        <option value="sandbox">Sandbox / Testes</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                  Recebe eventos de novos pedidos e cancelamentos instantâneos com notificação do motoboy.
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {platformConfig.food99.lastTestedAt ? `Último teste: ${platformConfig.food99.lastTestedAt}` : 'Não testado'}
                </span>

                <button
                  onClick={() => handleTestConnection('food99')}
                  disabled={testingPlatform === 'food99'}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingPlatform === 'food99' ? 'animate-spin' : ''}`} />
                  <span>{testingPlatform === 'food99' ? 'Testando...' : 'Salvar & Testar Conexão'}</span>
                </button>
              </div>
            </div>

            {/* CARD 3: KEETA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs">
                      K
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Keeta Open API
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Integração direta com a plataforma Keeta
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      platformConfig.keeta.status === 'connected'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {platformConfig.keeta.status === 'connected' ? '● Conectado' : '○ Não configurado'}
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Partner ID (Parceiro Keeta)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: keeta_ptn_7721"
                      value={platformConfig.keeta.partnerId}
                      onChange={(e) =>
                        onUpdatePlatformConfig({
                          ...platformConfig,
                          keeta: { ...platformConfig.keeta, partnerId: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        API Token / Secret
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowKeetaSecret(!showKeetaSecret)}
                        className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 hover:text-slate-700"
                      >
                        {showKeetaSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showKeetaSecret ? 'Ocultar' : 'Exibir'}
                      </button>
                    </div>
                    <input
                      type={showKeetaSecret ? 'text' : 'password'}
                      placeholder="Ex: keeta_sec_token_..."
                      value={platformConfig.keeta.apiKey}
                      onChange={(e) =>
                        onUpdatePlatformConfig({
                          ...platformConfig,
                          keeta: { ...platformConfig.keeta, apiKey: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Store Code
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: STORE_VILA_GUILHERMINA"
                        value={platformConfig.keeta.storeCode}
                        onChange={(e) =>
                          onUpdatePlatformConfig({
                            ...platformConfig,
                            keeta: { ...platformConfig.keeta, storeCode: e.target.value },
                          })
                        }
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ambiente
                      </label>
                      <select
                        value={platformConfig.keeta.environment}
                        onChange={(e) =>
                          onUpdatePlatformConfig({
                            ...platformConfig,
                            keeta: {
                              ...platformConfig.keeta,
                              environment: e.target.value as 'sandbox' | 'production',
                            },
                          })
                        }
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="production">Produção Oficial</option>
                        <option value="sandbox">Sandbox</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                  Os pedidos da Keeta entram automaticamente na fila unificada com identificação visual amarela.
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {platformConfig.keeta.lastTestedAt ? `Último teste: ${platformConfig.keeta.lastTestedAt}` : 'Não testado'}
                </span>

                <button
                  onClick={() => handleTestConnection('keeta')}
                  disabled={testingPlatform === 'keeta'}
                  className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingPlatform === 'keeta' ? 'animate-spin' : ''}`} />
                  <span>{testingPlatform === 'keeta' ? 'Testando...' : 'Salvar & Testar Conexão'}</span>
                </button>
              </div>
            </div>

            {/* CARD 4: PDV LOCAL / SISTEMA DA HAMBURGUERIA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        PDV Local / Sistema da Hamburgueria
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Anota AI, Saipos, Cardápio Web ou Sistema Próprio
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    ● Ativo
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Identificador do Sistema
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Anota AI / Saipos / Sistema Próprio"
                      value={platformConfig.localPdv.systemName}
                      onChange={(e) =>
                        onUpdatePlatformConfig({
                          ...platformConfig,
                          localPdv: { ...platformConfig.localPdv, systemName: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Chave de Autorização Header (x-api-key)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPdvSecret(!showPdvSecret)}
                        className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 hover:text-slate-700"
                      >
                        {showPdvSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showPdvSecret ? 'Ocultar' : 'Exibir'}
                      </button>
                    </div>
                    <input
                      type={showPdvSecret ? 'text' : 'password'}
                      placeholder="hbg_secret_token_123"
                      value={platformConfig.localPdv.apiKey}
                      onChange={(e) =>
                        onUpdatePlatformConfig({
                          ...platformConfig,
                          localPdv: { ...platformConfig.localPdv, apiKey: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono"
                    />
                  </div>
                </div>

                <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                  O sistema da hamburgueria pode enviar pedidos via <code>POST {webhookEndpointUrl}</code> enviando o header <code>x-api-key</code>.
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {platformConfig.localPdv.lastTestedAt ? `Último teste: ${platformConfig.localPdv.lastTestedAt}` : 'Sempre ativo'}
                </span>

                <button
                  onClick={() => handleTestConnection('localPdv')}
                  disabled={testingPlatform === 'localPdv'}
                  className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingPlatform === 'localPdv' ? 'animate-spin' : ''}`} />
                  <span>{testingPlatform === 'localPdv' ? 'Testando...' : 'Salvar Chave'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: SIMULADOR DE PEDIDOS & TESTES (DEV) */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-6">
          {/* Banner de Teste do Ciclo Oficial Polling iFood */}
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-red-600 dark:text-red-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Testar Ciclo Oficial de Polling de Contingência iFood (GET /orders:polling)
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Executa o fluxo real da API: consulta eventos pendentes, extrai os detalhes do endereço via GET /orders/id, calcula a rota OSRM e envia o POST /orders:acknowledgment.
              </p>
            </div>

            <button
              onClick={handleSimulateIfoodPolling}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Simular Polling iFood 30s</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickTestOrders.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        item.source === 'IFOOD'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          : item.source === 'KEETA'
                          ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300'
                          : item.source === '99FOOD'
                          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {item.source}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      Auto-despacho
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>

                  <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <p className="truncate">
                      <strong>Endereço:</strong> {item.street}, {item.number}
                    </p>
                    <p className="truncate">
                      <strong>Bairro:</strong> {item.neighborhood} (ZL)
                    </p>
                    <p className="truncate text-slate-500 dark:text-slate-400">
                      <strong>Motoboy:</strong> {item.courierName}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
                  <button
                    onClick={() => handleTriggerQuickWebhook(item, false)}
                    disabled={isProcessing}
                    className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar Webhook</span>
                  </button>

                  <button
                    onClick={() => handleTriggerQuickWebhook(item, true)}
                    disabled={isProcessing}
                    title="Gera um endereço aleatório diferente da Zona Leste para testar outros bairros e quilometragens"
                    className="w-full py-1 text-[11px] font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/50 rounded-lg transition-colors flex items-center justify-center gap-1 border border-orange-200 dark:border-orange-800/60"
                  >
                    <Sparkles className="w-3 h-3 text-orange-500" />
                    <span>Disparar com Endereço Novo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Testador de Cancelamento */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Testador de Cancelamento de Pedido
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Selecione um pedido para simular cancelamento ANTES (sem taxa) ou DEPOIS da entrega (taxa creditada).
                </p>
              </div>

              {selectedDeliveryToCancel && (
                <button
                  onClick={() => setSelectedDeliveryToCancel(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                >
                  Limpar seleção
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {deliveries.slice(0, 3).map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDeliveryToCancel(d)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedDeliveryToCancel?.id === d.id
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{d.orderNumber}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{d.source}</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">
                    {d.street}, {d.number}
                  </div>
                  <div className="text-[11px] font-medium text-orange-600 mt-1">
                    Taxa: R$ {d.feeAmount.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>

            {selectedDeliveryToCancel && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="cancelStage"
                      value="BEFORE_DELIVERY"
                      checked={cancelStage === 'BEFORE_DELIVERY'}
                      onChange={() => setCancelStage('BEFORE_DELIVERY')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span>Cancelado ANTES da entrega (Taxa R$ 0,00)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="cancelStage"
                      value="AFTER_DELIVERY"
                      checked={cancelStage === 'AFTER_DELIVERY'}
                      onChange={() => setCancelStage('AFTER_DELIVERY')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span>Cancelado DEPOIS da entrega (Taxa Paga R$ {selectedDeliveryToCancel.feeAmount.toFixed(2)})</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Motivo do cancelamento"
                    className="flex-1 text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleExecuteCancellation}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold whitespace-nowrap"
                  >
                    Confirmar Cancelamento
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Exemplo de cURL */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-slate-400">Comando cURL de Exemplo para Testar via Terminal</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(curlExample);
                  setCopiedCurl(true);
                  setTimeout(() => setCopiedCurl(false), 2000);
                }}
                className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCurl ? 'Copiado!' : 'Copiar cURL'}
              </button>
            </div>
            <pre className="text-xs font-mono text-emerald-400 overflow-x-auto p-3 bg-slate-950 rounded-xl leading-relaxed">
              {curlExample}
            </pre>
          </div>
        </div>
      )}

      {/* ABA 3: LOGS DE WEBHOOKS RECEBIDOS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-orange-600" />
              Histórico de Requisições Webhook Ingeridas
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Total de registros: {webhookLogs.length}
            </span>
          </div>

          {webhookLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Nenhuma requisição recebida até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Plataforma</th>
                    <th className="py-2.5 px-3">Pedido</th>
                    <th className="py-2.5 px-3">Motoboy</th>
                    <th className="py-2.5 px-3">Distância / Taxa</th>
                    <th className="py-2.5 px-3">Endereço Extraído</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono-numbers">
                  {webhookLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                        {new Date(log.receivedAt).toLocaleTimeString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-white">{log.source}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono">{log.orderNumber}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {log.courierNameMatched || <span className="text-slate-400">Pendente</span>}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {log.calculatedDistanceKm} km · R$ {log.calculatedFee.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 truncate max-w-xs">{log.addressExtracted}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
