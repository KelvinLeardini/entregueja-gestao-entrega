import React, { useState } from 'react';
import {
  ShieldAlert,
  Store,
  ExternalLink,
  Plus,
  KeyRound,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Search,
  Sparkles,
  Layers,
  Database,
  PlayCircle,
  Copy,
  Check,
  Building2,
  UtensilsCrossed,
  Trash2,
  Lock,
  Mail,
  LogOut,
  Settings,
  ChevronDown,
  ChevronUp,
  MapPin,
  DollarSign,
  Phone,
  AlertCircle,
  X,
} from 'lucide-react';
import { TenantStore, SegmentType } from '../types';
import {
  verifyDevCredentials,
  createTenant,
  deleteTenant,
  saveDevCredentials,
  getTenantStats,
} from '../services/storage';

interface DevAdminViewProps {
  tenants: TenantStore[];
  onRefreshTenants: () => void;
  onNavigateToTenant: (slug: string, devSuperAdmin?: boolean) => void;
  onNavigateToSandbox: () => void;
  onNavigateHome: () => void;
}

export const DevAdminView: React.FC<DevAdminViewProps> = ({
  tenants,
  onRefreshTenants,
  onNavigateToTenant,
  onNavigateToSandbox,
  onNavigateHome,
}) => {
  // Autenticação Segura de Desenvolvedor por E-mail e Senha Alfanumérica
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('kelvinleardini@gmail.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Troca de Senha
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Busca e filtros
  const [searchTerm, setSearchTerm] = useState('');

  // Controle do Formulário Dinâmico de Novo Tenant
  const [isCreateFormExpanded, setIsCreateFormExpanded] = useState(true);
  const [createdSuccessMessage, setCreatedSuccessMessage] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Form State para novo tenant
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newSegment, setNewSegment] = useState<SegmentType>('BURGER');
  const [newPlan, setNewPlan] = useState<'ESSENCIAL' | 'PRO' | 'ENTERPRISE'>('PRO');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOriginAddress, setNewOriginAddress] = useState('');
  const [newBaseFee, setNewBaseFee] = useState(6.0);
  const [newKmRate, setNewKmRate] = useState(1.5);
  const [newStorePin, setNewStorePin] = useState('1234');
  const [newAdminPin, setNewAdminPin] = useState('9876');
  const [formError, setFormError] = useState('');

  // Modal de Exclusão com Confirmação Segura
  const [storeToDelete, setStoreToDelete] = useState<TenantStore | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  // Auto-geração do slug ao digitar o nome
  const handleNameChange = (val: string) => {
    setNewName(val);
    if (!newSlug || newSlug === autoSlug(newName)) {
      setNewSlug(autoSlug(val));
    }
  };

  const autoSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyDevCredentials(emailInput, passwordInput)) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Credenciais inválidas. Dica padrão: kelvinleardini@gmail.com / DevMaster@2026');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (newPassword.length < 6) {
      setPasswordChangeError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError('As senhas não coincidem.');
      return;
    }

    saveDevCredentials(emailInput, newPassword);
    setPasswordChangeSuccess('Senha de desenvolvedor atualizada com sucesso!');
    setTimeout(() => {
      setIsChangePasswordModalOpen(false);
      setPasswordChangeSuccess('');
      setNewPassword('');
      setConfirmPassword('');
    }, 2000);
  };

  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreatedSuccessMessage(null);

    const cleanSlug = autoSlug(newSlug);

    if (!cleanSlug || !newName || !newOriginAddress) {
      setFormError('Preencha os campos obrigatórios (Slug da URL, Nome e Endereço de Expedição).');
      return;
    }

    try {
      const storeToAdd: TenantStore = {
        id: 'store_' + Math.random().toString(36).substring(2, 9),
        slug: cleanSlug,
        name: newName,
        segment: newSegment,
        status: 'ACTIVE',
        plan: newPlan,
        ownerName: newOwnerName || 'Administrador',
        ownerPhone: newOwnerPhone || '11999990000',
        ownerEmail: newOwnerEmail || `${cleanSlug}@entregueja.com.br`,
        originAddress: newOriginAddress,
        originLat: -23.5505,
        originLng: -46.6333,
        calculationMode: 'KM_DRIVEN',
        defaultBaseFee: Number(newBaseFee) || 6.0,
        defaultKmRate: Number(newKmRate) || 1.5,
        storePin: newStorePin || '1234',
        adminPin: newAdminPin || '9876',
        createdAt: new Date().toISOString(),
      };

      createTenant(storeToAdd);
      onRefreshTenants();
      setCreatedSuccessMessage(`Loja "${storeToAdd.name}" cadastrada com sucesso no banco de dados! Acessível em /${storeToAdd.slug}`);

      // Limpar campos
      setNewSlug('');
      setNewName('');
      setNewOriginAddress('');
      setNewOwnerName('');
      setNewOwnerPhone('');
      setNewOwnerEmail('');

      setTimeout(() => setCreatedSuccessMessage(null), 6000);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao provisionar loja.');
    }
  };

  const handleConfirmDelete = () => {
    if (!storeToDelete) return;

    if (deleteConfirmationInput.trim().toLowerCase() !== storeToDelete.slug.toLowerCase()) {
      alert(`Para confirmar, digite exatamente o slug "${storeToDelete.slug}".`);
      return;
    }

    deleteTenant(storeToDelete.slug);
    onRefreshTenants();
    setDeleteSuccessMessage(`Comércio "${storeToDelete.name}" e todos os seus dados associados foram excluídos com sucesso do banco.`);
    setStoreToDelete(null);
    setDeleteConfirmationInput('');
    setTimeout(() => setDeleteSuccessMessage(null), 5000);
  };

  const handleCopyMagicLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/${slug}?devSuperAdmin=true`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // SE NÃO AUTENTICADO: Tela de Segurança com E-mail e Senha Alfanumérica
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl space-y-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold tracking-tight">Portal Exclusivo do Desenvolvedor</h1>
            <p className="text-xs text-slate-400">
              Acesso estritamente restrito ao criador da plataforma. Autentique-se com seu e-mail e senha.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail do Desenvolvedor</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="seu-email@dominio.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Senha Alfanumérica</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {loginError && (
                <p className="text-xs text-red-400 mt-2 text-center">{loginError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all"
            >
              Entrar no Painel do Desenvolvedor
            </button>
          </form>

          <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Ir para o Site
            </button>
            <span className="font-mono text-[11px] text-slate-500">Credencial inicial: DevMaster@2026</span>
          </div>
        </div>
      </div>
    );
  }

  // TELA PRINCIPAL DO SUPER ADMIN DEV
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Bar do Super Admin */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Voltar ao site"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <span>Dev Admin Portal</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Fundador
                </span>
              </h1>
              <span className="text-xs text-slate-400">Gestão Exclusiva de Lojas (Tenants) & Suporte Técnico</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsChangePasswordModalOpen(true)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5 border border-slate-700"
            title="Alterar Senha de Desenvolvedor"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Mudar Senha</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors border border-slate-700"
            title="Desconectar do painel"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Conteúdo do Console */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Notificações de Sucesso */}
        {createdSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{createdSuccessMessage}</span>
            </div>
            <button onClick={() => setCreatedSuccessMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {deleteSuccessMessage && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
              <span>{deleteSuccessMessage}</span>
            </div>
            <button onClick={() => setDeleteSuccessMessage(null)} className="text-red-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Banner de Estatísticas da Plataforma */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium">Lojas Ativas Cadastradas</span>
            <div className="text-2xl font-bold font-mono-numbers text-white mt-1">
              {tenants.length}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium">Sua Sessão de Desenvolvedor</span>
            <div className="text-sm font-semibold text-emerald-400 mt-2 flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">{emailInput}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium">Isolamento de Dados</span>
            <div className="text-sm font-semibold text-amber-400 mt-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Multi-Tenant por storeId</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FORMULÁRIO DINÂMICO DE CADASTRO DE NOVO TENANT (LOJA)     */}
        {/* ========================================================= */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-sm">
          <div
            onClick={() => setIsCreateFormExpanded((prev) => !prev)}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-750 transition-colors border-b border-slate-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Cadastrar Novo Comércio (Criar Tenant no Banco)</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                    PostgreSQL / Prisma
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Preencha os dados da loja contratante para gerar o link exclusivo, taxas e credenciais
                </p>
              </div>
            </div>

            <button className="p-1 rounded-lg text-slate-400 hover:text-white">
              {isCreateFormExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {isCreateFormExpanded && (
            <form onSubmit={handleCreateStore} className="p-4 sm:p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nome Comercial da Loja *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Pizzaria Forno Nobre"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Slug da URL (Link Exclusivo) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(autoSlug(e.target.value))}
                    placeholder="ex: pizzaria-forno-nobre"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                    Link final: /{newSlug || 'slug'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Segmento</label>
                  <select
                    value={newSegment}
                    onChange={(e) => setNewSegment(e.target.value as SegmentType)}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold"
                  >
                    <option value="BURGER">Hamburgueria / Lanchonete</option>
                    <option value="PIZZERIA">Pizzaria</option>
                    <option value="RESTAURANT">Restaurante / Marmitaria</option>
                    <option value="PHARMACY">Farmácia</option>
                    <option value="MARKET">Mercado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plano Contratado</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold"
                  >
                    <option value="ESSENCIAL">Essencial (R$ 89/mês)</option>
                    <option value="PRO">Profissional (R$ 149/mês)</option>
                    <option value="ENTERPRISE">Redes & Franquias (R$ 279/mês)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome do Proprietário</label>
                  <input
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    placeholder="11999990000"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Endereço Completo de Expedição (Ponto de Partida do Roteamento OSRM) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newOriginAddress}
                    onChange={(e) => setNewOriginAddress(e.target.value)}
                    placeholder="Ex: Rua Emílio Mallet, 850 - Tatuapé, São Paulo - SP"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Taxa Base (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={newBaseFee}
                    onChange={(e) => setNewBaseFee(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Adicional por KM (R$)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={newKmRate}
                    onChange={(e) => setNewKmRate(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">PIN Balcão (4 dígitos)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={newStorePin}
                    onChange={(e) => setNewStorePin(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">PIN Gestor (Admin)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={newAdminPin}
                    onChange={(e) => setNewAdminPin(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar e Criar Loja no Banco</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ========================================================= */}
        {/* LISTAGEM DE LOJAS CADASTRADAS COM EXCLUSÃO EM CASCATA    */}
        {/* ========================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, slug ou proprietário..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <span className="text-xs text-slate-400 font-mono-numbers">
              {filteredTenants.length} comércio(s) cadastrado(s)
            </span>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-850 border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Comércio / Rota</th>
                    <th className="py-3 px-4">Segmento</th>
                    <th className="py-3 px-4">Proprietário & Contato</th>
                    <th className="py-3 px-4">Expedição (Origem OSRM)</th>
                    <th className="py-3 px-4">Taxas</th>
                    <th className="py-3 px-4">Plano</th>
                    <th className="py-3 px-4 text-right">Ações (Suporte & Exclusão)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Nenhum comércio cadastrado com esse filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((store) => {
                      const stats = getTenantStats(store.slug);

                      return (
                        <tr key={store.id} className="hover:bg-slate-750 transition-colors">
                          {/* Comércio e Slug */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">{store.name}</div>
                            <div className="font-mono text-amber-400 text-[11px] flex items-center gap-1 mt-0.5">
                              <span>/{store.slug}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 font-mono-numbers">
                              {stats.ordersCount} pedidos · {stats.couriersCount} motoboys
                            </div>
                          </td>

                          {/* Segmento */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 text-slate-300">
                              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                              <span>{store.segment}</span>
                            </span>
                          </td>

                          {/* Responsável */}
                          <td className="py-3.5 px-4">
                            <div className="text-slate-200">{store.ownerName}</div>
                            <div className="text-[11px] text-slate-400">{store.ownerPhone}</div>
                          </td>

                          {/* Endereço Origem */}
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-300" title={store.originAddress}>
                            {store.originAddress}
                          </td>

                          {/* Taxas */}
                          <td className="py-3.5 px-4 font-mono-numbers">
                            <div className="text-white font-medium">R$ {store.defaultBaseFee.toFixed(2)}</div>
                            <div className="text-[11px] text-slate-400">+ R$ {store.defaultKmRate.toFixed(2)}/km</div>
                          </td>

                          {/* Status & Plano */}
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {store.plan}
                            </span>
                          </td>

                          {/* Magic Links e Botão de Exclusão */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleCopyMagicLink(store.slug)}
                                title="Copiar Magic Link com token de suporte"
                                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                              >
                                {copiedSlug === store.slug ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                onClick={() => onNavigateToTenant(store.slug, true)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
                              >
                                <span>Acessar</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setStoreToDelete(store);
                                  setDeleteConfirmationInput('');
                                }}
                                title="Excluir este comércio e todos os dados associados"
                                className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-400 hover:text-red-200 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO EM CASCATA              */}
      {/* ========================================================= */}
      {storeToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-red-700/60 p-6 space-y-4 text-slate-100 shadow-2xl animate-in fade-in-50">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Excluir Comércio em Cascata</h3>
              </div>
              <button
                onClick={() => setStoreToDelete(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Você está prestes a excluir permanentemente o comércio <strong className="text-white">{storeToDelete.name}</strong> (<span className="font-mono text-amber-400">/{storeToDelete.slug}</span>).
              </p>

              <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl space-y-1.5 text-red-300">
                <span className="font-bold block">Atenção: Ação Irreversível no Banco de Dados!</span>
                <p>Todos os registros vinculados ao <strong>storeId</strong> serão apagados imediatamente:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-200">
                  <li>Todas as entregas e pedidos da loja</li>
                  <li>Todos os motoboys e seus tokens 2FA</li>
                  <li>Configurações de taxas por KM e OSRM</li>
                  <li>Histórico de fechamentos semanais e chaves PIX</li>
                  <li>Logs de webhooks e cache de endereços</li>
                </ul>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-slate-300 font-semibold">
                  Digite <span className="font-mono text-amber-400 font-bold">{storeToDelete.slug}</span> para confirmar a exclusão:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder={`Digite "${storeToDelete.slug}"`}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-red-750 text-white font-mono text-center focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStoreToDelete(null)}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmationInput.trim().toLowerCase() !== storeToDelete.slug.toLowerCase()}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar Exclusão em Cascata</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alteração de Senha */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Alterar Senha de Desenvolvedor</span>
              </h3>
              <button
                onClick={() => setIsChangePasswordModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              {passwordChangeError && (
                <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300">
                  {passwordChangeError}
                </div>
              )}
              {passwordChangeSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                  {passwordChangeSuccess}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nova Senha Alfanumérica</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
