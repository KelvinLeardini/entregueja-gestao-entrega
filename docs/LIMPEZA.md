# 📋 Relatório de Limpeza e Migração · Fase 0 (EntregueJá)

Este documento registra todas as remoções, manutenções, alterações e decisões técnicas tomadas na **Fase 0 · Limpeza e remoção do Google AI Studio** do projeto **EntregueJá**.

---

## 1. O que foi removido e por quê

| Item / Arquivo | Motivo da Remoção |
| :--- | :--- |
| `server.ts` e `server.js` | Remoção do servidor Express e do Vite como servidor de desenvolvimento. A stack agora é exclusivamente Next.js App Router. |
| `metadata.json` | Continha referências ao Google AI Studio, permissões e capacidades do Gemini API que não fazem parte do produto. |
| Pasta `.aistudio/` | Metadados e artefatos de prototipação do AI Studio, completamente desnecessários em um projeto desacoplado. |
| Dependência `@google/genai` | O produto não utiliza modelos de inteligência artificial generativa. |
| `data/` e `data/db.json` | Persistência em arquivos JSON banida pelas regras arquiteturais. O armazenamento oficial é relacional (PostgreSQL + Prisma). |
| `app/api/dev/` e `app/dev-admin/` | Rotas de suporte dev/admin expostas que misturavam o fluxo multi-tenant com painéis internos de depuração. |
| `DevAdminView.tsx`, `DevSandboxView.tsx`, `DevAdminAsaasConfigModal.tsx` | Componentes utilizados exclusivamente pelo painel dev admin removido. |
| `ScopeDocumentationView.tsx` | Documentação interna de escopo exposta na interface do usuário. |
| `src/services/testDataPool.ts` | Gerador legado de dados aleatórios em memória. Sua lógica foi transferida para `prisma/seed.ts` para dados de desenvolvimento. |
| `index.html`, `src/App.tsx`, `src/main.tsx` | Pontos de entrada obsoletos da SPA Vite, substituídos pela infraestrutura do Next.js App Router (`app/layout.tsx` e `app/page.tsx`). |
| `vite.config.ts` | Configurações do Vite descontinuadas em favor do Next.js. O Vitest mantém configuração isolada em `vitest.config.ts`. |
| Landing page simplificada em `app/page.tsx` | Substituída pela versão definitiva e completa em `src/components/LandingPage.tsx` com calculadora de ROI e planos de assinatura. |
| Referência a `LICENSE` no README | O arquivo físico de licença não existia no repositório. |
| Alegações falsas / infladas | Remoção de promessas de "2FA biométrico" (o sistema usa PIN de 6 dígitos), "isolamento estrito" (ainda a auditar na Fase 1), "custo zero de API" (ajustado para esclarecer os limites do OSRM/Nominatim), "nível empresarial", "auto-recuperação/self-healing" e "compatível com todas as impressoras". |

---

## 2. O que foi mantido

| Arquivo / Módulo | Finalidade / Justificativa |
| :--- | :--- |
| `src/services/feeCalculator.ts` | Lógica matemática pura de cálculo de frete por faixas de KM, KM excedente e valores de contingência. |
| `src/services/osrm.ts` | Cliente HTTP de roteamento viário com tolerância a falhas e cálculo de tempo/distância. |
| `src/services/nominatim.ts` | Geocodificação OpenStreetMap com formatação normalizada de consultas de endereço. |
| `src/services/pix.ts` | Geração de payload Pix e validação de chaves. |
| `src/services/soundEffects.ts` | Síntese de áudio via Web Audio API para alertas sonoros operacionais no balcão de pedidos. |
| `src/components/ThermalReceiptModal.tsx` | Modal de diagramação e impressão térmica ESC/POS (58mm, 80mm). |
| `src/components/BalcaoView.tsx` | Painel operacional principal (fila de pedidos, visualização em lista/kanban e despacho). |
| `src/components/MotoboyPortalView.tsx` | Tela do entregador acessível via URL única e autenticação por PIN numérico. |
| `src/components/FechamentoSemanalModal.tsx` | Fechamento semanal consolidado com separação clara de cancelamentos (pré-saída R$ 0 vs pós-saída taxa integral). |
| `src/components/TabelaTaxasModal.tsx` | Modal de configuração de faixas quilométricas e valores por KM. |
| `src/components/SettingsModal.tsx` | Configurações do estabelecimento (endereço base, dados da loja e impressora). |
| `src/components/LandingPage.tsx` | Landing page principal com simulador de economia, detalhamento dos planos Asaas e FAQ. |
| `tests/unit/feeCalculator.test.ts` e `settlement.test.ts` | Suíte de testes unitários automatizados com Vitest (8 testes passando com 100% de sucesso). |
| `tests/fixtures/` | Local para onde foram movidos `WebhookSimulatorModal.tsx` e `ClientDemoPlayground.tsx` para uso em testes. |

---

## 3. O que foi alterado

1. **`package.json`**:
   - Nome padronizado para `"name": "entregueja"`, versão `1.0.0`.
   - Scripts Next.js: `"dev": "next dev -p 3000"`, `"build": "next build"`, `"start": "next start -p 3000"`, `"lint": "tsc --noEmit"`, `"test": "vitest run"`.
   - Adicionadas dependências obrigatórias: `next@15.3.9`, `zod`, `jose`, `@prisma/client`, `prisma`, `tailwindcss v4`, `@tailwindcss/postcss`.
2. **`.gitignore`**:
   - Ajustado com: `node_modules`, `.next`, `dist`, `.env`, `.env.*`, `data/`, `playwright-report`, `test-results`, `coverage`, `*.log`.
3. **`.env.example`**:
   - Contém exclusivamente as variáveis requeridas sem segredos reais: `DATABASE_URL`, `AUTH_SECRET`, `SESSION_SECRET`, `WEBHOOK_ENCRYPTION_KEY`, `OSRM_BASE_URL`, `NOMINATIM_USER_AGENT`.
4. **`app/layout.tsx`**:
   - Configurado com `lang="pt-BR"`, metadados corretos de OpenGraph e título "EntregueJá".
5. **`app/page.tsx`**:
   - Conectado diretamente à `LandingPage.tsx` institucional com modo cliente e navegação Next.js.
6. **`app/[tenantSlug]/page.tsx` e `app/api/webhooks/[tenantSlug]/route.ts`**:
   - Parâmetros assíncronos (`params: Promise<{ tenantSlug: string }>`) conforme especificação do Next.js 15 e `export const dynamic = 'force-dynamic'`.
7. **`README.md`**:
   - Reescrito sem termos sensacionalistas e com documentação transparente das limitações do servidor público de demonstração do OSRM e da política de 1 requisição/segundo com User-Agent do Nominatim.
8. **`prisma/seed.ts`**:
   - Criado para semear dados de teste para desenvolvimento inicial.

---

## 4. Decisões que ficaram para o Usuário

1. **String de Conexão com o PostgreSQL (`DATABASE_URL`)**:
   - Para rodar as migrações (`npx prisma migrate dev`), é necessário apontar uma base de dados PostgreSQL válida no `.env`.
2. **Servidor OSRM de Produção**:
   - O servidor público `router.project-osrm.org` funciona apenas para prototipagem e desenvolvimento. Para produção, é recomendado configurar uma instância privada (Docker OSRM) e informar a URL na variável `OSRM_BASE_URL`.
3. **Segredos Criptográficos de Sessão e Webhooks**:
   - Gerar chaves aleatórias seguras (ex: via `openssl rand -base64 32`) para preencher `AUTH_SECRET`, `SESSION_SECRET` e `WEBHOOK_ENCRYPTION_KEY` antes de colocar em produção.

---

## 5. Erros de tipo e pendências do banco

- **TypeScript (`npm run lint` / `tsc --noEmit`)**: **0 erros** (Compilação estrita aprovada com sucesso).
- **Testes Unitários (`npm test`)**: **8 testes aprovados** (100% de cobertura nos cálculos de taxa e fechamento).
- **Status do Prisma**: O Prisma Client (`@prisma/client`) foi gerado com sucesso a partir de `prisma/schema.prisma`. As consultas no App Router (`app/[tenantSlug]`) estão protegidas com fallback gracioso em tempo de desenvolvimento até que a base de dados em `DATABASE_URL` receba a migração de tabelas.
