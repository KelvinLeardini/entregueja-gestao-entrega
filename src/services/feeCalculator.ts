import { DeliveryRateRange } from '../types';

export interface FeeCalculationResult {
  fee: number;
  matchedRangeLabel: string;
  isExtraKm: boolean;
  extraKmCount: number;
}

/**
 * Calcula a taxa de entrega com base na tabela por faixas fixas de KM configurada pela hamburgueria
 */
export function calculateDeliveryFee(
  distanceKm: number,
  ranges: DeliveryRateRange[],
  fallbackRate: number = 7.0,
  extraKmRate: number = 1.5
): FeeCalculationResult {
  if (distanceKm <= 0) {
    return {
      fee: fallbackRate,
      matchedRangeLabel: 'Taxa Padrão (Sem rota)',
      isExtraKm: false,
      extraKmCount: 0,
    };
  }

  // Filtra apenas faixas ativas e ordena pelo minKm
  const activeRanges = ranges
    .filter((r) => r.isActive)
    .sort((a, b) => a.minKm - b.minKm);

  if (activeRanges.length === 0) {
    return {
      fee: fallbackRate,
      matchedRangeLabel: 'Taxa Padrão',
      isExtraKm: false,
      extraKmCount: 0,
    };
  }

  // Verifica se a distância cai dentro de alguma faixa cadastrada
  for (const range of activeRanges) {
    if (distanceKm >= range.minKm && distanceKm <= range.maxKm) {
      return {
        fee: Number(range.price.toFixed(2)),
        matchedRangeLabel: `${range.minKm} km a ${range.maxKm} km`,
        isExtraKm: false,
        extraKmCount: 0,
      };
    }
  }

  // Caso exceda a maior faixa cadastrada: aplica a última faixa + taxa por KM excedente
  const highestRange = activeRanges[activeRanges.length - 1];
  if (distanceKm > highestRange.maxKm) {
    const extraKm = Number((distanceKm - highestRange.maxKm).toFixed(2));
    const extraCost = extraKm * extraKmRate;
    const totalFee = Number((highestRange.price + extraCost).toFixed(2));

    return {
      fee: totalFee,
      matchedRangeLabel: `Acima de ${highestRange.maxKm} km (+R$ ${extraKmRate.toFixed(2)}/km)`,
      isExtraKm: true,
      extraKmCount: extraKm,
    };
  }

  return {
    fee: fallbackRate,
    matchedRangeLabel: 'Taxa Padrão',
    isExtraKm: false,
    extraKmCount: 0,
  };
}
