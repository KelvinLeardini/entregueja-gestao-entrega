# Higienização de URL e Rolagem Suave na Landing Page

Eliminar o fragmento residual `/#solucao` na página principal e garantir que a página sempre carregue limpa no topo (`/`), mantendo a navegação da Landing Page fluida e com rolagem suave (*smooth scroll*), sem alterar nem poluir a barra de endereços do navegador.

---

## Decisões Confirmadas com o Usuário

> [!IMPORTANT]
> - **Limpeza Automática da URL**: Na inicialização da página inicial (`LandingPage`), se houver qualquer hash na URL (como `/#solucao`), ele será automaticamente removido via `window.history.replaceState` sem recarregar a página, garantindo que o usuário veja a URL limpa `/` e a página abra sempre no topo (Hero banner).
> - **Rolagem Suave sem Alterar o Endereço**: Os botões do menu superior e do rodapé (Solução, Como Funciona, Simulador ROI, Planos e Dúvidas) continuarão executando `scrollIntoView({ behavior: 'smooth' })`, porém sem adicionar tags hash à URL no navegador.

---

## 1. Visão Geral e Conceito

### Causa Raiz do `/#solucao`
- A seção de benefícios da Landing Page possui o atributo `id="solucao"`.
- Quando um link com âncora era acionado ou uma URL continha `#solucao`, o navegador preservava essa âncora no histórico e, ao atualizar a página, rolava automaticamente para o meio da tela na seção de dores em vez de exibir a manchete principal.

### Solução Proposta
1. **Higienização de Inicialização**: Um `useEffect` no carregamento da página raiz detecta a presença de qualquer âncora (`window.location.hash`) e a limpa com `window.history.replaceState(null, '', window.location.pathname + window.location.search)`, reposicionando suavemente o scroll no topo se o acesso foi direto à raiz.
2. **Garantia de Rolagem Neutra nos Botões**: As funções de rolagem (`handleScrollToSection`) continuam guiando o visitante suavemente até as seções desejadas sem injetar tags `#` na barra de endereços.

---

## 2. Diagrama de Fluxo de Navegação

```
        Visitante acessa a Landing Page (com ou sem hash residual)
                                  │
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │  Detecta se existe hash na URL (ex: /#solucao)         │
      ├────────────────────────────────────────────────────────┤
      │ • window.history.replaceState() limpa para "/"         │
      │ • window.scrollTo({ top: 0, behavior: 'instant' })     │
      └────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                Exibe Hero Section no topo da tela
                                  │
                                  ▼
            Visitante clica em item do menu (ex: "Solução")
                                  │
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │  Executa scrollIntoView({ behavior: 'smooth' })        │
      │  URL PERMANECE LIMPA COMO "/" (sem injetar #)          │
      └────────────────────────────────────────────────────────┘
```

---

## 3. Especificação das Modificações Técnicas

### 3.1. `src/components/LandingPage.tsx`
- Adicionar hook `useEffect` na montagem da `LandingPage`:
  - Se `window.location.hash` existir, limpa com `window.history.replaceState(null, '', window.location.pathname + window.location.search)`.
  - Garante que a página inicie na coordenada `top: 0` para uma primeira impressão limpa e com a Hero Section visível.
- Manter `handleScrollToSection` chamando estritamente `element.scrollIntoView({ behavior: 'smooth' })` sem mutação da barra de endereços.

### 3.2. `src/App.tsx`
- Assegurar que `navigateTo('/')` zere qualquer fragmento no histórico, mantendo a navegação entre a demonstração/lojas e a página inicial perfeitamente limpa.

---

## 4. Plano de Validação e Verificação

1. **Teste de Acesso com Hash**:
   - Simular acesso à URL `http://localhost:3000/#solucao`.
   - Verificar se a barra de endereços é sanitizada para `http://localhost:3000/` e a visualização abre no topo da página.
2. **Teste de Rolagem do Menu**:
   - Clicar nos botões do menu ("Solução", "Como Funciona", "Simulador ROI", "Planos", "Dúvidas").
   - Verificar que a rolagem suave acontece perfeitamente e a URL permanece `/` sem adicionar `#`.
3. **Validação de Compilação**:
   - Executar `lint_applet` e `compile_applet`.
