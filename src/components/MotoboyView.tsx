import React, { useState } from 'react';
import {
  Bike,
  CheckCircle,
  Navigation,
  MapPin,
  QrCode,
  DollarSign,
  Package,
  ExternalLink,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { Delivery, User, PixKeyType } from '../types';

interface MotoboyViewProps {
  courier: User;
  deliveries: Delivery[];
  onConfirmDelivery: (deliveryId: string) => void;
  onUpdateCourierPix: (
    courierId: string,
    pixKeyType: PixKeyType,
    pixKey: string
  ) => void;
}

export const MotoboyView: React.FC<MotoboyViewProps> = ({
  courier,
  deliveries,
  onConfirmDelivery,
  onUpdateCourierPix,
}) => {
  const [isEditingPix, setIsEditingPix] = useState(false);
  const [pixType, setPixType] = useState<PixKeyType>(courier.pixKeyType || 'PHONE');
  const [pixKey, setPixKey] = useState(courier.pixKey || '');

  // Entregas vinculadas a este motoboy
  const courierDeliveries = deliveries.filter((d) => d.courierId === courier.id);

  // Pedidos ativos em rota
  const activeDeliveries = courierDeliveries.filter((d) => d.status === 'IN_TRANSIT');

  // Corridas concluídas ou canceladas que constam no extrato do motoboy
  const historyList = courierDeliveries.filter(
    (d) =>
      d.status === 'DELIVERED' ||
      d.status === 'CANCELED_BEFORE_DELIVERY' ||
      d.status === 'CANCELED_AFTER_DELIVERY'
  );

  // Total acumulado a receber: Entregues + Cancelados PÓS-entrega (onde o motoboy fez o trajeto)
  const payableDeliveries = courierDeliveries.filter(
    (d) => d.isFeePayable && (d.status === 'DELIVERED' || d.status === 'CANCELED_AFTER_DELIVERY')
  );
  const totalAmountEarned = payableDeliveries.reduce((sum, d) => sum + d.feeAmount, 0);

  // Entregas de hoje
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPayable = payableDeliveries.filter((d) =>
    (d.deliveredAt || d.canceledAt || d.createdAt).startsWith(todayStr)
  );
  const todayAmount = todayPayable.reduce((sum, d) => sum + d.feeAmount, 0);

  const handleSavePix = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixKey.trim()) {
      alert('Informe uma chave Pix válida.');
      return;
    }
    onUpdateCourierPix(courier.id, pixType, pixKey.trim());
    setIsEditingPix(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      {/* Card do Motoboy & Perfil */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shrink-0">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{courier.name}</h1>
              <span className="text-xs text-slate-400 block font-mono">
                {courier.vehiclePlate || 'Placa não cadastrada'} ·{' '}
                {courier.vehicleModel || 'Moto'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsEditingPix(true)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Minha Chave Pix"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo Financeiro da Semana do Motoboy */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
              Acumulado na Semana
            </span>
            <span className="text-2xl font-black text-orange-400 font-mono-numbers block mt-0.5">
              R$ {totalAmountEarned.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {payableDeliveries.length} corridas remuneradas
            </span>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
              Hoje ({todayPayable.length})
            </span>
            <span className="text-2xl font-black text-white font-mono-numbers block mt-0.5">
              R$ {todayAmount.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-emerald-400 mt-0.5 block">
              {activeDeliveries.length > 0
                ? `${activeDeliveries.length} em rota agora`
                : 'Livre para novas'}
            </span>
          </div>
        </div>

        {/* Chave Pix Cadastrada */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Pix para acerto semanal:</span>
          <button
            onClick={() => setIsEditingPix(true)}
            className="text-orange-400 font-mono font-medium hover:underline truncate max-w-[190px]"
          >
            {courier.pixKey ? `${courier.pixKeyType}: ${courier.pixKey}` : 'Cadastrar Pix'}
          </button>
        </div>
      </div>

      {/* Entrega Ativa em Rota (Destaque Principal de Toque Largo) */}
      {activeDeliveries.length > 0 ? (
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1 block">
            Corrida Atual em Andamento ({activeDeliveries.length})
          </span>

          {activeDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="bg-white border-2 border-orange-500 rounded-3xl p-5 shadow-md space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-black font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                    PEDIDO {delivery.orderNumber}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {delivery.customerName}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Sua taxa</span>
                  <span className="text-xl font-black text-slate-900 font-mono-numbers">
                    R$ {delivery.feeAmount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Endereço com fonte grande e legível na rua */}
              <div className="bg-slate-50 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-base font-bold text-slate-900 block leading-snug">
                      {delivery.street}, {delivery.number}
                    </span>
                    <span className="text-xs font-medium text-slate-600 block">
                      Bairro {delivery.neighborhood}
                      {delivery.complement ? ` · ${delivery.complement}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-2 border-t border-slate-200/80">
                  <span>📍 {delivery.distanceKm.toFixed(1)} km</span>
                  <span aria-hidden="true">·</span>
                  <span>⏱ ~{delivery.durationMinutes} min</span>
                  {delivery.customerPhone && (
                    <>
                      <span aria-hidden="true">·</span>
                      <a
                        href={`tel:${delivery.customerPhone}`}
                        className="text-blue-600 font-bold flex items-center gap-1 hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        Ligar
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Botões de Navegação com 1 Toque (Touch Targets >= 48px) */}
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={`https://waze.com/ul?q=${encodeURIComponent(
                    `${delivery.street}, ${delivery.number}, ${delivery.neighborhood}, ${delivery.city}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Abrir no Waze</span>
                </a>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${delivery.street}, ${delivery.number}, ${delivery.neighborhood}, ${delivery.city}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <span>Google Maps</span>
                </a>
              </div>

              {/* Botão Gigante de Confirmação de Entrega (Touch Target >= 52px) */}
              <button
                onClick={() => onConfirmDelivery(delivery.id)}
                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                <span>CONFIRMAR ENTREGA REALIZADA</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-emerald-900">
            Você está sem corridas em andamento
          </h3>
          <p className="text-xs text-emerald-700 mt-1">
            Aguardando novo pedido despachado pelo balcão da hamburgueria.
          </p>
        </div>
      )}

      {/* Histórico das Corridas Recentes */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Suas Corridas Concluídas
          </span>
          <span className="text-xs text-slate-500 font-mono-numbers">
            {historyList.length} registros
          </span>
        </div>

        {historyList.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Nenhuma corrida realizada ainda nesta semana.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {historyList.map((del) => {
              const deliveryTime = (del.deliveredAt || del.canceledAt)
                ? new Date(del.deliveredAt || del.canceledAt || '').toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '--:--';

              const isCanceledAfter = del.status === 'CANCELED_AFTER_DELIVERY';
              const isCanceledBefore = del.status === 'CANCELED_BEFORE_DELIVERY';
              const isDelivered = del.status === 'DELIVERED';

              return (
                <div key={del.id} className="py-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono text-slate-900">
                          {del.orderNumber}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {del.source}
                        </span>
                        <span className="text-xs text-slate-700 font-medium truncate max-w-[140px]">
                          · {del.customerName}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 block truncate max-w-[230px]">
                        {del.street}, {del.number} ({del.neighborhood})
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      {isDelivered && (
                        <span className="text-sm font-bold text-emerald-600 font-mono-numbers block">
                          + R$ {del.feeAmount.toFixed(2).replace('.', ',')}
                        </span>
                      )}

                      {isCanceledAfter && (
                        <div>
                          <span className="text-sm font-bold text-amber-600 font-mono-numbers block">
                            + R$ {del.feeAmount.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 block">
                            Taxa PAGA
                          </span>
                        </div>
                      )}

                      {isCanceledBefore && (
                        <div>
                          <span className="text-xs font-bold text-slate-400 line-through font-mono-numbers block">
                            R$ {del.feeAmount.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-[10px] font-bold text-rose-600 block">
                            Não Remunerado
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Avisos Explícitos de Cancelamento para Transparência Total */}
                  {isCanceledAfter && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-900">
                      <span className="font-bold block">
                        Cancelamento Pós-Entrega / No Local:
                      </span>
                      <span>{del.cancellationReason || 'Cancelado após viagem. Motoboy recebe taxa normal.'}</span>
                    </div>
                  )}

                  {isCanceledBefore && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-[11px] text-rose-900">
                      <span className="font-bold block">
                        Cancelamento Antes da Entrega:
                      </span>
                      <span>{del.cancellationReason || 'Cancelado antes do deslocamento.'}</span>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-mono-numbers flex items-center gap-2">
                    <span>📍 {del.distanceKm.toFixed(1)} km</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {isDelivered
                        ? `Entregue às ${deliveryTime}`
                        : `Cancelado às ${deliveryTime}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal / Sheet para Edição da Chave Pix */}
      {isEditingPix && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Minha Chave Pix (Acerto Semanal)
              </h3>
              <button
                onClick={() => setIsEditingPix(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSavePix} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Chave
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['PHONE', 'CPF', 'EMAIL', 'RANDOM'] as PixKeyType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPixType(type)}
                      className={`py-2 text-[11px] font-bold rounded-lg border transition-colors ${
                        pixType === type
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type === 'PHONE'
                        ? 'Celular'
                        : type === 'CPF'
                        ? 'CPF'
                        : type === 'EMAIL'
                        ? 'E-mail'
                        : 'Aleatória'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chave Pix
                </label>
                <input
                  type="text"
                  placeholder={
                    pixType === 'PHONE'
                      ? 'Ex: 16991234567'
                      : pixType === 'CPF'
                      ? 'Ex: 12345678900'
                      : pixType === 'EMAIL'
                      ? 'seuemail@exemplo.com'
                      : 'Cole sua chave aleatória'
                  }
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500">
                O pagamento de todas as suas taxas acumuladas da semana será transferido para esta chave no fechamento.
              </p>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                Salvar Chave Pix
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
