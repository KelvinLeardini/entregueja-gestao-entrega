import { defineConfig } from 'vitest/config';

/**
 * Configuração da Suíte de Testes Unitários e de Lógica com Vitest
 * Ambiente configurado com jsdom para validação de lógica matemática, estado e DOM
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
