# Sistema Profissional de Assinaturas & Checkout com Integração Asaas

Implementação do fluxo completo de checkout profissional com gestão de assinaturas recorrentes via Asaas (Pix com QR Code, Cartão de Crédito e Boleto), contemplando os planos Essencial (R$ 30), Profissional (R$ 50) e Turbo (R$ 70), 7 dias de degustação gratuita sem cobrança imediata, geração instantânea da URL exclusiva do restaurante (`/[slug]`) e provisionamento automático no portal do desenvolvedor (`/dev-admin-portal`).

---

## Revisão do Usuário & Decisões Confirmadas

> [!IMPORTANT]
> As decisões principais levantadas na etapa de alinhamento foram consolidadas abaixo conforme confirmado com o cliente:

- **Provedor de Pagamento Homologado**: Integração com Asaas para cobranças recorrentes via Pix instantâneo, Cartão de Crédito com verificação de segurança e Boleto Bancário.
- **Grade e Precificação dos Planos**:
  1. **Essencial**: R$ 30,00/mês — voltado para operações individuais ou até 3 motoboys.
  2. **Profissional**: R$ 50,00/mês — motoboys ilimitados, fechamento semanal PIX e portal do motoboy com 2FA.
  3. **Turbo**: R$ 70,00/mês — todas as integrações de PDV/iFood/99Food, múltiplos balcões e suporte prioritário.
- **Trial de 7 Dias**: Liberação imediata de acesso completo com 7 dias de teste gratuito antes do débito da primeira fatura.
- **Onboarding Pós-Pagamento & Dev Portal**: Imediatamente após a confirmação do checkout, o sistema gera a URL exclusiva da loja (`https://dominio.com/[slug]`), entrega os links de acesso rápido (Balcão, Gestão e Motoboy) e cadastra a nova unidade automaticamente no banco de dados de tenants gerenciado pelo Super Admin Dev (`/dev-admin-portal`).

---

## 1. Visão Geral & Conceito do Produto

- **O que faz**: Permite que donos de hamburguerias, pizzarias, farmácias e restaurantes assinem a plataforma de forma autônoma e segura. Na tela de checkout `/assinar`, o cliente informa os dados cadastrais (Razão Social/Nome, CNPJ/CPF, WhatsApp, e-mail, endereço da loja para cálculo das rotas OSRM e slug exclusivo), escolhe seu plano e o meio de pagamento.
- **Público-Alvo**: Estabelecimentos comerciais com entregas próprias que buscam eliminar atritos no fechamento de motoboys e profissionalizar sua logística.
- **Proposta de Valor**: Transparência financeira total, barreira de entrada zero com 7 dias grátis, checkout ágil sem burocracia e ativação imediata do sistema sem intervenção manual.

---

## 2. Experiência do Usuário & Design Visual

### Fluxos Principais do Usuário

1. **Escolha na Landing Page**:
   - A seção de preços na Landing Page exibe os novos valores (R$ 30, R$ 50 e R$ 70) com o selo visual "7 Dias Grátis - Cancele quando quiser".
   - Botões "Assinar Plano" e "Começar 7 Dias Grátis" direcionam para `/assinar?plano=[essencial|profissional|turbo]`.

2. **Página de Checkout Profissional (`/assinar`)**:
   - **Etapa 1: Dados do Negócio**: Nome do comércio, segmento comercial (Hamburgueria, Pizzaria, etc.), responsável, WhatsApp, e-mail, CNPJ/CPF e definição da URL exclusiva (`/[slug]`) com validação em tempo real de disponibilidade.
   - **Etapa 2: Endereço de Origem**: Endereço base da loja com preenchimento assistido para cálculo das rotas e km dos motoboys.
   - **Etapa 3: Seleção do Plano & Faturamento**: Seletor dinâmico dos 3 planos com destaque para os 7 dias grátis ("Primeira cobrança de R$ [valor] apenas em [Data daqui a 7 dias]").
   - **Etapa 4: Método de Pagamento Asaas**:
     - *PIX*: Geração de QR Code dinâmico e código Pix Copia e Cola, com contador regressivo e detecção de status.
     - *Cartão de Crédito*: Campos para número do cartão, titular, validade e CVV com máscara, bandeira automática e botão de preenchimento para teste de homologação.
     - *Boleto Bancário*: Linha digitável e opção de visualização.

3. **Tela de Boas-Vindas & Entrega de Acessos**:
   - Feedback visual de sucesso informando que o período de 7 dias de teste está ativo.
   - Card com a URL da loja gerada com 1 clique para copiar (`https://app.../[slug]`).
   - Botões diretos para abrir o Balcão de Pedidos, Painel do Gestor ou enviar o link do portal para o WhatsApp do restaurante.

4. **Painel do Desenvolvedor (`/dev-admin-portal`)**:
   - A nova loja aparece instantaneamente na listagem de tenants.
   - Badges visuais indicando: Plano (Essencial R$ 30, Pro R$ 50, Turbo R$ 70), Status (`TRIAL`), contagem regressiva dos 7 dias e identificadores do Asaas.
   - Botão para impersonar a loja diretamente com privilégios de super admin.

### Identidade Visual & Diretrizes de Estilo
- **Paleta de Cores**: Fundo neutro Slate (`bg-slate-950` / `bg-slate-900` no dark mode e `bg-slate-50` / `bg-white` no light mode), realces em Amber (`amber-500` / `amber-400`) e Emerald para validações financeiras (`emerald-500`).
- **Tipografia**: Hierarquia balanceada com fontes modernas sans-serif e números tabulares (`font-mono tabular-nums`) em todos os valores monetários e contadores.
- **Zero-Pill Discipline**: Metadados limpos sem sobreposição de pílulas visuais genéricas.

---

## 3. Decisões do Produto & Trade-Offs

- **Arquitetura de Assinatura Asaas**:
  - *Decisão*: Utilizar criação de cliente (`/api/v3/customers`) e assinatura recorrente (`/api/v3/subscriptions`) com parâmetro `nextDueDate` programado exatamente para 7 dias à frente.
  - *Vantagem*: Garante o início imediato das operações sem cobrar o comerciante no dia 1, reduzindo a fricção e mantendo a cobrança automatizada após a degustação.
- **Multi-Tenant e Persistência**:
  - *Decisão*: Salvar o novo tenant imediatamente no registro de tenants (`saveTenants`), inicializar as estruturas isoladas (`tenant_[slug]_*`) e sincronizar com o backend `/api/tenants`.
  - *Vantagem*: O cliente não depende de recarregamento e pode começar a lançar entregas instantaneamente, enquanto o Dev Admin enxerga o novo cliente em tempo real.
- **Ambiente de Teste / Simulação Segura**:
  - *Decisão*: Fornecer no checkout um seletor de "Modo de Homologação Asaas" (Sandbox/Produção) com preenchimento rápido de cartões de teste e chave Pix fictícia gerada para testes imediatos sem exigir transações reais em contas de produção durante a avaliação.

---

## 4. Arquitetura Técnica & Estratégia de Dados

### Diagrama do Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ENTREGUEJÁ SAAS                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┴───────────────────────────┐
          ▼                                                       ▼
┌───────────────────┐                                   ┌───────────────────┐
│   Landing Page    │                                   │ Dev Admin Portal  │
│    (Preços 30,    │                                   │ (/dev-admin-portal│
│    50 e 70 R$)    │                                   │  Gestão Tenants)  │
└─────────┬─────────┘                                   └─────────▲─────────┘
          │ (Clique "Assinar Plano")                              │
          ▼                                                       │
┌─────────────────────────────────────────────────────────┐       │
│           CheckoutAssinaturaView (/assinar)             │       │
│  - Cadastro Loja (CNPJ, Nome, Endereço, Slug)           │       │
│  - Seleção de Plano (Essencial, Pro, Turbo)             │       │
│  - Período de 7 dias grátis (nextDueDate = now + 7d)    │       │
│  - Gateway Asaas (Pix QR Code, Cartão, Boleto)          │       │
└───────────────────────────┬─────────────────────────────┘       │
                            │                                     │
                            ▼                                     │
┌─────────────────────────────────────────────────────────┐       │
│                 Serviço Asaas Client                    │       │
│                (src/services/asaas.ts)                  │       │
│  - createAsaasCustomer(data)                            │       │
│  - createRecurringSubscription(plan, method, trialDays) │       │
│  - generatePixQrCode() / tokenizeCard()                 │       │
└───────────────────────────┬─────────────────────────────┘       │
                            │                                     │
                            ▼ (Sucesso da Assinatura)             │
┌─────────────────────────────────────────────────────────┐       │
│              Provisionamento de Tenant                  │───────┘
│  - createTenant({ slug, plan, trialEndsAt, ... })       │  (Aparece no
│  - saveTenantScopedData(slug, { config, rates... })     │   Painel Dev)
│  - Gera URL: https://app.../[slug]                      │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                Tela de Conclusão & Links                │
│  - Link Balcão: /[slug]?role=balcao                     │
│  - Link Gestão: /[slug]?role=admin                      │
│  - Compartilhamento WhatsApp para a Loja                │
└─────────────────────────────────────────────────────────┘
```

### Componentes e Módulos Previstos

1. **`src/types/index.ts`**:
   - Atualização do tipo `TenantStore`: suporte a planos `'ESSENCIAL' | 'PROFISSIONAL' | 'TURBO'`, campos de `trialEndsAt`, `asaasCustomerId`, `asaasSubscriptionId`, `billingStatus`.
2. **`src/services/asaas.ts`**:
   - Estruturas de dados da API Asaas (Cliente, Assinatura, Cobrança, QR Code Pix).
   - Mock/Proxy de homologação e emissão de assinaturas com vencimento para +7 dias.
3. **`src/components/CheckoutAssinaturaView.tsx`**:
   - Interface completa e responsiva do checkout em 3 etapas com validação de campos brasileiros (máscaras de CNPJ/CPF, WhatsApp, CEP).
   - Resumo claro do plano com contagem regressiva dos 7 dias gratuitos.
   - Telas de pagamento para Pix, Cartão e Boleto.
   - Tela final com os links diretos da loja criada.
4. **`src/components/LandingPage.tsx`**:
   - Ajuste dos cards de planos: Essencial (R$ 30), Profissional (R$ 50) e Turbo (R$ 70).
   - Botões direcionando para a nova rota de assinatura.
5. **`src/components/DevAdminView.tsx`**:
   - Exibição destacada do selo "TRIAL (X dias restantes)", plano assinado e código Asaas de cada comércio.
6. **`src/App.tsx`**:
   - Registro da rota `/assinar` e `/checkout`, com suporte ao parâmetro de URL `?plano=...`.
