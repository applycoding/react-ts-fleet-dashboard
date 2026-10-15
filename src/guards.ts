import type { FleetSnapshot, RestrictedZone, TelemetrySample } from './types';

export function isZone(value: unknown): value is RestrictedZone {
  if (typeof value !== 'object' || value === null) return false;
  const zone = value as Partial<RestrictedZone>;
  return (
    typeof zone.name === 'string' &&
    typeof zone.south === 'number' &&
    typeof zone.west === 'number' &&
    typeof zone.north === 'number' &&
    typeof zone.east === 'number'
  );
}

export function isSnapshot(value: unknown): value is FleetSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Partial<FleetSnapshot>;
  return (
    Array.isArray(record.units) &&
    Array.isArray(record.alerts) &&
    typeof record.serverTime === 'number' &&
    isZone(record.zone)
  );
}

export function isHistory(value: unknown): value is { samples: TelemetrySample[] } {
  if (typeof value !== 'object' || value === null) return false;
  return Array.isArray((value as { samples?: unknown }).samples);
}
