import React, { useState } from 'react';
import { User, Delivery, PixKeyType } from '../types';
import { Bike, ShieldCheck, MapPin, CheckCircle2, Copy, Check, DollarSign } from 'lucide-react';

interface MotoboyPortalViewProps {
  courier: User;
  deliveries: Delivery[];
  onConfirmDelivery: (deliveryId: string) => void;
  onUpdatePixKey: (key: string, type: PixKeyType) => void;
}

export const MotoboyPortalView: React.FC<MotoboyPortalViewProps> = ({
  courier,
  deliveries,
  onConfirmDelivery,
  onUpdatePixKey,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [copiedAddressId, setCopiedAddressId] = useState<string | null>(null);

  const activePin = courier.activePin || courier.authPin2FA || '123456';

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === activePin) {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPinInput('');
    }
  };

  const handleCopyAddress = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddressId(id);
    setTimeout(() => setCopiedAddressId(null), 2000);
  };

  // Se não autenticado, tela de desafio por PIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto font-bold shadow-md shadow-amber-500/20">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Portal do Entregador</h1>
            <p className="text-xs text-slate-400 mt-1">Olá, {courier.name}. Digite seu PIN de 6 dígitos para acessar.</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4 pt-2">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••••"
              className="w-full text-center tracking-widest text-2xl font-mono py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-amber-500 outline-none"
              autoFocus
            />
            {authError && <p className="text-xs text-red-400 font-medium">PIN incorreto. Tente novamente.</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm shadow-md transition-all"
            >
              Acessar Corridas
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard do Motoboy
  const myDeliveries = deliveries.filter((d) => d.courierId === courier.id);
  const activeDeliveries = myDeliveries.filter((d) => d.status === 'IN_TRANSIT');
  const deliveredToday = myDeliveries.filter((d) => d.status === 'DELIVERED');
  const totalEarned = deliveredToday.reduce((sum, d) => sum + (d.isFeePayable ? d.feeAmount : 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-lg mx-auto space-y-4">
      {/* Header do Piloto */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-amber-500 font-semibold uppercase tracking-wider">Entregador Ativo</span>
          <h2 className="text-base font-bold text-white">{courier.name}</h2>
          <p className="text-xs text-slate-400">{courier.vehicleModel} · {courier.vehiclePlate}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Total Hoje</span>
          <span className="text-xl font-extrabold text-emerald-400 font-mono">
            R$ {totalEarned.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Corridas em Andamento */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Corridas Ativas ({activeDeliveries.length})
        </h3>
        {activeDeliveries.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-dashed border-slate-800">
            <p className="text-xs text-slate-400">Você não tem nenhuma entrega em rota no momento.</p>
          </div>
        ) : (
          activeDeliveries.map((d) => {
            const addressFull = `${d.street}, ${d.number} - ${d.neighborhood}, ${d.city}`;
            return (
              <div key={d.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-white">Pedido #{d.orderNumber}</span>
                  <span className="text-xs font-bold text-amber-500 font-mono">R$ {d.feeAmount.toFixed(2)}</span>
                </div>
                <div className="text-xs text-slate-300">
                  <p className="font-semibold text-white">{d.customerName}</p>
                  <p className="mt-0.5 text-slate-400">{addressFull}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleCopyAddress(d.id, addressFull)}
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    {copiedAddressId === d.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAddressId === d.id ? 'Copiado!' : 'Copiar Endereço'}</span>
                  </button>
                  <button
                    onClick={() => onConfirmDelivery(d.id)}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Concluir</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Histórico Recente */}
      <div className="space-y-3 pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Entregas Concluídas Hoje ({deliveredToday.length})
        </h3>
        <div className="space-y-2">
          {deliveredToday.map((d) => (
            <div key={d.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-white">#{d.orderNumber}</span>
                <p className="text-[11px] text-slate-400">{d.neighborhood}</p>
              </div>
              <span className="font-mono text-emerald-400 font-bold">R$ {d.feeAmount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
