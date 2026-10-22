import React, { useState } from 'react';
import {
  DollarSign,
  Copy,
  Check,
  QrCode,
  Share2,
  Calendar,
  CheckCircle2,
  Bike,
  Sparkles,
  Download,
} from 'lucide-react';
import { User, Delivery, WeeklySettlement, StoreConfig, SettlementStatus } from '../types';
import { generatePixPayload, generateWhatsAppSettlementMessage } from '../services/pix';

interface FechamentoSemanalModalProps {
  couriers: User[];
  deliveries: Delivery[];
  settlements: WeeklySettlement[];
  storeConfig: StoreConfig;
  onSaveSettlement: (settlement: WeeklySettlement) => void;
}

export const FechamentoSemanalView: React.FC<FechamentoSemanalModalProps> = ({
  couriers,
  deliveries,
  settlements,
  storeConfig,
  onSaveSettlement,
}) => {
  // Ajustes por motoboy (bônus e descontos)
  const [bonuses, setBonuses] = useState<Record<string, number>>({});
  const [discounts, setDiscounts] = useState<Record<string, number>>({});

  // Modal de pagamento Pix ativo
  const [activePixCourier, setActivePixCourier] = useState<User | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Período da semana corrente (últimos 7 dias ou semana atual)
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0);

  // Calcula o intervalo da semana
  const weekRange = React.useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 domingo, 1 segunda...
    const diffToMonday = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    
    const monday = new Date(today.setDate(diffToMonday - selectedWeekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const format = (d: Date) =>
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    return {
      start: monday,
      end: sunday,
      label: `Semana de ${format(monday)} a ${format(sunday)}`,
    };
  }, [selectedWeekOffset]);

  // Agrega as entregas realizadas na semana por motoboy
  const courierSummaries = couriers.map((courier) => {
    // Entregas remuneráveis deste motoboy no período selecionado (DELIVERED e CANCELED_AFTER_DELIVERY)
    const payableDeliveries = deliveries.filter((d) => {
      if (d.courierId !== courier.id) return false;
      const isPayable = d.isFeePayable && (d.status === 'DELIVERED' || d.status === 'CANCELED_AFTER_DELIVERY');
      if (!isPayable) return false;
      const date = new Date(d.deliveredAt || d.canceledAt || d.createdAt);
      return date >= weekRange.start && date <= weekRange.end;
    });

    // Entregas canceladas antes da entrega (para exibição e auditoria, sem valor)
    const canceledBeforeList = deliveries.filter((d) => {
      if (d.courierId !== courier.id || d.status !== 'CANCELED_BEFORE_DELIVERY') return false;
      const date = new Date(d.canceledAt || d.createdAt);
      return date >= weekRange.start && date <= weekRange.end;
    });

    // Entregas canceladas pós-entrega (remuneradas)
    const canceledAfterCount = payableDeliveries.filter((d) => d.status === 'CANCELED_AFTER_DELIVERY').length;

    const totalDeliveries = payableDeliveries.length;
    const subtotalFees = payableDeliveries.reduce((sum, d) => sum + d.feeAmount, 0);

    // Conta dias distintos trabalhados
    const uniqueDays = new Set(
      payableDeliveries.map((d) =>
        new Date(d.deliveredAt || d.canceledAt || d.createdAt).toLocaleDateString('pt-BR')
      )
    ).size;

    const bonus = bonuses[courier.id] || 0;
    const discount = discounts[courier.id] || 0;
    const finalPayout = Math.max(0, subtotalFees + bonus - discount);

    // Checa se já existe um settlement gravado para este motoboy nesta semana
    const existingSettlement = settlements.find(
      (s) =>
        s.courierId === courier.id &&
        s.weekLabel === weekRange.label
    );

    return {
      courier,
      deliveries: payableDeliveries,
      totalDeliveries,
      canceledAfterCount,
      uniqueDays,
      subtotalFees,
      bonus,
      discount,
      finalPayout,
      existingSettlement,
    };
  });

  const totalWeekDeliveries = courierSummaries.reduce(
    (sum, s) => sum + s.totalDeliveries,
    0
  );
  const totalWeekAmount = courierSummaries.reduce(
    (sum, s) => sum + s.finalPayout,
    0
  );

  const handleBonusChange = (courierId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setBonuses((prev) => ({ ...prev, [courierId]: num }));
  };

  const handleDiscountChange = (courierId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setDiscounts((prev) => ({ ...prev, [courierId]: num }));
  };

  const handleOpenPixModal = (courier: User) => {
    setActivePixCourier(courier);
    setCopiedKey(false);
    setCopiedPayload(false);
  };

  const handleConfirmPayment = (courierId: string) => {
    const summary = courierSummaries.find((s) => s.courier.id === courierId);
    if (!summary) return;

    const newSettlement: WeeklySettlement = {
      id: summary.existingSettlement?.id || `settle_${Date.now()}_${courierId}`,
      courierId,
      startDate: weekRange.start.toISOString(),
      endDate: weekRange.end.toISOString(),
      weekLabel: weekRange.label,
      totalDeliveries: summary.totalDeliveries,
      totalAmount: summary.subtotalFees,
      bonusAmount: summary.bonus,
      discountAmount: summary.discount,
      finalPayout: summary.finalPayout,
      status: 'PAID',
      pixKeySnapshot: summary.courier.pixKey,
      pixTypeSnapshot: summary.courier.pixKeyType,
      paidAt: new Date().toISOString(),
      paidByUserName: 'Caixa / Administração',
      createdAt: new Date().toISOString(),
    };

    onSaveSettlement(newSettlement);
    alert(`Acerto semanal de ${summary.courier.name} marcado como PAGO com sucesso!`);
    setActivePixCourier(null);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Fechamento Semanal */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Fechamento Semanal de Taxas dos Motoboys
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Conforme a rotina da hamburgueria: consolidação de todas as entregas dos dias operados na semana para pagamento único via Pix.
          </p>
        </div>

        {/* Seletor de Semanas */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={selectedWeekOffset}
            onChange={(e) => setSelectedWeekOffset(Number(e.target.value))}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value={0}>Semana Atual (Corrente)</option>
            <option value={1}>Semana Anterior (-1)</option>
            <option value={2}>Há 2 semanas (-2)</option>
            <option value={3}>Há 3 semanas (-3)</option>
          </select>
        </div>
      </div>

      {/* Cards de Resumo Consolidado da Semana */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">
            Período de Apuração
          </span>
          <span className="text-sm font-bold text-slate-900 block mt-1">
            {weekRange.label}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">
            Total de Entregas da Semana
          </span>
          <span className="text-2xl font-bold text-slate-900 font-mono-numbers block mt-1">
            {totalWeekDeliveries}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">
            Montante Total a Pagar aos Motoboys
          </span>
          <span className="text-2xl font-bold text-emerald-600 font-mono-numbers block mt-1">
            R$ {totalWeekAmount.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* Tabela de Acerto por Motoboy */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Quadro Semanal por Motoboy
          </span>
          <span className="text-xs text-slate-500">
            {couriers.length} motoboys cadastrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Motoboy / Moto</th>
                <th className="py-3 px-4 text-center">Dias Trab.</th>
                <th className="py-3 px-4 text-center">Entregas</th>
                <th className="py-3 px-4 text-right">Subtotal Taxas</th>
                <th className="py-3 px-4 text-center">Bônus (R$)</th>
                <th className="py-3 px-4 text-center">Vales (R$)</th>
                <th className="py-3 px-4 text-right">Total a Pagar</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ação Pix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courierSummaries.map((summary) => {
                const isPaid = summary.existingSettlement?.status === 'PAID';

                return (
                  <tr key={summary.courier.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {summary.courier.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {summary.courier.vehiclePlate || 'Sem placa'} ·{' '}
                        {summary.courier.pixKey
                          ? `${summary.courier.pixKeyType}: ${summary.courier.pixKey}`
                          : 'Sem Pix'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono-numbers">
                      {summary.uniqueDays} dias
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-800 font-mono-numbers">
                      <div>{summary.totalDeliveries}</div>
                      {summary.canceledAfterCount > 0 && (
                        <div className="text-[10px] text-amber-600 font-normal">
                          (inclui {summary.canceledAfterCount} cancel. no local)
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono-numbers font-medium text-slate-700">
                      R$ {summary.subtotalFees.toFixed(2).replace('.', ',')}
                    </td>

                    {/* Input de Bônus (chuva, diária extra) */}
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        disabled={isPaid}
                        placeholder="0.00"
                        value={bonuses[summary.courier.id] || ''}
                        onChange={(e) =>
                          handleBonusChange(summary.courier.id, e.target.value)
                        }
                        className="w-18 text-xs font-mono text-center bg-slate-50 border border-slate-200 rounded p-1 text-slate-800 disabled:opacity-50"
                      />
                    </td>

                    {/* Input de Vales / Adiantamentos */}
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        disabled={isPaid}
                        placeholder="0.00"
                        value={discounts[summary.courier.id] || ''}
                        onChange={(e) =>
                          handleDiscountChange(summary.courier.id, e.target.value)
                        }
                        className="w-18 text-xs font-mono text-center bg-slate-50 border border-slate-200 rounded p-1 text-rose-700 disabled:opacity-50"
                      />
                    </td>

                    <td className="py-3 px-4 text-right font-mono-numbers font-bold text-sm text-emerald-700">
                      R$ {summary.finalPayout.toFixed(2).replace('.', ',')}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isPaid ? (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pago
                        </span>
                      ) : summary.totalDeliveries > 0 ? (
                        <span className="text-[11px] font-semibold text-amber-700">
                          Pendente
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sem corridas</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {summary.totalDeliveries > 0 && (
                        <button
                          onClick={() => handleOpenPixModal(summary.courier)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ml-auto ${
                            isPaid
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{isPaid ? 'Ver Recibo' : 'Pagar Pix'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Pagamento Pix Oficial (BR Code & WhatsApp) */}
      {activePixCourier && (() => {
        const activeSummary = courierSummaries.find(
          (s) => s.courier.id === activePixCourier.id
        );
        if (!activeSummary) return null;

        const pixPayload = activePixCourier.pixKey
          ? generatePixPayload({
              pixKey: activePixCourier.pixKey,
              merchantName: activePixCourier.name,
              merchantCity: storeConfig.city,
              amount: activeSummary.finalPayout,
              description: `Taxas ${storeConfig.storeName} ${weekRange.label.slice(0, 20)}`,
            })
          : '';

        const whatsappMessage = generateWhatsAppSettlementMessage({
          storeName: storeConfig.storeName,
          courierName: activePixCourier.name,
          periodLabel: weekRange.label,
          totalDeliveries: activeSummary.totalDeliveries,
          totalAmount: activeSummary.subtotalFees,
          bonusAmount: activeSummary.bonus,
          discountAmount: activeSummary.discount,
          finalPayout: activeSummary.finalPayout,
          pixKey: activePixCourier.pixKey || 'Não cadastrada',
          pixType: activePixCourier.pixKeyType || 'PIX',
        });

        const isAlreadyPaid = activeSummary.existingSettlement?.status === 'PAID';

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Acerto Semanal via Pix
                  </h3>
                </div>
                <button
                  onClick={() => setActivePixCourier(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Fechar
                </button>
              </div>

              {/* Detalhes do Pagamento */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Motoboy:</span>
                  <span className="font-bold text-slate-900">
                    {activePixCourier.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Período:</span>
                  <span className="text-slate-700">{weekRange.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">
                    Total de Corridas:
                  </span>
                  <span className="font-bold text-slate-900 font-mono-numbers">
                    {activeSummary.totalDeliveries} entregas
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Total a Pagar:</span>
                  <span className="text-xl font-black text-emerald-600 font-mono-numbers">
                    R$ {activeSummary.finalPayout.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Chave Pix e Copia e Cola */}
              {activePixCourier.pixKey ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-1">
                      Chave Pix Direta ({activePixCourier.pixKeyType}):
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 font-mono text-xs px-3 py-2 rounded-xl text-slate-800 truncate">
                        {activePixCourier.pixKey}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activePixCourier.pixKey || '');
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1 shrink-0"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? 'Copiado!' : 'Copiar Chave'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-1">
                      Código Pix "Copia e Cola" (BR Code Banco Central):
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 font-mono text-[11px] px-3 py-2 rounded-xl text-slate-600 truncate">
                        {pixPayload}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pixPayload);
                          setCopiedPayload(true);
                          setTimeout(() => setCopiedPayload(false), 2000);
                        }}
                        className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shrink-0"
                      >
                        {copiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPayload ? 'Copiado!' : 'Copiar Código'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  Este motoboy ainda não cadastrou a Chave Pix. Solicite a chave no celular dele ou cadastre na aba Motoboys.
                </div>
              )}

              {/* Botões de Ação Final */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>Extrato WhatsApp</span>
                </a>

                <button
                  onClick={() => handleConfirmPayment(activePixCourier.id)}
                  disabled={isAlreadyPaid}
                  className={`h-11 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                    isAlreadyPaid
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isAlreadyPaid ? 'Já Marcado como Pago' : 'Confirmar Pago'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
