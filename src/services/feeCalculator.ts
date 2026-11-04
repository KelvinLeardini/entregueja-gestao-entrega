import { DeliveryRateRange } from '../types';

export interface FeeCalculationResult {
  fee: number;
  matchedRangeLabel: string;
  isOverLimit: boolean;
  extraKm: number;
}

/**
 * Calcula a taxa de entrega baseando-se na distância em KM,
 * na tabela de faixas de entrega configuradas e no valor de KM excedente.
 */
export function calculateDeliveryFee(
  distanceKm: number,
  ranges: DeliveryRateRange[],
  fallbackRate: number = 6.0,
  extraKmRate: number = 1.5
): FeeCalculationResult {
  if (distanceKm < 0 || isNaN(distanceKm)) {
    return {
      fee: fallbackRate,
      matchedRangeLabel: 'Taxa Padrão (Distância Inválida)',
      isOverLimit: false,
      extraKm: 0,
    };
  }

  // Ordena as faixas pela distância máxima crescente
  const sortedRanges = [...ranges].sort((a, b) => a.maxDistanceKm - b.maxDistanceKm);

  // Procura faixa correspondente
  for (const range of sortedRanges) {
    if (distanceKm >= range.minDistanceKm && distanceKm <= range.maxDistanceKm) {
      return {
        fee: range.feeAmount,
        matchedRangeLabel: range.label || `Faixa ${range.minDistanceKm}km a ${range.maxDistanceKm}km`,
        isOverLimit: false,
        extraKm: 0,
      };
    }
  }

  // Se exceder a maior faixa configurada
  if (sortedRanges.length > 0) {
    const highestRange = sortedRanges[sortedRanges.length - 1];
    if (distanceKm > highestRange.maxDistanceKm) {
      const extraKm = Math.ceil(distanceKm - highestRange.maxDistanceKm);
      const fee = highestRange.feeAmount + extraKm * extraKmRate;
      return {
        fee: Math.round(fee * 100) / 100,
        matchedRangeLabel: `Acima de ${highestRange.maxDistanceKm}km (+R$ ${extraKmRate.toFixed(2)}/km extra)`,
        isOverLimit: true,
        extraKm,
      };
    }
  }

  return {
    fee: fallbackRate,
    matchedRangeLabel: 'Taxa Padrão de Contingência',
    isOverLimit: false,
    extraKm: 0,
  };
}
