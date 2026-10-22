# 🚀 EntregueJá SaaS · Sistema Operacional de Delivery & Logística Multi-Tenant

<div align="center">

![EntregueJá SaaS Banner](https://img.shields.io/badge/EntregueJ%C3%A1-SaaS%20Delivery%20Logistics-f59e0b?style=for-the-badge&logo=fastapi&logoColor=black)
<br/>

[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.3-38b2ac?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Tests-2e8555?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit%20Tests-729b1b?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=flat-square)](LICENSE)

**A plataforma completa para gestão, roteamento sem custo de API, impressão térmica e remuneração de motoboys para hamburguerias, pizzarias, restaurantes e farmácias.**

[Funcionalidades](#-funcionalidades-chave) •
[Arquitetura](#-arquitetura-do-sistema) •
[Impressão Térmica](#-impressão-térmica-escpos) •
[Testes Automatizados](#-suíte-de-testes-automatizados) •
[Como Executar](#-guia-rápido-de-instalação)

</div>

---

## 📌 Visão Geral do Produto

O **EntregueJá** é uma solução completa de logística e expedição sob demanda desenvolvida para resolver as dores reais do balcão de delivery:

1. **Roteamento Inteligente a Custo R$ 0,00**: Adeus a cobranças abusivas do Google Maps API. O sistema utiliza **OSRM (Open Source Routing Machine)** em malha viária real com geocodificação via **Nominatim OpenStreetMap** e cache local instantâneo.
2. **Arquitetura Multi-Tenant com Isolamento Estrito**: Permite atender múltiplas marcas e filiais (`/[tenantSlug]`, ex: `/hardbeerburguer`, `/phyto-formula`, `/demo`), garantindo dados, taxas e usuários 100% segregados.
3. **Impressão Térmica Universal**: Suporte a todos os padrões de bobinas do mercado (**58mm**, **72mm**, **80mm Padrão**, **112mm** e milimetragem personalizada), com controle de guilhotina e diagramação automática.
4. **Portal do Motoboy com Autenticação 2FA por PIN**: Acesso individual por link tokenizado com desafio obrigatório de 6 dígitos em teclado virtual ou físico.
5. **Fechamento Semanal Auditado (Pix)**: Cálculo transparente de remuneração com distinção jurídica entre cancelamentos pré-deslocamento (sem taxa) e cancelamentos no local (com taxa integral paga ao motoboy).

---

## 🏗️ Arquitetura do Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                     ENTREGUEJÁ SAAS · ARQUITETURA                      │
└────────────────────────────────────────────────────────────────────────┘
          │
          ├──> 🌐 Plataformas Externas (iFood / 99Food / Keeta / WhatsApp)
          │         │
          │         ▼
          │   [ Webhook Gateway & Central de Configurações ]
          │         │
          ▼         ▼
    ┌───────────────────────────┐
    │  BALCÃO OPERACIONAL       │ <──> [ Motor de Roteamento OSRM ]
    │  - Fila Unificada         │      - Geocodificação Nominatim
    │  - Modos Kanban & Lista   │      - Cache Local de Endereços
    │  - Despacho em Lote       │      - Tabela de Faixas de KM
    └─────────────┬─────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌────────────────────────────────┐
│ IMPRESSÃO     │   │ PORTAL DO MOTOBOY (URL Única)  │
│ TÉRMICA       │   │ - Desafio 2FA (PIN 6 dígitos)  │
│ - 58mm / 80mm │   │ - Lista Pessoal de Entregas    │
│ - ESC/POS     │   │ - Status em Tempo Real         │
│ - Guilhotina  │   │ - Chave Pix para Recebimento   │
└───────────────┘   └───────────────┬────────────────┘
                                    │
                                    ▼
                    ┌────────────────────────────────┐
                    │ FECHAMENTO SEMANAL PIX         │
                    │ - Separação Pré vs Pós-saída   │
                    │ - Bônus e Descontos            │
                    │ - Relatório e Liquidação Pix   │
                    └────────────────────────────────┘
```

---

## 🌟 Funcionalidades Chave

### 1. 📋 Balcão Operacional & Fila em Tempo Real
- **Visualização em Lista ou Kanban**: Alternância rápida entre visão unificada ou cards por status (`Pendente`, `Em Trânsito`, `Entregue`).
- **Despacho em Lote (Multi-Drop Batching)**: Agrupamento de até múltiplos pedidos na mesma rota para o mesmo motoboy com um único clique.
- **Alertas Sonoros Integrados**: Notificação sonora imediata na chegada de pedidos (estilo Cardápio Web).
- **Lançamento Manual & Roteamento Instantâneo**: Cálculo em tempo real da distância viária em KM e enquadramento automático na faixa de taxa.

### 2. 🖨️ Impressão Térmica ESC/POS Universal
- **Compatível com todas as impressoras de recibo**: Epson (TM-T20X, TM-T20, TM-T88), Bematech (MP-4200 TH), Elgin (i9, i7), Daruma (DR800), Diebold e mini-impressoras Bluetooth de 58mm.
- **Padrões de Bobina Suportados**:
  - `58 mm (2")`: Mini POS, Bluetooth portátil.
  - `72 / 76 mm`: Bobina estreita ou matricial.
  - `80 mm (3")`: O padrão nacional mais utilizado no mercado de alimentação.
  - `112 mm (4")`: Folha estendida para listas volumosas.
  - `Personalizado`: Largura exata configurada em milímetros (mm).
- **Recursos Gráficos do Cupom**:
  - Dados completos de cliente, endereço, distância e tempo estimado.
  - Discriminação minuciosa de itens, adicionais, pontos de carne e observações.
  - Destaque financeiro (Já Pago Online vs. Cobrar na Entrega com valor e método).
  - Controle de linhas em branco antes do acionamento da guilhotina/corte manual.
  - Botão de **Imprimir Teste de Calibração** com réguas milimétricas.

### 3. 🛵 Portal do Motoboy & Segurança 2FA
- **Link Exclusivo com Token Único** (`/?motoToken=mb_...`): O motoboy acessa apenas sua tela de trabalho sem ter acesso aos dados financeiros do restaurante.
- **Desafio 2FA de 6 Dígitos**:
  - Teclado numérico virtual touch responsivo para celular.
  - Suporte completo a digitação física e botão de limpeza (`C` ou `Backspace`).
  - Bloqueio imediato contra PINs incorretos.
- **Ações Rápidas na Corrida**:
  - Cópia do endereço com 1 toque para colar no Waze/Google Maps.
  - Confirmação de entrega em campo.
  - Cadastro e alteração de chave Pix pessoal (CPF, Telefone, E-mail ou Aleatória).

### 4. ⚙️ Central de Configurações da Loja
- Acessível diretamente pelo botão **Configurações** na barra superior da loja:
  - **Aba Impressora Térmica**: Largura do papel, modelo da impressora, escala tipográfica (Compacta 10px, Padrão 11px, Grande 13px), mensagens de cabeçalho/rodapé e linhas de corte.
  - **Aba APIs & Webhooks**: Integração com **iFood Developer API**, **99Food Partner API**, **Keeta Delivery Gateway**, **WhatsApp API (Evolution/Z-API)** para notificação de saída de motoboy e endpoint público de Webhook para recepção de pedidos.
  - **Aba Dados do Estabelecimento**: Nome fantasia, CNPJ, telefone, endereço da loja física e parâmetros de contingência.

### 5. 💰 Fechamento Semanal & Conciliação Pix
- Agrupamento das entregas por motoboy e semana operacional.
- Regra de negócio transparente para cancelamentos:
  - *Cancelado antes da saída*: A moto não rodou, taxa **R$ 0,00**.
  - *Cancelado após a saída / no local*: Cliente recusou na porta, motoboy recebe taxa integral.
- Inclusão de bônus, vales ou descontos com precisão em centavos (sem erros de dízima flutuante IEEE 754).
- Exportação e conferência das chaves Pix para pagamento via Internet Banking.

---

## 💻 Tecnologias Utilizadas

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend Core** | React 19 + TypeScript | SPA de alta performance com hooks e tipagem estrita |
| **Estilização** | Tailwind CSS v4 | Estilização utility-first, modo Dark/Light e CSS print |
| **Ícones** | Lucide React | Biblioteca moderna de ícones vetoriais |
| **Build & Dev** | Vite 8 + ESBuild | Inicialização instantânea e compilação otimizada |
| **Roteamento Viário** | OSRM + Nominatim | Cálculo viário e geocodificação sem custos de API |
| **Testes E2E** | Playwright Test | Testes automatizados no navegador (Chromium/Headless) |
| **Testes Unitários** | Vitest + JSDOM | Validação de lógica matemática, taxas e estados |

---

## 🚀 Guia Rápido de Instalação

### Pré-requisitos
- **Node.js** v18 ou superior instalado
- Gerenciador de pacotes **npm** ou **yarn** / **pnpm**

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/entregueja-saas.git
   cd entregueja-saas
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no seu navegador:**
   - **Landing Page Institucional:** [http://localhost:3000](http://localhost:3000)
   - **Loja Modelo (Hard Beer Burguer):** [http://localhost:3000/hardbeerburguer](http://localhost:3000/hardbeerburguer)
   - **Sandbox de Demonstração:** [http://localhost:3000/demo](http://localhost:3000/demo)
   - **Portal do Motoboy (Carlão):** [http://localhost:3000/?motoToken=mb_carlao_vilaguilhermina](http://localhost:3000/?motoToken=mb_carlao_vilaguilhermina)

---

## 🧪 Suíte de Testes Automatizados

O projeto conta com uma suíte de testes de nível empresarial para garantir estabilidade contínua e auto-recuperação (Self-Healing).

### 1. Testes Unitários de Lógica (Vitest)
Testa funções matemáticas de cálculo de taxas, KM excedente, fallback de contingência e soma de fechamento semanal com precisão em centavos:
```bash
npm run test:unit
# ou: npx vitest run
```

### 2. Testes de Integração e E2E (Playwright)
Executa cenários no navegador Chromium real:
- Carregamento de rotas dinâmicas multi-tenant (`/[tenantSlug]`) e garantia de isolamento.
- Desafio 2FA do motoboy: digitação de PIN incorreto (bloqueio) e PIN correto (desbloqueio).
```bash
# Instalar os navegadores do Playwright (apenas na 1ª execução)
npx playwright install chromium

# Executar os testes E2E em modo headless
npm run test:e2e
# ou: npx playwright test

# Executar com interface gráfica interativa do Playwright
npm run test:e2e:ui
```

---

## 📁 Estrutura de Diretórios

```
├── .aistudio/                  # Metadados e planos de arquitetura
├── src/
│   ├── components/
│   │   ├── BalcaoView.tsx             # Fila operacional e despacho de pedidos
│   │   ├── Header.tsx                 # Barra superior com marca, tema e configurações
│   │   ├── SettingsModal.tsx          # Central unificada: Impressora, APIs e Loja
│   │   ├── ThermalReceiptModal.tsx    # Modal e motor de impressão térmica ESC/POS
│   │   ├── MotoboyPortalView.tsx      # Portal exclusivo do motoboy com 2FA
│   │   ├── FechamentoSemanalModal.tsx # Conciliação semanal e acerto Pix
│   │   ├── TabelaTaxasModal.tsx       # Configuração de faixas de KM
│   │   ├── WebhookSimulatorModal.tsx  # Simulador de pedidos iFood/99/Keeta
│   │   ├── LoginGateModal.tsx         # Portão de PIN (Balcão vs Admin)
│   │   └── LandingPage.tsx            # Página institucional de apresentação
│   ├── services/
│   │   ├── feeCalculator.ts           # Cálculo de taxas de entrega e faixas de KM
│   │   ├── osrm.ts                    # Roteamento viário sem custos
│   │   ├── nominatim.ts               # Geocodificação OpenStreetMap
│   │   ├── storage.ts                 # Armazenamento e persistência isolada por tenant
│   │   ├── testDataPool.ts            # Gerador de pedidos realistas de teste
│   │   └── soundEffects.ts            # Alertas sonoros sintetizados
│   ├── types/
│   │   └── index.ts                   # Interfaces TypeScript unificadas
│   ├── App.tsx                        # Roteador dinâmico multi-tenant
│   ├── main.tsx                       # Ponto de entrada React
│   └── index.css                      # Tailwind CSS v4 e regras globais
├── tests/
│   ├── e2e/
│   │   ├── multi-tenant.spec.ts       # Teste E2E de isolamento e rotas
│   │   └── motoboy-auth.spec.ts       # Teste E2E do 2FA do motoboy
│   └── unit/
│       ├── feeCalculator.test.ts      # Testes de cálculo de frete
│       └── settlement.test.ts         # Testes de fechamento de caixa
├── playwright.config.ts               # Configuração do Playwright
├── vitest.config.ts                   # Configuração do Vitest
├── package.json                       # Scripts e dependências
└── README.md                          # Documentação oficial do projeto
```

---

## 🔒 Segurança e Privacidade

- **Segregação de Perfis**: O operador do balcão possui acesso focado à expedição, enquanto configurações fiscais, APIs e fechamentos financeiros exigem autenticação do gestor.
- **Tokens Invioláveis para Motoboys**: Os links de entrega usam tokens alfanuméricos com verificação criptográfica local e exigência obrigatória de PIN 2FA.
- **Privacidade de Dados**: Chaves de API e segredos de Webhooks são armazenados em escopo seguro sem vazamento entre lojas diferentes.

---

## 📄 Licença

Este projeto é distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para obter mais informações.

---

<div align="center">
Desenvolvido com foco em alta produtividade, estabilidade operacional e custo zero de infraestrutura de mapas para o mercado de delivery brasileiro.
</div>
