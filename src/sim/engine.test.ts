import { describe, expect, it } from 'vitest';
import type { FleetUnit } from '../types';
import { HISTORY_POINTS, createEngine, deriveAlerts, projectUnit } from './engine';
import { blueprintById, ROSTER } from './roster';
import { inZone } from './geo';
import { RESTRICTED_ZONE } from './roster';

const NOW = 1_700_000_000_000;

function unit(partial: Partial<FleetUnit> & Pick<FleetUnit, 'id' | 'kind'>): FleetUnit {
  return {
    callsign: partial.id.toUpperCase(),
    status: 'enroute',
    lat: 37.77,
    lng: -122.42,
    heading: 0,
    speedKph: 30,
    batteryPct: 80,
    altitudeM: 0,
    payload: 'payload',
    routeName: 'route',
    desk: 'desk',
    link: 'nominal',
    updatedAt: NOW,
    ...partial,
  };
}

describe('fleet engine', () => {
  it('projects every roster unit into a finite position', () => {
    const snapshot = createEngine().snapshot(NOW);
    expect(snapshot.units).toHaveLength(ROSTER.length);
    for (const fleetUnit of snapshot.units) {
      expect(Number.isFinite(fleetUnit.lat)).toBe(true);
      expect(Number.isFinite(fleetUnit.lng)).toBe(true);
      expect(fleetUnit.batteryPct).toBeGreaterThanOrEqual(0);
      expect(fleetUnit.batteryPct).toBeLessThanOrEqual(100);
    }
  });

  it('keeps the yard mule parked and the degraded units in alert', () => {
    const mule = blueprintById('m-03');
    const degraded = blueprintById('m-09');
    if (!mule || !degraded) throw new Error('missing blueprint');
    expect(projectUnit(mule, NOW).speedKph).toBe(0);
    expect(projectUnit(mule, NOW).status).toBe('idle');
    expect(projectUnit(degraded, NOW).status).toBe('alert');
    expect(projectUnit(degraded, NOW).link).toBe('degraded');
  });

  it('sends the basin drone through the restricted zone', () => {
    const drone = blueprintById('d-15');
    if (!drone) throw new Error('missing drone');
    let hits = 0;
    for (let t = NOW; t < NOW + 10 * 60_000; t += 2_000) {
      const projected = projectUnit(drone, t);
      if (inZone(projected.lat, projected.lng, RESTRICTED_ZONE)) hits += 1;
    }
    expect(hits).toBeGreaterThan(0);
  });

  it('raises link and battery alerts for a degraded unit and keeps them acknowledged', () => {
    const engine = createEngine();
    const first = engine.snapshot(NOW);
    const link = first.alerts.find((alert) => alert.id === 'link:m-09');
    const battery = first.alerts.find((alert) => alert.id === 'battery:d-02');
    expect(link?.severity).toBe('warning');
    expect(battery?.severity).toBe('critical');

    engine.acknowledge('link:m-09');
    const second = engine.snapshot(NOW + 5_000);
    expect(second.alerts.some((alert) => alert.id === 'link:m-09')).toBe(false);
    expect(second.alerts.find((alert) => alert.id === 'link:m-09')).toBeUndefined();
    expect(second.alerts.find((alert) => alert.id === 'link:m-09')?.at).toBeUndefined();
    expect(link && second.alerts.find((alert) => alert.id === 'battery:d-02')?.at).toBe(
      battery?.at,
    );
  });

  it('does not flag a ground vehicle inside the airspace box', () => {
    const alerts = deriveAlerts(
      [
        unit({
          id: 'truck',
          kind: 'ground',
          lat: 37.752,
          lng: -122.39,
          altitudeM: 0,
        }),
      ],
      new Map(),
      NOW,
    );
    expect(alerts.map((alert) => alert.code)).not.toContain('restricted-zone');
  });

  it('returns a time-ordered history window', () => {
    const samples = createEngine().history('d-12', NOW, HISTORY_POINTS);
    expect(samples).toHaveLength(HISTORY_POINTS);
    expect(samples[0]?.t).toBeLessThan(samples[samples.length - 1]?.t ?? 0);
    expect(samples[samples.length - 1]?.t).toBe(NOW);
  });
});
