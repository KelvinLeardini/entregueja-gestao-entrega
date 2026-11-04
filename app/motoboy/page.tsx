'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bike,
  MapPin,
  Phone,
  Navigation,
  RefreshCw,
  LogOut,
  AlertCircle,
} from 'lucide-react';

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

export default function MotoboyCleanPortalPage() {
  const router = useRouter();
  const [courier, setCourier] = useState<CourierData | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPortalData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/motoboy/deliveries');
      if (res.status === 401 || res.status === 404) {
        setError('Sessão expirada ou não autenticada. Acesse através do link enviado pelo seu estabelecimento.');
        setIsLoading(false);
        return;
      }
      if (!res.ok) {
        setError('Falha ao sincronizar entregas.');
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      setCourier(data.courier);
      setDeliveries(data.deliveries || []);
    } catch {
      setError('Erro de conexão ao buscar entregas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Garante que a URL exibida no navegador seja limpa (/motoboy)
    if (typeof window !== 'undefined' && window.location.pathname !== '/motoboy') {
      window.history.replaceState({}, '', '/motoboy');
    }
    loadPortalData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Carregando painel do entregador...</span>
        </div>
      </div>
    );
  }

  if (error || !courier) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 max-w-md mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-bold text-white mb-2">Acesso Exclusivo por Link</h1>
        <p className="text-xs text-slate-400 mb-6">
          {error || 'Para sua segurança, o acesso ao painel do motoboy deve ser iniciado pelo link único com PIN fornecido pelo seu estabelecimento.'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

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
              <h2 className="text-sm font-bold text-white">{courier.name}</h2>
              <p className="text-[11px] text-slate-400">
                {courier.vehicleModel || 'Moto'} · {courier.vehiclePlate || 'Sem placa'}
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
        {courier.store && (
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
            onClick={loadPortalData}
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
