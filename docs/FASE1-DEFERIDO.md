# Fase 1: pendências deferidas

## Confirmado
- Login do dono funciona (AUTH_URL configurado).
- Redirecionamento para /hardbeerburguer funciona.
- storeSlug presente em /api/auth/session.
- npm run build concluiu.
- middleware.ts lista configuracoes, taxas, fechamento e webhooks como OWNER-only.

## Pendente (não verificado)
- Teste automatizado do middleware: OPERATOR recebe 404 nas rotas OWNER-only; OWNER passa.
- Páginas /taxas, /fechamento e /configuracoes ainda não existem (Fase 3).
- Teste 8 do navegador: fetch('/api/motoboy/deliveries') sem cookie retorna 401.
- Três SELECT de conferência no Supabase.
- RLS ativado nas tabelas do Supabase.
- Nomes das variáveis no .env (sem valores).
- Warnings de deflate.js no build (não confirmados como ausentes).
- Mensagem "Conta bloqueada temporariamente" revela existência do e-mail; trocar pela genérica.
- Senha de demo no repositório (prisma/seed.ts); trocar antes de uso externo.
- Componentes antigos já removidos; confirmar que o build não os referencia.