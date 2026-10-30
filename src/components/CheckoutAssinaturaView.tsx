import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  CreditCard,
  QrCode,
  FileText,
  Building2,
  MapPin,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Store,
  Clock,
  ChevronRight,
  UtensilsCrossed,
  Info,
  Phone,
  Mail,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';
import {
  ASAAS_PLANS,
  AsaasPlanId,
  AsaasBillingType,
  createAsaasSubscription,
  calculateTrialDueDate,
  AsaasSubscriptionResult,
} from '../services/asaas';
import {
  createTenant,
  loadTenants,
  saveTenantScopedConfig,
  saveTenantScopedRates,
  DEFAULT_RATE_RANGES,
} from '../services/storage';
import { SegmentType, TenantStore } from '../types';

interface CheckoutAssinaturaViewProps {
  initialPlan?: AsaasPlanId;
  onBackToHome: () => void;
  onNavigateToTenant: (slug: string) => void;
  onNavigateToDevAdmin: () => void;
  theme: 'light' | 'dark';
}

export function CheckoutAssinaturaView({
  initialPlan = 'PROFISSIONAL',
  onBackToHome,
  onNavigateToTenant,
  onNavigateToDevAdmin,
  theme,
}: CheckoutAssinaturaViewProps) {
  // Estado do Plano Selecionado
  const [selectedPlanId, setSelectedPlanId] = useState<AsaasPlanId>(initialPlan);
  const selectedPlan = ASAAS_PLANS[selectedPlanId] || ASAAS_PLANS.PROFISSIONAL;

  // Método de Pagamento
  const [billingType, setBillingType] = useState<AsaasBillingType>('PIX');

  // Dados Cadastrais do Comércio
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [segment, setSegment] = useState<SegmentType>('BURGER');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');

  // Endereço de Origem
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');
  const [postalCode, setPostalCode] = useState('');

  // Dados do Cartão de Crédito
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Estados de Interface e Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedSubscription, setCompletedSubscription] = useState<AsaasSubscriptionResult | null>(null);
  const [createdTenantSlug, setCreatedTenantSlug] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Calcula data do trial
  const { formattedDate: trialEndDateFormatted } = calculateTrialDueDate(7);

  // Geração automática de slug a partir do nome
  useEffect(() => {
    if (!isSlugManual && storeName.trim()) {
      const generated = storeName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  }, [storeName, isSlugManual]);

  // Checa se slug já existe
  const isSlugTaken = React.useMemo(() => {
    if (!slug) return false;
    const currentTenants = loadTenants();
    return currentTenants.some((t) => t.slug.toLowerCase() === slug.toLowerCase());
  }, [slug]);

  // Máscara de Telefone
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 10) {
      setOwnerPhone(raw.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3'));
    } else {
      setOwnerPhone(raw.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3'));
    }
  };

  // Máscara de CNPJ/CPF
  const handleCpfCnpjChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 14);
    if (raw.length <= 11) {
      setCpfCnpj(raw.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4'));
    } else {
      setCpfCnpj(raw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5'));
    }
  };

  // Preenchimento de Cartão de Teste (Sandbox)
  const handleFillTestCard = () => {
    setCardHolder(ownerName || 'LOJA DEMO TESTE LTDA');
    setCardNumber('5502 0900 0000 4242');
    setCardExpiry('12/28');
    setCardCvv('789');
  };

  // Submissão do Formulário de Assinatura
  const handleSubmitSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validações básicas
    if (!storeName.trim()) {
      setErrorMessage('Por favor, informe o nome do seu estabelecimento comercial.');
      return;
    }
    if (!slug.trim()) {
      setErrorMessage('Por favor, defina o link exclusivo da sua loja.');
      return;
    }
    if (isSlugTaken) {
      setErrorMessage('Este link exclusivo já está em uso por outro comércio. Por favor, escolha outro.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMessage('Informe o nome do responsável.');
      return;
    }
    if (!ownerPhone.trim()) {
      setErrorMessage('Informe o WhatsApp do responsável.');
      return;
    }
    if (!ownerEmail.trim()) {
      setErrorMessage('Informe um e-mail válido para recebimento dos acessos e faturas.');
      return;
    }
    if (!cpfCnpj.trim()) {
      setErrorMessage('Informe o CPF ou CNPJ da empresa.');
      return;
    }

    if (billingType === 'CREDIT_CARD') {
      if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
        setErrorMessage('Preencha todos os dados do cartão de crédito ou clique em "Preencher Cartão de Teste".');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Processa a Assinatura Recorrente no Asaas (com 7 dias grátis)
      const fullAddress = `${street ? street + ', ' : ''}${number ? number + ' - ' : ''}${neighborhood ? neighborhood + ', ' : ''}${city} - ${state}`;

      const asaasResult = await createAsaasSubscription({
        customer: {
          name: storeName.trim(),
          cpfCnpj: cpfCnpj.trim(),
          email: ownerEmail.trim(),
          phone: ownerPhone.trim(),
          address: street,
          addressNumber: number,
          province: neighborhood,
          postalCode,
          storeSlug: slug.trim(),
        },
        planId: selectedPlanId,
        billingType,
        creditCard:
          billingType === 'CREDIT_CARD'
            ? {
                holderName: cardHolder,
                number: cardNumber,
                expiryMonth: cardExpiry.split('/')[0] || '12',
                expiryYear: cardExpiry.split('/')[1] || '2028',
                ccv: cardCvv,
              }
            : undefined,
      });

      // 2. Provisiona o novo Tenant no banco local e servidor
      const newTenant: TenantStore = {
        id: `store_${slug.trim().toLowerCase()}`,
        slug: slug.trim().toLowerCase(),
        name: storeName.trim(),
        segment,
        status: 'TRIAL',
        plan: selectedPlanId,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerEmail: ownerEmail.trim(),
        cnpjCpf: cpfCnpj.trim(),
        originAddress: fullAddress || 'Rua Principal, 100 - Centro, São Paulo - SP',
        originLat: -23.5505,
        originLng: -46.6333,
        calculationMode: 'KM_DRIVEN',
        defaultBaseFee: 6.0,
        defaultKmRate: 1.5,
        storePin: '1234',
        adminPin: '9876',
        trialEndsAt: asaasResult.trialEndsAt,
        asaasCustomerId: asaasResult.customerId,
        asaasSubscriptionId: asaasResult.subscriptionId,
        billingMethod: billingType,
        billingStatus: 'TRIAL',
        createdAt: new Date().toISOString(),
      };

      createTenant(newTenant);

      // Salva configuração de loja e faixas de taxa iniciais
      saveTenantScopedConfig(newTenant.slug, {
        id: newTenant.id,
        storeName: newTenant.name,
        street: street || 'Rua Principal',
        number: number || '100',
        neighborhood: neighborhood || 'Centro',
        city: city || 'São Paulo',
        state: state || 'SP',
        postalCode: postalCode || '',
        cnpj: cpfCnpj,
        phone: ownerPhone,
        latitude: -23.5505,
        longitude: -46.6333,
        fallbackRate: 7.0,
        extraKmRate: 1.5,
        maxDistanceKm: 25.0,
      });

      saveTenantScopedRates(newTenant.slug, DEFAULT_RATE_RANGES);

      // Sincroniza com o servidor caso a API esteja ativa
      try {
        fetch('/api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTenant),
        }).catch(() => {});
      } catch (e) {}

      setCompletedSubscription(asaasResult);
      setCreatedTenantSlug(newTenant.slug);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar assinatura no Asaas. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentOriginUrl = typeof window !== 'undefined' ? window.location.origin : 'https://entregueja.com.br';
  const fullStoreUrl = `${currentOriginUrl}/${createdTenantSlug || slug}`;

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(fullStoreUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyPix = (payload: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(payload);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  // ==========================================================================
  // TELA 2: SUCESSO E ENTREGA DO LINK EXCLUSIVO DA LOJA
  // ==========================================================================
  if (completedSubscription && createdTenantSlug) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto w-full space-y-6">
          {/* Top Bar da Conclusão */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Assinatura Ativada com Sucesso!
            </h1>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Sua conta foi criada no Asaas com <strong className="text-emerald-400">7 dias de teste gratuito</strong> até <span className="font-mono text-white">{trialEndDateFormatted}</span>.
            </p>
          </div>

          {/* Card Central com Link Exclusivo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-amber-500" />
                  URL Exclusiva da sua Loja
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Pronto para Operar
                </span>
              </div>

              {/* Caixa de URL com botão de copiar */}
              <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-sm font-mono text-amber-400 truncate flex-1 select-all">
                  {fullStoreUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Detalhes da Cobrança Asaas */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Plano Selecionado:</span>
                <span className="font-bold text-white uppercase">{selectedPlan.name} · R$ {selectedPlan.price.toFixed(2)}/mês</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Status da Assinatura:</span>
                <span className="font-bold text-emerald-400">7 Dias Grátis Ativos (Degustação)</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Primeira Cobrança Asaas:</span>
                <span className="font-mono text-amber-400 font-bold">{trialEndDateFormatted} (R$ {selectedPlan.price.toFixed(2)})</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">ID da Assinatura:</span>
                <span className="font-mono text-slate-400">{completedSubscription.subscriptionId}</span>
              </div>
            </div>

            {/* Informações de Pagamento (PIX / Boleto) se gerados */}
            {completedSubscription.paymentDetails.pix && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>PIX do Asaas para Ativação Automática (Opcional antecipar)</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shrink-0">
                    <img
                      src={completedSubscription.paymentDetails.pix.encodedImage}
                      alt="QR Code Pix"
                      className="w-32 h-32"
                    />
                  </div>
                  <div className="space-y-2 text-xs flex-1">
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Se você desejar validar o pagamento imediatamente via PIX ou guardar o código para quando o período gratuito finalizar:
                    </p>
                    <button
                      onClick={() => handleCopyPix(completedSubscription.paymentDetails.pix!.payload)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                    >
                      {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPix ? 'Código Pix Copiado!' : 'Copiar Chave Pix Copia e Cola'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Ações Rápidas de Acesso */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onNavigateToTenant(createdTenantSlug)}
                className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <span>Acessar Painel da Loja</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onNavigateToDevAdmin}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <span>Ver no Painel de Desenvolvedor</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={onBackToHome}
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para a Página Principal</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // TELA 1: CHECKOUT PROFISSIONAL E FORMULÁRIO DE ASSINATURA ASAAS
  // ==========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar de Segurança SSL e Selo Asaas */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHome}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-sm">
              E
            </div>
            <div>
              <span className="font-bold text-white text-sm">EntregueJá</span>
              <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">Checkout Seguro de Assinatura</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Checkout Asaas 256-bit SSL</span>
        </div>
      </header>

      {/* Conteúdo Principal do Checkout */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
        <form onSubmit={handleSubmitSubscription} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUNA ESQUERDA (8 COLUNAS): Dados da Loja, Responsável e Pagamento */}
          <div className="lg:col-span-7 space-y-6">
            {/* Mensagem de Erro Geral */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SEÇÃO 1: Identificação do Estabelecimento */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                <Store className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-white">1. Dados do seu Comércio</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nome do Estabelecimento *</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ex: Hard Beer Burguer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Segmento</label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value as SegmentType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="BURGER">Hamburgueria Artesanal</option>
                    <option value="PIZZERIA">Pizzaria Delivery</option>
                    <option value="RESTAURANT">Restaurante Geral</option>
                    <option value="PHARMACY">Farmácia & Drogaria</option>
                    <option value="MARKET">Mercado & Conveniência</option>
                  </select>
                </div>
              </div>

              {/* Definição do Link Exclusivo (Slug) */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Link Exclusivo da sua Loja (URL de Acesso) *
                </label>
                <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 overflow-hidden focus-within:border-amber-500">
                  <span className="px-3 text-xs text-slate-500 font-mono bg-slate-900/60 border-r border-slate-800 py-2.5 shrink-0">
                    entregueja.com.br/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      setIsSlugManual(true);
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '')
                      );
                    }}
                    placeholder="minha-loja"
                    className="w-full px-3 py-2.5 bg-transparent text-amber-400 font-mono text-xs focus:outline-none"
                  />
                </div>
                {isSlugTaken && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Este link já está cadastrado. Por favor, adicione um sufixo (ex: {slug}-sp).
                  </p>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  É por este endereço que você e seus motoboys acessarão o sistema.
                </p>
              </div>

              {/* CNPJ / CPF e Responsável */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nome do Responsável *</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ex: Ricardo Mendonça"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">CNPJ ou CPF (Faturamento Asaas) *</label>
                  <input
                    type="text"
                    required
                    value={cpfCnpj}
                    onChange={(e) => handleCpfCnpjChange(e.target.value)}
                    placeholder="00.000.000/0000-00 ou CPF"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">WhatsApp do Comércio *</label>
                  <input
                    type="text"
                    required
                    value={ownerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">E-mail para Acesso & Faturas *</label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="financeiro@sualoja.com.br"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: Endereço Base da Loja (Origem das Rotas OSRM) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                <MapPin className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-white">2. Endereço de Expedição (Ponto de Partida)</h2>
              </div>
              <p className="text-xs text-slate-400">
                Endereço de onde seus motoboys saem para entregar. Utilizado para o cálculo de quilometragem real por rota.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="sm:col-span-3">
                  <label className="block text-slate-400 mb-1 font-medium">Rua / Avenida</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Ex: R. Dr. Fábio Montenegro"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Número</label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="32"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">Bairro</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Vila Guilhermina"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Estado</label>
                  <input
                    type="text"
                    value={state}
                    maxLength={2}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-center uppercase font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: Forma de Pagamento Asaas */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">3. Método de Pagamento (Asaas Recorrente)</h2>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  7 Dias Grátis
                </span>
              </div>

              {/* Seletor de Método de Pagamento */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBillingType('PIX')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    billingType === 'PIX'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>PIX</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingType('CREDIT_CARD')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    billingType === 'CREDIT_CARD'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cartão de Crédito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingType('BOLETO')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    billingType === 'BOLETO'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Boleto Bancário</span>
                </button>
              </div>

              {/* Formulário de Cartão de Crédito */}
              {billingType === 'CREDIT_CARD' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Dados do Cartão</span>
                    <button
                      type="button"
                      onClick={handleFillTestCard}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Preencher Cartão de Teste (Sandbox)
                    </button>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Nome no Cartão</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder="NOME COMO IMPRESSO NO CARTÃO"
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">Número do Cartão</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                          setCardNumber(v.replace(/(\d{4})/g, '$1 ').trim());
                        }}
                        placeholder="0000 0000 0000 0000"
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">Validade</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                            if (v.length > 2) {
                              setCardExpiry(`${v.slice(0, 2)}/${v.slice(2)}`);
                            } else {
                              setCardExpiry(v);
                            }
                          }}
                          placeholder="MM/AA"
                          className="w-full px-2 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-center font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="123"
                          className="w-full px-2 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informações sobre PIX */}
              {billingType === 'PIX' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <QrCode className="w-4 h-4" />
                    <span>Como funciona a assinatura via PIX:</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Você terá <strong>7 dias de teste livre</strong>. Quando o período de teste expirar em{' '}
                    <strong className="text-white">{trialEndDateFormatted}</strong>, o Asaas enviará a chave PIX automática mensalmente por WhatsApp e e-mail para renovação sem dores de cabeça.
                  </p>
                </div>
              )}

              {/* Informações sobre Boleto */}
              {billingType === 'BOLETO' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <FileText className="w-4 h-4" />
                    <span>Emissão de Boleto Bancário:</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    O primeiro boleto será emitido com vencimento para{' '}
                    <strong className="text-white">{trialEndDateFormatted}</strong> (após os 7 dias gratuitos).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA (5 COLUNAS): Resumo do Pedido, Seleção de Planos e CTA */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            {/* Seletor de Planos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Escolha o seu Plano Mensal
              </span>

              <div className="space-y-3">
                {(['ESSENCIAL', 'PROFISSIONAL', 'TURBO'] as AsaasPlanId[]).map((planKey) => {
                  const p = ASAAS_PLANS[planKey];
                  const isSelected = selectedPlanId === planKey;

                  return (
                    <div
                      key={planKey}
                      onClick={() => setSelectedPlanId(planKey)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{p.name}</span>
                            {p.recommended && (
                              <span className="text-[10px] font-bold uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                                {p.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">{p.couriersLimit}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-extrabold text-white font-mono-numbers">
                            R$ {p.price.toFixed(0)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">/mês</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resumo Financeiro com 7 Dias Grátis */}
              <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Plano Selecionado:</span>
                  <span className="text-white font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Período de Teste Gratuito:</span>
                  <span className="text-emerald-400 font-semibold">7 Dias Grátis</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cobrança Imediata Hoje:</span>
                  <span className="text-emerald-400 font-bold font-mono">R$ 0,00</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Primeira Fatura Asaas:</span>
                  <span className="text-white font-mono">{trialEndDateFormatted}</span>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Total a Pagar Hoje:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400 font-mono-numbers">R$ 0,00</span>
                    <span className="text-[10px] text-slate-500 block">Após 7 dias: R$ {selectedPlan.price.toFixed(2)}/mês</span>
                  </div>
                </div>
              </div>

              {/* Callout de Degustação */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Você não será cobrado agora. Teste todas as funções na sua rotina com motoboys reais por 7 dias. Cancele quando quiser.
                </span>
              </div>

              {/* Botão de Finalização */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Processando Assinatura no Asaas...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar 7 Dias de Teste Grátis</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center text-[10px] text-slate-500 space-y-1">
                <p>Ao assinar você concorda com os termos de serviço e privacidade.</p>
                <p>Cobrança gerenciada de forma segura pelo gateway Asaas.</p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
