import React, { useEffect } from 'react';
import { Delivery, StoreConfig, User, ThermalPrinterSettings } from '../types';
import { loadPrinterSettings } from '../services/storage';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface ThermalReceiptModalProps {
  delivery: Delivery | null;
  storeConfig: StoreConfig;
  couriers?: User[];
  printerSettings?: ThermalPrinterSettings;
  onClose: () => void;
  onMarkPrinted?: (deliveryId: string) => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  delivery,
  storeConfig,
  couriers = [],
  printerSettings: propPrinterSettings,
  onClose,
  onMarkPrinted,
}) => {
  const printerSettings = propPrinterSettings || loadPrinterSettings();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!delivery) return null;

  const assignedCourier = couriers.find((c) => c.id === delivery.courierId);

  // Determina rótulo e cor da plataforma
  const getSourceDisplay = (source: string) => {
    switch (source) {
      case 'IFOOD':
        return { label: 'iFood Entrega', badge: 'iFood' };
      case '99FOOD':
        return { label: '99Food Delivery', badge: '99Food' };
      case 'KEETA':
        return { label: 'Keeta Delivery', badge: 'Keeta' };
      case 'BALCAO':
        return { label: 'Pedido Balcão / WhatsApp', badge: 'Balcão' };
      default:
        return { label: 'Sistema Local', badge: 'Local' };
    }
  };

  const sourceInfo = getSourceDisplay(delivery.source);

  // Calcula valores caso subtotal não esteja explicitamente gravado
  const subtotal =
    delivery.subtotal ??
    (delivery.items && delivery.items.length > 0
      ? delivery.items.reduce((acc, it) => acc + it.totalPrice, 0)
      : Math.max(0, (delivery.orderTotal || 45) - (delivery.customerDeliveryFee ?? 6)));

  const deliveryFee = delivery.customerDeliveryFee ?? 6.0;
  const discount = delivery.discountAmount ?? 0;
  const orderTotal = delivery.orderTotal ?? Math.max(0, subtotal + deliveryFee - discount);

  const handlePrint = () => {
    if (onMarkPrinted) {
      onMarkPrinted(delivery.id);
    }
    window.print();
  };

  const formattedDate = new Date(delivery.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const formattedTime = new Date(delivery.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Cálculo das dimensões físicas em milímetros
  const paperWidthMm =
    printerSettings.paperWidth === '58mm'
      ? 58
      : printerSettings.paperWidth === '72mm'
      ? 72
      : printerSettings.paperWidth === '80mm'
      ? 80
      : printerSettings.paperWidth === '112mm'
      ? 112
      : printerSettings.customWidthMm || 80;

  // Largura útil de impressão (descontando margens dos roletes)
  const printableWidthMm =
    printerSettings.paperWidth === '58mm'
      ? 48
      : printerSettings.paperWidth === '72mm'
      ? 68
      : printerSettings.paperWidth === '80mm'
      ? 74
      : printerSettings.paperWidth === '112mm'
      ? 104
      : Math.max(38, paperWidthMm - 6);

  const fontSizeCss =
    printerSettings.fontSize === 'compact'
      ? '10px'
      : printerSettings.fontSize === 'large'
      ? '13px'
      : '11px';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Estilos específicos para impressoras térmicas baseados nas configurações */}
      <style>{`
        @media print {
          @page {
            size: ${paperWidthMm}mm auto;
            margin: 0;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Esconde tudo no DOM exceto o cupom térmico */
          body * {
            visibility: hidden !important;
          }
          #thermal-print-receipt, #thermal-print-receipt * {
            visibility: visible !important;
          }
          #thermal-print-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${printableWidthMm}mm !important;
            max-width: ${printableWidthMm}mm !important;
            margin: 0 !important;
            padding: 2mm 2.5mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: ${fontSizeCss} !important;
            line-height: 1.25 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .thermal-no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Caixa do Modal na Tela */}
      <div className="relative w-full max-w-[420px] bg-slate-900/95 dark:bg-slate-900/95 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col my-auto max-h-[95vh] print:max-h-none print:bg-white print:border-none print:shadow-none print:w-auto">
        {/* Topo do Modal (Controles na tela) */}
        <div className="thermal-no-print px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold leading-tight">Visualização do Cupom Térmico</h3>
              <p className="text-[10px] text-slate-400">
                Padrão bobina: <strong className="text-amber-400">{printerSettings.paperWidth}</strong> ({printerSettings.printerModel.split('/')[0].trim()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Área de Visualização do Papel Térmico (Scrollável na tela, fixa na impressão) */}
        <div className="p-4 sm:p-5 overflow-y-auto bg-slate-950/60 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div
            id="thermal-print-receipt"
            className="w-full bg-white text-black p-4 font-mono leading-tight shadow-md border-t-4 border-dashed border-slate-300 rounded-sm print:max-w-none print:p-1 print:border-none print:shadow-none"
            style={{
              fontFamily: `'Courier New', Courier, monospace`,
              maxWidth: `${Math.min(380, Math.max(260, printableWidthMm * 4.3))}px`,
              fontSize: fontSizeCss,
            }}
          >
            {/* CABEÇALHO DO ESTABELECIMENTO */}
            {printerSettings.showStoreHeader && (
              <div className="text-center pb-2 border-b border-dashed border-black">
                <div className="text-sm font-black uppercase tracking-wider leading-snug">
                  {storeConfig.storeName || 'ESTABELECIMENTO'}
                </div>
                {storeConfig.cnpj && (
                  <div className="text-[9px] text-slate-700">CNPJ: {storeConfig.cnpj}</div>
                )}
                <div className="text-[10px] mt-0.5">
                  {storeConfig.street}, {storeConfig.number}
                  {storeConfig.neighborhood ? ` - ${storeConfig.neighborhood}` : ''}
                </div>
                <div className="text-[10px]">
                  {storeConfig.city} - {storeConfig.state}
                </div>
                {storeConfig.phone && (
                  <div className="text-[9px] font-bold">Tel: {storeConfig.phone}</div>
                )}
                <div className="text-[9px] text-slate-600 mt-1">
                  Data: {formattedDate} {formattedTime}
                </div>
              </div>
            )}

            {/* BANNER DA PLATAFORMA E IDENTIFICADOR DO PEDIDO */}
            <div className="my-2 py-1.5 px-1 bg-black text-white text-center rounded-xs">
              <div className="text-[10px] font-bold tracking-widest uppercase">
                {sourceInfo.label}
              </div>
              <div className="text-base font-black tracking-wider">
                {delivery.orderNumber}
              </div>
            </div>

            {/* DADOS DO CLIENTE E ENTREGA */}
            <div className="py-1.5 border-b border-dashed border-black">
              <div className="text-[9px] font-bold uppercase text-slate-700">CLIENTE:</div>
              <div className="text-xs font-black uppercase">{delivery.customerName}</div>
              {delivery.customerPhone && (
                <div className="text-[10px] font-bold">Tel: {delivery.customerPhone}</div>
              )}

              <div className="mt-1 text-[9px] font-bold uppercase text-slate-700">ENDEREÇO DE ENTREGA:</div>
              <div className="text-xs font-black">
                {delivery.street}, {delivery.number}
                {delivery.complement ? ` - ${delivery.complement}` : ''}
              </div>
              <div className="text-[10px] font-bold uppercase">
                Bairro: {delivery.neighborhood}
              </div>
              <div className="text-[9px]">
                {delivery.city} - {delivery.state} {delivery.postalCode ? `(CEP: ${delivery.postalCode})` : ''}
              </div>

              {/* Informações da Viagem e Motoboy */}
              <div className="mt-1.5 pt-1 border-t border-dotted border-slate-400 text-[10px] flex justify-between">
                <span>Distância: <strong>{delivery.distanceKm.toFixed(1)} km</strong></span>
                <span>Tempo est.: <strong>{delivery.durationMinutes} min</strong></span>
              </div>
              {assignedCourier && (
                <div className="text-[10px] font-bold mt-0.5">
                  Motoboy: {assignedCourier.name} {assignedCourier.vehicleModel ? `(${assignedCourier.vehicleModel})` : ''}
                </div>
              )}
            </div>

            {/* LISTA COMPLETA E DISCRIMINADA DE ITENS */}
            <div className="py-2 border-b border-dashed border-black">
              <div className="text-center font-bold text-[10px] uppercase tracking-wider mb-1.5">
                --- DISCRIMINAÇÃO DOS ITENS ---
              </div>

              {delivery.items && delivery.items.length > 0 ? (
                <div className="space-y-2">
                  {delivery.items.map((item, idx) => (
                    <div key={item.id || idx} className="text-[11px]">
                      {/* Linha Principal do Item: Qtd x Nome e Valor */}
                      <div className="flex justify-between items-start font-black">
                        <span className="pr-1">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="shrink-0">
                          R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* Adicionais / Opções do Item */}
                      {item.options && item.options.length > 0 && (
                        <div className="pl-3 text-[10px] space-y-0.5 mt-0.5 text-slate-800">
                          {item.options.map((opt, oIdx) => (
                            <div key={oIdx} className="leading-tight">
                              • {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Observação do Item */}
                      {item.notes && (
                        <div className="pl-3 text-[10px] italic font-semibold text-slate-700 mt-0.5">
                          Obs: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback caso seja um pedido legado com itemsSummary */
                <div className="text-xs">
                  <div className="font-bold">{delivery.itemsSummary || '1x Pedido Padrão'}</div>
                </div>
              )}
            </div>

            {/* OBSERVAÇÃO GERAL DO CLIENTE / COZINHA */}
            {printerSettings.showCustomerNotes && delivery.customerNotes && (
              <div className="py-2 border-b border-dashed border-black">
                <div className="text-[9px] font-bold uppercase text-slate-700">OBSERVAÇÕES DO CLIENTE:</div>
                <div className="text-[10px] font-bold bg-slate-100 p-1.5 border border-slate-300 rounded-xs mt-0.5 leading-tight">
                  {delivery.customerNotes}
                </div>
              </div>
            )}

            {/* TOTAIS E FINANCEIRO */}
            <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal dos Itens:</span>
                <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>

              <div className="flex justify-between">
                <span>Taxa de Entrega:</span>
                <span>R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Desconto / Cupom:</span>
                  <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}

              <div className="pt-1 border-t border-dotted border-black flex justify-between items-center text-sm font-black">
                <span>TOTAL DO PEDIDO:</span>
                <span>R$ {orderTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {/* FORMA DE PAGAMENTO E AVISO DE COBRANÇA */}
            <div className="py-2 border-b-2 border-black text-center">
              {delivery.paymentMethod === 'ONLINE' ? (
                <div className="p-1.5 border-2 border-black bg-slate-100 font-black text-xs leading-tight">
                  *** JÁ PAGO ONLINE ***
                  <div className="text-[9px] font-bold mt-0.5">NÃO COBRAR NADA DO CLIENTE</div>
                </div>
              ) : (
                <div className="p-1.5 border-2 border-black bg-black text-white font-black text-xs leading-tight">
                  *** COBRAR NA ENTREGA ***
                  <div className="text-sm font-black mt-0.5">
                    R$ {orderTotal.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-[9px] font-normal tracking-wide mt-0.5">
                    Forma: {delivery.paymentMethod === 'CARD' ? 'Cartão de Débito/Crédito' : delivery.paymentMethod === 'PIX' ? 'PIX na Entrega' : 'Dinheiro'}
                  </div>
                </div>
              )}
            </div>

            {/* MENSAGEM DE RODAPÉ PERSONALIZADA */}
            {printerSettings.customFooterNote && (
              <div className="text-center text-[9px] font-bold py-1.5 border-t border-dashed border-black mt-1">
                {printerSettings.customFooterNote}
              </div>
            )}

            {/* CONTROLE INTERNO DO MOTOBOY */}
            {printerSettings.showCourierSection && (
              <div className="pt-2 text-[9px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>Taxa Motoboy (Remuneração):</span>
                  <span>R$ {delivery.feeAmount.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="text-center text-[8px] text-slate-500 pt-1">
                  EntregueJá · Controle de Expedição e Entregas
                </div>
              </div>
            )}

            {/* LINHAS EM BRANCO PARA CORTE DA GUILHOTINA */}
            <div style={{ height: `${Math.max(1, printerSettings.feedLines || 3) * 6}mm` }} />
          </div>
        </div>

        {/* Rodapé com Botão de Impressão Direta (Conforme exigido pelo usuário: apenas botão de imprimir e fechar, sem copiar texto) */}
        <div className="thermal-no-print p-4 bg-slate-800 border-t border-slate-700 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-2 shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cupom Térmico</span>
          </button>
        </div>
      </div>
    </div>
  );
};
