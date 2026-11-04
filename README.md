# 🛵 EntregueJá · Gestão de Delivery & Logística Multi-Tenant

<div align="center">

**Sistema de balcão de pedidos, despacho para motoboys, roteamento viário, impressão térmica ESC/POS, portal do motoboy e acerto semanal via Pix para hamburguerias, pizzarias e farmácias.**

</div>

---

## 📌 Visão Geral do Produto

O **EntregueJá** é uma aplicação web para gestão operacional e logística de entregas locais desenvolvida para atender as necessidades do balcão de delivery:

1. **Roteamento Viário com OSRM**: Integração com a malha viária real via OSRM (Open Source Routing Machine) com endpoint configurável (`OSRM_BASE_URL`), geocodificação via Nominatim OpenStreetMap e cache local de coordenadas.
2. **Arquitetura Multi-Tenant**: Atendimento a diferentes lojas e operações (`/[tenantSlug]`, ex: `/hardbeerburguer`, `/phyto-formula`), com segregação de dados por identificador de loja.
3. **Impressão Térmica ESC/POS**: Suporte aos padrões de bobinas térmicas mais comuns no mercado nacional (**58mm** e **80mm**) e larguras personalizadas em mm, com controle de corte/alimentação.
4. **Portal do Motoboy com Acesso por PIN**: Acesso dedicado via link com token e validação por código numérico PIN de 6 dígitos em teclado virtual ou numérico.
5. **Fechamento Semanal de Taxas com Pix**: Consolidação de repasses para motoboys com regras claras de cancelamento:
   - *Cancelado antes da saída*: entrega cancelada antes do deslocamento tem taxa **R$ 0,00**.
   - *Cancelado no local*: se o motoboy se deslocou até o cliente e a entrega foi cancelada na porta, a taxa é paga integralmente ao motoboy.

---

## 🗺️ Infraestrutura de Mapas & Limitações

### OSRM (Roteamento Viário)
- O sistema utiliza a variável `OSRM_BASE_URL` para realizar consultas de rotas viárias e distância em quilômetros.
- **Importante:** O servidor de demonstração público do projeto OSRM (`router.project-osrm.org`) é destinado apenas a testes e protótipos de desenvolvimento. Ele possui limitação de vazão, não oferece SLA e não deve ser utilizado em ambientes de produção com alto volume de requisições. Para produção, configure uma instância dedicada de OSRM apontada na variável `OSRM_BASE_URL`.

### Nominatim (Geocodificação OpenStreetMap)
- Consultas de endereços para coordenadas geográficas utilizam o serviço Nominatim.
- **Requisitos de uso:**
  - O cabeçalho `User-Agent` com identificação válida do aplicativo é obrigatório (configurado via `NOMINATIM_USER_AGENT`).
  - A política de uso restringe o tráfego a no máximo **1 requisição por segundo**.
  - O sistema implementa cache local de endereços previamente consultados para evitar chamadas redundantes e respeitar os limites operacionais.

---

## 🏗️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Framework Full-Stack** | Next.js (App Router) + TypeScript | Arquitetura moderna com rotas de servidor e cliente |
| **Banco de Dados & ORM** | PostgreSQL + Prisma ORM | Modelagem relacional e tipagem de dados |
| **Autenticação** | Auth.js (NextAuth v5) & jose | Credenciais para lojistas/operadores e sessões assinadas para motoboys |
| **Validação** | Zod | Validação de esquemas e entradas de API |
| **Estilização** | Tailwind CSS v4 + Lucide React | Estilização utility-first com suporte a modo claro/escuro |
| **Testes Unitários** | Vitest | Testes automatizados de lógica matemática de taxas e fechamentos |
| **Testes E2E** | Playwright | Testes automatizados de fluxos e interface |

---

## 🚀 Instalação e Execução

### Pré-requisitos
- **Node.js** v20 ou superior
- Instância PostgreSQL disponível

### Configuração de Ambiente

1. Clone o repositório e acesse a pasta:
   ```bash
   git clone https://github.com/seu-usuario/entregueja.git
   cd entregueja
   ```

2. Crie seu arquivo de variáveis de ambiente a partir do exemplo:
   ```bash
   cp .env.example .env
   ```

3. Configure os valores no `.env`:
   - `DATABASE_URL`: String de conexão PostgreSQL.
   - `AUTH_SECRET`: Segredo de autenticação Auth.js.
   - `SESSION_SECRET`: Chave secreta para tokens jose.
   - `WEBHOOK_ENCRYPTION_KEY`: Chave de criptografia de webhooks.
   - `OSRM_BASE_URL`: URL do serviço OSRM (padrão: `https://router.project-osrm.org`).
   - `NOMINATIM_USER_AGENT`: Identificador User-Agent para requisições de mapas.

4. Instale as dependências:
   ```bash
   npm install
   ```

5. Inicialize o Prisma Client:
   ```bash
   npx prisma generate
   ```

6. Inicie o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000).

---

## 🧪 Suíte de Testes

### Testes Unitários (Vitest)
Executa a validação de regras de negócio, cálculo de taxas de entrega por KM, excedentes e conciliação semanal:
```bash
npm test
# ou: npm run test:unit
```

---

## 📁 Estrutura do Projeto

```
├── app/                        # Next.js App Router (páginas, layouts e APIs)
│   ├── [tenantSlug]/           # Rota dinâmica por loja (multi-tenant)
│   ├── api/                    # Endpoints de API e Webhooks
│   ├── globals.css             # Estilos globais
│   ├── layout.tsx              # Layout raiz pt-BR
│   └── page.tsx                # Landing page principal
├── prisma/
│   ├── schema.prisma           # Esquema do banco de dados relacional
│   └── seed.ts                 # Script de dados de desenvolvimento
├── src/
│   ├── components/             # Componentes de interface (Balcão, Modais, Portal)
│   ├── lib/                    # Utilitários e clientes (Prisma)
│   ├── services/               # Lógica de cálculo, mapas (OSRM/Nominatim) e Pix
│   └── types/                  # Tipos TypeScript do domínio
├── tests/
│   └── unit/                   # Testes unitários com Vitest
├── vitest.config.ts            # Configuração do Vitest
├── tsconfig.json               # Configuração do compilador TypeScript
└── package.json                # Scripts e dependências
```
