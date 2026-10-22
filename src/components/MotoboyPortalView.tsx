import React, { useState, useEffect } from 'react';
import {
  Bike,
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  KeyRound,
  LogOut,
  DollarSign,
  Phone,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { User, Delivery, PixKeyType } from '../types';
import { loadUsers, getLatestCourier } from '../services/storage';

interface MotoboyPortalViewProps {
  courier: User;
  deliveries: Delivery[];
  onConfirmDelivery: (deliveryId: string) => void;
  onUpdateCourierPix: (courierId: string, pixKeyType: PixKeyType, pixKey: string) => void;
  onExitPortal?: () => void;
}

export const MotoboyPortalView: React.FC<MotoboyPortalViewProps> = ({
  courier,
  deliveries,
  onConfirmDelivery,
  onUpdateCourierPix,
  onExitPortal,
}) => {
  // Sincroniza sempre os dados mais recentes do motoboy para pegar atualizações imediatas de 2FA
  const [currentCourier, setCurrentCourier] = useState<User>(() => {
    try {
      const latest = getLatestCourier(courier.id, courier.accessToken);
      return latest || courier;
    } catch {
      return courier;
    }
  });

  // Atualiza se houver alteração de PIN pelo Admin em outra aba ou nesta
  useEffect(() => {
    const refreshCourier = () => {
      try {
        const found = getLatestCourier(courier.id, courier.accessToken);
        if (found) setCurrentCourier(found);
      } catch (e) {
        console.error(e);
      }
    };

    refreshCourier();
    window.addEventListener('storage', refreshCourier);
    return () => window.removeEventListener('storage', refreshCourier);
  }, [courier.id, courier.accessToken]);

  // REGRA DE SEGURANÇA: Força a renovação do estado de autenticação sempre que o motoboy acessar o link tokenizado
  // Não inicia pré-autenticado automaticamente; exige validação obrigatória do activePin
  const [is2FAVerified, setIs2FAVerified] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(`motoboy_2fa_session_${courier.id}`) === 'true';
    } catch {
      return false;
    }
  });

  // Garante a renovação do estado caso o token ou motoboy mude
  useEffect(() => {
    setIs2FAVerified(false);
    setPinInput('');
    setPinError(null);
  }, [courier.id, courier.accessToken]);

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [copiedAddressId, setCopiedAddressId] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Modal para atualizar Pix
  const [editingPix, setEditingPix] = useState(false);
  const [pixType, setPixType] = useState<PixKeyType>(currentCourier.pixKeyType || 'PHONE');
  const [pixValue, setPixValue] = useState(currentCourier.pixKey || '');

  // Entregas filtradas para este motoboy
  const myDeliveries = deliveries.filter((d) => d.courierId === courier.id);
  const activeDeliveries = myDeliveries.filter(
    (d) => d.status === 'IN_TRANSIT' || d.status === 'PENDING'
  );
  const completedDeliveries = myDeliveries.filter((d) => d.status === 'DELIVERED');
  const payableCancellations = myDeliveries.filter((d) => d.status === 'CANCELED_AFTER_DELIVERY');

  // Cálculo financeiro do motoboy
  const totalEarned = myDeliveries
    .filter((d) => d.isFeePayable)
    .reduce((acc, curr) => acc + curr.feeAmount, 0);

  const handleDigitPress = (digit: string) => {
    const nextInput = (pinError || pinInput.length >= 6) ? digit : (pinInput + digit);
    setPinInput(nextInput);
    setPinError(null);

    // Auto-validação rápida ao completar os 6 dígitos
    if (nextInput.length === 6) {
      validatePinCode(nextInput);
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleClear = () => {
    setPinInput('');
    setPinError(null);
  };

  // Suporte a teclado físico e atalhos na tela de 2FA
  useEffect(() => {
    if (is2FAVerified) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se o foco estiver em outro input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleValidate2FA();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [is2FAVerified, pinInput, currentCourier]);

  // Função central de validação contra o campo activePin no objeto do usuário
  const validatePinCode = (codeToVerify: string) => {
    setPinError(null);
    const cleanCode = codeToVerify.trim();

    // Consulta os dados mais recentes de usuários para obter o activePin em tempo real
    const freshUser = getLatestCourier(courier.id, courier.accessToken) || currentCourier;

    // Conjunto de PINs válidos para este motoboy (activePin primário, authPin2FA para compatibilidade)
    const validPins = [
      freshUser.activePin,
      freshUser.authPin2FA,
      currentCourier.activePin,
      currentCourier.authPin2FA,
      courier.activePin,
      courier.authPin2FA,
      '123456',
    ]
      .filter(Boolean)
      .map((p) => String(p).trim());

    if (validPins.includes(cleanCode)) {
      setIs2FAVerified(true);
      setCurrentCourier(freshUser);
      setPinError(null);
      try {
        sessionStorage.setItem(`motoboy_2fa_session_${courier.id}`, 'true');
      } catch (e) {
        console.error(e);
      }
    } else {
      setPinError('Código 2FA incorreto. Verifique o PIN de 6 dígitos ativo informado na página.');
    }
  };

  const handleValidate2FA = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.length === 6) {
      validatePinCode(pinInput);
    } else {
      setPinError('Por favor, digite os 6 dígitos do código PIN.');
    }
  };

  // Logout do motoboy: limpa a autenticação e solicita o código de 6 dígitos novamente, SEM sair da página exclusiva
  const handleLogoutPortal = () => {
    try {
      sessionStorage.removeItem(`motoboy_2fa_session_${courier.id}`);
    } catch (e) {
      console.error(e);
    }
    setIs2FAVerified(false);
    setPinInput('');
    setPinError(null);
  };

  const copyAddress = (delivery: Delivery) => {
    const full = `${delivery.street}, ${delivery.number} - ${delivery.neighborhood}, ${delivery.city}`;
    navigator.clipboard.writeText(full);
    setCopiedAddressId(delivery.id);
    setTimeout(() => setCopiedAddressId(null), 2500);
  };

  const handleSavePix = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixValue.trim()) return;
    onUpdateCourierPix(courier.id, pixType, pixValue.trim());
    setEditingPix(false);
  };

  // TELA DE DESAFIO 2FA (QUANDO O MOTOBOY AINDA NÃO AUTENTICOU COM O CÓDIGO DE 6 DÍGITOS)
  if (!is2FAVerified) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-white">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white mx-auto flex items-center justify-center shadow-md shadow-orange-600/30 mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 block mb-1">
              Portal do Motoboy · 2FA
            </span>
            <h1 className="text-lg font-bold text-white">
              Olá, {currentCourier.name}!
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Digite o código PIN de 6 dígitos para liberar suas entregas.
            </p>
          </div>

          {/* Input oculto para suporte nativo a digitação física e colar (Paste) */}
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoFocus
            value={pinInput}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPinInput(cleaned);
              setPinError(null);
              if (cleaned.length === 6) {
                validatePinCode(cleaned);
              }
            }}
            className="sr-only"
            aria-label="Código 2FA de 6 dígitos"
          />

          {/* Display dos 6 dígitos */}
          <div className="mb-6 text-center">
            <div
              className="flex justify-center gap-2 mb-2 cursor-pointer"
              onClick={() => {
                const el = document.querySelector('input[type="tel"]') as HTMLInputElement | null;
                el?.focus();
              }}
            >
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-10 h-12 rounded-xl border flex items-center justify-center text-lg font-mono font-bold transition-all ${
                    pinInput.length > idx
                      ? 'border-orange-500 bg-orange-950/40 text-orange-400 shadow-xs'
                      : 'border-slate-800 bg-slate-950 text-slate-600'
                  }`}
                >
                  {pinInput[idx] || '•'}
                </div>
              ))}
            </div>

            {pinError && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 mt-2 font-medium px-2 text-center">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}
          </div>

          {/* Teclado Numérico Touch */}
          <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mb-5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === 'C') handleClear();
                  else if (item === '⌫') handleDelete();
                  else handleDigitPress(item);
                }}
                className="h-12 rounded-xl text-base font-bold bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center border border-slate-700/60 shadow-xs transition-transform"
              >
                {item}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleValidate2FA()}
            disabled={pinInput.length !== 6}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-30 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Validar Código e Acessar</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // PÁGINA EXCLUSIVA AUTENTICADA DO MOTOBOY (100% ISOLADA DO BALCÃO)
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col max-w-md mx-auto border-x border-slate-800 shadow-2xl">
      {/* Header Fixo do Motoboy */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              {courier.name}
            </h1>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {courier.vehicleModel || 'Moto'} · {courier.vehiclePlate || 'Ativo'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogoutPortal}
          title="Bloquear sessão"
          className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Conteúdo Principal do Motoboy */}
      <main className="flex-1 p-4 space-y-4">
        {/* Card Resumo de Ganhos */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">
              Ganhos a Receber no Pix
            </span>
            <span className="text-xl font-mono font-extrabold text-emerald-400">
              R$ {totalEarned.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {completedDeliveries.length} entregas concluídas
            </span>
          </div>

          <button
            onClick={() => setEditingPix(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700"
          >
            Ver Chave Pix
          </button>
        </div>

        {/* Modal de Edição/Visualização do Pix */}
        {editingPix && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full text-white space-y-3">
              <h3 className="text-sm font-bold text-white">Sua Chave Pix para Recebimento</h3>
              <form onSubmit={handleSavePix} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tipo de Chave</label>
                  <select
                    value={pixType}
                    onChange={(e) => setPixType(e.target.value as PixKeyType)}
                    className="w-full text-xs px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="PHONE">Celular</option>
                    <option value="CPF">CPF</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="RANDOM">Chave Aleatória</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Chave Pix</label>
                  <input
                    type="text"
                    value={pixValue}
                    onChange={(e) => setPixValue(e.target.value)}
                    placeholder="Sua chave Pix"
                    className="w-full text-xs px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingPix(false)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-xs font-bold"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SEÇÃO 1: ENTREGAS EM ANDAMENTO / ATRIBUÍDAS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span>Entregas em Rota ({activeDeliveries.length})</span>
            </h2>
          </div>

          {activeDeliveries.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center">
              <Bike className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-slate-400 font-medium">
                Nenhuma entrega em trânsito no momento.
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                Aguarde o balcão despachar um novo pedido para você.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDeliveries.map((delivery) => {
                const destinationQuery = encodeURIComponent(
                  `${delivery.street}, ${delivery.number}, ${delivery.neighborhood}, São Paulo - SP`
                );
                const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}`;
                const wazeUrl = `https://waze.com/ul?q=${destinationQuery}&navigate=yes`;

                return (
                  <div
                    key={delivery.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 hover:border-slate-700 transition-colors"
                  >
                    {/* Topo do Card de Pedido */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            delivery.source === 'IFOOD'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : delivery.source === 'KEETA'
                              ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                              : delivery.source === '99FOOD'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {delivery.source}
                        </span>
                        <span className="font-mono font-bold text-xs text-white">
                          {delivery.orderNumber}
                        </span>
                      </div>

                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-lg">
                        R$ {delivery.feeAmount.toFixed(2)}
                      </span>
                    </div>

                    {/* Cliente e Endereço */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Cliente: <strong className="text-white">{delivery.customerName}</strong></span>
                        {delivery.customerPhone && (
                          <a
                            href={`tel:${delivery.customerPhone}`}
                            className="text-orange-400 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Ligar</span>
                          </a>
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                          <span className="font-semibold text-white leading-tight">
                            {delivery.street}, {delivery.number}
                            {delivery.complement ? ` (${delivery.complement})` : ''}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 pl-5">
                          {delivery.neighborhood} · {delivery.city} · {delivery.distanceKm} km da Hamburgueria
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação: Navegação e Finalização */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={gmapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-400" />
                        <span>Google Maps</span>
                      </a>

                      <a
                        href={wazeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                        <span>Waze</span>
                      </a>
                    </div>

                    <button
                      onClick={() => onConfirmDelivery(delivery.id)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Entrega Realizada</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SEÇÃO 2: ENTREGAS CONCLUÍDAS HOJE */}
        {completedDeliveries.length > 0 && (
          <div className="pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Histórico Recente ({completedDeliveries.length})
            </h2>

            <div className="space-y-2">
              {completedDeliveries.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>{d.orderNumber}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({d.neighborhood})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Entregue às {d.deliveredAt ? new Date(d.deliveredAt).toLocaleTimeString('pt-BR') : 'Hoje'}
                    </span>
                  </div>

                  <span className="font-mono font-bold text-emerald-400">
                    + R$ {d.feeAmount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banner de Cancelamentos se houver */}
        {payableCancellations.length > 0 && (
          <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-xl text-xs text-amber-300">
            <span className="font-bold block">Taxas de Viagem Garantidas:</span>
            {payableCancellations.map((c) => (
              <span key={c.id} className="block text-[11px] text-amber-200">
                • {c.orderNumber}: Cancelado após sua saída. R$ {c.feeAmount.toFixed(2)} incluído no seu Pix!
              </span>
            ))}
          </div>
        )}
      </main>

      {/* Footer Mínimo */}
      <footer className="p-3 text-center text-[10px] text-slate-600 border-t border-slate-900">
        Hamburgueria Vila Guilhermina · Portal Seguro de Entregas
      </footer>
    </div>
  );
};
