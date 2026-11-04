export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
}

const DEFAULT_OSRM_URL = 'https://router.project-osrm.org';

/**
 * Consulta distância viária real e tempo estimado via motor OSRM.
 */
export async function calculateDrivingRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<RouteResult | null> {
  const baseUrl = process.env.OSRM_BASE_URL || DEFAULT_OSRM_URL;
  const url = `${baseUrl}/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=false`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const durationMinutes = Math.max(1, Math.round(route.duration / 60));

    return {
      distanceKm,
      durationMinutes,
    };
  } catch (error) {
    console.warn('Falha na consulta OSRM, acionando contingência:', error);
    return null;
  }
}
