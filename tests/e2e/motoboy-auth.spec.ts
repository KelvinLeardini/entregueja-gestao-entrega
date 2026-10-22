import { test, expect } from '@playwright/test';

test.describe('Cenário 2: Autenticação do Motoboy via Token e PIN de 6 Dígitos (2FA)', () => {
  const MOTOBOY_TOKEN = 'mb_carlao_vilaguilhermina';
  const VALID_PIN = '784129';
  const INVALID_PIN = '000000';

  test('Deve bloquear acesso e exibir erro ao informar PIN de 6 dígitos inválido', async ({ page }) => {
    // 1. Acessa o portal com o link tokenizado exclusivo do motoboy
    await page.goto(`/?motoToken=${MOTOBOY_TOKEN}`);

    // 2. Valida se a tela de desafio 2FA está visível com saudação personalizada
    await expect(page.getByText('Portal do Motoboy · 2FA')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Carlos Silva (Carlão)', { exact: false })).toBeVisible();

    // 3. Digita o PIN inválido clicando no teclado numérico na tela
    for (const digit of INVALID_PIN) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }

    // 4. Valida se a mensagem de erro de autenticação aparece
    const errorMessage = page.getByText(/Código 2FA incorreto/i);
    await expect(errorMessage).toBeVisible();

    // 5. Garante que o painel interno de entregas não foi desbloqueado
    await expect(page.getByText(/Ganhos a Receber|Entregas em Rota/i)).not.toBeVisible();
  });

  test('Deve desbloquear o painel operacional de entregas ao digitar o PIN correto', async ({ page }) => {
    // 1. Acessa o portal com o token
    await page.goto(`/?motoToken=${MOTOBOY_TOKEN}`);

    // 2. Aguarda a tela de 2FA
    await expect(page.getByText('Portal do Motoboy · 2FA')).toBeVisible();

    // 3. Digita o PIN correto (784129) usando os botões virtuais
    for (const digit of VALID_PIN) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }

    // 4. Valida que o desafio de PIN sumiu e o painel foi liberado
    await expect(page.getByText('Portal do Motoboy · 2FA')).not.toBeVisible({ timeout: 6000 });

    // 5. Verifica se as informações financeiras e de rotas do motoboy estão visíveis
    const myDeliveriesHeader = page.getByText(/Ganhos a Receber|Entregas em Rota/i);
    await expect(myDeliveriesHeader.first()).toBeVisible();
  });

  test('Deve permitir recuperação imediata e login após digitação de PIN incorreto', async ({ page }) => {
    await page.goto(`/?motoToken=${MOTOBOY_TOKEN}`);
    await expect(page.getByText('Portal do Motoboy · 2FA')).toBeVisible();

    // 1. Digita PIN incorreto
    for (const digit of INVALID_PIN) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
    await expect(page.getByText(/Código 2FA incorreto/i)).toBeVisible();

    // 2. Digita PIN correto imediatamente (o teclado reseta com o novo dígito sem travar)
    for (const digit of VALID_PIN) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
    await expect(page.getByText('Portal do Motoboy · 2FA')).not.toBeVisible({ timeout: 6000 });
    await expect(page.getByText(/Ganhos a Receber|Entregas em Rota/i).first()).toBeVisible();
  });
});
