import React, { useState } from 'react';
import { DeliveryRateRange } from '../types';
import { X, Layers, Plus, Trash2 } from 'lucide-react';

interface TabelaTaxasModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateRanges: DeliveryRateRange[];
  onSaveRanges: (ranges: DeliveryRateRange[]) => void;
}

export const TabelaTaxasModal: React.FC<TabelaTaxasModalProps> = ({
  isOpen,
  onClose,
  rateRanges,
  onSaveRanges,
}) => {
  const [ranges, setRanges] = useState<DeliveryRateRange[]>(rateRanges);

  if (!isOpen) return null;

  const handleAddRange = () => {
    const last = ranges[ranges.length - 1];
    const min = last ? last.maxDistanceKm : 0;
    const max = min + 2;
    const newRange: DeliveryRateRange = {
      id: `range_${Date.now()}`,
      minDistanceKm: min,
      maxDistanceKm: max,
      feeAmount: last ? last.feeAmount + 2 : 6.0,
      label: `De ${min}km a ${max}km`,
    };
    setRanges([...ranges, newRange]);
  };

  const handleRemoveRange = (id: string) => {
    setRanges(ranges.filter((r) => r.id !== id));
  };

  const handleSave = () => {
    onSaveRanges(ranges);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Tabela de Taxas por KM</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {ranges.map((r, idx) => (
            <div
              key={r.id}
              className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
            >
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {r.minDistanceKm} km até {r.maxDistanceKm} km
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  R$ {r.feeAmount.toFixed(2)}
                </span>
                <button
                  onClick={() => handleRemoveRange(r.id)}
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddRange}
          className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Faixa</span>
        </button>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-sm"
          >
            Salvar Tabela
          </button>
        </div>
      </div>
    </div>
  );
};
