import { describe, it, expect } from 'vitest';
import { calculateDeliveryFee } from '../../src/services/feeCalculator';
import { DeliveryRateRange } from '../../src/types';

describe('Cálculo de Taxas de Entrega (feeCalculator)', () => {
  const sampleRanges: DeliveryRateRange[] = [
    { id: '1', minDistanceKm: 0, maxDistanceKm: 2, feeAmount: 6.0, label: '0 a 2 km' },
    { id: '2', minDistanceKm: 2.1, maxDistanceKm: 4, feeAmount: 8.5, label: '2.1 a 4 km' },
    { id: '3', minDistanceKm: 4.1, maxDistanceKm: 7, feeAmount: 12.0, label: '4.1 a 7 km' },
  ];

  it('deve aplicar taxa padrão para distâncias inválidas ou negativas', () => {
    const resNegative = calculateDeliveryFee(-1, sampleRanges, 6.0, 1.5);
    expect(resNegative.fee).toBe(6.0);
    expect(resNegative.isOverLimit).toBe(false);

    const resNaN = calculateDeliveryFee(NaN, sampleRanges, 7.0, 1.5);
    expect(resNaN.fee).toBe(7.0);
  });

  it('deve enquadrar perfeitamente na primeira faixa (0 a 2km)', () => {
    const res = calculateDeliveryFee(1.5, sampleRanges);
    expect(res.fee).toBe(6.0);
    expect(res.isOverLimit).toBe(false);
  });

  it('deve enquadrar na segunda faixa (2.1 a 4km)', () => {
    const res = calculateDeliveryFee(3.2, sampleRanges);
    expect(res.fee).toBe(8.5);
    expect(res.isOverLimit).toBe(false);
  });

  it('deve enquadrar no limite superior de uma faixa', () => {
    const res = calculateDeliveryFee(4.0, sampleRanges);
    expect(res.fee).toBe(8.5);
  });

  it('deve calcular taxa com KM excedente quando a distância ultrapassa a maior faixa', () => {
    // Maior faixa é 7km (R$ 12.00). Distância = 9.2km -> 2.2km excedente (teto = 3km)
    // 12.00 + 3 * 1.50 = 16.50
    const res = calculateDeliveryFee(9.2, sampleRanges, 6.0, 1.5);
    expect(res.isOverLimit).toBe(true);
    expect(res.extraKm).toBe(3);
    expect(res.fee).toBe(16.5);
  });

  it('deve retornar taxa de contingência quando não há faixas configuradas', () => {
    const res = calculateDeliveryFee(5.0, [], 8.0, 2.0);
    expect(res.fee).toBe(8.0);
    expect(res.matchedRangeLabel).toBe('Taxa Padrão de Contingência');
  });
});
