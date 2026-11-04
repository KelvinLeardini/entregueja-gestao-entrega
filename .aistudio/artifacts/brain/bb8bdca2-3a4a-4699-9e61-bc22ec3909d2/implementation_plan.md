# EntregueJá · Fase 1: Modelo de Dados e Autenticação

Implementação da camada central de dados relacionais e segurança do EntregueJá, estabelecendo o schema PostgreSQL no Prisma com valores em centavos, autenticação de lojistas via Auth.js (NextAuth v5), isolamento estrito entre lojas com resposta 404 e portal do motoboy seguro por link com hash SHA-256 e PIN de 6 dígitos assinado com jose.

---

### Decisões Confirmadas & Portões de Revisão

> [!IMPORTANT]
> **Decisões arquiteturais alinhadas com o usuário**:
> - **Biblioteca de Hashing**: `bcryptjs` para hashes de senha (`passwordHash`) e PIN (`pinHash`), garantindo máxima compatibilidade sem depender de compilação C++ nativa no runtime.
> - **Autenticação de Lojistas e Operadores**: NextAuth v5 (Auth.js) utilizando Credentials Provider com tokens JWT em cookies `httpOnly`, `sameSite: "lax"` e `secure` em produção.
> - **Isolamento Multi-Tenant**: O slug na URL (`/[slug]`) localiza a loja, mas toda autorização é ancorada no `storeId` da sessão autenticada. Acessos cruzados retornam HTTP 404 para evitar enumeração de estabelecimentos.
> - **Acesso do Motoboy**: Rota `/motoboy/[token]` onde `token` é verificado via SHA-256 (`tokenHash`), seguido por desafio de PIN de 6 dígitos (`pinHash`). Após 5 erros, bloqueio de 15 minutos registrado no banco. Sucesso emite cookie `httpOnly` assinado via `jose` com validade de 12 horas, atrelado a `courierId` e `sessionVersion`.

---

## 1. Visão Geral & Escopo

A Fase 1 estabelece a fundação de segurança e dados do EntregueJá. O sistema elimina qualquer suposição em memória e passa a persistir e autorizar todas as operações com base no PostgreSQL:
- **Lojista/Operador**: Gerencia balcão, entregas, taxas e motoboys sob sua loja exclusiva.
- **Motoboy**: Acessa suas corridas em `/motoboy/[token]` sem credenciais visíveis na URL, conferindo valores e status após autenticação por PIN.
- **Auditoria**: Registro imutável de eventos (`AuditEvent`) para ações sensíveis de usuários, motoboys e webhooks.

---

## 2. Experiência do Usuário & Telas

### A. Fluxos de Interface
1. **Login do Lojista (`/login`)**:
   - Formulário limpo com e-mail e senha.
   - Mensagem de erro neutra: `"E-mail ou senha incorretos."` (sem revelar se o e-mail existe no sistema).
   - Bloqueio temporário após 5 tentativas incorretas.
   - Redirecionamento automático para `/[slug]` correspondente à loja do usuário.

2. **Portal Seguro do Motoboy (`/motoboy/[token]`)**:
   - Tela de desafio numérico para digitação do PIN de 6 dígitos.
   - Feedback de tentativas restantes (`"PIN incorreto. Tentativa 2 de 5"`).
   - Ao atingir 5 falhas, bloqueio exibindo contador regressivo de 15 minutos baseado em `pinLockedUntil`.
   - Ao autenticar com sucesso, cookie `moto_session` emitido e redirecionamento para o dashboard de entregas do motoboy.

3. **Geração e Redefinição de Link do Motoboy**:
   - No painel da loja, o lojista gera um novo link. Um token aleatório criptográfico de 32 bytes é gerado, e a tela exibe o link completo uma única vez.
   - O banco salva exclusivamente `SHA256(token)`.
   - Redefinição de PIN pelo lojista salva apenas o novo `bcrypt.hash(pin)`.

---

## 3. Decisões de Produto & Arquitetura de Dados

### A. Tipagem Financeira e Distância
- **Valores Monetários**: Sempre `Int` em centavos (`feeAmountCents`, `totalCents`, `feeCents`) para evitar erros de ponto flutuante em operações contábeis.
- **Distância**: `Decimal(6, 2)` para quilômetros (`distanceKm`, `minKm`, `maxKm`), permitindo precisão decimal exata.

### B. Segregação e Proteção contra Enumeração
- Todas as rotas autenticadas validam se o `storeId` da sessão coincide com o `id` da loja vinculada ao `slug` da rota.
- Se houver divergência, a resposta é `404 Not Found`.

---

## 4. Arquitetura Técnica & Modelo de Dados

### A. Diagrama de Arquitetura e Fluxo de Autenticação

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Navegador / Cliente                             │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │                                          │
   Cookie NextAuth (Lojista)                   Cookie jose (Motoboy)
   [authjs.session-token]                      [moto_session]
               │                                          │
               ▼                                          ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  Next.js Middleware & Auth.js        │  │  /motoboy/[token] Rota       │
│  - Valida JWT da sessão              │  │  - Valida SHA256(token)      │
│  - Checa storeId vs /[slug]          │  │  - Valida PIN (bcrypt)       │
│  - Incompatível? Retorna 404         │  │  - Checa sessionVersion      │
└──────────────┬───────────────────────┘  └──────────────┬───────────────┘
               │                                         │
               ▼                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Prisma ORM (PostgreSQL)                         │
│  Store · User · Courier · Delivery · RateRule · Settlement · Audit     │
└────────────────────────────────────────────────────────────────────────┘
```

### B. Modelos Prisma (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  OWNER
  OPERATOR
}

enum DeliverySource {
  MANUAL
  IFOOD
  NINETY_NINE_FOOD
  KEETA
  WHATSAPP
}

enum DeliveryStatus {
  PENDING
  PREPARING
  ASSIGNED
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
}

enum CancellationType {
  BEFORE_DEPARTURE
  ON_SITE
}

enum SettlementStatus {
  OPEN
  PAID
}

enum ActorType {
  USER
  COURIER
  SYSTEM
}

model Store {
  id            String          @id @default(uuid())
  slug          String          @unique
  name          String
  cnpj          String?
  phone         String
  originAddress String
  originLat     Float?
  originLng     Float?

  users         User[]
  couriers      Courier[]
  deliveries    Delivery[]
  rateRules     RateRule[]
  settlements   Settlement[]
  webhookConfigs WebhookConfig[]
  auditEvents   AuditEvent[]

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([slug])
}

model User {
  id                 String    @id @default(uuid())
  storeId            String
  store              Store     @relation(fields: [storeId], references: [id], onDelete: Cascade)
  email              String    @unique
  passwordHash       String
  role               UserRole  @default(OPERATOR)
  active             Boolean   @default(true)
  failedLoginAttempts Int      @default(0)
  lockedUntil        DateTime?

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@index([storeId])
}

model Courier {
  id                String       @id @default(uuid())
  storeId           String
  store             Store        @relation(fields: [storeId], references: [id], onDelete: Cascade)
  name              String
  phone             String
  vehiclePlate      String?
  vehicleModel      String?
  pixKeyType        String       @default("PHONE")
  pixKey            String
  active            Boolean      @default(true)
  tokenHash         String       @unique
  pinHash           String
  pinFailedAttempts Int          @default(0)
  pinLockedUntil    DateTime?
  sessionVersion    Int          @default(1)

  deliveries        Delivery[]
  settlements       Settlement[]

  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  @@index([storeId])
  @@index([tokenHash])
}

model Delivery {
  id               String            @id @default(uuid())
  storeId          String
  store            Store             @relation(fields: [storeId], references: [id], onDelete: Cascade)
  courierId        String?
  courier          Courier?          @relation(fields: [courierId], references: [id], onDelete: SetNull)
  source           DeliverySource    @default(MANUAL)
  externalId       String?
  orderNumber      String
  customerName     String
  customerPhone    String?
  street           String
  number           String
  neighborhood     String
  city             String
  state            String
  distanceKm       Decimal           @db.Decimal(6, 2)
  feeAmountCents   Int               @default(0)
  status           DeliveryStatus    @default(PENDING)
  isFeePayable     Boolean           @default(false)
  deliveredAt      DateTime?
  cancelledAt      DateTime?
  cancellationType CancellationType?

  settlementId     String?
  settlement       Settlement?       @relation(fields: [settlementId], references: [id], onDelete: SetNull)

  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  @@unique([storeId, source, externalId])
  @@index([storeId])
  @@index([courierId])
  @@index([createdAt])
  @@index([status])
}

model RateRule {
  id         String   @id @default(uuid())
  storeId    String
  store      Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  minKm      Decimal  @db.Decimal(6, 2)
  maxKm      Decimal  @db.Decimal(6, 2)
  feeCents   Int
  orderIndex Int      @default(1)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([storeId])
}

model Settlement {
  id         String           @id @default(uuid())
  storeId    String
  store      Store            @relation(fields: [storeId], references: [id], onDelete: Cascade)
  courierId  String
  courier    Courier          @relation(fields: [courierId], references: [id], onDelete: Cascade)
  weekStart  DateTime
  weekEnd    DateTime
  totalCents Int              @default(0)
  status     SettlementStatus @default(OPEN)
  paidAt     DateTime?

  deliveries Delivery[]

  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt

  @@unique([courierId, weekStart])
  @@index([storeId])
}

model WebhookConfig {
  id               String   @id @default(uuid())
  storeId          String
  store            Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  provider         String
  secretCiphertext String
  active           Boolean  @default(true)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([storeId])
}

model AuditEvent {
  id         String    @id @default(uuid())
  storeId    String
  store      Store     @relation(fields: [storeId], references: [id], onDelete: Cascade)
  actorType  ActorType
  actorId    String
  action     String
  entityType String
  entityId   String
  metadata   Json?

  createdAt  DateTime  @default(now())

  @@index([storeId])
  @@index([createdAt])
}
```

---

## 5. Suíte de Testes Automatizados (Fase 1)

Os testes serão implementados em `tests/unit/auth-isolation.test.ts` e `tests/unit/courier-access.test.ts`:
1. **Isolamento de Lojas**: Usuário com sessão da Loja A tentando acessar dados da Loja B recebe `404 Not Found`.
2. **Motoboy Desativado**: Sessão com `active: false` é rejeitada imediatamente com `401 Unauthorized`.
3. **Invalidação por sessionVersion**: Quando o token é regenerado ou o motoboy é desativado, `sessionVersion` é incrementada e o cookie anterior é recusado.
4. **Bloqueio de PIN (Rate Limiting no Banco)**: 5 tentativas incorretas resultam em bloqueio por 15 minutos persistido no campo `pinLockedUntil`.
5. **Higienização de Respostas**: Nenhuma resposta pública ou autenticada expõe `tokenHash`, `pinHash` ou `pinFailedAttempts`.

---

## 6. Plano de Execução Passo a Passo

1. Atualizar `prisma/schema.prisma` com os modelos estritos e rodar `npx prisma generate`.
2. Implementar utilitários criptográficos (`src/lib/crypto.ts`):
   - Hashing e comparação de senhas e PINs via `bcryptjs`.
   - Hashing SHA-256 para tokens de link.
   - Criptografia simétrica AES-256-GCM para webhooks com `WEBHOOK_ENCRYPTION_KEY`.
   - Assinatura e verificação de JWT do motoboy via `jose`.
3. Configurar Auth.js (NextAuth v5) com Credentials Provider em `src/lib/auth.ts` e `app/api/auth/[...nextauth]/route.ts`.
4. Implementar rotas do motoboy:
   - `app/motoboy/[token]/page.tsx` (desafio de PIN numérico com design limpo sem pills).
   - `app/api/motoboy/verify-pin/route.ts` (validação com bloqueio após 5 falhas e emissão do cookie assinado).
5. Configurar `middleware.ts` para proteção multi-tenant com resposta 404 em caso de incompatibilidade de loja.
6. Atualizar `prisma/seed.ts` com loja demo (`hardbeerburguer`), lojista e motoboy com credenciais exibidas apenas no console do seed.
7. Implementar e executar todos os testes da Fase 1 (`npm test`), seguidos por `npm run lint` e `npm run build`.
