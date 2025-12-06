/**
 * Extrae latitud y longitud de diferentes formatos de URLs de Google Maps
 *
 * Formatos soportados:
 * - https://maps.google.com/maps?q=-33.49,-64.36&z=17
 * - https://www.google.com/maps?q=-33.49,-64.36
 * - https://goo.gl/maps/xxxxx (requiere resolver redirect)
 * - https://maps.app.goo.gl/xxxxx
 * - Coordenadas directas: -33.49,-64.36
 */

interface Coordinates {
  latitude: number;
  longitude: number;
}

export function parseGoogleMapsUrl(input: string): Coordinates | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();

  // Caso 1: Coordenadas directas (ej: "-33.49,-64.36" o "-33.49, -64.36")
  const directCoordsMatch = trimmed.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (directCoordsMatch) {
    const lat = parseFloat(directCoordsMatch[1]);
    const lng = parseFloat(directCoordsMatch[2]);
    if (isValidCoordinates(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Caso 2: URL con parámetro q= (más común)
  // Ej: https://maps.google.com/maps?q=-33.49,-64.36&z=17
  const qParamMatch = trimmed.match(/[?&]q=(-?\d+\.?\d*)[,%2C]+(-?\d+\.?\d*)/i);
  if (qParamMatch) {
    const lat = parseFloat(qParamMatch[1]);
    const lng = parseFloat(qParamMatch[2]);
    if (isValidCoordinates(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Caso 3: URL con @lat,lng en el path
  // Ej: https://www.google.com/maps/@-33.49,-64.36,17z
  const atMatch = trimmed.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidCoordinates(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Caso 4: URL con /place/ seguido de coordenadas
  // Ej: https://www.google.com/maps/place/-33.49,-64.36
  const placeMatch = trimmed.match(/\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (placeMatch) {
    const lat = parseFloat(placeMatch[1]);
    const lng = parseFloat(placeMatch[2]);
    if (isValidCoordinates(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Caso 5: URL con ll= parameter
  // Ej: https://maps.google.com/?ll=-33.49,-64.36
  const llMatch = trimmed.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) {
    const lat = parseFloat(llMatch[1]);
    const lng = parseFloat(llMatch[2]);
    if (isValidCoordinates(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Caso 6: URL con destination= (para rutas)
  // Ej: https://www.google.com/maps/dir/?api=1&destination=-33.49,-64.36
  const destMatch = trimmed.match(/[?&]destination=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (destMatch) {
    const lat = parseFloat(destMatch[1]);
    const lng = parseFloat(destMatch[2]);
    if (isValidCoordinates(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  return null;
}

function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Genera URL de navegación de Google Maps
 */
export function generateGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
