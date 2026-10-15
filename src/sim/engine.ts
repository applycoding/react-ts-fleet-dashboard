import type { Alert, FleetSnapshot, FleetUnit, TelemetrySample, UnitBlueprint } from '../types';
import { buildRoute, inZone, pointAlong, type RouteGeom } from './geo';
import { blueprintById, RESTRICTED_ZONE, ROSTER } from './roster';

export const HISTORY_POINTS = 48;
export const HISTORY_STEP_MS = 5_000;

const routeCache = new Map<string, RouteGeom>();

function geometryFor(blueprint: UnitBlueprint): RouteGeom {
  const cached = routeCache.get(blueprint.id);
  if (cached) return cached;
  const built = buildRoute(blueprint.route);
  routeCache.set(blueprint.id, built);
  return built;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function batteryAt(blueprint: UnitBlueprint, now: number): number {
  switch (blueprint.behavior) {
    case 'idle': {
      const wobble = 0.5 + 0.5 * Math.sin(now / 20_000);
      return 74 + Math.round(4 * wobble);
    }
    case 'charging': {
      const phase =
        ((now + blueprint.phaseMs) % blueprint.batteryPeriodMs) / blueprint.batteryPeriodMs;
      return clamp(Math.round(22 + phase * 70), 0, 100);
    }
    case 'degraded': {
      const wobble = 0.5 + 0.5 * Math.sin((now + blueprint.phaseMs) / 8_000);
      return clamp(Math.round(6 + wobble * 5), 0, 100);
    }
    case 'patrol': {
      const phase =
        ((now + blueprint.phaseMs) % blueprint.batteryPeriodMs) / blueprint.batteryPeriodMs;
      const wave = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
      return clamp(Math.round(14 + wave * 84), 0, 100);
    }
    default: {
      const unreachable: never = blueprint.behavior;
      return unreachable;
    }
  }
}

export function speedAt(blueprint: UnitBlueprint, now: number): number {
  switch (blueprint.behavior) {
    case 'idle':
    case 'charging':
      return 0;
    case 'degraded':
    case 'patrol': {
      const factor = blueprint.behavior === 'degraded' ? 0.35 : 1;
      const wave = 0.86 + 0.14 * Math.sin((now + blueprint.phaseMs) / 7_000);
      return Math.round(blueprint.cruiseKph * factor * wave);
    }
    default: {
      const unreachable: never = blueprint.behavior;
      return unreachable;
    }
  }
}

export function altitudeAt(blueprint: UnitBlueprint, now: number): number {
  if (blueprint.kind === 'ground') return 0;
  switch (blueprint.behavior) {
    case 'idle':
    case 'charging':
      return 0;
    case 'degraded':
    case 'patrol': {
      const wave = Math.sin((now + blueprint.phaseMs) / 9_000);
      return Math.round(blueprint.altitudeBase + blueprint.altitudeAmp * wave);
    }
    default: {
      const unreachable: never = blueprint.behavior;
      return unreachable;
    }
  }
}

export function projectUnit(blueprint: UnitBlueprint, now: number): FleetUnit {
  const batteryPct = batteryAt(blueprint, now);
  const home = blueprint.route[0] ?? { lat: 37.77, lng: -122.42 };
  let lat = home.lat;
  let lng = home.lng;
  let heading = 0;

  switch (blueprint.behavior) {
    case 'idle':
    case 'charging':
      break;
    case 'degraded':
    case 'patrol': {
      // Cruise speed keeps the loop smooth. The readout speed wobbles around it.
      const factor = blueprint.behavior === 'degraded' ? 0.35 : 1;
      const metersPerSecond = (blueprint.cruiseKph * factor * 1000) / 3600;
      const distance = metersPerSecond * ((now + blueprint.phaseMs) / 1000);
      const point = pointAlong(geometryFor(blueprint), distance);
      lat = point.lat;
      lng = point.lng;
      heading = point.heading;
      break;
    }
    default: {
      const unreachable: never = blueprint.behavior;
      throw new Error(`Unknown behavior ${String(unreachable)}`);
    }
  }

  let status: FleetUnit['status'];
  switch (blueprint.behavior) {
    case 'charging':
      status = 'charging';
      break;
    case 'idle':
      status = batteryPct < 20 ? 'alert' : 'idle';
      break;
    case 'degraded':
      status = 'alert';
      break;
    case 'patrol':
      status = batteryPct < 20 ? 'alert' : 'enroute';
      break;
    default: {
      const unreachable: never = blueprint.behavior;
      throw new Error(`Unknown behavior ${String(unreachable)}`);
    }
  }

  if (
    blueprint.kind === 'drone' &&
    blueprint.behavior !== 'charging' &&
    blueprint.behavior !== 'idle' &&
    inZone(lat, lng, RESTRICTED_ZONE)
  ) {
    status = 'alert';
  }

  return {
    id: blueprint.id,
    callsign: blueprint.callsign,
    kind: blueprint.kind,
    status,
    lat,
    lng,
    heading,
    speedKph: speedAt(blueprint, now),
    batteryPct,
    altitudeM: altitudeAt(blueprint, now),
    payload: blueprint.payload,
    routeName: blueprint.routeName,
    desk: blueprint.desk,
    link: blueprint.behavior === 'degraded' ? 'degraded' : 'nominal',
    updatedAt: now,
  };
}

export function historyFor(
  blueprint: UnitBlueprint,
  now: number,
  points = HISTORY_POINTS,
  stepMs = HISTORY_STEP_MS,
): TelemetrySample[] {
  const samples: TelemetrySample[] = [];
  for (let index = points - 1; index >= 0; index -= 1) {
    const t = now - index * stepMs;
    samples.push({
      t,
      speedKph: speedAt(blueprint, t),
      batteryPct: batteryAt(blueprint, t),
      altitudeM: altitudeAt(blueprint, t),
    });
  }
  return samples;
}

function pushAlert(
  alerts: Alert[],
  startedAt: Map<string, number>,
  alert: Omit<Alert, 'at'>,
  now: number,
): void {
  const existing = startedAt.get(alert.id);
  const at = existing ?? now;
  if (existing === undefined) startedAt.set(alert.id, at);
  alerts.push({ ...alert, at });
}

export function deriveAlerts(
  units: FleetUnit[],
  startedAt: Map<string, number>,
  now: number,
): Alert[] {
  const alerts: Alert[] = [];
  const active = new Set<string>();

  for (const unit of units) {
    if (unit.link === 'degraded') {
      const id = `link:${unit.id}`;
      active.add(id);
      pushAlert(
        alerts,
        startedAt,
        {
          id,
          unitId: unit.id,
          callsign: unit.callsign,
          severity: 'warning',
          code: 'link-degraded',
          message: `${unit.callsign} telemetry link is intermittent`,
        },
        now,
      );
    }

    if (unit.status !== 'charging' && unit.batteryPct < 20) {
      const id = `battery:${unit.id}`;
      active.add(id);
      const severity = unit.batteryPct < 12 ? 'critical' : 'warning';
      pushAlert(
        alerts,
        startedAt,
        {
          id,
          unitId: unit.id,
          callsign: unit.callsign,
          severity,
          code: 'low-battery',
          message: `${unit.callsign} battery at ${unit.batteryPct}%`,
        },
        now,
      );
    }

    if (
      unit.kind === 'drone' &&
      unit.altitudeM > 0 &&
      inZone(unit.lat, unit.lng, RESTRICTED_ZONE)
    ) {
      const id = `zone:${unit.id}`;
      active.add(id);
      pushAlert(
        alerts,
        startedAt,
        {
          id,
          unitId: unit.id,
          callsign: unit.callsign,
          severity: 'critical',
          code: 'restricted-zone',
          message: `${unit.callsign} entered ${RESTRICTED_ZONE.name} restricted airspace`,
        },
        now,
      );
    }
  }

  for (const id of startedAt.keys()) {
    if (!active.has(id)) startedAt.delete(id);
  }

  const severityRank: Record<Alert['severity'], number> = { critical: 0, warning: 1 };
  return alerts.sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity] || a.at - b.at,
  );
}

export interface FleetEngine {
  snapshot(now?: number): FleetSnapshot;
  history(unitId: string, now?: number, points?: number): TelemetrySample[];
  acknowledge(id: string): void;
}

export function createEngine(): FleetEngine {
  const startedAt = new Map<string, number>();
  const acknowledged = new Set<string>();

  return {
    snapshot(now = Date.now()) {
      const units = ROSTER.map((blueprint) => projectUnit(blueprint, now));
      const alerts = deriveAlerts(units, startedAt, now).filter(
        (alert) => !acknowledged.has(alert.id),
      );
      return { units, alerts, serverTime: now, zone: RESTRICTED_ZONE };
    },
    history(unitId, now = Date.now(), points = HISTORY_POINTS) {
      const blueprint = blueprintById(unitId);
      if (!blueprint) return [];
      return historyFor(blueprint, now, points);
    },
    acknowledge(id) {
      acknowledged.add(id);
    },
  };
}
