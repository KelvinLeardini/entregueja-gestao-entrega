import React, { useState } from 'react';
import { Sliders, Plus, Trash2, MapPin, Save, RotateCcw, ArrowUpDown, Sparkles, AlertCircle } from 'lucide-react';
import { DeliveryRateRange, StoreConfig } from '../types';
import { DEFAULT_RATE_RANGES, DEFAULT_STORE_CONFIG } from '../services/storage';

interface TabelaTaxasViewProps {
  rateRanges: DeliveryRateRange[];
  storeConfig: StoreConfig;
  onSaveRateRanges: (ranges: DeliveryRateRange[]) => void;
  onSaveStoreConfig: (config: StoreConfig) => void;
}

export const TabelaTaxasView: React.FC<TabelaTaxasViewProps> = ({
  rateRanges,
  storeConfig,
  onSaveRateRanges,
  onSaveStoreConfig,
}) => {
  const [ranges, setRanges] = useState<DeliveryRateRange[]>(rateRanges);
  const [store, setStore] = useState<StoreConfig>(storeConfig);
  const [isSaved, setIsSaved] = useState(false);

  // Campos para novo bloco rápido
  const [newMinKm, setNewMinKm] = useState('');
  const [newMaxKm, setNewMaxKm] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Atualização em tempo real de cada bloco
  const handleUpdateField = (
    id: string,
    field: keyof DeliveryRateRange,
    value: string | number | boolean
  ) => {
    setRanges((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return { ...r, [field]: value };
      })
    );
    setIsSaved(false);
  };

  const handleToggleActive = (id: string) => {
    setRanges((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
    setIsSaved(false);
  };

  const handleDeleteRange = (id: string) => {
    setRanges((prev) => prev.filter((r) => r.id !== id));
    setIsSaved(false);
  };

  // Ordenar blocos automaticamente por KM inicial
  const handleSortRanges = () => {
    setRanges((prev) => [...prev].sort((a, b) => a.minKm - b.minKm));
    setIsSaved(false);
  };

  // Adicionar bloco rápido pré-preenchido
  const handleQuickAddBlock = () => {
    const sorted = [...ranges].sort((a, b) => a.minKm - b.minKm);
    const lastRange = sorted[sorted.length - 1];
    const nextMin = lastRange ? lastRange.maxKm : 0.0;
    const nextMax = Number((nextMin + 3.0).toFixed(1));
    const nextPrice = lastRange ? Number((lastRange.price + 3.0).toFixed(2)) : 6.0;

    const newBlock: DeliveryRateRange = {
      id: `range_${Date.now()}`,
      minKm: nextMin,
      maxKm: nextMax,
      price: nextPrice,
      description: `De ${nextMin} a ${nextMax} km`,
      isActive: true,
      orderIndex: ranges.length + 1,
    };

    setRanges((prev) => [...prev, newBlock].sort((a, b) => a.minKm - b.minKm));
    setIsSaved(false);
  };

  const handleAddCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseFloat(newMinKm);
    const max = parseFloat(newMaxKm);
    const price = parseFloat(newPrice);

    if (isNaN(min) || isNaN(max) || isNaN(price)) {
      alert('Informe valores numéricos válidos para KM e Preço.');
      return;
    }

    if (min >= max) {
      alert('O KM Inicial deve ser menor que o KM Final.');
      return;
    }

    const newRange: DeliveryRateRange = {
      id: `range_${Date.now()}`,
      minKm: min,
      maxKm: max,
      price: price,
      description: newDesc.trim() || `De ${min} a ${max} km`,
      isActive: true,
      orderIndex: ranges.length + 1,
    };

    setRanges((prev) => [...prev, newRange].sort((a, b) => a.minKm - b.minKm));
    setNewMinKm('');
    setNewMaxKm('');
    setNewPrice('');
    setNewDesc('');
    setIsSaved(false);
  };

  const handleSaveAll = () => {
    // Garante que as faixas estão ordenadas antes de salvar
    const sorted = [...ranges].sort((a, b) => a.minKm - b.minKm);
    onSaveRateRanges(sorted);
    onSaveStoreConfig(store);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar as faixas e valores padrão sugeridos?')) {
      setRanges(DEFAULT_RATE_RANGES);
      setStore(DEFAULT_STORE_CONFIG);
      onSaveRateRanges(DEFAULT_RATE_RANGES);
      onSaveStoreConfig(DEFAULT_STORE_CONFIG);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-slate-900">
              Tabela de Taxas por Faixas de Distância (KM)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Liberdade total para adicionar, editar ou excluir blocos de KM e definir o valor de taxa exato para cada raio da hamburgueria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSortRanges}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
            title="Organizar do menor para o maior KM"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Ordenar KM</span>
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Padrão</span>
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-orange-400" />
            <span>{isSaved ? 'Taxas Salvas com Sucesso!' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna 1: Tabela Dinâmica e Livre de Blocos de KM (8 colunas) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Blocos de KM Cadastrados ({ranges.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Você pode editar as distâncias e valores diretamente nos campos abaixo.
              </span>
            </div>

            <button
              type="button"
              onClick={handleQuickAddBlock}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar Bloco de KM</span>
            </button>
          </div>

          {/* Lista de Blocos Editáveis */}
          <div className="space-y-3">
            {ranges.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Nenhum bloco de KM cadastrado. Adicione o primeiro bloco abaixo.
              </div>
            ) : (
              ranges.map((range, idx) => (
                <div
                  key={range.id}
                  className={`p-3 rounded-xl border transition-all ${
                    range.isActive
                      ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      : 'bg-slate-100/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    {/* Indicador do Bloco */}
                    <div className="sm:col-span-1 flex items-center justify-center">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold font-mono text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </div>

                    {/* KM Inicial e Final */}
                    <div className="sm:col-span-4 flex items-center gap-1.5">
                      <div className="w-1/2">
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                          De (KM)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={range.minKm}
                          onChange={(e) =>
                            handleUpdateField(
                              range.id,
                              'minKm',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full text-xs font-bold font-mono-numbers bg-white border border-slate-300 rounded-lg p-1.5 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                      <span className="text-xs text-slate-400 mt-3">até</span>
                      <div className="w-1/2">
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                          Até (KM)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={range.maxKm}
                          onChange={(e) =>
                            handleUpdateField(
                              range.id,
                              'maxKm',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full text-xs font-bold font-mono-numbers bg-white border border-slate-300 rounded-lg p-1.5 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Valor da Taxa */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                        Taxa (R$)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-500 font-medium">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={range.price}
                          onChange={(e) =>
                            handleUpdateField(
                              range.id,
                              'price',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full text-xs font-bold font-mono-numbers bg-white border border-slate-300 rounded-lg pl-8 pr-2 py-1.5 text-orange-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Descrição / Bairros */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                        Descrição / Bairros
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Centro / Próximos"
                        value={range.description || ''}
                        onChange={(e) =>
                          handleUpdateField(range.id, 'description', e.target.value)
                        }
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>

                    {/* Ações: Ativo / Inativo e Excluir */}
                    <div className="sm:col-span-1 flex items-center justify-end gap-1 mt-2 sm:mt-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(range.id)}
                        className={`text-[10px] font-bold px-1.5 py-1 rounded transition-colors ${
                          range.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                        title={range.isActive ? 'Bloco ativo' : 'Bloco inativo'}
                      >
                        {range.isActive ? 'ON' : 'OFF'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Excluir o bloco de ${range.minKm} a ${range.maxKm} km (R$ ${range.price.toFixed(2)})?`
                            )
                          ) {
                            handleDeleteRange(range.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir este bloco"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Formulário Manual de Inserção de Novo Bloco */}
          <div className="pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-xl">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-bold text-slate-900">
                Cadastrar Novo Bloco Personalizado de KM
              </span>
            </div>

            <form
              onSubmit={handleAddCustomRange}
              className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end"
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  KM Inicial
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 8.0"
                  value={newMinKm}
                  onChange={(e) => setNewMinKm(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  KM Final
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="Ex: 12.0"
                  value={newMaxKm}
                  onChange={(e) => setNewMaxKm(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Valor da Taxa (R$)
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="Ex: 15.00"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-bold"
                  required
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Nome / Descrição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Bairros Afastados"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <button
                  type="submit"
                  className="w-full h-9 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Inserir Bloco</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Coluna 2: Regras de Excedente & Ponto de Origem Fixo (4 colunas) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card de Regra de Excedente */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                KM Além da Última Faixa
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Caso o cliente esteja mais longe do que o maior bloco cadastrado, o sistema cobra o valor da última faixa somado a este valor por KM excedente:
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adicional por KM Excedente (R$/km)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-500 font-medium">
                  R$
                </span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={store.extraKmRate}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      extraKmRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full text-xs font-bold font-mono-numbers bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Ex: Se a última faixa termina em 10 km (R$ 15,00) e a entrega for de 12 km (+2 km), soma-se 2 × R$ {store.extraKmRate.toFixed(2)}.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Taxa de Contingência (Se endereço falhar)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-500 font-medium">
                  R$
                </span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={store.fallbackRate}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      fallbackRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full text-xs font-bold font-mono-numbers bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Configuração da Hamburgueria (Ponto de Origem Vila Guilhermina) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Origem das Rotas
              </span>
            </div>

            <div className="text-xs space-y-1.5 text-slate-600">
              <div className="font-bold text-slate-900">{store.storeName}</div>
              <div>{store.street}, {store.number} - {store.neighborhood}</div>
              <div>{store.city} - {store.state}, CEP {store.postalCode || '03542-060'}</div>
              <div className="text-[11px] font-mono text-slate-400 pt-1">
                Lat: {store.latitude} · Lng: {store.longitude}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              Todas as distâncias viárias em KM são calculadas automaticamente a partir deste ponto via OSRM gratuito.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
