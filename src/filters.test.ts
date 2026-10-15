import { describe, expect, it } from 'vitest';
import { filterUnits, sortUnits } from './filters';
import type { FleetUnit } from './types';

function unit(
  partial: Partial<FleetUnit> & Pick<FleetUnit, 'id' | 'callsign' | 'status'>,
): FleetUnit {
  return {
    kind: 'ground',
    lat: 0,
    lng: 0,
    heading: 0,
    speedKph: 10,
    batteryPct: 50,
    altitudeM: 0,
    payload: 'crates',
    routeName: 'loop',
    desk: 'desk',
    link: 'nominal',
    updatedAt: 0,
    ...partial,
  };
}

const units = [
  unit({
    id: 'a',
    callsign: 'M-14',
    status: 'enroute',
    batteryPct: 10,
    routeName: 'Embarcadero',
  }),
  unit({
    id: 'b',
    callsign: 'D-12',
    status: 'alert',
    kind: 'drone',
    batteryPct: 90,
    payload: 'lidar',
  }),
  unit({ id: 'c', callsign: 'M-03', status: 'idle', batteryPct: 40, routeName: 'Yard' }),
];

describe('filters', () => {
  it('matches callsign, route, and payload without case', () => {
    expect(
      filterUnits(units, { search: 'embar', kind: 'all', status: 'all' }).map((u) => u.id),
    ).toEqual(['a']);
    expect(
      filterUnits(units, { search: 'LIDAR', kind: 'all', status: 'all' }).map((u) => u.id),
    ).toEqual(['b']);
  });

  it('filters by kind and status', () => {
    expect(
      filterUnits(units, { search: '', kind: 'drone', status: 'all' }).map((u) => u.id),
    ).toEqual(['b']);
    expect(
      filterUnits(units, { search: '', kind: 'all', status: 'idle' }).map((u) => u.id),
    ).toEqual(['c']);
  });

  it('sorts alerts ahead of healthier units', () => {
    expect(sortUnits(units).map((u) => u.callsign)).toEqual(['D-12', 'M-03', 'M-14']);
  });
});
