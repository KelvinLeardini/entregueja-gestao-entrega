import React from 'react';
import { Delivery, StoreConfig, ThermalPrinterSettings } from '../types';
import { Printer, X } from 'lucide-react';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  storeConfig: StoreConfig;
  printerSettings?: ThermalPrinterSettings;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  delivery,
  storeConfig,
  printerSettings,
}) => {
  if (!isOpen || !delivery) return null;

  const widthMm =
    printerSettings?.paperWidth === '58mm'
      ? '58mm'
      : printerSettings?.paperWidth === 'custom'
      ? `${printerSettings.customWidthMm || 80}mm`
      : '80mm';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
            <Printer className="w-5 h-5 text-amber-500" />
            <span>Comanda de Impressão Térmica</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pré-visualização da Comanda */}
        <div
          className="mx-auto bg-white text-black p-4 rounded border border-dashed border-slate-300 font-mono text-xs shadow-inner"
          style={{ width: widthMm, maxWidth: '100%' }}
        >
          <div className="text-center font-bold text-sm mb-2">{storeConfig.storeName}</div>
          <div className="text-center text-[10px] mb-3">{storeConfig.phone}</div>
          <div className="border-b border-black pb-2 mb-2">
            <div>PEDIDO: #{delivery.orderNumber} ({delivery.source})</div>
            <div>DATA: {new Date(delivery.createdAt).toLocaleString('pt-BR')}</div>
          </div>

          <div className="border-b border-black pb-2 mb-2">
            <div className="font-bold">CLIENTE:</div>
            <div>{delivery.customerName}</div>
            {delivery.customerPhone && <div>Tel: {delivery.customerPhone}</div>}
            <div>
              {delivery.street}, {delivery.number}
            </div>
            <div>{delivery.neighborhood} - {delivery.city}</div>
          </div>

          {delivery.items && delivery.items.length > 0 && (
            <div className="border-b border-black pb-2 mb-2">
              <div className="font-bold mb-1">ITENS:</div>
              {delivery.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.quantity}x {it.name}</span>
                  <span>R$ {it.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 text-right">
            <div>Taxa Entrega: R$ {delivery.feeAmount.toFixed(2)}</div>
            <div className="font-bold text-sm">TOTAL: R$ {(delivery.orderTotal || 0).toFixed(2)}</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Fechar
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cupom</span>
          </button>
        </div>
      </div>
    </div>
  );
};
