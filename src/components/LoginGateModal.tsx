import React, { useState } from 'react';
import {
  ShieldCheck,
  Bike,
  Lock,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Store,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { AuthSessionRole, SecuritySettings } from '../types';

interface LoginGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  securitySettings: SecuritySettings;
  currentAuthRole: AuthSessionRole | null;
  onSelectRole: (role: AuthSessionRole) => void;
}

export const LoginGateModal: React.FC<LoginGateModalProps> = ({
  isOpen,
  onClose,
  securitySettings,
  currentAuthRole,
  onSelectRole,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<'BALCAO' | 'ADMIN'>('BALCAO');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDigitPress = (digit: string) => {
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + digit);
      setErrorMsg(null);
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMsg(null);
  };

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (selectedTarget === 'BALCAO') {
      // PIN do Balcão
      if (pinInput === securitySettings.balcaoPin) {
        onSelectRole('BALCAO');
        onClose();
      } else {
        setErrorMsg('PIN incorreto para o Balcão. Tente novamente.');
        setPinInput('');
      }
    } else {
      // PIN do Admin
      if (pinInput === securitySettings.adminPin) {
        onSelectRole('ADMIN');
        onClose();
      } else {
        setErrorMsg('PIN Master incorreto para o Administrador.');
        setPinInput('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Header do Modal */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white mx-auto flex items-center justify-center shadow-md shadow-orange-600/30 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Controle de Acesso da Hamburgueria
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Selecione o perfil desejado e digite o PIN de autorização.
          </p>
        </div>

        {/* Seletor de Perfil: Balcão vs Admin */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setSelectedTarget('BALCAO');
              setPinInput('');
              setErrorMsg(null);
            }}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
              selectedTarget === 'BALCAO'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Acesso Balcão</span>
            <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
              Operacional & Fila
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTarget('ADMIN');
              setPinInput('');
              setErrorMsg(null);
            }}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
              selectedTarget === 'ADMIN'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Acesso Admin</span>
            <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
              Controle Total & APIs
            </span>
          </button>
        </div>

        {/* Mostrador do PIN */}
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 py-2 px-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <KeyRound className="w-4 h-4 text-slate-400" />
            <div className="flex gap-2">
              {Array.from({ length: selectedTarget === 'BALCAO' ? 4 : 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    pinInput.length > idx
                      ? 'bg-orange-600 scale-110'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 mt-2 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Teclado Numérico Touch */}
        <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                if (item === 'C') handleClear();
                else if (item === '⌫') handleDelete();
                else handleDigitPress(item);
              }}
              className={`h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center active:scale-95 ${
                item === 'C'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                  : item === '⌫'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-orange-500 shadow-xs'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Botão de Entrar */}
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={pinInput.length < (selectedTarget === 'BALCAO' ? 4 : 4)}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <span>Entrar no Perfil {selectedTarget === 'BALCAO' ? 'Balcão' : 'Administrador'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
