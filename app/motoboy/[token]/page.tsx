'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Lock,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  Navigation,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface MotoboyPageProps {
  params: Promise<{
    token: string;
  }>;
}

interface CourierData {
  id: string;
  name: string;
  phone: string;
  vehiclePlate?: string | null;
  vehicleModel?: string | null;
  pixKeyType?: string;
  pixKey?: string;
  store?: {
    name: string;
    slug: string;
    phone: string;
    originAddress: string;
  };
}

interface DeliveryItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  distanceKm: number;
  feeAmountCents: number;
  status: string;
  deliveredAt?: string | null;
}

export default function MotoboyAccessPage({ params }: MotoboyPageProps) {
  const { token } = use(params);
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [courier, setCourier] = useState<CourierData | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [isLoadingPortal, setIsLoadingPortal] = useState(true);

  // Verifica se já tem sessão válida ativa e redireciona para a rota limpa /motoboy
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const res = await fetch('/api/motoboy/deliveries');
        if (res.ok) {
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/motoboy');
          }
          router.replace('/motoboy');
          return;
        }
      } catch (err) {
        console.warn('Nenhuma sessão pré-existente:', err);
      } finally {
        setIsLoadingPortal(false);
      }
    }

    checkExistingSession();
  }, [router]);

  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setErrorMessage('Digite o PIN de 6 dígitos numéricos.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/motoboy/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'PIN inválido. Tente novamente.');
        setPin('');
        setIsVerifying(false);
        return;
      }

      // PIN validado: limpa a URL via replaceState e redireciona para a rota limpa /motoboy
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/motoboy');
      }
      router.replace('/motoboy');
    } catch {
      setErrorMessage('Erro de conexão ao verificar PIN. Verifique sua internet.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDigitClick = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 6) {
        // Auto-envio imediato ao atingir 6 dígitos
        setTimeout(() => {
          verifyPinDirect(nextPin);
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const verifyPinDirect = async (pinValue: string) => {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/motoboy/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin: pinValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'PIN inválido. Tente novamente.');
        setPin('');
        setIsVerifying(false);
        return;
      }

      // PIN validado: limpa a URL via replaceState e redireciona para a rota limpa /motoboy
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/motoboy');
      }
      router.replace('/motoboy');
    } catch {
      setErrorMessage('Erro de conexão ao verificar PIN.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoadingPortal) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Carregando portal do entregador...</span>
        </div>
      </div>
    );
  }

  // TELA DE PIN (Antes da autenticação)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 max-w-md mx-auto">
        <div className="pt-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Bike className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Portal do Entregador</h1>
          <p className="text-xs text-slate-400 mt-1">
            Digite seu PIN de 6 dígitos para liberar o acesso às suas corridas
          </p>
        </div>

        <div className="my-auto py-6">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Indicadores Visuais de Dígito */}
          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const hasDigit = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-11 h-13 rounded-xl border flex items-center justify-center text-lg font-bold transition-all ${
                    hasDigit
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-500/20'
                      : 'border-slate-800 bg-slate-900/80 text-slate-600'
                  }`}
                >
                  {hasDigit ? '•' : ''}
                </div>
              );
            })}
          </div>

          {/* Teclado Numérico Mobile Friendly */}
          <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitClick(digit)}
                disabled={isVerifying || pin.length >= 6}
                className="h-14 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-emerald-950/50 border border-slate-800/80 text-lg font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              disabled={isVerifying || pin.length === 0}
              className="h-14 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 text-xs font-semibold text-slate-400 transition-colors cursor-pointer"
            >
              LIMPAR
            </button>
            <button
              type="button"
              onClick={() => handleDigitClick('0')}
              disabled={isVerifying || pin.length >= 6}
              className="h-14 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-emerald-950/50 border border-slate-800/80 text-lg font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              disabled={isVerifying || pin.length === 0}
              className="h-14 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 text-sm font-semibold text-slate-400 transition-colors cursor-pointer flex items-center justify-center"
            >
              ⌫
            </button>
          </div>
        </div>

        <div className="pb-4 text-center">
          <p className="text-[11px] text-slate-500">
            Acesso protegido por criptografia de sessão de 12 horas.
          </p>
        </div>
      </div>
    );
  }

  // PORTAL DO MOTOBOY (Autenticado)
  const totalEarnedCents = deliveries
    .filter((d) => d.status === 'DELIVERED')
    .reduce((sum, d) => sum + d.feeAmountCents, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-lg mx-auto">
      {/* Top Header */}
      <header className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{courier?.name}</h2>
              <p className="text-[11px] text-slate-400">
                {courier?.vehicleModel || 'Moto'} · {courier?.vehiclePlate || 'Sem placa'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Acumulado Hoje</span>
            <span className="text-base font-bold text-emerald-400">
              R$ {(totalEarnedCents / 100).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* Banner do Estabelecimento */}
        {courier?.store && (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200">{courier.store.name}</span>
              <p className="text-slate-500 text-[11px] truncate max-w-xs">{courier.store.originAddress}</p>
            </div>
            <a
              href={`tel:${courier.store.phone}`}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Ligar para a loja"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Minhas Entregas ({deliveries.length})
          </h3>
          <button
            onClick={async () => {
              const res = await fetch('/api/motoboy/deliveries');
              if (res.ok) {
                const data = await res.json();
                setDeliveries(data.deliveries || []);
              }
            }}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Atualizar</span>
          </button>
        </div>

        {deliveries.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <Bike className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-300">Nenhuma entrega no momento</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Aguarde a expedição despachar um pedido para o seu nome no balcão.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((item) => {
              const isDone = item.status === 'DELIVERED';
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                `${item.street}, ${item.number}, ${item.neighborhood}, ${item.city}`
              )}`;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-slate-900/50 border-slate-800/80 opacity-75'
                      : 'bg-slate-900 border-slate-700/80 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">#{item.orderNumber}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isDone
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                        }`}
                      >
                        {isDone ? 'ENTREGUE' : 'A CAMINHO'}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">
                      R$ {(item.feeAmountCents / 100).toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-200 mb-1">{item.customerName}</p>

                  <div className="flex items-start gap-1.5 text-xs text-slate-400 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      {item.street}, {item.number} - {item.neighborhood}
                    </span>
                  </div>

                  {!isDone && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        {item.distanceKm.toFixed(1)} km
                      </span>
                      <div className="flex items-center gap-2">
                        {item.customerPhone && (
                          <a
                            href={`tel:${item.customerPhone}`}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Ligar</span>
                          </a>
                        )}
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Rota</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
