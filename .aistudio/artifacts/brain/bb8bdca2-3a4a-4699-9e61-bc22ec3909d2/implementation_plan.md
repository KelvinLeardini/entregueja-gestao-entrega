# Nova Aba 'Histórico & Conferência de Caixa' no Balcão

Implementação de uma aba dedicada de **Histórico de Entregas e Conferência de Caixa** integrada ao painel do balcão e à navegação principal da loja, permitindo aos operadores e gerentes auditar entregas concluídas por período, totalizar taxas pagas a motoboys, conferir valores e volumes recebidos, além de exportar dados em CSV e emitir relatórios impressos para fechamento de caixa.

---

## Decisões Confirmadas com o Usuário

> [!IMPORTANT]
> - **Filtros de Período**: Seletores rápidos para **Hoje**, **Últimos 7 dias** e **Últimos 30 dias**, com data/hora precisa e filtragem em tempo real sobre entregas finalizadas (`DELIVERED`, `CANCELED_AFTER_DELIVERY` com taxa devida, e canceladas pré-saída).
> - **Métricas de Caixa e Conferência**:
>   1. **Total de Taxas de Motoboys** (valor acumulado de diárias/taxas por entrega devidas aos entregadores).
>   2. **Quantidade Total de Pedidos Concluídos** (com taxa de entrega bem-sucedida vs cancelamentos).
>   3. **Volume Financeiro dos Pedidos** (total faturado em mercadorias e breakdown entre pagamentos online vs valores cobrados no destino pelo motoboy).
> - **Exportação e Impressão**:
>   1. **Exportar CSV**: Download direto com dados tabulares estruturados (Data/Hora, Nº Pedido, Canal, Motoboy, Cliente, Bairro, Forma de Pagamento, Valor Pedido, Taxa Motoboy, Status).
>   2. **Impressão de Relatório de Caixa**: Layout limpo e otimizado para conferência física (folha A4 ou bobina térmica 80mm), perfeito para conferência de gaveta e acerto de turno.

---

## 1. Visão Geral e Conceito

### O Problema do Operador de Balcão
Atualmente, no pico do turno, a coluna de "Concluídos" no Kanban ou na tabela geral lista apenas as entregas correntes sem filtros por período retroativo (7 ou 30 dias) e sem um painel de soma financeira direta para conferência de caixa. Ao fechar o caixa ou conferir o dinheiro que retornou com os motoboys, o operador precisa fazer contas manuais.

### A Solução
Uma visão analítica e operacional completa com:
1. **Cards de Consolidação de Caixa**: Indicadores em tempo real do período selecionado (Volume Bruto, Total em Taxas de Entrega, Saldo em Dinheiro a Cobrar no Balcão, Entregas Concluídas).
2. **Tabela Analítica de Entregas Concluídas**: Linhas densas, alinhamento tabular (`tabular-nums`), pesquisa instantânea por cliente, pedido ou motoboy, e filtro por canal de venda (iFood, 99Food, Keeta, Balcão).
3. **Agrupamento por Motoboy**: Resumo de quantas viagens cada motoboy realizou no período e o subtotal exato de taxas a acertar.
4. **Exportação & Impressão**: Botões utilitários de 1 clique para gerar planilha (.csv) e abrir o diálogo de impressão de comprovante de fechamento de caixa.

---

## 2. Experiência do Usuário e Design Visual

### Navegação e Pontos de Acesso
- **No Header Principal**: Adicionada a aba `Histórico & Caixa` na barra de categorias da loja, visível tanto no perfil Administrador quanto no perfil Balcão (`adminOnly: false`).
- **No Painel do Balcão (`BalcaoView`)**: Um botão de atalho rápido na barra superior de controles ("Ir para Histórico & Caixa"), permitindo transição com 1 clique sem perder o contexto operacional.

### Layout e Estética (Diretrizes SaaS & Dashboard)
- **Zero-Pill Discipline**: Tipografia limpa com separadores sutis (`·`), sem tags em cápsula desnecessárias.
- **Tabular Figures**: Todos os valores monetários (`R$ 0,00`), percentuais e contadores formatados com `tabular-nums font-mono` para alinhamento vertical perfeito.
- **Micro-Interações e Responsividade**: Design adaptativo para telas grandes de balcão (1440px) e tablets/telas menores de caixa (compactação elegante em cards no mobile).

---

## 3. Arquitetura Técnica e Fluxo de Dados

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                              App.tsx                                   │
 │       deliveries[ ]  ·  couriers[ ]  ·  storeConfig  ·  theme          │
 └──────────────────────────────────┬─────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
 ┌──────────────────────┐                         ┌──────────────────────┐
 │      Header.tsx      │                         │  BalcaoView.tsx      │
 │  Nova aba:           │                         │  Atalho rápido para  │
 │  "Histórico & Caixa" │                         │  o Histórico         │
 └─────────┬────────────┘                         └──────────┬───────────┘
           │                                                 │
           └────────────────────────┬────────────────────────┘
                                    ▼
       ┌────────────────────────────────────────────────────────────┐
       │             HistoricoConferenciaCaixaView.tsx              │
       │                                                            │
       │  ┌──────────────────────────────────────────────────────┐  │
       │  │ Filtros: [Hoje] [Últimos 7 dias] [Últimos 30 dias]  │  │
       │  │ Busca por texto + Filtro por Canal (iFood/Keeta/...) │  │
       │  └──────────────────────────────────────────────────────┘  │
       │                                                            │
       │  ┌──────────────────────────────────────────────────────┐  │
       │  │ KPI Strip:                                           │  │
       │  │ • Total Taxas Motoboys  • Total de Pedidos           │  │
       │  │ • Faturamento de Pedidos • Valores a Cobrar em Mãos   │  │
       │  └──────────────────────────────────────────────────────┘  │
       │                                                            │
       │  ┌──────────────────────────────────────────────────────┐  │
       │  │ Resumo Consolidado por Motoboy (Viagens + Taxa Devida│  │
       │  └──────────────────────────────────────────────────────┘  │
       │                                                            │
       │  ┌──────────────────────────────────────────────────────┐  │
       │  │ Tabela Detalhada com Ordenação e Paginação           │  │
       │  └──────────────────────────────────────────────────────┘  │
       │                                                            │
       │  ┌──────────────────────────────────────────────────────┐  │
       │  │ Ações: [📥 Baixar Planilha CSV]  [🖨️ Imprimir Fechamento│
       │  └──────────────────────────────────────────────────────┘  │
       └────────────────────────────────────────────────────────────┘
```

---

## 4. Estrutura de Implementação por Componente

### 4.1. Novo Componente: `src/components/HistoricoConferenciaCaixaView.tsx`
- **Filtros Temporais**:
  - `HOJE`: Entregas realizadas desde as 00:00 do dia atual até as 23:59.
  - `SETE_DIAS`: Entregas dos últimos 7 dias corridos.
  - `TRINTA_DIAS`: Entregas dos últimos 30 dias corridos.
- **Cálculo de Totais**:
  - `totalTaxas`: Soma de `feeAmount` para entregas onde `isFeePayable` é verdadeiro (`DELIVERED` e `CANCELED_AFTER_DELIVERY`).
  - `totalPedidos`: Contagem de entregas finalizadas.
  - `volumePedidos`: Soma de `orderTotal` dos pedidos concluídos.
  - `valoresCobrarDestino`: Soma de pedidos com pagamento `CASH`, `CARD` ou `PIX` cobrados no ato pelo motoboy (conferência do dinheiro físico).
- **Exportação CSV**:
  - Função pura em TypeScript gerando cabeçalhos UTF-8 (`\uFEFF`) e linhas separadas por ponto-e-vírgula (compatível com Excel no Brasil).
- **Impressão de Conferência**:
  - Estilização `@media print` dedicada para impressão de comprovante estruturado contendo resumo da loja, período, totais por motoboy e relação de pedidos.

### 4.2. Atualização em `src/components/Header.tsx`
- Adicionar o item `'historico'` à lista `allNavItems` com ícone de histórico/auditoria (`History` ou `FileSpreadsheet`), configurado como `adminOnly: false` para que o operador de caixa no modo Balcão também tenha acesso imediato.

### 4.3. Atualização em `src/App.tsx`
- Expandir a tipagem de `activeTab` para incluir `'historico'`.
- Renderizar `<HistoricoConferenciaCaixaView>` quando `activeTab === 'historico'`.
- Permitir que a navegação do modo Balcão mantenha a permissão de alternar entre o `Balcão Operacional` e o `Histórico & Conferência de Caixa`.

### 4.4. Integração em `src/components/BalcaoView.tsx`
- Adicionar na barra de ferramentas do balcão um botão de acesso rápido "Histórico & Caixa", permitindo navegar diretamente à conferência.

---

## 5. Plano de Validação e Testes

1. **Validação de Filtros por Período**:
   - Alternar entre `Hoje`, `Últimos 7 dias` e `Últimos 30 dias` e confirmar que as listas e métricas são recalculadas com precisão instantânea.
2. **Validação das Métricas Financeiras**:
   - Conferir soma de taxas de motoboy (`feeAmount`), contagem de pedidos e volume total (`orderTotal`), conferindo casos de cancelamento pós-saída (onde a taxa permanece devida).
3. **Validação da Exportação CSV**:
   - Clicar em "Exportar CSV" e checar se o arquivo `.csv` é baixado com todos os campos preenchidos e codificação adequada.
4. **Validação da Impressão de Relatório**:
   - Clicar em "Imprimir Relatório" e validar se a janela de impressão do navegador exibe o formato de conferência limpo sem elementos de interface desnecessários.
5. **Verificação de Compilação**:
   - Executar `compile_applet` e garantir 0 erros de TypeScript e integridade visual.
