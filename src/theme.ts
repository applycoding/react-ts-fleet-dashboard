export type SchemePreference = 'light' | 'dark' | 'system';

export function preferenceFromStorage(raw: string | null): SchemePreference {
  if (raw === 'light' || raw === 'dark') return raw;
  return 'system';
}

export function metaContentFor(preference: SchemePreference): 'light' | 'dark' | 'light dark' {
  switch (preference) {
    case 'light':
      return 'light';
    case 'dark':
      return 'dark';
    case 'system':
      return 'light dark';
    default: {
      const unreachable: never = preference;
      return unreachable;
    }
  }
}

export function resolveScheme(
  preference: SchemePreference,
  system: 'light' | 'dark',
): 'light' | 'dark' {
  switch (preference) {
    case 'system':
      return system;
    case 'light':
    case 'dark':
      return preference;
    default: {
      const unreachable: never = preference;
      return unreachable;
    }
  }
}

export function readMetaContent(): string {
  return (
    document.querySelector('meta[name="color-scheme"]')?.getAttribute('content') ?? 'light dark'
  );
}

export function preferenceFromMeta(content: string): SchemePreference {
  if (content === 'light' || content === 'dark') return content;
  return 'system';
}

/** Persist a deliberate light, dark, or system choice and reflect it on the root meta tag. */
export function applyPreference(preference: SchemePreference): void {
  const content = metaContentFor(preference);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', content);
  try {
    if (preference === 'system') localStorage.removeItem('color-scheme');
    else localStorage.setItem('color-scheme', preference);
  } catch {
    // Storage can throw when site data is blocked. The meta tag still updates this tab.
  }
}
