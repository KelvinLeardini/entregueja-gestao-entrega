import React, { useState } from 'react';
import {
  Bike,
  Plus,
  Copy,
  Check,
  Phone,
  ShieldCheck,
  UserCheck,
  Trash2,
  ExternalLink,
  Share2,
  RefreshCw,
  KeyRound,
  Lock,
} from 'lucide-react';
import { User, PixKeyType } from '../types';
import { generateCourierAccessToken, generateCourier2FAPin } from '../services/storage';

interface MotoboysViewProps {
  couriers: User[];
  onAddCourier: (courier: User) => void;
  onUpdateCourier: (courier: User) => void;
  onDeleteCourier: (id: string) => void;
}

export const MotoboysView: React.FC<MotoboysViewProps> = ({
  couriers,
  onAddCourier,
  onUpdateCourier,
  onDeleteCourier,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('PHONE');
  const [pixKey, setPixKey] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://burgerroute.com';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Preencha o nome e o telefone do motoboy.');
      return;
    }

    const initialPin = generateCourier2FAPin();
    const newCourier: User = {
      id: `courier_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      role: 'COURIER',
      isActive: true,
      vehiclePlate: vehiclePlate.trim().toUpperCase() || undefined,
      vehicleModel: vehicleModel.trim() || undefined,
      pixKeyType,
      pixKey: pixKey.trim() || undefined,
      accessToken: generateCourierAccessToken(),
      activePin: initialPin,
      authPin2FA: initialPin,
      createdAt: new Date().toISOString(),
    };

    onAddCourier(newCourier);
    setName('');
    setPhone('');
    setVehiclePlate('');
    setVehicleModel('');
    setPixKey('');
    setShowAddForm(false);
  };

  const handleCopyPix = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyLink = (id: string, token: string, pin?: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = pin
      ? `${origin}/?motoToken=${token}&pin=${pin}`
      : `${origin}/?motoToken=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleCopyPin = (id: string, pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPinId(id);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  const handleRegenerate2FA = (courier: User) => {
    const newPin = generateCourier2FAPin();
    const updated: User = {
      ...courier,
      activePin: newPin,
      authPin2FA: newPin,
    };
    onUpdateCourier(updated);
    try {
      sessionStorage.removeItem(`motoboy_2fa_session_${courier.id}`);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }
    alert(`Novo código 2FA (activePin) gerado para ${courier.name}: ${newPin}\nO acesso anterior foi invalidado e o motoboy deverá digitar este novo código.`);
  };

  const handleShareWhatsApp = (courier: User) => {
    const cleanPhone = courier.phone.replace(/\D/g, '');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pin = courier.activePin || courier.authPin2FA || '123456';
    const directUrl = `${origin}/?motoToken=${courier.accessToken}&pin=${pin}`;
    const message = `Olá ${courier.name}! Aqui está o seu link de acesso exclusivo às suas entregas:\n\n🔗 ${directUrl}\n\n🛡️ Seu código PIN de segurança: *${pin}*\n\nBasta tocar no link para acessar direto suas viagens.`;
    const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Topo Informativo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bike className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Equipe de Motoboys & Links Exclusivos 2FA
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cada motoboy possui uma página exclusiva e isolada com token criptográfico e autenticação em dois fatores (PIN de 6 dígitos).
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-700 text-white flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 text-orange-400 dark:text-white" />
          <span>{showAddForm ? 'Cancelar' : 'Cadastrar Motoboy'}</span>
        </button>
      </div>

      {/* Formulário de Cadastro */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in"
        >
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block pb-2 border-b border-slate-100 dark:border-slate-800">
            Novo Motoboy da Hamburgueria
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo / Apelido
              </label>
              <input
                type="text"
                placeholder="Ex: Carlos Silva (Carlão)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp / Celular
              </label>
              <input
                type="text"
                placeholder="(11) 99123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Placa da Moto
              </label>
              <input
                type="text"
                placeholder="ABC-1D23"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white uppercase focus:bg-white focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Modelo da Moto
              </label>
              <input
                type="text"
                placeholder="Titan 160 Preta"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo da Chave Pix
              </label>
              <select
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="PHONE">Celular</option>
                <option value="CPF">CPF</option>
                <option value="EMAIL">E-mail</option>
                <option value="RANDOM">Chave Aleatória</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chave Pix para Acerto
              </label>
              <input
                type="text"
                placeholder="Insira a chave Pix do motoboy"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-colors"
            >
              Salvar Motoboy e Gerar Link 2FA
            </button>
          </div>
        </form>
      )}

      {/* Grid de Motoboys Cadastrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {couriers.map((courier) => {
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const pin = courier.activePin || courier.authPin2FA || '123456';
          const personalUrl = `${origin}/?motoToken=${courier.accessToken}&pin=${pin}`;

          return (
            <div
              key={courier.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <Bike className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {courier.name}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {courier.vehiclePlate || 'Sem placa'} · {courier.vehicleModel || 'Moto'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onUpdateCourier({ ...courier, isActive: !courier.isActive })
                    }
                    className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors ${
                      courier.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                    title={courier.isActive ? 'Clique para desativar' : 'Clique para ativar'}
                  >
                    {courier.isActive ? 'Ativo' : 'Inativo'}
                  </button>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Tem certeza que deseja excluir o motoboy "${courier.name}"?\n\nEle sairá da equipe e eventuais entregas pendentes voltarão para a fila.`
                        )
                      ) {
                        onDeleteCourier(courier.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Excluir motoboy"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Informações de Contato e Pix */}
              <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">WhatsApp:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{courier.phone}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Chave Pix:</span>
                  {courier.pixKey ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                        {courier.pixKey}
                      </span>
                      <button
                        onClick={() => handleCopyPix(courier.id, courier.pixKey || '')}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Copiar Pix"
                      >
                        {copiedId === courier.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Não cadastrado</span>
                  )}
                </div>
              </div>

              {/* ÁREA EXCLUSIVA DE ACESSO DO MOTOBOY & 2FA */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-orange-500" />
                    Acesso Exclusivo & Código 2FA
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Página Isolada
                  </span>
                </div>

                {/* Código PIN 2FA */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-tight">PIN 2FA Ativo</span>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white tracking-widest">
                        {courier.activePin || courier.authPin2FA || '123456'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyPin(courier.id, courier.activePin || courier.authPin2FA || '123456')}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded flex items-center gap-1"
                      title="Copiar código PIN"
                    >
                      {copiedPinId === courier.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPinId === courier.id ? 'Copiado' : 'Copiar'}</span>
                    </button>

                    <button
                      onClick={() => handleRegenerate2FA(courier)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Gerar novo código 2FA"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Link Único e Botões de Compartilhar */}
                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  <a
                    href={personalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-xs"
                    title="Testar e abrir página exclusiva do motoboy em nova aba"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Abrir</span>
                  </a>

                  <button
                    onClick={() => handleCopyLink(courier.id, courier.accessToken || '', courier.activePin || courier.authPin2FA)}
                    className="py-1.5 px-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-xs"
                    title="Copiar link com código PIN embutido para entrada direta com 1 clique"
                  >
                    {copiedLinkId === courier.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLinkId === courier.id ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(courier)}
                    className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-xs"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 text-center truncate font-mono select-all bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  {personalUrl}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
