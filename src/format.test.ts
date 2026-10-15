import { describe, expect, it } from 'vitest';
import { alertCodeLabel, formatAge, formatHeading, statusLabel } from './format';

describe('format', () => {
  it('formats ages in short buckets', () => {
    expect(formatAge(0, 0)).toBe('just now');
    expect(formatAge(0, 9_000)).toBe('just now');
    expect(formatAge(0, 12_000)).toBe('12s ago');
    expect(formatAge(0, 90_000)).toBe('1m ago');
    expect(formatAge(0, 7_200_000)).toBe('2h ago');
  });

  it('pads headings and wraps negative degrees', () => {
    expect(formatHeading(0)).toBe('000°');
    expect(formatHeading(90)).toBe('090°');
    expect(formatHeading(-10)).toBe('350°');
    expect(formatHeading(359.6)).toBe('000°');
  });

  it('labels every status and alert code', () => {
    expect(statusLabel('enroute')).toBe('En route');
    expect(alertCodeLabel('restricted-zone')).toBe('Airspace');
  });
});
