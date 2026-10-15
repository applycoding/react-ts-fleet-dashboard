import { describe, expect, it } from 'vitest';
import { RESTRICTED_ZONE } from './roster';
import { distanceMeters, headingDegrees, inZone } from './geo';

describe('geo', () => {
  it('measures a zero distance for the same point', () => {
    expect(distanceMeters({ lat: 37.7, lng: -122.4 }, { lat: 37.7, lng: -122.4 })).toBe(0);
  });

  it('heads east when longitude increases', () => {
    const heading = headingDegrees({ lat: 37.7, lng: -122.4 }, { lat: 37.7, lng: -122.3 });
    expect(heading).toBeGreaterThan(80);
    expect(heading).toBeLessThan(100);
  });

  it('treats the zone edges as inside', () => {
    expect(inZone(RESTRICTED_ZONE.south, RESTRICTED_ZONE.west, RESTRICTED_ZONE)).toBe(true);
    expect(inZone(RESTRICTED_ZONE.north + 0.01, RESTRICTED_ZONE.east, RESTRICTED_ZONE)).toBe(
      false,
    );
  });
});
