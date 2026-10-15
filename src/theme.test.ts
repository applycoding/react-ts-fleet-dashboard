import { describe, expect, it } from 'vitest';
import { applyPreference, metaContentFor, preferenceFromStorage, resolveScheme } from './theme';

describe('color scheme', () => {
  it('maps the three preferences onto the meta tag', () => {
    expect(metaContentFor('system')).toBe('light dark');
    expect(metaContentFor('dark')).toBe('dark');
    expect(preferenceFromStorage('nope')).toBe('system');
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('light', 'dark')).toBe('light');
  });

  it('pins dark and clears the pin when returning to system', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'color-scheme');
    meta.setAttribute('content', 'light dark');
    document.head.append(meta);

    applyPreference('dark');
    expect(meta.getAttribute('content')).toBe('dark');
    expect(localStorage.getItem('color-scheme')).toBe('dark');

    applyPreference('system');
    expect(meta.getAttribute('content')).toBe('light dark');
    expect(localStorage.getItem('color-scheme')).toBeNull();
    meta.remove();
  });
});
