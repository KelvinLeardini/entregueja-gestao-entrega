import React, { useState } from 'react';
import {
  X,
  Printer,
  Plug,
  Store,
  CheckCircle2,
  Sliders,
  FileText,
  AlertCircle,
  Save,
  RefreshCw,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  ThermalPrinterSettings,
  ThermalPaperWidth,
  ThermalFontSize,
  PlatformApiConfig,
  StoreConfig,
} from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  printerSettings: ThermalPrinterSettings;
  onSavePrinterSettings: (settings: ThermalPrinterSettings) => void;
  platformConfig: PlatformApiConfig;
  onSavePlatformConfig: (config: PlatformApiConfig) => void;
  storeConfig: StoreConfig;
  onSaveStoreConfig: (config: StoreConfig) => void;
  tenantSlug?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  printerSettings: initialPrinterSettings,
  onSavePrinterSettings,
  platformConfig: initialPlatformConfig,
  onSavePlatformConfig,
  storeConfig: initialStoreConfig,
  onSaveStoreConfig,
  tenantSlug = 'loja',
}) => {
  const [activeTab, setActiveTab] = useState<'printer' | 'apis' | 'store'>('printer');

  // Estados locais dos formulários
  const [printer, setPrinter] = useState<ThermalPrinterSettings>(initialPrinterSettings);
  const [platform, setPlatform] = useState<PlatformApiConfig>(initialPlatformConfig);
  const [store, setStore] = useState<StoreConfig>(initialStoreConfig);

  // Feedbacks de teste de conexão e salvamento
  const [testStatus, setTestStatus] = useState<Record<string, { loading: boolean; message: string; success: boolean }>>({});
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = (service: 'ifood' | 'food99' | 'keeta' | 'whatsapp') => {
    setTestStatus((prev) => ({
      ...prev,
      [service]: { loading: true, message: 'Testando comunicação com a API...', success: false },
    }));

    setTimeout(() => {
      let isSuccess = false;
      let msg = '';

      if (service === 'ifood') {
        const hasId = !!platform.ifood.clientId && !!platform.ifood.merchantId;
        isSuccess = hasId;
        msg = hasId
          ? 'iFood API Conectada! Merchant verificado com sucesso.'
          : 'Aviso: Preencha Client ID e Merchant ID para validar o handshake.';
        if (hasId) {
          setPlatform((p) => ({
            ...p,
            ifood: { ...p.ifood, status: 'connected', lastTestedAt: new Date().toISOString() },
          }));
        }
      } else if (service === 'food99') {
        const hasKey = !!platform.food99.appKey && !!platform.food99.storeId;
        isSuccess = hasKey;
        msg = hasKey
          ? '99Food API Autenticada com sucesso! Loja ativa.'
          : 'Aviso: Preencha Store ID e App Key.';
        if (hasKey) {
          setPlatform((p) => ({
            ...p,
            food99: { ...p.food99, status: 'connected', lastTestedAt: new Date().toISOString() },
          }));
        }
      } else if (service === 'keeta') {
        const hasKey = !!platform.keeta.apiKey && !!platform.keeta.storeCode;
        isSuccess = hasKey;
        msg = hasKey
          ? 'Keeta Delivery Gateway Conectado com sucesso!'
          : 'Aviso: Preencha Store Code e API Key.';
        if (hasKey) {
          setPlatform((p) => ({
            ...p,
            keeta: { ...p.keeta, status: 'connected', lastTestedAt: new Date().toISOString() },
          }));
        }
      } else if (service === 'whatsapp') {
        const hasUrl = !!platform.whatsapp?.serverUrl;
        isSuccess = hasUrl;
        msg = hasUrl
          ? 'Instância do WhatsApp verificada! Pronta para disparos de rota.'
          : 'Aviso: Informe a URL do servidor Evolution/Z-API.';
        if (hasUrl && platform.whatsapp) {
          setPlatform((p) => ({
            ...p,
            whatsapp: { ...p.whatsapp!, status: 'connected', lastTestedAt: new Date().toISOString() },
          }));
        }
      }

      setTestStatus((prev) => ({
        ...prev,
        [service]: { loading: false, message: msg, success: isSuccess },
      }));
    }, 900);
  };

  const handleTestPrint = () => {
    // Cria um documento de teste temporário ou dispara impressão direta
    const widthMm =
      printer.paperWidth === '58mm'
        ? '58mm'
        : printer.paperWidth === '72mm'
        ? '72mm'
        : printer.paperWidth === '80mm'
        ? '80mm'
        : printer.paperWidth === '112mm'
        ? '112mm'
        : `${printer.customWidthMm}mm`;

    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir a página de teste.');
      return;
    }

    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Teste de Impressão Térmica - ${printer.paperWidth}</title>
          <style>
            @page {
              size: ${widthMm} auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: ${printer.fontSize === 'compact' ? '10px' : printer.fontSize === 'large' ? '13px' : '11px'};
              line-height: 1.25;
              padding: 4mm 3mm;
              margin: 0;
              color: #000000;
              background: #ffffff;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
            .ruler {
              font-size: 8px;
              letter-spacing: 1px;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 2px 0;
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="center bold border-b">
            <div>*** TESTE DE IMPRESSÃO TÉRMICA ***</div>
            <div>ENTREGUEJÁ DELIVERY</div>
          </div>
          <div class="border-b">
            <div><strong>Estabelecimento:</strong> ${store.storeName}</div>
            <div><strong>Modelo Configurado:</strong> ${printer.printerModel}</div>
            <div><strong>Largura de Bobina:</strong> ${printer.paperWidth} (${widthMm})</div>
            <div><strong>Tamanho da Fonte:</strong> ${printer.fontSize}</div>
            <div><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</div>
          </div>
          <div class="center ruler">
            |....10....20....30....40....50....60....70....80|
          </div>
          <div class="border-b">
            <div><strong>Alinhamento de Margem:</strong></div>
            <div>[ESQUERDA 0mm .......................... DIREITA]</div>
            <div>0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
            <div>abcdefghijklmnopqrstuvwxyz 0123456789</div>
          </div>
          <div class="center border-b">
            <div>${printer.customHeaderNote || 'Obrigado pela preferência!'}</div>
          </div>
          <div class="center">
            <div>-- TESTE CONCLUÍDO COM SUCESSO --</div>
            <div style="font-size: 9px; margin-top: 2px;">${printer.customFooterNote || 'EntregueJá SaaS'}</div>
          </div>
          ${'<br/>'.repeat(printer.feedLines)}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(testHtml);
    printWindow.document.close();
  };

  const handleSaveAll = () => {
    onSavePrinterSettings(printer);
    onSavePlatformConfig(platform);
    onSaveStoreConfig(store);

    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
      onClose();
    }, 1100);
  };

  const webhookBaseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/v1/webhooks/${tenantSlug}/orders`
    : `https://entregueja.app/api/v1/webhooks/${tenantSlug}/orders`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* TOPO DO MODAL */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shadow-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2">
                Painel de Configurações da Loja
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                  /{tenantSlug}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure impressora térmica, integração com APIs de delivery e dados cadastrais.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVEGAÇÃO POR ABAS (TABS) */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 sm:px-6 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('printer')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'printer'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Impressora Térmica & Recibos</span>
          </button>

          <button
            onClick={() => setActiveTab('apis')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'apis'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Plug className="w-4 h-4" />
            <span>APIs & Webhooks (iFood/99/Keeta)</span>
          </button>

          <button
            onClick={() => setActiveTab('store')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'store'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Dados do Estabelecimento</span>
          </button>
        </div>

        {/* CORPO DO MODAL (SCROLLÁVEL) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 dark:text-slate-200 text-xs">
          
          {/* ========================================================= */}
          {/* ABA 1: CONFIGURAÇÕES DA IMPRESSORA TÉRMICA & RECIBOS      */}
          {/* ========================================================= */}
          {activeTab === 'printer' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* SELEÇÃO DO MODELO / LARGURA DA BOBINA */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-1">
                    Largura do Papel / Bobina Térmica
                  </label>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Selecione o padrão de bobina compatível com a sua impressora de recibos:
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    {
                      id: '58mm' as ThermalPaperWidth,
                      title: '58 mm (2")',
                      desc: 'Mini POS / Bluetooth / Portátil',
                      width: '48mm útil',
                    },
                    {
                      id: '72mm' as ThermalPaperWidth,
                      title: '72 / 76 mm',
                      desc: 'Bobina estreita / Matricial',
                      width: '68mm útil',
                    },
                    {
                      id: '80mm' as ThermalPaperWidth,
                      title: '80 mm (3" Padrão)',
                      desc: 'Epson, Bematech, Elgin i9',
                      width: '74mm útil',
                      recommended: true,
                    },
                    {
                      id: '112mm' as ThermalPaperWidth,
                      title: '112 mm (4")',
                      desc: 'Recibo largo / Folha estendida',
                      width: '104mm útil',
                    },
                  ].map((item) => {
                    const isSelected = printer.paperWidth === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPrinter({ ...printer, paperWidth: item.id })}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 dark:bg-amber-950/40'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {item.recommended && (
                          <span className="absolute -top-2 right-2 text-[9px] font-bold bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full uppercase">
                            Padrão
                          </span>
                        )}
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white block">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {item.desc}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-2 block">
                          {item.width}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Opção Customizada de Milímetros */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="paper-custom"
                      name="paper-preset"
                      checked={printer.paperWidth === 'custom'}
                      onChange={() => setPrinter({ ...printer, paperWidth: 'custom' })}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <label htmlFor="paper-custom" className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      Personalizar largura manual (Milímetros exatos)
                    </label>
                  </div>

                  {printer.paperWidth === 'custom' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="40"
                        max="160"
                        value={printer.customWidthMm}
                        onChange={(e) =>
                          setPrinter({ ...printer, customWidthMm: Math.max(40, parseInt(e.target.value) || 80) })
                        }
                        className="w-20 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <span className="text-slate-500 text-xs font-bold">milímetros (mm)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* MODELO E HARDWARE DA IMPRESSORA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Modelo ou Marca da Impressora
                  </label>
                  <select
                    value={printer.printerModel}
                    onChange={(e) => setPrinter({ ...printer, printerModel: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Epson TM-T20X / Bematech MP-4200 (80mm)">
                      Epson TM-T20X / TM-T20 / TM-T88 (80mm Padrão)
                    </option>
                    <option value="Bematech MP-4200 TH / MP-4000 (80mm)">
                      Bematech MP-4200 TH / MP-4000 / MP-100 (80mm)
                    </option>
                    <option value="Elgin i9 / i7 / i8 (80mm)">Elgin i9 / i7 / i8 (80mm)</option>
                    <option value="Daruma DR700 / DR800 (80mm)">Daruma DR700 / DR800 (80mm)</option>
                    <option value="Diebold Nixdorf TSP143 (80mm)">Diebold Nixdorf TSP143 (80mm)</option>
                    <option value="Mini Impressora Térmica 58mm (Bluetooth/USB/POS)">
                      Mini Impressora Térmica 58mm (Bluetooth / USB / Maquininha POS)
                    </option>
                    <option value="Impressora Térmica Genérica ESC/POS">
                      Impressora Térmica Genérica ESC/POS
                    </option>
                    <option value="Impressora de Sistema / PDF">Impressora Padrão do Windows / Mac / PDF</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Define o formato visual e espaçamento de caracteres para o cabeçalho.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tamanho da Tipografia no Cupom
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'compact' as ThermalFontSize, label: 'Compacta (10px)', desc: 'Mais caracteres' },
                      { id: 'standard' as ThermalFontSize, label: 'Padrão (11px)', desc: 'Recomendada' },
                      { id: 'large' as ThermalFontSize, label: 'Grande (13px)', desc: 'Alta visibilidade' },
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setPrinter({ ...printer, fontSize: sz.id })}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          printer.fontSize === sz.id
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-xs">{sz.label.split(' ')[0]}</div>
                        <div className="text-[9px] opacity-80">{sz.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CONTROLES DE GUILHOTINA E CONTEÚDO */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="font-bold text-xs text-slate-900 dark:text-white block">
                      Linhas em Branco após o Cupom (Espaço para Guilhotina / Corte manual)
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Evita que o cabeçalho do próximo pedido seja cortado pela faca da impressora.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={printer.feedLines}
                      onChange={(e) => setPrinter({ ...printer, feedLines: parseInt(e.target.value) || 3 })}
                      className="w-32 accent-amber-500 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                      {printer.feedLines} linhas
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mensagem de Cabeçalho (Opcional)
                    </label>
                    <input
                      type="text"
                      value={printer.customHeaderNote}
                      onChange={(e) => setPrinter({ ...printer, customHeaderNote: e.target.value })}
                      placeholder="Ex: Obrigado pela preferência! Bom apetite."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mensagem de Rodapé (Opcional)
                    </label>
                    <input
                      type="text"
                      value={printer.customFooterNote}
                      onChange={(e) => setPrinter({ ...printer, customFooterNote: e.target.value })}
                      placeholder="Ex: Siga no Instagram @hamburgueria"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Toggles Rápidos */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printer.showStoreHeader}
                      onChange={(e) => setPrinter({ ...printer, showStoreHeader: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      Incluir Nome e Endereço da Hamburgueria no topo
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printer.showCourierSection}
                      onChange={(e) => setPrinter({ ...printer, showCourierSection: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      Incluir Dados do Motoboy e Veículo no cupom
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printer.showCustomerNotes}
                      onChange={(e) => setPrinter({ ...printer, showCustomerNotes: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      Destacar Observações do Cliente em caixa alta
                    </span>
                  </label>
                </div>
              </div>

              {/* BOTÃO DE TESTE DE IMPRESSÃO */}
              <div className="flex items-center justify-between p-4 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      Testar Calibração da Impressora
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Dispara uma impressão de diagnóstico na bobina de {printer.paperWidth} para conferir margens e corte.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Teste ({printer.paperWidth})</span>
                </button>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 2: APIS DE DELIVERY & WEBHOOKS (iFood / 99 / Keeta)    */}
          {/* ========================================================= */}
          {activeTab === 'apis' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* ENDPOINT DO WEBHOOK DO COMÉRCIO */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Plug className="w-3.5 h-3.5" />
                    Webhook URL do seu Comércio
                  </span>
                  <span className="text-[10px] text-slate-400">Pronto para receber POST em tempo real</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookBaseUrl}
                    className="flex-1 bg-slate-950 text-amber-300 font-mono text-[11px] px-3 py-2 rounded-xl border border-slate-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookBaseUrl);
                      alert('Webhook URL copiada para a área de transferência!');
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Cadastre esta URL no Portal de Desenvolvedores do iFood, 99Food ou no seu ERP para entrada automática de pedidos no balcão.
                </p>
              </div>

              {/* CARD IFOOD */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white font-black flex items-center justify-center text-xs">
                      iF
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        iFood Developer API & Merchant Portal
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Sincronização de pedidos e despacho de rotas via iFood API v1.0
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      platform.ifood.status === 'connected'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {platform.ifood.status === 'connected' ? '● Conectado' : '○ Desconectado'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Merchant ID (UUID da Loja no iFood)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: c1d7a8e2-9b2f-4123-..."
                      value={platform.ifood.merchantId}
                      onChange={(e) =>
                        setPlatform({
                          ...platform,
                          ifood: { ...platform.ifood, merchantId: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Client ID (Chave de Integração)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: d784a923-..."
                      value={platform.ifood.clientId}
                      onChange={(e) =>
                        setPlatform({
                          ...platform,
                          ifood: { ...platform.ifood, clientId: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Client Secret (Chave Secreta)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={platform.ifood.clientSecret}
                      onChange={(e) =>
                        setPlatform({
                          ...platform,
                          ifood: { ...platform.ifood, clientSecret: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Webhook Secret Token
                    </label>
                    <input
                      type="text"
                      placeholder="Token para assinatura HMAC"
                      value={platform.ifood.webhookSecret}
                      onChange={(e) =>
                        setPlatform({
                          ...platform,
                          ifood: { ...platform.ifood, webhookSecret: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500">
                    {testStatus.ifood?.loading ? (
                      <span className="text-amber-500 font-semibold flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verificando...
                      </span>
                    ) : testStatus.ifood ? (
                      <span className={testStatus.ifood.success ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
                        {testStatus.ifood.message}
                      </span>
                    ) : platform.ifood.lastTestedAt ? (
                      <span>Último teste: {new Date(platform.ifood.lastTestedAt).toLocaleDateString()}</span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestConnection('ifood')}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    Testar Conexão iFood
                  </button>
                </div>
              </div>

              {/* CARD 99FOOD */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                      99
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">99Food Partner API</h4>
                      <p className="text-[10px] text-slate-500">Integração direta com o painel de pedidos do 99Food</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      platform.food99.status === 'connected'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {platform.food99.status === 'connected' ? '● Conectado' : '○ Desconectado'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Store ID (ID da Loja)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 99_store_49182"
                      value={platform.food99.storeId}
                      onChange={(e) =>
                        setPlatform({
                          ...platform,
                          food99: { ...platform.food99, storeId: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      App Key
                    </label>
                    <input
                      type="text"
                      placeholder="Chave do aplicativo"
                      value={platform.food99.appKey}
                      onChange={(e) =>
                        setPlatform({
                          ...platform,
                          food99: { ...platform.food99, appKey: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      App Secret
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={platform.food99.appSecret}
                      onChange={(e) =>
                        setPlatform({
                          ...platform,
                          food99: { ...platform.food99, appSecret: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500">
                    {testStatus.food99?.loading ? (
                      <span className="text-amber-500 font-semibold flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testando...
                      </span>
                    ) : testStatus.food99 ? (
                      <span className={testStatus.food99.success ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
                        {testStatus.food99.message}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestConnection('food99')}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    Testar Conexão 99Food
                  </button>
                </div>
              </div>

              {/* CARD KEETA */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-600 text-white font-black flex items-center justify-center text-xs">
                      KT
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">Keeta Delivery Connect</h4>
                      <p className="text-[10px] text-slate-500">Conexão internacional e delivery regional Keeta</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      platform.keeta.status === 'connected'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {platform.keeta.status === 'connected' ? '● Conectado' : '○ Desconectado'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Store Code (Código da Loja)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: KT-SP-9021"
                      value={platform.keeta.storeCode}
                      onChange={(e) =>
                        setPlatform({
                          ...platform,
                          keeta: { ...platform.keeta, storeCode: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Partner ID
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: part_8910"
                      value={platform.keeta.partnerId}
                      onChange={(e) =>
                        setPlatform({
                          ...platform,
                          keeta: { ...platform.keeta, partnerId: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      API Secret Key
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={platform.keeta.apiKey}
                      onChange={(e) =>
                        setPlatform({
                          ...platform,
                          keeta: { ...platform.keeta, apiKey: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500">
                    {testStatus.keeta?.loading ? (
                      <span className="text-amber-500 font-semibold flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verificando...
                      </span>
                    ) : testStatus.keeta ? (
                      <span className={testStatus.keeta.success ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
                        {testStatus.keeta.message}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestConnection('keeta')}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    Testar Conexão Keeta
                  </button>
                </div>
              </div>

              {/* CARD WHATSAPP / NOTIFICAÇÃO DO CLIENTE */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-xs">
                      WA
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        WhatsApp API (Evolution / Z-API / Baileys)
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Dispara notificação automática ao cliente assim que a moto sai do balcão
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      platform.whatsapp?.status === 'connected'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {platform.whatsapp?.status === 'connected' ? '● Conectado' : '○ Desconectado'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      URL do Servidor WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="https://api.meuservidor.com"
                      value={platform.whatsapp?.serverUrl || ''}
                      onChange={(e) =>
                        setPlatform({
                          ...platform,
                          whatsapp: {
                            ...(platform.whatsapp || {
                              instanceName: 'balcao',
                              notifyOnDispatch: true,
                              status: 'disconnected',
                              apiKey: '',
                              serverUrl: '',
                            }),
                            serverUrl: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      API Token / Secret Key
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={platform.whatsapp?.apiKey || ''}
                      onChange={(e) =>
                        setPlatform({
                          ...platform,
                          whatsapp: {
                            ...(platform.whatsapp || {
                              instanceName: 'balcao',
                              notifyOnDispatch: true,
                              status: 'disconnected',
                              apiKey: '',
                              serverUrl: '',
                            }),
                            apiKey: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platform.whatsapp?.notifyOnDispatch ?? true}
                      onChange={(e) =>
                        setPlatform({
                          ...platform,
                          whatsapp: {
                            ...(platform.whatsapp || {
                              instanceName: 'balcao',
                              notifyOnDispatch: true,
                              status: 'disconnected',
                              apiKey: '',
                              serverUrl: '',
                            }),
                            notifyOnDispatch: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      Enviar WhatsApp com link de rastreio em tempo real ao despachar o pedido
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500">
                    {testStatus.whatsapp?.loading ? (
                      <span className="text-amber-500 font-semibold flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verificando...
                      </span>
                    ) : testStatus.whatsapp ? (
                      <span className={testStatus.whatsapp.success ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
                        {testStatus.whatsapp.message}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestConnection('whatsapp')}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    Testar Instância WhatsApp
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 3: DADOS DO ESTABELECIMENTO (NOME, CNPJ, ENDEREÇO)    */}
          {/* ========================================================= */}
          {activeTab === 'store' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Identificação Comercial
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Estes dados são impressos no cabeçalho das comandas térmicas e utilizados para cálculo de rotas.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome Fantasia do Estabelecimento
                    </label>
                    <input
                      type="text"
                      value={store.storeName}
                      onChange={(e) => setStore({ ...store, storeName: e.target.value })}
                      placeholder="Ex: Hard Beer Burguer"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      CNPJ / MEI (Opcional)
                    </label>
                    <input
                      type="text"
                      value={store.cnpj || ''}
                      onChange={(e) => setStore({ ...store, cnpj: e.target.value })}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Telefone do Balcão
                    </label>
                    <input
                      type="text"
                      value={store.phone || ''}
                      onChange={(e) => setStore({ ...store, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={store.city}
                      onChange={(e) => setStore({ ...store, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Estado (UF)
                    </label>
                    <input
                      type="text"
                      value={store.state}
                      onChange={(e) => setStore({ ...store, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white uppercase outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* ENDEREÇO DE ORIGEM DA EXPEDIÇÃO */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <h5 className="font-bold text-[11px] text-slate-800 dark:text-slate-200 mb-2">
                    Endereço de Origem (Ponto de Partida dos Motoboys)
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Logradouro (Rua / Av.)
                      </label>
                      <input
                        type="text"
                        value={store.street}
                        onChange={(e) => setStore({ ...store, street: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        value={store.number}
                        onChange={(e) => setStore({ ...store, number: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={store.neighborhood}
                        onChange={(e) => setStore({ ...store, neighborhood: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* PARÂMETROS DE CONTINGÊNCIA */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Taxa de Contingência (Fallback)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">R$</span>
                      <input
                        type="number"
                        step="0.5"
                        value={store.fallbackRate}
                        onChange={(e) => setStore({ ...store, fallbackRate: parseFloat(e.target.value) || 6.0 })}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Adicional por KM Excedente
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">R$</span>
                      <input
                        type="number"
                        step="0.5"
                        value={store.extraKmRate}
                        onChange={(e) => setStore({ ...store, extraKmRate: parseFloat(e.target.value) || 1.5 })}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Raio Máximo de Despacho (km)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={store.maxDistanceKm}
                      onChange={(e) => setStore({ ...store, maxDistanceKm: parseFloat(e.target.value) || 25.0 })}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RODAPÉ COM AÇÕES */}
        <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between shrink-0">
          <div>
            {showSavedFeedback && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-100">
                <CheckCircle2 className="w-4 h-4" />
                Configurações salvas e aplicadas com sucesso!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
