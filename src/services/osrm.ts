export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  source: 'osrm' | 'haversine_approximation';
}

/**
 * Calcula a distância em linha reta (Haversine) com fator de sinuosidade urbana (1.35x)
 * para contingência caso a rota viária externa esteja indisponível.
 */
export function calculateFallbackDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): RouteResult {
  const R = 6371; // Raio da Terra em KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistanceKm = R * c;

  // Fator de sinuosidade viária urbana média em cidades brasileiras: ~1.35x a distância em linha reta
  const roadEstimatedKm = Number((straightDistanceKm * 1.35).toFixed(2));
  // Média de 25 km/h em trânsito urbano de moto + semáforos
  const estimatedMinutes = Math.max(4, Math.round((roadEstimatedKm / 25) * 60));

  return {
    distanceKm: Math.max(0.8, roadEstimatedKm),
    durationMinutes: estimatedMinutes,
    source: 'haversine_approximation',
  };
}

/**
 * Consulta a rota viária real via OSRM (Open Source Routing Machine) pública e gratuita
 */
export async function calculateDrivingRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<RouteResult> {
  // Formato OSRM: {longitude},{latitude};{longitude},{latitude}
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false&alternatives=false&steps=false`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4500),
    });

    if (response.ok) {
      const json = await response.json();
      if (json.code === 'Ok' && Array.isArray(json.routes) && json.routes.length > 0) {
        const primary = json.routes[0];
        const distanceKm = Number((primary.distance / 1000).toFixed(2));
        const durationMinutes = Math.max(3, Math.round(primary.duration / 60));

        return {
          distanceKm,
          durationMinutes,
          source: 'osrm',
        };
      }
    }
  } catch (err) {
    console.warn('[OSRM Offline/Timeout - Ativando cálculo de contingência]:', err);
  }

  // Fallback seguro imediato para não interromper a operação do caixa
  return calculateFallbackDistance(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude
  );
}

export const calculateRouteWithOSRM = calculateDrivingRoute;

