import { GeoPoint } from '../types';

interface NominatimParams {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Normaliza um endereço para servir de chave de cache determinística
 */
export function normalizeAddressQuery(params: NominatimParams): string {
  return `${params.street} ${params.number} ${params.neighborhood} ${params.city} ${params.state}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Geocodifica um endereço usando a API pública gratuita do Nominatim (OpenStreetMap)
 */
export async function geocodeAddress(params: NominatimParams): Promise<GeoPoint | null> {
  const { street, number, neighborhood, city, state } = params;

  if (!street.trim()) return null;

  // Consulta estruturada com número e rua
  const streetWithNumber = number.trim() ? `${street.trim()}, ${number.trim()}` : street.trim();
  const searchParams = new URLSearchParams({
    street: streetWithNumber,
    city: city.trim(),
    county: neighborhood.trim(),
    state: state.trim(),
    country: 'Brazil',
    format: 'json',
    limit: '1',
    addressdetails: '1',
  });

  const url = `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(4500),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          displayName: data[0].display_name,
        };
      }
    }

    // Fallback 1: Busca em formato livre (q=...) caso a busca estruturada seja restritiva demais
    const freeTextQuery = `${street}, ${number ? number + ',' : ''} ${neighborhood}, ${city} - ${state}, Brasil`;
    const freeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(freeTextQuery)}&format=json&limit=1&countrycodes=br`;
    
    const freeResp = await fetch(freeUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3500),
    });

    if (freeResp.ok) {
      const freeData = await freeResp.json();
      if (Array.isArray(freeData) && freeData.length > 0) {
        return {
          latitude: parseFloat(freeData[0].lat),
          longitude: parseFloat(freeData[0].lon),
          displayName: freeData[0].display_name,
        };
      }
    }

    // Fallback 2: Busca por Bairro + Cidade caso a rua seja recém-criada ou com grafia divergente
    if (neighborhood.trim()) {
      const neighUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${neighborhood}, ${city}, ${state}`)}&format=json&limit=1&countrycodes=br`;
      const neighResp = await fetch(neighUrl, { signal: AbortSignal.timeout(3000) });
      if (neighResp.ok) {
        const neighData = await neighResp.json();
        if (Array.isArray(neighData) && neighData.length > 0) {
          return {
            latitude: parseFloat(neighData[0].lat),
            longitude: parseFloat(neighData[0].lon),
            displayName: `${neighborhood}, ${city} (Aproximado por Bairro)`,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.warn('[Nominatim Warning - Rede ou Timeout]:', error);
    return null;
  }
}
