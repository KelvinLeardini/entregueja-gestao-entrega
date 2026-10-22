import { describe, it, expect } from 'vitest';
import { Delivery } from '../../src/types';

/**
 * Função representativa de fechamento financeiro de turno/semanal do motoboy
 */
export function calculateCourierSettlement(
  courierId: string,
  deliveries: Delivery[],
  bonus: number = 0,
  discount: number = 0
) {
  const courierDeliveries = deliveries.filter((d) => d.courierId === courierId);

  // Considera apenas pedidos em que a taxa é devida (Entregues OU Cancelados após deslocamento/no local)
  const payableDeliveries = courierDeliveries.filter((d) => d.isFeePayable);

  // Soma dos valores com precisão em centavos
  const totalAmount = payableDeliveries.reduce((acc, curr) => {
    return Math.round((acc + curr.feeAmount) * 100) / 100;
  }, 0);

  const finalPayout = Math.round((totalAmount + bonus - discount) * 100) / 100;

  return {
    totalDeliveries: payableDeliveries.length,
    totalCanceledUnpaid: courierDeliveries.filter((d) => !d.isFeePayable).length,
    totalAmount,
    bonus,
    discount,
    finalPayout: Math.max(0, finalPayout),
  };
}

describe('Cenário 4: Fechamento de Caixa Semanal com Precisão Exata de Centavos', () => {
  const COURIER_ID = 'courier_carlão';

  it('deve somar corretamente taxas de pedidos entregues e pedidos cancelados após saída', () => {
    const mockDeliveries: Delivery[] = [
      {
        id: 'del_1',
        orderNumber: '#101',
        source: 'IFOOD',
        customerName: 'Cliente A',
        street: 'Rua 1',
        number: '10',
        neighborhood: 'Bairro',
        city: 'SP',
        state: 'SP',
        distanceKm: 2.5,
        durationMinutes: 8,
        feeAmount: 6.55,
        isManualOverride: false,
        status: 'DELIVERED',
        isFeePayable: true,
        courierId: COURIER_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'del_2',
        orderNumber: '#102',
        source: 'BALCAO',
        customerName: 'Cliente B',
        street: 'Rua 2',
        number: '20',
        neighborhood: 'Bairro',
        city: 'SP',
        state: 'SP',
        distanceKm: 4.0,
        durationMinutes: 12,
        feeAmount: 9.35,
        isManualOverride: false,
        status: 'DELIVERED',
        isFeePayable: true,
        courierId: COURIER_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Pedido CANCELADO ANTES da saída -> NÃO PAGA TAXA
      {
        id: 'del_3',
        orderNumber: '#103',
        source: '99FOOD',
        customerName: 'Cliente C',
        street: 'Rua 3',
        number: '30',
        neighborhood: 'Bairro',
        city: 'SP',
        state: 'SP',
        distanceKm: 3.0,
        durationMinutes: 10,
        feeAmount: 8.0,
        isManualOverride: false,
        status: 'CANCELED_BEFORE_DELIVERY',
        isFeePayable: false,
        courierId: COURIER_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Pedido CANCELADO DEPOIS da saída / no local -> PAGA TAXA AO MOTOBOY
      {
        id: 'del_4',
        orderNumber: '#104',
        source: 'KEETA',
        customerName: 'Cliente D',
        street: 'Rua 4',
        number: '40',
        neighborhood: 'Bairro',
        city: 'SP',
        state: 'SP',
        distanceKm: 5.5,
        durationMinutes: 15,
        feeAmount: 13.1,
        isManualOverride: false,
        status: 'CANCELED_AFTER_DELIVERY',
        isFeePayable: true,
        courierId: COURIER_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Total esperado: 6.55 + 9.35 + 13.10 = 29.00
    const settlement = calculateCourierSettlement(COURIER_ID, mockDeliveries, 10.5, 5.0);

    expect(settlement.totalDeliveries).toBe(3);
    expect(settlement.totalCanceledUnpaid).toBe(1);
    expect(settlement.totalAmount).toBe(29.0);
    // 29.00 + 10.50 (bônus) - 5.00 (desconto) = 34.50
    expect(settlement.finalPayout).toBe(34.5);
  });

  it('deve garantir que centavos de múltiplos pedidos não sofram imprecisão de dízima flutuante', () => {
    // 10 pedidos a R$ 6.33 cada = R$ 63.30
    const microDeliveries: Delivery[] = Array.from({ length: 10 }).map((_, idx) => ({
      id: `micro_${idx}`,
      orderNumber: `#20${idx}`,
      source: 'BALCAO',
      customerName: `Cliente ${idx}`,
      street: 'Rua',
      number: '1',
      neighborhood: 'Bairro',
      city: 'SP',
      state: 'SP',
      distanceKm: 2,
      durationMinutes: 5,
      feeAmount: 6.33,
      isManualOverride: false,
      status: 'DELIVERED',
      isFeePayable: true,
      courierId: COURIER_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const settlement = calculateCourierSettlement(COURIER_ID, microDeliveries, 0.05, 0.02);

    expect(settlement.totalAmount).toBe(63.3);
    // 63.30 + 0.05 - 0.02 = 63.33
    expect(settlement.finalPayout).toBe(63.33);
  });
});
