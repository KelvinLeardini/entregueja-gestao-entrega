import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Printer,
  Search,
  CheckCircle2,
  DollarSign,
  Bike,
  Clock,
  ArrowLeft,
  X,
  CreditCard,
  Banknote,
  Receipt,
  UserCheck,
  Building2,
  Phone,
  MapPin,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Delivery,
  User,
  StoreConfig,
  OrderSource,
  DeliveryStatus,
} from '../types';

interface HistoricoConferenciaCaixaViewProps {
  deliveries: Delivery[];
  couriers: User[];
  storeConfig: StoreConfig;
  onBackToBalcao?: () => void;
}

type PeriodFilter = 'HOJE' | 'SETE_DIAS' | 'TRINTA_DIAS';

export const HistoricoConferenciaCaixaView: React.FC<HistoricoConferenciaCaixaViewProps> = ({
  deliveries,
  couriers,
  storeConfig,
  onBackToBalcao,
}) => {
  // Filtros de controle
  const [period, setPeriod] = useState<PeriodFilter>('HOJE');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | OrderSource>('ALL');
  const [selectedCourierId, setSelectedCourierId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELIVERED' | 'CANCELED_AFTER_DELIVERY'>('ALL');

  // Modal de Impressão de Conferência
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Determina a janela temporal do filtro
  const dateRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (period === 'SETE_DIAS') {
      start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'TRINTA_DIAS') {
      start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
    }

    return { start, end };
  }, [period]);

  // Filtra as entregas finalizadas que se enquadram no período e nos critérios
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      // Somente finalizadas ou canceladas após saída
      const isCompletedStatus =
        d.status === 'DELIVERED' ||
        d.status === 'CANCELED_AFTER_DELIVERY' ||
        d.status === 'CANCELED_BEFORE_DELIVERY';

      if (!isCompletedStatus) return false;

      // Status específico se filtrado
      if (statusFilter !== 'ALL' && d.status !== statusFilter) {
        return false;
      }

      // Validação de data: usa deliveredAt, canceledAt ou createdAt
      const dateString = d.deliveredAt || d.canceledAt || d.createdAt;
      const deliveryDate = new Date(dateString);

      if (deliveryDate < dateRange.start || deliveryDate > dateRange.end) {
        return false;
      }

      // Filtro de canal
      if (sourceFilter !== 'ALL' && d.source !== sourceFilter) {
        return false;
      }

      // Filtro de motoboy
      if (selectedCourierId !== 'ALL' && d.courierId !== selectedCourierId) {
        return false;
      }

      // Filtro de busca textual
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const courier = couriers.find((c) => c.id === d.courierId);
        const courierName = courier?.name.toLowerCase() || '';
        const matchOrder = d.orderNumber.toLowerCase().includes(query);
        const matchCustomer = d.customerName.toLowerCase().includes(query);
        const matchPhone = d.customerPhone?.toLowerCase().includes(query) || false;
        const matchStreet = d.street.toLowerCase().includes(query);
        const matchBairro = d.neighborhood.toLowerCase().includes(query);
        const matchCourier = courierName.includes(query);

        if (!matchOrder && !matchCustomer && !matchPhone && !matchStreet && !matchBairro && !matchCourier) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.deliveredAt || a.canceledAt || a.createdAt).getTime();
      const dateB = new Date(b.deliveredAt || b.canceledAt || b.createdAt).getTime();
      return dateB - dateA; // Mais recentes primeiro
    });
  }, [deliveries, dateRange, sourceFilter, selectedCourierId, statusFilter, searchTerm, couriers]);

  // Cálculos consolidados para conferência de caixa
  const metrics = useMemo(() => {
    let totalTaxas = 0;
    let totalPedidosConcluidos = 0;
    let totalVolumeFinanceiro = 0;
    let cobrancasEmMaos = 0; // Pedidos onde o motoboy cobra dinheiro/cartão no local
    let pedidosOnline = 0;
    let pedidosCanceladosComTaxa = 0;
    let pedidosCanceladosSemTaxa = 0;

    for (const d of filteredDeliveries) {
      if (d.status === 'DELIVERED') {
        totalPedidosConcluidos++;
        totalVolumeFinanceiro += d.orderTotal || 0;

        if (d.paymentMethod === 'ONLINE') {
          pedidosOnline += d.orderTotal || 0;
        } else {
          // Cobrança física a conferir no caixa (CASH, CARD, PIX no ato)
          cobrancasEmMaos += d.orderTotal || 0;
        }
      } else if (d.status === 'CANCELED_AFTER_DELIVERY') {
        pedidosCanceladosComTaxa++;
      } else if (d.status === 'CANCELED_BEFORE_DELIVERY') {
        pedidosCanceladosSemTaxa++;
      }

      // Taxa do motoboy devida
      if (d.isFeePayable) {
        totalTaxas += d.feeAmount;
      }
    }

    const ticketMedio =
      totalPedidosConcluidos > 0 ? totalVolumeFinanceiro / totalPedidosConcluidos : 0;

    return {
      totalTaxas,
      totalPedidosConcluidos,
      totalVolumeFinanceiro,
      cobrancasEmMaos,
      pedidosOnline,
      pedidosCanceladosComTaxa,
      pedidosCanceladosSemTaxa,
      ticketMedio,
    };
  }, [filteredDeliveries]);

  // Resumo individualizado por motoboy no período
  const courierSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        courierId: string;
        courierName: string;
        vehiclePlate: string;
        totalTrips: number;
        totalFees: number;
        collectedCash: number;
      }
    >();

    for (const d of filteredDeliveries) {
      const courier = couriers.find((c) => c.id === d.courierId);
      const cId = d.courierId || 'unassigned';
      const cName = courier?.name || 'Não informado / Balcão';
      const cPlate = courier?.vehiclePlate || '—';

      if (!map.has(cId)) {
        map.set(cId, {
          courierId: cId,
          courierName: cName,
          vehiclePlate: cPlate,
          totalTrips: 0,
          totalFees: 0,
          collectedCash: 0,
        });
      }

      const entry = map.get(cId)!;
      if (d.status === 'DELIVERED' || d.status === 'CANCELED_AFTER_DELIVERY') {
        entry.totalTrips++;
      }
      if (d.isFeePayable) {
        entry.totalFees += d.feeAmount;
      }
      if (d.status === 'DELIVERED' && d.paymentMethod !== 'ONLINE') {
        entry.collectedCash += d.orderTotal || 0;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalFees - a.totalFees);
  }, [filteredDeliveries, couriers]);

  // Exportação CSV formatada para Excel (Brasil com delimitador ;)
  const handleExportCSV = () => {
    const headers = [
      'Data/Hora',
      'Nº Pedido',
      'Canal',
      'Motoboy',
      'Cliente',
      'Telefone',
      'Endereço',
      'Bairro',
      'Cidade',
      'Forma Pagamento',
      'Valor Pedido (R$)',
      'Taxa Motoboy (R$)',
      'Taxa Paga?',
      'Status Entrega',
    ];

    const rows = filteredDeliveries.map((d) => {
      const courier = couriers.find((c) => c.id === d.courierId);
      const date = new Date(d.deliveredAt || d.canceledAt || d.createdAt).toLocaleString('pt-BR');
      const orderTotalStr = (d.orderTotal || 0).toFixed(2).replace('.', ',');
      const feeStr = d.feeAmount.toFixed(2).replace('.', ',');
      const statusLabel =
        d.status === 'DELIVERED'
          ? 'Entregue'
          : d.status === 'CANCELED_AFTER_DELIVERY'
          ? 'Cancelado no Local (Taxa Paga)'
          : 'Cancelado Pré-Saída';

      return [
        `"${date}"`,
        `"${d.orderNumber}"`,
        `"${d.source}"`,
        `"${courier?.name || 'Não Atribuído'}"`,
        `"${d.customerName.replace(/"/g, '""')}"`,
        `"${d.customerPhone || ''}"`,
        `"${(d.street + ', ' + d.number).replace(/"/g, '""')}"`,
        `"${d.neighborhood.replace(/"/g, '""')}"`,
        `"${d.city}"`,
        `"${d.paymentMethod || 'ONLINE'}"`,
        `"${orderTotalStr}"`,
        `"${feeStr}"`,
        `"${d.isFeePayable ? 'SIM' : 'NÃO'}"`,
        `"${statusLabel}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const periodLabel = period === 'HOJE' ? 'hoje' : period === 'SETE_DIAS' ? 'ultimos-7-dias' : 'ultimos-30-dias';
    const dateFormatted = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `conferencia-caixa-${periodLabel}-${dateFormatted}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Abre janela de impressão do navegador com foco no relatório
  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const periodReadable =
    period === 'HOJE'
      ? 'Hoje'
      : period === 'SETE_DIAS'
      ? 'Últimos 7 Dias'
      : 'Últimos 30 Dias';

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. CABEÇALHO DA ABA & AÇÕES RÁPIDAS                          */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {onBackToBalcao && (
              <button
                type="button"
                onClick={onBackToBalcao}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1"
                title="Voltar à Fila do Balcão"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Histórico & Conferência de Caixa
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Conferência de entregas finalizadas por período, apuração de taxas pagas aos motoboys e fechamento de caixa.
          </p>
        </div>

        {/* Botões de Ação: Exportar CSV e Imprimir */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-2xs"
            title="Baixar planilha CSV para Excel com todas as entregas do período"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-xs"
            title="Imprimir relatório analítico para conferência de caixa"
          >
            <Printer className="w-3.5 h-3.5 text-slate-950" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. FILTROS DE PERÍODO, CANAL, MOTOBOY E PESQUISA             */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Seletor Segmentado de Período */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setPeriod('HOJE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === 'HOJE'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setPeriod('SETE_DIAS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === 'SETE_DIAS'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => setPeriod('TRINTA_DIAS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === 'TRINTA_DIAS'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Últimos 30 dias
            </button>
          </div>

          {/* Campo de Pesquisa Instantânea */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nº pedido, cliente, motoboy ou bairro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Motoboy Específico */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Motoboy:</label>
            <select
              value={selectedCourierId}
              onChange={(e) => setSelectedCourierId(e.target.value)}
              className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 text-slate-900 dark:text-white"
            >
              <option value="ALL">Todos os Motoboys ({couriers.length})</option>
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha Secundária: Filtro de Origem / Plataforma */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-medium text-[11px]">Plataforma:</span>
            <button
              type="button"
              onClick={() => setSourceFilter('ALL')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-colors ${
                sourceFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('IFOOD')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-colors ${
                sourceFilter === 'IFOOD'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50'
              }`}
            >
              iFood
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('99FOOD')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-colors ${
                sourceFilter === '99FOOD'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50'
              }`}
            >
              99Food
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('KEETA')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-colors ${
                sourceFilter === 'KEETA'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50'
              }`}
            >
              Keeta
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('BALCAO')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-colors ${
                sourceFilter === 'BALCAO'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50'
              }`}
            >
              Balcão / Telefone
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Período:</span>
            <strong className="text-slate-800 dark:text-slate-200">
              {dateRange.start.toLocaleDateString('pt-BR')} até {dateRange.end.toLocaleDateString('pt-BR')}
            </strong>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. CARDS DE TOTALIZAÇÃO DE CAIXA (KPI STRIP)                 */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total de Taxas dos Motoboys */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Taxas de Motoboys
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Bike className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-orange-600 dark:text-orange-400">
            R$ {metrics.totalTaxas.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>Valores devidos aos entregadores no período</span>
          </div>
        </div>

        {/* Card 2: Quantidade de Pedidos Concluídos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Entregas Concluídas
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {metrics.totalPedidosConcluidos}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {metrics.pedidosCanceladosComTaxa > 0 ? (
              <span>+{metrics.pedidosCanceladosComTaxa} canceladas no destino (taxa paga)</span>
            ) : (
              <span>100% entregas bem-sucedidas</span>
            )}
          </div>
        </div>

        {/* Card 3: Volume Total de Faturamento dos Pedidos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Volume de Pedidos
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            R$ {metrics.totalVolumeFinanceiro.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <span>Ticket médio: R$ {metrics.ticketMedio.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        {/* Card 4: Conferência de Caixa (Cobranças no Local) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Recebido no Local
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            R$ {metrics.cobrancasEmMaos.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <span>Dinheiro / Máquina · Pago online: R$ {metrics.pedidosOnline.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. RESUMO DE CONFERÊNCIA POR MOTOBOY                         */}
      {/* ============================================================ */}
      {courierSummary.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Acerto Individual por Motoboy ({periodReadable})
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {courierSummary.length} entregador(es) atuando no período
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {courierSummary.map((item) => (
              <div
                key={item.courierId}
                className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.courierName}
                    </h3>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Placa: {item.vehiclePlate}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">
                    {item.totalTrips} viagem(ns)
                  </span>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Taxas devidas ao motoboy:
                    </span>
                    <strong className="font-mono tabular-nums text-orange-600 dark:text-orange-400 font-bold">
                      R$ {item.totalFees.toFixed(2).replace('.', ',')}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Cobranças recebidas no destino:
                    </span>
                    <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      R$ {item.collectedCash.toFixed(2).replace('.', ',')}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. TABELA ANALÍTICA DETALHADA DE ENTREGAS                    */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Relação de Entregas Finalizadas
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredDeliveries.length} registros
            </span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Ordenado por horário mais recente
          </div>
        </div>

        {filteredDeliveries.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Nenhuma entrega encontrada para os filtros selecionados
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Tente selecionar outro período (como Últimos 7 ou 30 dias) ou limpe os filtros de canal e pesquisa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <th className="py-3 px-3.5 whitespace-nowrap">Data / Hora</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Pedido & Origem</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Motoboy</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Cliente & Destino</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-right">Valor Pedido</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-right">Taxa Motoboy</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDeliveries.map((delivery) => {
                  const courier = couriers.find((c) => c.id === delivery.courierId);
                  const dateObj = new Date(delivery.deliveredAt || delivery.canceledAt || delivery.createdAt);
                  const timeFormatted = dateObj.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  });

                  return (
                    <tr
                      key={delivery.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Data / Hora */}
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{timeFormatted}</span>
                        <span className="block text-[10px] text-slate-400">{dateFormatted}</span>
                      </td>

                      {/* Pedido & Origem */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
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
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {delivery.source}
                          </span>
                        </div>
                      </td>

                      {/* Motoboy */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold flex items-center justify-center text-slate-700 dark:text-slate-300">
                            {courier?.name ? courier.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block leading-tight">
                              {courier?.name || 'Não Atribuído'}
                            </span>
                            {courier?.vehiclePlate && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {courier.vehiclePlate}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cliente & Destino */}
                      <td className="py-3 px-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {delivery.customerName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {delivery.street}, {delivery.number} · <span className="font-medium">{delivery.neighborhood}</span>
                        </div>
                      </td>

                      {/* Valor Pedido & Forma */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-right">
                        <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white block">
                          R$ {(delivery.orderTotal || 0).toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {delivery.paymentMethod === 'ONLINE' ? '💳 Online' : '💵 No local'}
                        </span>
                      </td>

                      {/* Taxa do Motoboy */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-right">
                        <span
                          className={`font-mono font-bold tabular-nums ${
                            delivery.isFeePayable
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-slate-400 line-through'
                          }`}
                        >
                          R$ {delivery.feeAmount.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {delivery.distanceKm.toFixed(1)} km
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-center">
                        {delivery.status === 'DELIVERED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Entregue
                          </span>
                        )}
                        {delivery.status === 'CANCELED_AFTER_DELIVERY' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                            Cancelado no local (PAGA)
                          </span>
                        )}
                        {delivery.status === 'CANCELED_BEFORE_DELIVERY' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                            Cancelado pré-saída (R$ 0)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 6. MODAL DE IMPRESSÃO DE CONFERÊNCIA DE CAIXA                */}
      {/* ============================================================ */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in-50 duration-150">
            {/* Topo do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Relatório de Conferência de Caixa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pré-visualização do Relatório (Formatado para impressão física) */}
            <div
              id="conferencia-caixa-print-area"
              className="p-5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs space-y-4"
            >
              {/* Cabeçalho da Loja */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h4 className="text-sm font-black uppercase tracking-wider">{storeConfig.storeName}</h4>
                <p className="text-[11px] text-slate-600">
                  {storeConfig.street}, {storeConfig.number} · {storeConfig.neighborhood}
                </p>
                <p className="text-[11px] text-slate-600">
                  {storeConfig.city}/{storeConfig.state}
                </p>
                <div className="mt-2 text-[10px] text-slate-500">
                  RELATÓRIO DE CONFERÊNCIA DE FECHAMENTO DE CAIXA
                </div>
                <div className="text-[10px] text-slate-700 font-bold">
                  PERÍODO: {periodReadable.toUpperCase()} ({dateRange.start.toLocaleDateString('pt-BR')} a {dateRange.end.toLocaleDateString('pt-BR')})
                </div>
                <div className="text-[10px] text-slate-500">
                  EMISSÃO: {new Date().toLocaleString('pt-BR')}
                </div>
              </div>

              {/* Tabela de Totais Financeiros */}
              <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>TOTAL DE ENTREGAS CONCLUÍDAS:</span>
                  <strong>{metrics.totalPedidosConcluidos}</strong>
                </div>
                <div className="flex justify-between">
                  <span>VOLUME FATURADO EM PEDIDOS:</span>
                  <strong>R$ {metrics.totalVolumeFinanceiro.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>TOTAL EM TAXAS PAGAS/DEVIDAS A MOTOBOYS:</span>
                  <strong>R$ {metrics.totalTaxas.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div className="flex justify-between">
                  <span>VALORES RECEBIDOS NO LOCAL (DINHEIRO/MÁQUINA):</span>
                  <strong>R$ {metrics.cobrancasEmMaos.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div className="flex justify-between">
                  <span>VALORES RECEBIDOS ONLINE (IFOOD/CARDÁPIO):</span>
                  <strong>R$ {metrics.pedidosOnline.toFixed(2).replace('.', ',')}</strong>
                </div>
              </div>

              {/* Detalhamento por Motoboy */}
              {courierSummary.length > 0 && (
                <div className="space-y-2 pb-3 border-b border-dashed border-slate-300">
                  <div className="font-bold text-[11px]">DEMONSTRATIVO POR MOTOBOY:</div>
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-1">Motoboy</th>
                        <th className="py-1 text-center">Viagens</th>
                        <th className="py-1 text-right">Taxa (R$)</th>
                        <th className="py-1 text-right">Cobrado (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courierSummary.map((c) => (
                        <tr key={c.courierId}>
                          <td className="py-1 font-semibold">{c.courierName}</td>
                          <td className="py-1 text-center">{c.totalTrips}</td>
                          <td className="py-1 text-right">R$ {c.totalFees.toFixed(2).replace('.', ',')}</td>
                          <td className="py-1 text-right">R$ {c.collectedCash.toFixed(2).replace('.', ',')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Campo para assinaturas */}
              <div className="pt-6 grid grid-cols-2 gap-4 text-center text-[10px]">
                <div>
                  <div className="border-t border-slate-400 pt-1">Operador do Caixa</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1">Gerente / Responsável</div>
                </div>
              </div>
            </div>

            {/* Botões do Rodapé do Modal */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
