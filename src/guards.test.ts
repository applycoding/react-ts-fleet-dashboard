import { describe, expect, it } from 'vitest';
import { isSnapshot } from './guards';

describe('isSnapshot', () => {
  it('accepts a payload with units, alerts, time, and a zone', () => {
    expect(
      isSnapshot({
        units: [],
        alerts: [],
        serverTime: 1,
        zone: { name: 'South Basin', south: 1, west: 2, north: 3, east: 4 },
        type: 'tick',
      }),
    ).toBe(true);
    expect(isSnapshot({ units: [] })).toBe(false);
  });
});
