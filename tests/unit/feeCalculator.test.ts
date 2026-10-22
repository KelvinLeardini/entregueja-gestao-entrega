import { describe, it, expect } from 'vitest';
import { calculateDeliveryFee } from '../../src/services/feeCalculator';
import { DeliveryRateRange } from '../../src/types';

describe('Cenário 3: Cálculo Matemático de Taxas de Entrega e KM Excedente', () => {
  const MOCK_RATE_RANGES: DeliveryRateRange[] = [
    {
      id: 'range_1',
      minKm: 0.0,
      maxKm: 3.0,
      price: 6.0,
      description: 'Até 3km',
      isActive: true,
      orderIndex: 1,
    },
    {
      id: 'range_2',
      minKm: 3.1,
      maxKm: 5.0,
      price: 9.0,
      description: '3km a 5km',
      isActive: true,
      orderIndex: 2,
    },
    {
      id: 'range_3',
      minKm: 5.1,
      maxKm: 8.0,
      price: 13.0,
      description: '5km a 8km',
      isActive: true,
      orderIndex: 3,
    },
    {
      id: 'range_4',
      minKm: 8.1,
      maxKm: 12.0,
      price: 18.0,
      description: '8km a 12km',
      isActive: true,
      orderIndex: 4,
    },
  ];

  it('deve retornar a taxa padrão de contingência (fallback) se a distância for zero ou negativa', () => {
    const fallback = 7.0;
    const resZero = calculateDeliveryFee(0, MOCK_RATE_RANGES, fallback, 1.5);
    expect(resZero.fee).toBe(7.0);
    expect(resZero.isExtraKm).toBe(false);

    const resNeg = calculateDeliveryFee(-2, MOCK_RATE_RANGES, fallback, 1.5);
    expect(resNeg.fee).toBe(7.0);
  });

  it('deve enquadrar perfeitamente na Faixa 1 (0 a 3 km) custando R$ 6,00', () => {
    const res = calculateDeliveryFee(2.5, MOCK_RATE_RANGES);
    expect(res.fee).toBe(6.0);
    expect(res.isExtraKm).toBe(false);
    expect(res.matchedRangeLabel).toBe('0 km a 3 km');
  });

  it('deve enquadrar perfeitamente na Faixa 2 (3.1 a 5 km) custando R$ 9,00', () => {
    const res = calculateDeliveryFee(4.8, MOCK_RATE_RANGES);
    expect(res.fee).toBe(9.0);
    expect(res.isExtraKm).toBe(false);
  });

  it('deve enquadrar perfeitamente na Faixa 4 (8.1 a 12 km) custando R$ 18,00', () => {
    const res = calculateDeliveryFee(11.2, MOCK_RATE_RANGES);
    expect(res.fee).toBe(18.0);
    expect(res.isExtraKm).toBe(false);
  });

  it('deve cobrar taxa da última faixa + valor por KM excedente quando a distância ultrapassar o limite máximo', () => {
    // 15km = limite 12km (R$ 18,00) + 3km excedentes a R$ 1,50/km = R$ 18,00 + R$ 4,50 = R$ 22,50
    const res = calculateDeliveryFee(15.0, MOCK_RATE_RANGES, 7.0, 1.5);
    expect(res.isExtraKm).toBe(true);
    expect(res.extraKmCount).toBe(3.0);
    expect(res.fee).toBe(22.5);
  });

  it('deve retornar taxa padrão se a lista de faixas ativas estiver vazia', () => {
    const res = calculateDeliveryFee(4.0, [], 7.5, 1.5);
    expect(res.fee).toBe(7.5);
    expect(res.matchedRangeLabel).toBe('Taxa Padrão');
  });
});
