/**
 * Utility functions for coordinate parsing, DMS conversion, and reverse geocoding.
 */

export interface ParsedCoordinate {
  lat: number;
  lng: number;
}

/**
 * Converts Decimal Degrees (DD) to Degrees Minutes Seconds (DMS) string representation for Latitude.
 * Example: 13.851979 -> 13°51'07.1"N
 */
export function formatLatDms(latNum: number): string {
  if (isNaN(latNum)) return '';
  const dir = latNum >= 0 ? 'N' : 'S';
  const abs = Math.abs(latNum);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = (minFloat - min) * 60;
  const secStr = sec.toFixed(1).padStart(4, '0');
  const minStr = String(min).padStart(2, '0');
  return `${deg}°${minStr}'${secStr}"${dir}`;
}

/**
 * Converts Decimal Degrees (DD) to Degrees Minutes Seconds (DMS) string representation for Longitude.
 * Example: 100.643406 -> 100°38'36.3"E
 */
export function formatLngDms(lngNum: number): string {
  if (isNaN(lngNum)) return '';
  const dir = lngNum >= 0 ? 'E' : 'W';
  const abs = Math.abs(lngNum);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = (minFloat - min) * 60;
  const secStr = sec.toFixed(1).padStart(4, '0');
  const minStr = String(min).padStart(2, '0');
  return `${deg}°${minStr}'${secStr}"${dir}`;
}

/**
 * Extracts coordinates from arbitrary text input, DMS strings, or Google Maps URLs.
 */
export function parseCoordinatesFromText(rawInput: string): ParsedCoordinate | null {
  if (!rawInput || !rawInput.trim()) return null;

  let text = rawInput.trim();

  // Try decoding URL if applicable
  try {
    text = decodeURIComponent(text);
  } catch {
    // If decoding fails, keep raw text
  }

  // 1. Check for DMS (Degrees Minutes Seconds) format:
  // e.g. 13°51'07.1"N 100°38'36.3"E or 13°51'07.1" N, 100°38'36.3" E
  const explicitLat = text.match(/(?:([NnSs])\s*)?(\d{1,2})\s*(?:°|deg|\s+)\s*(\d{1,2})\s*[\'′]\s*(\d+(?:\.\d+)?)\s*[\"″]?\s*([NnSs])/i)
    || text.match(/([NnSs])\s*(\d{1,2})\s*(?:°|deg|\s+)\s*(\d{1,2})\s*[\'′]\s*(\d+(?:\.\d+)?)\s*[\"″]?/i);

  const explicitLng = text.match(/(?:([EeWw])\s*)?(\d{1,3})\s*(?:°|deg|\s+)\s*(\d{1,2})\s*[\'′]\s*(\d+(?:\.\d+)?)\s*[\"″]?\s*([EeWw])/i)
    || text.match(/([EeWw])\s*(\d{1,3})\s*(?:°|deg|\s+)\s*(\d{1,2})\s*[\'′]\s*(\d+(?:\.\d+)?)\s*[\"″]?/i);

  if (explicitLat && explicitLng) {
    const latDeg = parseInt(explicitLat[2], 10);
    const latMin = parseInt(explicitLat[3], 10);
    const latSec = parseFloat(explicitLat[4]);
    const latDir = (explicitLat[5] || explicitLat[1] || 'N').toUpperCase();

    const lngDeg = parseInt(explicitLng[2], 10);
    const lngMin = parseInt(explicitLng[3], 10);
    const lngSec = parseFloat(explicitLng[4]);
    const lngDir = (explicitLng[5] || explicitLng[1] || 'E').toUpperCase();

    let lat = latDeg + latMin / 60 + latSec / 3600;
    if (latDir === 'S') lat = -lat;

    let lng = lngDeg + lngMin / 60 + lngSec / 3600;
    if (lngDir === 'W') lng = -lng;

    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      };
    }
  }

  // 2. Check for DM (Degrees Decimal Minutes) format: e.g. 13°51.118'N 100°38.604'E
  const dmLatMatch = text.match(/(\d{1,2})\s*(?:°|deg|\s+)\s*(\d+(?:\.\d+)?)\s*[\'′]?\s*([NnSs])/i);
  const dmLngMatch = text.match(/(\d{1,3})\s*(?:°|deg|\s+)\s*(\d+(?:\.\d+)?)\s*[\'′]?\s*([EeWw])/i);
  if (dmLatMatch && dmLngMatch) {
    const latDeg = parseInt(dmLatMatch[1], 10);
    const latMin = parseFloat(dmLatMatch[2]);
    const latDir = dmLatMatch[3].toUpperCase();

    const lngDeg = parseInt(dmLngMatch[1], 10);
    const lngMin = parseFloat(dmLngMatch[2]);
    const lngDir = dmLngMatch[3].toUpperCase();

    let lat = latDeg + latMin / 60;
    if (latDir === 'S') lat = -lat;

    let lng = lngDeg + lngMin / 60;
    if (lngDir === 'W') lng = -lng;

    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      };
    }
  }

  // 3. Check for Google Maps URL @lat,lng format
  // e.g. https://www.google.com/maps/@13.851979,100.643406,17z
  const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  // 4. Check for URL query params e.g. q=13.851979,100.643406 or ll=13.851979,100.643406
  const queryMatch = text.match(/(?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/i);
  if (queryMatch) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  // 5. Check for path segment search/13.851979,100.643406 or place/13.851979,100.643406
  const pathMatch = text.match(/(?:search|place)\/(-?\d+\.\d+),(-?\d+\.\d+)/i);
  if (pathMatch) {
    const lat = parseFloat(pathMatch[1]);
    const lng = parseFloat(pathMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  // 6. Check for standard Decimal Pair in text: "13.851979, 100.643406" or "13.851979 100.643406"
  const decPairMatch = text.match(/(-?\d{1,2}\.\d+)\s*[\s,]\s*(-?\d{1,3}\.\d+)/);
  if (decPairMatch) {
    const lat = parseFloat(decPairMatch[1]);
    const lng = parseFloat(decPairMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  return null;
}

/**
 * Reverse geocodes lat/lng into address string using free OpenStreetMap Nominatim API.
 */
export async function reverseGeocodeAddress(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=th,en`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.display_name) {
      return data.display_name;
    }
    return null;
  } catch (error) {
    console.error('Failed to reverse geocode address:', error);
    return null;
  }
}
