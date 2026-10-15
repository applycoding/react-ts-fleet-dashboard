import { useEffect, useState } from 'react';
import { applyPreference, preferenceFromStorage, type SchemePreference } from '../theme';
import { useSystemScheme } from '../useSystemScheme';

function storedPreference(): SchemePreference {
  try {
    return preferenceFromStorage(localStorage.getItem('color-scheme'));
  } catch {
    return 'system';
  }
}

const OPTIONS: SchemePreference[] = ['system', 'light', 'dark'];

function optionLabel(option: SchemePreference): string {
  switch (option) {
    case 'system':
      return 'System';
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    default: {
      const unreachable: never = option;
      return unreachable;
    }
  }
}

export function ThemeControl() {
  const system = useSystemScheme();
  const [preference, setPreference] = useState<SchemePreference>(storedPreference);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'color-scheme') return;
      const next = preferenceFromStorage(event.newValue);
      applyPreference(next);
      setPreference(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const choose = (next: SchemePreference) => {
    applyPreference(next);
    setPreference(next);
  };

  return (
    <div className="theme" role="group" aria-label="Color scheme">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={preference === option}
          aria-label={option === 'system' ? `System, currently ${system}` : optionLabel(option)}
          onClick={() => choose(option)}
        >
          {optionLabel(option)}
        </button>
      ))}
    </div>
  );
}
