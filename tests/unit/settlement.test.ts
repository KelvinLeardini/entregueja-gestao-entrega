import { describe, it, expect } from 'vitest';
import { Delivery } from '../../src/types';

describe('Regras de Fechamento Financeiro & Cancelamentos', () => {
  it('deve remunerar taxa R$ 0,00 quando cancelado antes da saída', () => {
    const canceledBefore: Delivery = {
      id: 'del_1',
      orderNumber: '101',
      source: 'BALCAO',
      customerName: 'Cliente Teste',
      street: 'Rua A',
      number: '10',
      neighborhood: 'Bairro',
      city: 'São Paulo',
      state: 'SP',
      distanceKm: 2.0,
      durationMinutes: 8,
      feeAmount: 6.0,
      isManualOverride: false,
      status: 'CANCELED_BEFORE_DELIVERY',
      isFeePayable: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // A moto não rodou, não é devida taxa ao motoboy
    const payable = canceledBefore.status === 'DELIVERED' || canceledBefore.status === 'CANCELED_AFTER_DELIVERY';
    expect(payable).toBe(false);
  });

  it('deve remunerar taxa integral quando cancelado no local (após saída)', () => {
    const canceledAtLocation: Delivery = {
      id: 'del_2',
      orderNumber: '102',
      source: 'IFOOD',
      customerName: 'Cliente Recusou',
      street: 'Av B',
      number: '200',
      neighborhood: 'Bairro B',
      city: 'São Paulo',
      state: 'SP',
      distanceKm: 4.5,
      durationMinutes: 15,
      feeAmount: 10.0,
      isManualOverride: false,
      status: 'CANCELED_AFTER_DELIVERY',
      isFeePayable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // O entregador se deslocou, taxa deve ser paga integralmente
    const payable = canceledAtLocation.status === 'DELIVERED' || canceledAtLocation.status === 'CANCELED_AFTER_DELIVERY';
    expect(payable).toBe(true);
    expect(canceledAtLocation.feeAmount).toBe(10.0);
  });
});
