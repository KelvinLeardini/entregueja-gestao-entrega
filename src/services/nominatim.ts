import { Coordinates } from './osrm';

export interface GeocodeQuery {
  street: string;
  number?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export function normalizeAddressQuery(query: GeocodeQuery): string {
  const parts = [
    query.street,
    query.number || '',
    query.neighborhood,
    query.city,
    query.state,
    'Brasil',
  ];
  return parts
    .filter(Boolean)
    .join(', ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Geocodifica endereços utilizando a API pública do Nominatim OpenStreetMap.
 * Respeita a exigência de User-Agent identificado configurável via NOMINATIM_USER_AGENT.
 */
export async function geocodeAddress(query: GeocodeQuery): Promise<Coordinates | null> {
  const normalized = normalizeAddressQuery(query);
  const userAgent =
    process.env.NOMINATIM_USER_AGENT ||
    'EntregueJa-DeliverySaaS/1.0 (contato@entregueja.com.br)';

  const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    normalized
  )}&limit=1&addressdetails=1`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const results = await response.json();
    if (!results || results.length === 0) {
      return null;
    }

    const first = results[0];
    return {
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
    };
  } catch (error) {
    console.warn('Falha na geocodificação Nominatim:', error);
    return null;
  }
}
