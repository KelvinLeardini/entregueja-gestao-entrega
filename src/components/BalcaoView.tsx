import React, { useState, useId, useEffect } from 'react';
import {
  Send,
  Navigation,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  ExternalLink,
  Ban,
  Bike,
  PlusCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Volume2,
  VolumeX,
  Phone,
  MessageCircle,
  CheckSquare,
  Square,
  AlertTriangle,
  Receipt,
  UserCheck,
  TrendingUp,
  Share2,
  Eye,
  X,
  Printer,
} from 'lucide-react';
import {
  Delivery,
  User,
  StoreConfig,
  DeliveryRateRange,
  AddressCacheItem,
  DeliveryStatus,
  OrderSource,
  CancellationStage,
  ThermalPrinterSettings,
} from '../types';
import { geocodeAddress, normalizeAddressQuery } from '../services/nominatim';
import { calculateDrivingRoute } from '../services/osrm';
import { calculateDeliveryFee } from '../services/feeCalculator';
import { generateRandomTestDelivery } from '../services/testDataPool';
import { playNewOrderChime, playDispatchSuccessChime } from '../services/soundEffects';
import { ThermalReceiptModal } from './ThermalReceiptModal';

interface BalcaoViewProps {
  deliveries: Delivery[];
  couriers: User[];
  storeConfig: StoreConfig;
  rateRanges: DeliveryRateRange[];
  addressCache: AddressCacheItem[];
  printerSettings?: ThermalPrinterSettings;
  onAddDelivery: (delivery: Delivery) => void;
  onUpdateDeliveryStatus: (
    id: string,
    status: DeliveryStatus,
    courierId?: string,
    cancellationStage?: CancellationStage,
    cancellationReason?: string
  ) => void;
  onUpdateAddressCache: (item: AddressCacheItem) => void;
}

export const BalcaoView: React.FC<BalcaoViewProps> = ({
  deliveries,
  couriers,
  storeConfig,
  rateRanges,
  addressCache,
  printerSettings,
  onAddDelivery,
  onUpdateDeliveryStatus,
  onUpdateAddressCache,
}) => {
  const customFeeInputId = useId();

  // Modo de visualização: 'LIST' (Fila Unificada Geral) vs 'KANBAN' (Colunas)
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('LIST');

  // Som de alerta ativo/mudo (estilo Cardápio Web)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('burger_route_sound_alerts') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('burger_route_sound_alerts', String(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // Controle de exibição do formulário de lançamento manual
  const [showManualForm, setShowManualForm] = useState(false);

  // Estado do formulário de novo pedido manual
  const [orderSource, setOrderSource] = useState<OrderSource>('BALCAO');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');
  const [orderItemsText, setOrderItemsText] = useState('');
  const [orderTotalInput, setOrderTotalInput] = useState('');
  const [paymentMethodChoice, setPaymentMethodChoice] = useState<'ONLINE' | 'CARD' | 'CASH' | 'PIX'>('CARD');
  const [selectedCourierId, setSelectedCourierId] = useState(couriers[0]?.id || '');

  // Seleção múltipla para Despacho em Lote (Multi-drop batching estilo Cardápio Web)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [batchCourierId, setBatchCourierId] = useState<string>(couriers[0]?.id || '');

  // Modal de comanda de entrega para impressão/visualização rápida
  const [viewingSlipDelivery, setViewingSlipDelivery] = useState<Delivery | null>(null);

  // Modal de cancelamento detalhado (Antes vs Depois da entrega)
  const [cancelingDelivery, setCancelingDelivery] = useState<Delivery | null>(null);
  const [modalCancelStage, setModalCancelStage] = useState<CancellationStage>('BEFORE_DELIVERY');
  const [modalCancelReason, setModalCancelReason] = useState('Cancelado pelo cliente antes da saída');

  // Filtro por motoboy específico selecionado na barra de motoboys
  const [filterCourierId, setFilterCourierId] = useState<string | null>(null);

  // Estados de cálculo de rota manual
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(null);
  const [calculatedFee, setCalculatedFee] = useState<number | null>(null);
  const [matchedRangeLabel, setMatchedRangeLabel] = useState<string>('');
  const [calculationSource, setCalculationSource] = useState<string>('');

  // Ajuste manual de taxa
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [manualFee, setManualFee] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState('');

  // Filtros rápidos
  const [platformFilter, setPlatformFilter] = useState<'ALL' | OrderSource>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Link copiado feedback
  const [copiedCourierId, setCopiedCourierId] = useState<string | null>(null);

  // Próximo número de pedido sugerido
  const nextOrderNumber = React.useMemo(() => {
    const nums = deliveries
      .map((d) => parseInt(d.orderNumber.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 100;
    return `#${max + 1}`;
  }, [deliveries]);

  const [orderNumber, setOrderNumber] = useState(nextOrderNumber);

  useEffect(() => {
    setOrderNumber(nextOrderNumber);
  }, [nextOrderNumber]);

  // Simula chegada de pedidos de plataforma com som do Cardápio Web
  const handleSimulatePlatformArrival = (source: OrderSource) => {
    const simulatedDelivery = generateRandomTestDelivery(source, storeConfig, rateRanges);
    onAddDelivery(simulatedDelivery);
    if (soundEnabled) {
      playNewOrderChime();
    }
  };

  // Cálculo de rota gratuito para o formulário manual do balcão
  const handleCalculateRoute = async () => {
    if (!street.trim() || !neighborhood.trim()) {
      alert('Por favor, informe a Rua e o Bairro para calcular a distância e taxa.');
      return;
    }

    setIsCalculating(true);
    setCalculationSource('');

    try {
      const normalized = normalizeAddressQuery({
        street,
        number: number.trim() || '1',
        neighborhood,
        city: storeConfig.city,
        state: storeConfig.state,
      });

      // 1. Verifica cache local
      const cached = addressCache.find((c) => c.normalizedQuery === normalized);
      if (cached) {
        setCalculatedDistance(cached.distanceKm);
        setCalculatedDuration(cached.durationMinutes);
        const { fee, matchedRangeLabel: label } = calculateDeliveryFee(
          cached.distanceKm,
          rateRanges,
          storeConfig.fallbackRate,
          storeConfig.extraKmRate
        );
        setCalculatedFee(fee);
        setMatchedRangeLabel(label);
        setCalculationSource('Cache local instantâneo (R$ 0)');
        setIsCalculating(false);
        return;
      }

      // 2. Geocodifica via Nominatim OpenStreetMap
      const geo = await geocodeAddress({
        street,
        number: number.trim() || '1',
        neighborhood,
        city: storeConfig.city,
        state: storeConfig.state,
      });

      if (!geo) {
        setCalculatedDistance(null);
        setCalculatedFee(storeConfig.fallbackRate);
        setMatchedRangeLabel('Taxa Padrão de Contingência');
        setCalculationSource('Endereço não localizado com precisão');
        setIsCalculating(false);
        return;
      }

      // 3. Rota viária pelo OSRM gratuito
      const route = await calculateDrivingRoute(
        { latitude: storeConfig.latitude, longitude: storeConfig.longitude },
        { latitude: geo.latitude, longitude: geo.longitude }
      );

      if (route) {
        setCalculatedDistance(route.distanceKm);
        setCalculatedDuration(route.durationMinutes);

        const { fee, matchedRangeLabel: label } = calculateDeliveryFee(
          route.distanceKm,
          rateRanges,
          storeConfig.fallbackRate,
          storeConfig.extraKmRate
        );
        setCalculatedFee(fee);
        setMatchedRangeLabel(label);
        setCalculationSource('OSRM Project Oficial');

        // Grava no cache
        onUpdateAddressCache({
          id: `cache_${Date.now()}`,
          normalizedQuery: normalized,
          latitude: geo.latitude,
          longitude: geo.longitude,
          distanceKm: route.distanceKm,
          durationMinutes: route.durationMinutes,
          calculatedAt: new Date().toISOString(),
        });
      } else {
        setCalculatedDistance(null);
        setCalculatedFee(storeConfig.fallbackRate);
        setMatchedRangeLabel('Taxa Padrão de Contingência');
        setCalculationSource('Falha temporária de conexão com OSRM');
      }
    } catch (err) {
      console.error(err);
      setCalculatedDistance(null);
      setCalculatedFee(storeConfig.fallbackRate);
      setMatchedRangeLabel('Taxa Padrão de Contingência');
    } finally {
      setIsCalculating(false);
    }
  };

  // Criação de entrega manual
  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();

    if (!street.trim() || !neighborhood.trim()) {
      alert('Preencha ao menos Rua e Bairro.');
      return;
    }

    const finalFee =
      isManualOverride && manualFee
        ? parseFloat(manualFee) || 0
        : calculatedFee !== null
        ? calculatedFee
        : storeConfig.fallbackRate;

    const newDelivery: Delivery = {
      id: `del_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderNumber: orderNumber.trim() || nextOrderNumber,
      source: orderSource,
      customerName: customerName.trim() || 'Cliente Balcão',
      customerPhone: customerPhone.trim() || undefined,
      street: street.trim(),
      number: number.trim() || 'S/N',
      neighborhood: neighborhood.trim(),
      complement: complement.trim() || undefined,
      city: storeConfig.city,
      state: storeConfig.state,
      distanceKm: calculatedDistance || 0,
      durationMinutes: calculatedDuration || 10,
      feeAmount: finalFee,
      isManualOverride: isManualOverride,
      overrideReason: isManualOverride ? overrideReason : undefined,
      status: selectedCourierId ? 'IN_TRANSIT' : 'PENDING',
      courierId: selectedCourierId || undefined,
      dispatchedAt: selectedCourierId ? new Date().toISOString() : undefined,
      isFeePayable: true,
      paymentMethod: paymentMethodChoice,
      orderTotal: orderTotalInput ? parseFloat(orderTotalInput) : 50.0,
      subtotal: Math.max(0, (orderTotalInput ? parseFloat(orderTotalInput) : 50.0) - finalFee),
      customerDeliveryFee: finalFee,
      discountAmount: 0,
      items: [
        {
          name: orderItemsText.trim() || '1x Combo Artesanal + Fritas',
          quantity: 1,
          unitPrice: Math.max(0, (orderTotalInput ? parseFloat(orderTotalInput) : 50.0) - finalFee),
          totalPrice: Math.max(0, (orderTotalInput ? parseFloat(orderTotalInput) : 50.0) - finalFee),
          options: ['Pedido Registrado via Balcão / Telefone'],
        },
      ],
      itemsSummary: orderItemsText.trim() || '1x Combo Artesanal + Fritas',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddDelivery(newDelivery);
    if (soundEnabled) {
      playNewOrderChime();
    }

    // Limpa campos
    setCustomerName('');
    setCustomerPhone('');
    setStreet('');
    setNumber('');
    setNeighborhood('');
    setComplement('');
    setOrderItemsText('');
    setOrderTotalInput('');
    setCalculatedDistance(null);
    setCalculatedDuration(null);
    setCalculatedFee(null);
    setIsManualOverride(false);
    setManualFee('');
    setOverrideReason('');
    setShowManualForm(false);
  };

  // Despacho individual com som
  const handleSingleDispatch = (deliveryId: string, courierId: string) => {
    if (!courierId) return;
    onUpdateDeliveryStatus(deliveryId, 'IN_TRANSIT', courierId);
    if (soundEnabled) {
      playDispatchSuccessChime();
    }
  };

  // Despacho em Lote (Agrupar 2 ou mais pedidos para o mesmo motoboy na mesma viagem)
  const handleBatchDispatch = () => {
    if (selectedOrderIds.length === 0 || !batchCourierId) return;

    selectedOrderIds.forEach((id) => {
      onUpdateDeliveryStatus(id, 'IN_TRANSIT', batchCourierId);
    });

    if (soundEnabled) {
      playDispatchSuccessChime();
    }

    setSelectedOrderIds([]);
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllPending = () => {
    const pendingIds = pendingDeliveries.map((d) => d.id);
    if (selectedOrderIds.length === pendingIds.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(pendingIds);
    }
  };

  // Cópia do link exclusivo 2FA do motoboy
  const copyCourierLink = (c: User) => {
    const pin = c.activePin || c.authPin2FA || '123456';
    const url = `${window.location.origin}/?motoToken=${c.accessToken || ''}&pin=${pin}`;
    navigator.clipboard.writeText(url);
    setCopiedCourierId(c.id);
    setTimeout(() => setCopiedCourierId(null), 2500);
  };

  // Filtragem da lista
  const filteredDeliveries = deliveries
    .filter((d) => {
      if (platformFilter !== 'ALL' && d.source !== platformFilter) return false;
      if (filterCourierId && d.courierId !== filterCourierId) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const courierName = couriers.find((c) => c.id === d.courierId)?.name.toLowerCase() || '';
      return (
        d.orderNumber.toLowerCase().includes(term) ||
        d.customerName.toLowerCase().includes(term) ||
        d.street.toLowerCase().includes(term) ||
        d.neighborhood.toLowerCase().includes(term) ||
        d.source.toLowerCase().includes(term) ||
        courierName.includes(term)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Divisão por estágio no Kanban Cardápio Web
  const pendingDeliveries = filteredDeliveries.filter((d) => d.status === 'PENDING');
  const inTransitDeliveries = filteredDeliveries.filter((d) => d.status === 'IN_TRANSIT');
  const completedDeliveries = filteredDeliveries.filter(
    (d) =>
      d.status === 'DELIVERED' ||
      d.status === 'CANCELED_AFTER_DELIVERY' ||
      d.status === 'CANCELED_BEFORE_DELIVERY'
  );

  // Métricas do turno
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayDeliveries = deliveries.filter(
    (d) => d.createdAt.startsWith(todayDateStr) && d.status !== 'CANCELED_BEFORE_DELIVERY'
  );
  const totalTodayFee = todayDeliveries.reduce((sum, d) => sum + d.feeAmount, 0);

  // Identificação de bairros repetidos nos pedidos prontos para sugestão de lote inteligente
  const neighborhoodGrouping = React.useMemo(() => {
    const counts: Record<string, number> = {};
    pendingDeliveries.forEach((d) => {
      const b = d.neighborhood.trim();
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts).filter(([_, count]) => count >= 2);
  }, [pendingDeliveries]);

  // Helper de cálculo de tempo decorrido com formatação amigável
  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(1, Math.floor(diffMs / 60000));
  };

  return (
    <div className="space-y-4">
      {/* ============================================================ */}
      {/* 1. BARRA SUPERIOR DOS MOTOBOYS EM ATENDIMENTO (CARDÁPIO WEB) */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Motoboys em Atendimento
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  {couriers.length} ativos
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Acompanhamento em tempo real, pedidos na bag e atalhos rápidos de contato
              </p>
            </div>
          </div>

          {filterCourierId && (
            <button
              onClick={() => setFilterCourierId(null)}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 self-start sm:self-auto bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-900"
            >
              <span>Mostrando apenas entregas de um motoboy</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Grade de Motoboys com Status e Pedidos Ativos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          {couriers.map((courier) => {
            const activeCount = deliveries.filter(
              (d) => d.courierId === courier.id && d.status === 'IN_TRANSIT'
            ).length;
            const completedToday = deliveries.filter(
              (d) =>
                d.courierId === courier.id &&
                d.status === 'DELIVERED' &&
                d.createdAt.startsWith(todayDateStr)
            ).length;
            const feeToday = deliveries
              .filter(
                (d) =>
                  d.courierId === courier.id &&
                  d.isFeePayable &&
                  d.createdAt.startsWith(todayDateStr)
              )
              .reduce((sum, d) => sum + d.feeAmount, 0);

            const isSelected = filterCourierId === courier.id;

            return (
              <div
                key={courier.id}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-orange-50/80 border-orange-400 dark:bg-orange-950/30 dark:border-orange-500 ring-2 ring-orange-400'
                    : 'bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-800/40 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                        {courier.name.charAt(0)}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                          activeCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        title={activeCount > 0 ? 'Em rota' : 'Livre para entregas'}
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {courier.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                        {courier.vehicleModel || 'Moto'} · {courier.vehiclePlate || 'S/ Placa'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      activeCount > 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {activeCount > 0 ? `${activeCount} em rota` : 'Livre'}
                  </span>
                </div>

                {/* Métricas rápidas do motoboy no dia */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    Hoje: <strong className="text-slate-800 dark:text-slate-200">{completedToday} entregas</strong>
                  </span>
                  <span className="font-mono-numbers font-bold text-orange-600 dark:text-orange-400">
                    R$ {feeToday.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {/* Ações Rápidas: Filtrar, WhatsApp, Link 2FA */}
                <div className="mt-2 flex items-center justify-between gap-1 pt-1">
                  <button
                    onClick={() => setFilterCourierId(isSelected ? null : courier.id)}
                    className="flex-1 text-[10px] font-semibold py-1 px-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-center transition-colors"
                  >
                    {isSelected ? 'Ver Todos' : 'Ver Fila'}
                  </button>

                  {courier.phone && (
                    <a
                      href={`https://wa.me/55${courier.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${courier.name}, aqui é do despacho da hamburgueria!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                      title="Enviar WhatsApp para o motoboy"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <a
                    href={`${typeof window !== 'undefined' ? window.location.origin : ''}/?motoToken=${courier.accessToken || ''}&pin=${courier.activePin || courier.authPin2FA || '123456'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                    title="Abrir Portal deste Motoboy em nova aba"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => copyCourierLink(courier)}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title={copiedCourierId === courier.id ? 'Link copiado!' : 'Copiar Link com PIN Direto'}
                  >
                    {copiedCourierId === courier.id ? (
                      <span className="text-[10px] font-bold text-emerald-600">✓</span>
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. BARRA DE CONTROLE: SIMULADOR, MODO KANBAN / LISTA E BUSCA */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Lado Esquerdo: Simulação de Pedidos com Som */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 mr-1">
            <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <span>Chegar Pedido:</span>
          </div>

          <button
            type="button"
            onClick={() => handleSimulatePlatformArrival('IFOOD')}
            className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-2xs active:scale-95 flex items-center gap-1"
            title="Simula chegada de um novo pedido do iFood"
          >
            <span>+ Chegou iFood</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulatePlatformArrival('99FOOD')}
            className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-2xs active:scale-95 flex items-center gap-1"
            title="Simula chegada de um novo pedido do 99Food"
          >
            <span>+ Chegou 99Food</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulatePlatformArrival('KEETA')}
            className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 transition-all shadow-2xs active:scale-95 flex items-center gap-1 font-extrabold"
            title="Simula chegada de um novo pedido do Keeta"
          >
            <span>+ Chegou Keeta</span>
          </button>

          {/* Botão de Som Liga/Desliga */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs font-semibold ${
              soundEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
            }`}
            title={soundEnabled ? 'Som de novos pedidos ativado' : 'Som desativado'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
          </button>
        </div>

        {/* Lado Direito: Alternância de Visualização e Botão Lançar Pedido Balcão */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Seletor de Modo: Kanban (Colunas) vs Lista */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'KANBAN'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Colunas Despacho</span>
            </button>

            <button
              onClick={() => setViewMode('LIST')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'LIST'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabela Geral</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap ${
              showManualForm
                ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-orange-600 dark:hover:bg-orange-500'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-orange-400 dark:text-white" />
            <span>{showManualForm ? 'Fechar Lançamento' : '+ Pedido Balcão'}</span>
            {showManualForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Sugestão Inteligente de Agrupamento de Rotas para o mesmo Bairro */}
      {neighborhoodGrouping.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Oportunidade de Rota Conjunta:</strong> Há{' '}
              {neighborhoodGrouping.map(([bairro, count]) => `${count} pedidos para ${bairro}`).join(', ')}. Você pode despachar na mesma viagem!
            </span>
          </div>
          <button
            onClick={() => {
              // Seleciona pedidos do primeiro bairro agrupável
              const targetNeighborhood = neighborhoodGrouping[0][0];
              const matchIds = pendingDeliveries
                .filter((d) => d.neighborhood.trim() === targetNeighborhood)
                .map((d) => d.id);
              setSelectedOrderIds(matchIds);
            }}
            className="text-xs font-bold text-amber-900 dark:text-amber-100 bg-amber-200 dark:bg-amber-800/80 px-2.5 py-1 rounded-lg hover:bg-amber-300 transition-colors self-start sm:self-auto shrink-0"
          >
            Selecionar Pedidos de {neighborhoodGrouping[0][0]}
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. PAINEL RETRÁTIL DE LANÇAMENTO MANUAL (BALCÃO / TELEFONE) */}
      {/* ============================================================ */}
      {showManualForm && (
        <div className="bg-white dark:bg-slate-900 border-2 border-orange-200 dark:border-orange-900/60 rounded-2xl p-5 shadow-md space-y-4 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Lançar Entrega no Balcão / Telefone
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold">
              Origem: {storeConfig.neighborhood} · {storeConfig.city}
            </span>
          </div>

          <form onSubmit={handleCreateDelivery} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Canal de Entrada
                </label>
                <select
                  value={orderSource}
                  onChange={(e) => setOrderSource(e.target.value as OrderSource)}
                  className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  <option value="BALCAO">Balcão / Telefone</option>
                  <option value="IFOOD">iFood</option>
                  <option value="KEETA">Keeta</option>
                  <option value="99FOOD">99Food</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nº Pedido
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp / Celular
                </label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Rua / Avenida
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rua Dona Matilde"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  placeholder="480"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vila Matilde"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Complemento, Itens e Pagamento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Complemento / Apto
                </label>
                <input
                  type="text"
                  placeholder="Ex: Bloco B, Apto 42"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resumo dos Itens
                </label>
                <input
                  type="text"
                  placeholder="Ex: 2x Smash + Fritas"
                  value={orderItemsText}
                  onChange={(e) => setOrderItemsText(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Forma de Cobrança
                </label>
                <select
                  value={paymentMethodChoice}
                  onChange={(e) => setPaymentMethodChoice(e.target.value as 'ONLINE' | 'CARD' | 'CASH' | 'PIX')}
                  className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  <option value="ONLINE">💳 Já Pago Online (Não cobrar nada)</option>
                  <option value="CARD">💳 Cobrar no Cartão na Entrega</option>
                  <option value="CASH">💵 Cobrar em Dinheiro na Entrega</option>
                  <option value="PIX">⚡ Cobrar via Pix na Entrega</option>
                </select>
              </div>
            </div>

            {/* Botão de Cálculo OSRM e Resultado */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleCalculateRoute}
                disabled={isCalculating || !street.trim()}
                className="py-2 px-3 text-xs font-bold rounded-lg bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                {isCalculating
                  ? 'Consultando OSRM & OpenStreetMap...'
                  : 'Calcular Rota & Taxa Automática (Custo R$ 0)'}
              </button>

              {calculatedDistance !== null && (
                <div className="text-xs flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">
                    Distância: <strong className="text-slate-900 dark:text-white font-mono-numbers">{calculatedDistance.toFixed(1)} km</strong> (~{calculatedDuration} min)
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Taxa: <strong className="text-orange-600 dark:text-orange-400 font-mono-numbers">R$ {calculatedFee?.toFixed(2).replace('.', ',')}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Atribuir Motoboy no Lançamento e Enviar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Atribuir a qual Motoboy?
                </label>
                <select
                  value={selectedCourierId}
                  onChange={(e) => setSelectedCourierId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  <option value="">Aguardando Motoboy (Fila de Despacho)</option>
                  {couriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      🛵 {c.name} {c.vehicleModel ? `(${c.vehicleModel})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-5">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 h-10 bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.99] shadow-sm"
                >
                  <Send className="w-4 h-4 text-orange-400 dark:text-white" />
                  <span>Lançar Pedido no Painel</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. BARRA DE FILTROS & DESPACHO EM LOTE (SELEÇÃO MÚLTIPLA)   */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Barra de Ação de Despacho em Lote se houver selecionados */}
        {selectedOrderIds.length > 0 ? (
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-orange-50 dark:bg-orange-950/40 p-2 rounded-xl border border-orange-200 dark:border-orange-900">
            <span className="text-xs font-bold text-orange-900 dark:text-orange-200 whitespace-nowrap">
              📦 {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'pedido selecionado' : 'pedidos selecionados'}:
            </span>
            <div className="flex items-center gap-2 flex-1">
              <select
                value={batchCourierId}
                onChange={(e) => setBatchCourierId(e.target.value)}
                className="text-xs font-bold bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-800 rounded-lg p-1.5 text-slate-900 dark:text-white"
              >
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    🛵 Despachar p/ {c.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleBatchDispatch}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Despachar Juntos na Rota</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrderIds([])}
                className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 p-1"
              >
                Limpar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Filtro por Plataforma */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400 font-medium">Canal:</span>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value as 'ALL' | OrderSource)}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">Todas as Plataformas</option>
                <option value="IFOOD">iFood</option>
                <option value="99FOOD">99Food</option>
                <option value="KEETA">Keeta</option>
                <option value="BALCAO">Balcão / Telefone</option>
              </select>
            </div>

            {/* Contador de Pedidos do Turno */}
            <div className="text-slate-500 dark:text-slate-400 font-medium">
              Total hoje:{' '}
              <strong className="text-slate-900 dark:text-white font-mono-numbers">
                {todayDeliveries.length}
              </strong>{' '}
              · Taxas:{' '}
              <strong className="text-orange-600 dark:text-orange-400 font-mono-numbers">
                R$ {totalTodayFee.toFixed(2).replace('.', ',')}
              </strong>
            </div>
          </div>
        )}

        {/* Busca rápida */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por pedido, cliente, rua, bairro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. VISUALIZAÇÃO: KANBAN COLUNAS (ESTILO CARDÁPIO WEB)        */}
      {/* ============================================================ */}
      {viewMode === 'KANBAN' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ---------------------------------------------------------- */}
          {/* COLUNA 1: PRONTOS PARA DESPACHO / AGUARDANDO MOTOBOY      */}
          {/* ---------------------------------------------------------- */}
          <div className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col h-full min-h-[500px]">
            {/* Header da Coluna */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Prontos p/ Despacho
                </h3>
                <span className="text-xs font-bold font-mono bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 px-2 py-0.5 rounded-full">
                  {pendingDeliveries.length}
                </span>
              </div>

              {pendingDeliveries.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllPending}
                  className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>Selecionar todos</span>
                </button>
              )}
            </div>

            {/* Lista de Cards da Coluna 1 */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {pendingDeliveries.length === 0 ? (
                <div className="h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-50" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Bancada livre!
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Nenhum pedido aguardando motoboy no momento.
                  </span>
                </div>
              ) : (
                pendingDeliveries.map((delivery) => {
                  const elapsedMin = getElapsedMinutes(delivery.createdAt);
                  const isSelected = selectedOrderIds.includes(delivery.id);

                  return (
                    <div
                      key={delivery.id}
                      className={`bg-white dark:bg-slate-800/90 border rounded-xl p-3.5 shadow-xs transition-all relative ${
                        isSelected
                          ? 'border-orange-500 ring-2 ring-orange-400/40'
                          : 'border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {/* Topo do Card: Checkbox Lote + Canal + Nº + Timer */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleSelectOrder(delivery.id)}
                            className="text-slate-400 hover:text-orange-600 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-orange-600 fill-orange-50" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          <span
                            className={`text-[10px] font-black tracking-wide px-2 py-0.5 rounded shadow-2xs ${
                              delivery.source === 'IFOOD'
                                ? 'bg-rose-600 text-white'
                                : delivery.source === '99FOOD'
                                ? 'bg-orange-500 text-white'
                                : delivery.source === 'KEETA'
                                ? 'bg-amber-400 text-slate-950 font-black'
                                : 'bg-slate-800 text-white dark:bg-slate-700'
                            }`}
                          >
                            {delivery.source}
                          </span>

                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {delivery.orderNumber}
                          </span>
                        </div>

                        {/* Cronômetro com cor Cardápio Web */}
                        <div
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                            elapsedMin > 35
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 animate-pulse'
                              : elapsedMin > 20
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>⏱ {elapsedMin} min</span>
                        </div>
                      </div>

                      {/* Cliente e Contato */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {delivery.customerName}
                        </span>

                        {delivery.customerPhone && (
                          <a
                            href={`https://wa.me/55${delivery.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Olá ${delivery.customerName}! Seu pedido ${delivery.orderNumber} da hamburgueria já está pronto e sendo despachado!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Chamar cliente no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Resumo de itens (se houver) */}
                      {delivery.itemsSummary && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded-md mb-2 truncate">
                          🍔 {delivery.itemsSummary}
                        </div>
                      )}

                      {/* Endereço com Destaque no Bairro */}
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5 mb-2.5">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                          <span className="leading-tight">
                            {delivery.street}, {delivery.number}
                            {delivery.complement ? ` (${delivery.complement})` : ''}
                          </span>
                        </div>
                        <div className="pl-4">
                          <span className="inline-block text-[10px] font-bold bg-orange-100/80 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300 px-1.5 py-0.5 rounded">
                            📍 {delivery.neighborhood}
                          </span>
                        </div>
                      </div>

                      {/* Linha de Distância, Taxa e Forma de Pagamento */}
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-700/60 mb-3">
                        <span className="text-slate-500 dark:text-slate-400">
                          {delivery.distanceKm.toFixed(1)} km ·{' '}
                          <strong className="text-orange-600 dark:text-orange-400 font-mono-numbers">
                            Taxa R$ {delivery.feeAmount.toFixed(2).replace('.', ',')}
                          </strong>
                        </span>

                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {delivery.paymentMethod === 'ONLINE' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              💳 Pago Online
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              💵 Cobrar R$ {(delivery.orderTotal || 50).toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Botões de Ação: Despacho Rápido e Comanda */}
                      <div className="flex items-center gap-1.5">
                        <select
                          id={`courier-select-${delivery.id}`}
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSingleDispatch(delivery.id, e.target.value);
                            }
                          }}
                          className="flex-1 text-xs font-bold bg-orange-50 dark:bg-slate-700 border border-orange-300 dark:border-slate-600 text-orange-950 dark:text-white rounded-lg p-2 cursor-pointer focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">🛵 Despachar para...</option>
                          {couriers.map((c) => {
                            const inTransit = deliveries.filter(
                              (d) => d.courierId === c.id && d.status === 'IN_TRANSIT'
                            ).length;
                            return (
                              <option key={c.id} value={c.id}>
                                {c.name} {inTransit > 0 ? `(${inTransit} na rua)` : '(Livre)'}
                              </option>
                            );
                          })}
                        </select>

                        <button
                          type="button"
                          onClick={() => setViewingSlipDelivery(delivery)}
                          className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold text-orange-950 dark:text-orange-200 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/60 dark:hover:bg-orange-900/80 rounded-lg border border-orange-300 dark:border-orange-800 transition-colors shadow-2xs shrink-0"
                          title="Imprimir Cupom Térmico (80mm)"
                        >
                          <Printer className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                          <span>Imprimir</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* COLUNA 2: EM ROTA / COM MOTOBOY (NA RUA)                   */}
          {/* ---------------------------------------------------------- */}
          <div className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col h-full min-h-[500px]">
            {/* Header da Coluna */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Em Rota (Com Motoboy)
                </h3>
                <span className="text-xs font-bold font-mono bg-blue-100 text-blue-900 dark:bg-blue-950/70 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  {inTransitDeliveries.length}
                </span>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {inTransitDeliveries.length} na rua
              </span>
            </div>

            {/* Lista de Cards da Coluna 2 */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {inTransitDeliveries.length === 0 ? (
                <div className="h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <Bike className="w-8 h-8 text-blue-400 mb-2 opacity-50" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Nenhum motoboy na rua
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Os pedidos despachados aparecerão aqui em tempo real.
                  </span>
                </div>
              ) : (
                inTransitDeliveries.map((delivery) => {
                  const courier = couriers.find((c) => c.id === delivery.courierId);
                  const transitMinutes = delivery.dispatchedAt
                    ? getElapsedMinutes(delivery.dispatchedAt)
                    : 1;

                  return (
                    <div
                      key={delivery.id}
                      className="bg-white dark:bg-slate-800/90 border border-blue-200/80 dark:border-blue-900/50 rounded-xl p-3.5 shadow-xs transition-all"
                    >
                      {/* Topo do Card: Motoboy Atribuído + Tempo de Rota */}
                      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Bike className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                              {courier?.name || 'Motoboy'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {courier?.vehiclePlate || 'Moto'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>Rota: {transitMinutes} min</span>
                        </div>
                      </div>

                      {/* Pedido, Canal e Cliente */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-black tracking-wide px-1.5 py-0.5 rounded shadow-2xs ${
                              delivery.source === 'IFOOD'
                                ? 'bg-rose-600 text-white'
                                : delivery.source === '99FOOD'
                                ? 'bg-orange-500 text-white'
                                : delivery.source === 'KEETA'
                                ? 'bg-amber-400 text-slate-950 font-black'
                                : 'bg-slate-800 text-white dark:bg-slate-700'
                            }`}
                          >
                            {delivery.source}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {delivery.orderNumber}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {delivery.customerName}
                        </span>
                      </div>

                      {/* Endereço e Bairro Destacado */}
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5 mb-2.5">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                          <span className="leading-tight">
                            {delivery.street}, {delivery.number}
                          </span>
                        </div>
                        <div className="pl-4">
                          <span className="inline-block text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded">
                            📍 {delivery.neighborhood}
                          </span>
                        </div>
                      </div>

                      {/* Informações Financeiras e Cobrança */}
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-700/60 mb-3">
                        <span className="text-slate-500 dark:text-slate-400">
                          Taxa a Pagar:{' '}
                          <strong className="text-orange-600 dark:text-orange-400 font-mono-numbers">
                            R$ {delivery.feeAmount.toFixed(2).replace('.', ',')}
                          </strong>
                        </span>

                        <span className="text-[10px] font-semibold">
                          {delivery.paymentMethod === 'ONLINE' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              💳 Já Pago Online
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              💵 Cobrar R$ {(delivery.orderTotal || 50).toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Ações de Rota: Waze, Maps, Concluir e Cancelar */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                          <a
                            href={`https://waze.com/ul?q=${encodeURIComponent(
                              `${delivery.street}, ${delivery.number}, ${delivery.neighborhood}, ${delivery.city}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Abrir no Waze"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => setViewingSlipDelivery(delivery)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors"
                            title="Imprimir Cupom Térmico (80mm)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${delivery.street}, ${delivery.number}, ${delivery.neighborhood}, ${delivery.city}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Abrir no Google Maps"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setCancelingDelivery(delivery);
                              setModalCancelStage('AFTER_DELIVERY');
                              setModalCancelReason('Cliente recusou / cancelou no local');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Registrar Cancelamento / Recusa"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onUpdateDeliveryStatus(delivery.id, 'DELIVERED')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Finalizar Entrega</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* COLUNA 3: ENTREGUES / HISTÓRICO CONCLUÍDO DO TURNO         */}
          {/* ---------------------------------------------------------- */}
          <div className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col h-full min-h-[500px]">
            {/* Header da Coluna */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Entregas Concluídas
                </h3>
                <span className="text-xs font-bold font-mono bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  {completedDeliveries.length}
                </span>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                Histórico
              </span>
            </div>

            {/* Lista de Cards da Coluna 3 */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {completedDeliveries.length === 0 ? (
                <div className="h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Nenhuma entrega concluída ainda
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    À medida que os motoboys finalizarem, elas serão arquivadas aqui.
                  </span>
                </div>
              ) : (
                completedDeliveries.map((delivery) => {
                  const courier = couriers.find((c) => c.id === delivery.courierId);
                  const isDelivered = delivery.status === 'DELIVERED';
                  const isCanceledAfter = delivery.status === 'CANCELED_AFTER_DELIVERY';
                  const isCanceledBefore = delivery.status === 'CANCELED_BEFORE_DELIVERY';

                  return (
                    <div
                      key={delivery.id}
                      className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 shadow-xs opacity-90 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {delivery.orderNumber}
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              delivery.source === 'IFOOD'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : delivery.source === '99FOOD'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                                : delivery.source === 'KEETA'
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {delivery.source}
                          </span>
                        </div>

                        {isDelivered && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Entregue
                          </span>
                        )}

                        {isCanceledAfter && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            Cancelado no local (PAGA)
                          </span>
                        )}

                        {isCanceledBefore && (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            Cancelado pré-saída (R$ 0)
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mb-1 truncate">
                        <strong>{delivery.customerName}</strong> · {delivery.street}, {delivery.number} ({delivery.neighborhood})
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-slate-500 dark:text-slate-400">
                        <span>
                          Motoboy: <strong className="text-slate-800 dark:text-slate-200">{courier?.name || 'Não atribuído'}</strong>
                        </span>

                        <span className="font-mono-numbers font-bold text-orange-600 dark:text-orange-400">
                          {isCanceledBefore ? 'R$ 0,00' : `R$ ${delivery.feeAmount.toFixed(2).replace('.', ',')}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* 6. VISUALIZAÇÃO: TABELA GERAL LISTA COMPACTA               */
        /* ============================================================ */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          {/* Barra de Filtro de Plataformas no Topo da Tabela */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-700 dark:text-slate-300 mr-1 text-[11px] uppercase tracking-wider">
                Filtrar Plataforma:
              </span>
              <button
                type="button"
                onClick={() => setPlatformFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  platformFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Todas ({deliveries.length})
              </button>
              <button
                type="button"
                onClick={() => setPlatformFilter('IFOOD')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  platformFilter === 'IFOOD'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 hover:bg-rose-50'
                }`}
              >
                iFood ({deliveries.filter((d) => d.source === 'IFOOD').length})
              </button>
              <button
                type="button"
                onClick={() => setPlatformFilter('99FOOD')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  platformFilter === '99FOOD'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 border border-slate-200 dark:border-slate-700 hover:bg-orange-50'
                }`}
              >
                99Food ({deliveries.filter((d) => d.source === '99FOOD').length})
              </button>
              <button
                type="button"
                onClick={() => setPlatformFilter('KEETA')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  platformFilter === 'KEETA'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 hover:bg-amber-50'
                }`}
              >
                Keeta ({deliveries.filter((d) => d.source === 'KEETA').length})
              </button>
              <button
                type="button"
                onClick={() => setPlatformFilter('BALCAO')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  platformFilter === 'BALCAO'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                }`}
              >
                Balcão ({deliveries.filter((d) => d.source === 'BALCAO' || d.source === 'SISTEMA_LOCAL').length})
              </button>
            </div>

            <span className="text-[11px] text-slate-500 font-mono-numbers">
              {filteredDeliveries.length} de {deliveries.length} pedidos na fila unificada
            </span>
          </div>

          <div className="overflow-x-auto">
            <table id="balcao-deliveries-table" className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5">Plataforma</th>
                  <th className="py-3 px-3.5">Pedido / Horário</th>
                  <th className="py-3 px-3.5">Cliente & Endereço</th>
                  <th className="py-3 px-3.5">Distância & Taxa</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Atribuir Motoboy</th>
                  <th className="py-3 px-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      Nenhum pedido encontrado nesta visualização.
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map((delivery) => {
                    const courier = couriers.find((c) => c.id === delivery.courierId);
                    const isDelivered = delivery.status === 'DELIVERED';
                    const isInTransit = delivery.status === 'IN_TRANSIT';
                    const isPending = delivery.status === 'PENDING';
                    const isCanceledBefore = delivery.status === 'CANCELED_BEFORE_DELIVERY';
                    const isCanceledAfter = delivery.status === 'CANCELED_AFTER_DELIVERY';

                    return (
                      <tr
                        key={delivery.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isPending ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        {/* Coluna 1: Plataforma em Destaque */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-black tracking-wide px-2.5 py-1 rounded-md shadow-2xs inline-block ${
                              delivery.source === 'IFOOD'
                                ? 'bg-rose-600 text-white'
                                : delivery.source === '99FOOD'
                                ? 'bg-orange-500 text-white'
                                : delivery.source === 'KEETA'
                                ? 'bg-amber-400 text-slate-950 font-extrabold'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {delivery.source === 'SISTEMA_LOCAL' ? 'BALCÃO' : delivery.source}
                          </span>
                        </td>

                        {/* Coluna 2: Pedido & Horário */}
                        <td className="py-3 px-3.5 font-mono">
                          <span className="font-bold text-slate-900 dark:text-white block text-xs">
                            {delivery.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {new Date(delivery.createdAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>

                        {/* Coluna 3: Cliente & Endereço */}
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">
                            {delivery.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[280px]">
                              {delivery.street}, {delivery.number} - <strong>{delivery.neighborhood}</strong>
                            </span>
                          </div>
                        </td>

                        {/* Coluna 4: Distância & Taxa */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="font-mono-numbers font-bold text-slate-900 dark:text-white text-xs">
                            {delivery.distanceKm.toFixed(1)} km
                          </div>
                          {isCanceledBefore ? (
                            <div className="text-[10px] text-rose-600 font-bold">
                              <span className="line-through text-slate-400">
                                R$ {delivery.feeAmount.toFixed(2).replace('.', ',')}
                              </span>{' '}
                              (R$ 0,00)
                            </div>
                          ) : isCanceledAfter ? (
                            <div className="text-[10px] text-amber-600 font-bold">
                              R$ {delivery.feeAmount.toFixed(2).replace('.', ',')} (PAGA)
                            </div>
                          ) : (
                            <div className="font-bold text-orange-600 dark:text-orange-400 font-mono-numbers text-xs">
                              R$ {delivery.feeAmount.toFixed(2).replace('.', ',')}
                            </div>
                          )}
                        </td>

                        {/* Coluna 5: Status */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse border border-amber-300 dark:border-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Aguardando Motoboy
                            </span>
                          )}
                          {isInTransit && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                              <Clock className="w-3 h-3" />
                              Em Rota
                            </span>
                          )}
                          {isDelivered && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-850">
                              <CheckCircle2 className="w-3 h-3" />
                              Entregue
                            </span>
                          )}
                          {isCanceledAfter && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                              Cancelado no Local (Taxa Paga)
                            </span>
                          )}
                          {isCanceledBefore && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                              Cancelado Pré-Saída
                            </span>
                          )}
                        </td>

                        {/* Coluna 6: Atribuir Motoboy */}
                        <td className="py-3 px-3.5">
                          <select
                            value={delivery.courierId || ''}
                            onChange={(e) => {
                              const newCourierId = e.target.value;
                              if (newCourierId) {
                                handleSingleDispatch(delivery.id, newCourierId);
                              } else {
                                onUpdateDeliveryStatus(delivery.id, 'PENDING', undefined);
                              }
                            }}
                            className={`w-full text-xs font-semibold rounded-lg px-2 py-1.5 border transition-all cursor-pointer ${
                              isPending
                                ? 'bg-orange-50 border-orange-300 text-orange-950 ring-1 ring-orange-400 font-bold dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-200'
                                : 'bg-slate-50 border-slate-300 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:bg-white'
                            }`}
                          >
                            <option value="">
                              {isPending ? '👉 Escolha o Motoboy...' : 'Sem motoboy'}
                            </option>
                            {couriers.map((c) => (
                              <option key={c.id} value={c.id}>
                                🛵 {c.name} {c.vehicleModel ? `(${c.vehicleModel})` : ''}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Coluna 7: Ações */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {isInTransit && (
                              <button
                                onClick={() => onUpdateDeliveryStatus(delivery.id, 'DELIVERED')}
                                className="px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                title="Marcar como entregue com sucesso"
                              >
                                Finalizar
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setViewingSlipDelivery(delivery)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-950 dark:bg-orange-950/60 dark:hover:bg-orange-900/80 dark:text-orange-200 border border-orange-300 dark:border-orange-800 shadow-2xs transition-all active:scale-95"
                              title={`Imprimir Comanda Térmica - Pedido ${delivery.orderNumber}`}
                            >
                              <Printer className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                              <span>Imprimir</span>
                            </button>

                            <a
                              href={`https://waze.com/ul?q=${encodeURIComponent(
                                `${delivery.street}, ${delivery.number}, ${delivery.neighborhood}, ${delivery.city}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Abrir no Waze"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                            </a>

                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${delivery.street}, ${delivery.number}, ${delivery.neighborhood}, ${delivery.city}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-orange-600 transition-colors"
                              title="Abrir no Google Maps"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            {!delivery.status.startsWith('CANCELED') && (
                              <button
                                onClick={() => {
                                  setCancelingDelivery(delivery);
                                  setModalCancelStage(
                                    delivery.status === 'DELIVERED'
                                      ? 'AFTER_DELIVERY'
                                      : 'BEFORE_DELIVERY'
                                  );
                                  setModalCancelReason(
                                    delivery.status === 'DELIVERED'
                                      ? 'Cliente recusou / cancelou no local'
                                      : 'Cancelado pelo cliente antes da saída'
                                  );
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors ml-0.5"
                                title="Cancelar pedido com separação de taxa"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. MODAL DE IMPRESSÃO TÉRMICA DE PEDIDO (80mm / 58mm)         */}
      {/* ============================================================ */}
      {viewingSlipDelivery && (
        <ThermalReceiptModal
          delivery={viewingSlipDelivery}
          storeConfig={storeConfig}
          couriers={couriers}
          printerSettings={printerSettings}
          onClose={() => setViewingSlipDelivery(null)}
        />
      )}

      {/* ============================================================ */}
      {/* 8. MODAL DE CANCELAMENTO DETALHADO (PRÉ-SAÍDA VS NO LOCAL)    */}
      {/* ============================================================ */}
      {cancelingDelivery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 space-y-4 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cancelar Pedido {cancelingDelivery.orderNumber}
              </h3>
              <button
                onClick={() => setCancelingDelivery(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Fechar
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Para o acerto correto com o motoboy, especifique se o cancelamento aconteceu <strong>ANTES</strong> ou <strong>DEPOIS</strong> da entrega:
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setModalCancelStage('BEFORE_DELIVERY')}
                className={`w-full p-3 rounded-2xl border text-left transition-all ${
                  modalCancelStage === 'BEFORE_DELIVERY'
                    ? 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200 ring-2 ring-rose-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold block">
                  1. Cancelado ANTES da Entrega / Saída
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  A moto não realizou a viagem até a casa do cliente. <strong>Taxa NÃO creditada (R$ 0,00)</strong>. Fica registrado na lista do motoboy para transparência.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModalCancelStage('AFTER_DELIVERY')}
                className={`w-full p-3 rounded-2xl border text-left transition-all ${
                  modalCancelStage === 'AFTER_DELIVERY'
                    ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-200 ring-2 ring-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold block">
                  2. Cancelado DEPOIS da Entrega ou No Local
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  O motoboy se deslocou até o cliente e houve recusa/cancelamento na porta. <strong>Taxa integral PAGA ao motoboy (R$ {cancelingDelivery.feeAmount.toFixed(2)})</strong>.
                </span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Motivo do Cancelamento
              </label>
              <input
                type="text"
                placeholder="Ex: Cliente recusou o pedido"
                value={modalCancelReason}
                onChange={(e) => setModalCancelReason(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelingDelivery(null)}
                className="h-10 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  const newStatus: DeliveryStatus =
                    modalCancelStage === 'AFTER_DELIVERY'
                      ? 'CANCELED_AFTER_DELIVERY'
                      : 'CANCELED_BEFORE_DELIVERY';

                  onUpdateDeliveryStatus(
                    cancelingDelivery.id,
                    newStatus,
                    cancelingDelivery.courierId,
                    modalCancelStage,
                    modalCancelReason
                  );
                  setCancelingDelivery(null);
                }}
                className="h-10 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
