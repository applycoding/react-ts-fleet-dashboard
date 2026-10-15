import type { LatLng, RestrictedZone } from '../types';

const METERS_PER_DEG_LAT = 111_320;

export function distanceMeters(from: LatLng, to: LatLng): number {
  const latRad = (from.lat * Math.PI) / 180;
  const north = (to.lat - from.lat) * METERS_PER_DEG_LAT;
  const east = (to.lng - from.lng) * METERS_PER_DEG_LAT * Math.cos(latRad);
  return Math.hypot(east, north);
}

/** Degrees clockwise from north. */
export function headingDegrees(from: LatLng, to: LatLng): number {
  const latRad = (from.lat * Math.PI) / 180;
  const north = (to.lat - from.lat) * METERS_PER_DEG_LAT;
  const east = (to.lng - from.lng) * METERS_PER_DEG_LAT * Math.cos(latRad);
  const degrees = (Math.atan2(east, north) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

export interface RouteGeom {
  points: LatLng[];
  segmentLengths: number[];
  total: number;
}

export function buildRoute(points: LatLng[]): RouteGeom {
  const segmentLengths: number[] = [];
  let total = 0;
  for (let index = 0; index < points.length; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    if (!start || !end) continue;
    const length = Math.max(distanceMeters(start, end), 1);
    segmentLengths.push(length);
    total += length;
  }
  return { points, segmentLengths, total: Math.max(total, 1) };
}

export function pointAlong(
  route: RouteGeom,
  distance: number,
): { lat: number; lng: number; heading: number } {
  const first = route.points[0];
  if (!first) {
    return { lat: 0, lng: 0, heading: 0 };
  }
  let remaining = ((distance % route.total) + route.total) % route.total;
  for (let index = 0; index < route.segmentLengths.length; index += 1) {
    const length = route.segmentLengths[index] ?? 1;
    const start = route.points[index];
    const end = route.points[(index + 1) % route.points.length];
    if (!start || !end) continue;
    if (remaining <= length) {
      const t = remaining / length;
      return {
        lat: start.lat + (end.lat - start.lat) * t,
        lng: start.lng + (end.lng - start.lng) * t,
        heading: headingDegrees(start, end),
      };
    }
    remaining -= length;
  }
  return { lat: first.lat, lng: first.lng, heading: 0 };
}

export function inZone(lat: number, lng: number, zone: RestrictedZone): boolean {
  return lat >= zone.south && lat <= zone.north && lng >= zone.west && lng <= zone.east;
}
