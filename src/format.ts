import type { AlertCode, Severity, UnitKind, UnitStatus } from './types';
import { HISTORY_POINTS, HISTORY_STEP_MS } from './sim/engine';

export function statusLabel(status: UnitStatus): string {
  switch (status) {
    case 'enroute':
      return 'En route';
    case 'idle':
      return 'Idle';
    case 'charging':
      return 'Charging';
    case 'alert':
      return 'Alert';
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function kindLabel(kind: UnitKind): string {
  switch (kind) {
    case 'ground':
      return 'Ground';
    case 'drone':
      return 'Drone';
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

export function severityLabel(severity: Severity): string {
  switch (severity) {
    case 'warning':
      return 'Warning';
    case 'critical':
      return 'Critical';
    default: {
      const unreachable: never = severity;
      return unreachable;
    }
  }
}

export function alertCodeLabel(code: AlertCode): string {
  switch (code) {
    case 'low-battery':
      return 'Battery';
    case 'restricted-zone':
      return 'Airspace';
    case 'link-degraded':
      return 'Link';
    default: {
      const unreachable: never = code;
      return unreachable;
    }
  }
}

export function formatAge(at: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function formatHeading(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const rounded = Math.round(normalized) % 360;
  return `${rounded.toString().padStart(3, '0')}°`;
}

export function formatCoord(value: number): string {
  return value.toFixed(5);
}

export function historyWindowLabel(points = HISTORY_POINTS, stepMs = HISTORY_STEP_MS): string {
  const minutes = Math.max(1, Math.round((points * stepMs) / 60_000));
  return `Last ${minutes} min`;
}
