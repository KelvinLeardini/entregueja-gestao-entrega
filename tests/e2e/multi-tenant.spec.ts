import { test, expect } from '@playwright/test';

test.describe('Cenário 1: Roteamento Multi-Tenant e Isolamento de Lojas', () => {
  test('Deve carregar corretamente o tenant /hardbeerburguer com identidade da loja', async ({ page }) => {
    // 1. Navega para a rota dinâmica do tenant hardbeerburguer
    await page.goto('/hardbeerburguer');

    // 2. Aguarda a renderização do header com o nome da loja
    const storeTitle = page.locator('header').getByText('Hard Beer Burguer', { exact: false });
    await expect(storeTitle).toBeVisible({ timeout: 10000 });

    // 3. Verifica se o slug correto aparece no header
    const slugBadge = page.locator('header').getByText('/hardbeerburguer', { exact: false });
    await expect(slugBadge).toBeVisible();

    // 4. Valida se a fila de pedidos do balcão foi carregada
    const balcaoHeading = page.getByRole('heading', { name: /Fila de Entregas|Fila Geral/i }).or(
      page.getByText('Balcão & Fila Geral')
    );
    await expect(balcaoHeading.first()).toBeVisible();
  });

  test('Deve garantir isolamento de dados ao alternar entre /hardbeerburguer e /demo', async ({ page }) => {
    // 1. Acessa a primeira loja
    await page.goto('/hardbeerburguer');
    await expect(page.locator('header')).toContainText('Hard Beer Burguer');

    // 2. Navega para o ambiente de demonstração /demo
    await page.goto('/demo');

    // 3. Valida que a loja de demonstração foi carregada
    await expect(page.locator('header')).toContainText('Loja Demonstração');

    // 4. Garante que os dados da Hard Beer Burguer não vazaram na loja demo
    await expect(page.locator('header')).not.toContainText('/hardbeerburguer');
  });

  test('Deve redirecionar para a Landing Page institucional quando acessar a rota raiz /', async ({ page }) => {
    await page.goto('/');

    // Valida elementos característicos da Landing Page de apresentação do SaaS
    const ctaButton = page.getByRole('button', { name: /Experimentar Demonstração|Testar Agora/i }).or(
      page.getByText('EntregueJá')
    );
    await expect(ctaButton.first()).toBeVisible();
  });
});
