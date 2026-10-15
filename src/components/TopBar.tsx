import type { DataMode, FleetUnit } from '../types';
import { Mark } from './icons';
import { ThemeControl } from './ThemeControl';

function modeLabel(mode: DataMode): string {
  switch (mode) {
    case 'detecting':
      return 'Linking';
    case 'live':
      return 'Live socket';
    case 'browser':
      return 'Browser sim';
    default: {
      const unreachable: never = mode;
      return unreachable;
    }
  }
}

export function TopBar({
  mode,
  linkNote,
  units,
  alertCount,
}: {
  mode: DataMode;
  linkNote: string;
  units: FleetUnit[];
  alertCount: number;
}) {
  const moving = units.filter((unit) => unit.speedKph > 1).length;
  const averageBattery =
    units.length === 0
      ? null
      : Math.round(units.reduce((sum, unit) => sum + unit.batteryPct, 0) / units.length);

  return (
    <header className="top">
      <a className="skip" href="#fleet">
        Skip to fleet
      </a>
      <div className="brand">
        <Mark />
        <div>
          <h1>Meridian</h1>
          <p>Fleet operations · portfolio demo</p>
        </div>
      </div>
      <dl className="kpis">
        <div>
          <dt>Units</dt>
          <dd>{units.length || '—'}</dd>
        </div>
        <div>
          <dt>Moving</dt>
          <dd>{units.length ? moving : '—'}</dd>
        </div>
        <div>
          <dt>Alerts</dt>
          <dd>{units.length ? alertCount : '—'}</dd>
        </div>
        <div>
          <dt>Avg battery</dt>
          <dd>{averageBattery === null ? '—' : `${averageBattery}%`}</dd>
        </div>
      </dl>
      <div className="top__tools">
        <p className="conn" data-mode={mode} title={linkNote}>
          <span className="conn__dot" aria-hidden="true" />
          <span>{modeLabel(mode)}</span>
          <span className="sr-only">{linkNote}</span>
        </p>
        <ThemeControl />
      </div>
    </header>
  );
}
