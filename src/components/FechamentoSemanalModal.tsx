import React, { useState } from 'react';
import { User, Delivery, WeeklySettlement } from '../types';
import { X, DollarSign, Calendar, Copy, Check } from 'lucide-react';

interface FechamentoSemanalModalProps {
  isOpen: boolean;
  onClose: () => void;
  couriers: User[];
  deliveries: Delivery[];
  onConfirmSettlement?: (settlement: WeeklySettlement) => void;
}

export const FechamentoSemanalModal: React.FC<FechamentoSemanalModalProps> = ({
  isOpen,
  onClose,
  couriers,
  deliveries,
}) => {
  const [selectedCourierId, setSelectedCourierId] = useState<string>(couriers[0]?.id || '');
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const courier = couriers.find((c) => c.id === selectedCourierId);
  const courierDeliveries = deliveries.filter((d) => d.courierId === selectedCourierId);

  // Regra clara de negócio para cancelamentos:
  // - Cancelado antes da saída: moto não rodou, taxa R$ 0,00
  // - Cancelado no local / após saída: cliente recusou na porta, taxa integral paga ao motoboy
  const eligibleDeliveries = courierDeliveries.filter(
    (d) => d.status === 'DELIVERED' || d.status === 'CANCELED_AFTER_DELIVERY'
  );

  const totalFeeAmount = eligibleDeliveries.reduce((sum, d) => sum + d.feeAmount, 0);

  const handleCopyPix = () => {
    if (courier?.pixKey) {
      navigator.clipboard.writeText(courier.pixKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Fechamento Semanal (Pix)</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor de Motoboy */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Selecione o Entregador:
          </label>
          <select
            value={selectedCourierId}
            onChange={(e) => setSelectedCourierId(e.target.value)}
            className="w-full py-2 px-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
          >
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.vehicleModel || 'Moto'})
              </option>
            ))}
          </select>
        </div>

        {/* Resumo Financeiro */}
        {courier && (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="text-xs text-slate-500">Total a Repassar:</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  R$ {totalFeeAmount.toFixed(2)}
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <span>{eligibleDeliveries.length} entregas liquidadas</span>
              </div>
            </div>

            {/* Chave Pix do Motoboy */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">Chave Pix ({courier.pixKeyType || 'Chave'}):</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {courier.pixKey || 'Não cadastrada'}
                </span>
              </div>
              {courier.pixKey && (
                <button
                  onClick={handleCopyPix}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copiada!' : 'Copiar Pix'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
