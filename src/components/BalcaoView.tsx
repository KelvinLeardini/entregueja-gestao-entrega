import React, { useState } from 'react';
import {
  Delivery,
  User,
  StoreConfig,
  DeliveryRateRange,
  AddressCacheItem,
  OrderSource,
  ThermalPrinterSettings,
} from '../types';
import { calculateDeliveryFee } from '../services/feeCalculator';
import { playNewOrderChime, playDispatchSuccessChime } from '../services/soundEffects';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { Bike, Clock, MapPin, Printer, Search, PlusCircle, CheckCircle2 } from 'lucide-react';

interface BalcaoViewProps {
  deliveries: Delivery[];
  couriers: User[];
  storeConfig: StoreConfig;
  rateRanges: DeliveryRateRange[];
  addressCache: AddressCacheItem[];
  printerSettings?: ThermalPrinterSettings;
  isDemo?: boolean;
  onAddDelivery: (delivery: Delivery) => void;
  onUpdateDeliveryStatus: (
    deliveryId: string,
    status: Delivery['status'],
    courierId?: string
  ) => void;
  onUpdateAddressCache: (item: AddressCacheItem) => void;
}

export const BalcaoView: React.FC<BalcaoViewProps> = ({
  deliveries,
  couriers,
  storeConfig,
  rateRanges,
  isDemo,
  onAddDelivery,
  onUpdateDeliveryStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingReceipt, setViewingReceipt] = useState<Delivery | null>(null);

  const pending = deliveries.filter((d) => d.status === 'PENDING');
  const inTransit = deliveries.filter((d) => d.status === 'IN_TRANSIT');
  const delivered = deliveries.filter((d) => d.status === 'DELIVERED');

  const handleSimulateArrival = (source: OrderSource) => {
    const num = Math.floor(Math.random() * 900 + 100);
    const feeRes = calculateDeliveryFee(3.5, rateRanges, storeConfig.fallbackRate, storeConfig.extraKmRate);
    const sim: Delivery = {
      id: `del_${Date.now()}_${num}`,
      orderNumber: `${source === 'IFOOD' ? 'IF' : source === '99FOOD' ? '99' : 'BAL'}-${num}`,
      source,
      customerName: 'Cliente Demonstração',
      street: 'Rua Cantagalo',
      number: `${num}`,
      neighborhood: 'Tatuapé',
      city: storeConfig.city,
      state: storeConfig.state,
      distanceKm: 3.5,
      durationMinutes: 12,
      feeAmount: feeRes.fee,
      isManualOverride: false,
      status: 'PENDING',
      isFeePayable: true,
      orderTotal: 65.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onAddDelivery(sim);
    playNewOrderChime();
  };

  const handleDispatch = (delId: string, courierId: string) => {
    if (!courierId) return;
    onUpdateDeliveryStatus(delId, 'IN_TRANSIT', courierId);
    playDispatchSuccessChime();
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações Rápidas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Balcão Operacional</h2>
            <p className="text-xs text-slate-500">{deliveries.length} pedidos hoje · {couriers.length} motoboys</p>
          </div>
        </div>

        {isDemo && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Simular Pedido:</span>
            <button
              onClick={() => handleSimulateArrival('IFOOD')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-500"
            >
              + iFood
            </button>
            <button
              onClick={() => handleSimulateArrival('99FOOD')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-500 text-white hover:bg-orange-400"
            >
              + 99Food
            </button>
          </div>
        )}
      </div>

      {/* Grid de Pedidos por Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pendentes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pendentes ({pending.length})
            </span>
          </div>
          <div className="space-y-3">
            {pending.map((d) => (
              <div
                key={d.id}
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">#{d.orderNumber}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {d.source}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{d.customerName}</p>
                  <p>{d.street}, {d.number} - {d.neighborhood}</p>
                  <p className="mt-1 font-mono text-[11px] text-amber-600 dark:text-amber-400">
                    {d.distanceKm} km · R$ {d.feeAmount.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setViewingReceipt(d)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Imprimir comanda"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <select
                    onChange={(e) => handleDispatch(d.id, e.target.value)}
                    defaultValue=""
                    className="flex-1 text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="" disabled>Despachar para...</option>
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Em Trânsito */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Em Trânsito ({inTransit.length})
            </span>
          </div>
          <div className="space-y-3">
            {inTransit.map((d) => {
              const courier = couriers.find((c) => c.id === d.courierId);
              return (
                <div
                  key={d.id}
                  className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">#{d.orderNumber}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                      Com {courier?.name || 'Motoboy'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <p>{d.street}, {d.number} - {d.neighborhood}</p>
                  </div>
                  <button
                    onClick={() => onUpdateDeliveryStatus(d.id, 'DELIVERED')}
                    className="w-full py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmar Entrega</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Entregues */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Entregues ({delivered.length})
            </span>
          </div>
          <div className="space-y-3">
            {delivered.slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center opacity-80"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">#{d.orderNumber}</span>
                  <p className="text-slate-500">{d.neighborhood}</p>
                </div>
                <span className="font-mono text-emerald-600 font-bold">R$ {d.feeAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ThermalReceiptModal
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        delivery={viewingReceipt}
        storeConfig={storeConfig}
      />
    </div>
  );
};
