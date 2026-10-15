import { filterUnits, filtersAreActive, sortUnits } from '../filters';
import { kindLabel, statusLabel } from '../format';
import { useUiStore } from '../store/ui';
import type { FleetUnit, UnitKind, UnitStatus } from '../types';
import { DroneIcon, GroundIcon } from './icons';

const KINDS: Array<'all' | UnitKind> = ['all', 'ground', 'drone'];
const STATUSES: Array<'all' | UnitStatus> = ['all', 'enroute', 'idle', 'charging', 'alert'];

function kindChipLabel(kind: 'all' | UnitKind): string {
  switch (kind) {
    case 'all':
      return 'All';
    case 'ground':
      return 'Ground';
    case 'drone':
      return 'Drones';
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

function statusChipLabel(status: 'all' | UnitStatus): string {
  switch (status) {
    case 'all':
      return 'All';
    case 'enroute':
    case 'idle':
    case 'charging':
    case 'alert':
      return statusLabel(status);
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

function meterClass(batteryPct: number): string {
  if (batteryPct < 12) return 'meter is-critical';
  if (batteryPct < 20) return 'meter is-low';
  return 'meter';
}

export function FleetList({
  units,
  loading,
  error,
  onRetry,
}: {
  units: FleetUnit[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const search = useUiStore((state) => state.search);
  const kind = useUiStore((state) => state.kind);
  const status = useUiStore((state) => state.status);
  const selectedId = useUiStore((state) => state.selectedId);
  const setSearch = useUiStore((state) => state.setSearch);
  const setKind = useUiStore((state) => state.setKind);
  const setStatus = useUiStore((state) => state.setStatus);
  const setSelectedId = useUiStore((state) => state.setSelectedId);
  const clearFilters = useUiStore((state) => state.clearFilters);

  const filters = { search, kind, status };
  const visible = sortUnits(filterUnits(units, filters));
  const selectionHidden =
    Boolean(selectedId) && !visible.some((unit) => unit.id === selectedId);

  return (
    <section id="fleet" aria-label="Fleet units" className="panel fleet">
      <header className="panel__head">
        <h2>Units</h2>
        <p className="panel__meta" aria-live="polite">
          {loading ? 'Loading' : `${visible.length} of ${units.length}`}
        </p>
      </header>
      <div className="filters">
        <label className="search">
          <span className="sr-only">Search callsign, route, or payload</span>
          <input
            type="search"
            placeholder="Search callsign, route, or payload"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="chips" role="group" aria-label="Unit kind">
          {KINDS.map((option) => (
            <button
              key={option}
              type="button"
              className="chip"
              aria-pressed={kind === option}
              onClick={() => setKind(option)}
            >
              {kindChipLabel(option)}
            </button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Unit status">
          {STATUSES.map((option) => (
            <button
              key={option}
              type="button"
              className="chip"
              aria-pressed={status === option}
              onClick={() => setStatus(option)}
            >
              {statusChipLabel(option)}
            </button>
          ))}
        </div>
        {filtersAreActive(filters) ? (
          <button type="button" className="text-button" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>
      {loading ? (
        <div className="loading" aria-hidden="true">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : error ? (
        <div className="empty" role="alert">
          <p>{error}</p>
          <button type="button" className="chip" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <p>
            {filtersAreActive(filters)
              ? 'No units match these filters.'
              : 'No units in the snapshot.'}
          </p>
          {filtersAreActive(filters) ? (
            <button type="button" className="chip" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="scroll">
          {selectionHidden ? (
            <p className="hint">The selected unit is hidden by the current filters.</p>
          ) : null}
          <div role="listbox" aria-label="Fleet units">
            {visible.map((unit) => (
              <button
                key={unit.id}
                id={`unit-${unit.id}`}
                type="button"
                role="option"
                aria-selected={unit.id === selectedId}
                className={unit.id === selectedId ? 'unit is-selected' : 'unit'}
                onClick={() => setSelectedId(unit.id)}
              >
                <span className="unit__icon">
                  {unit.kind === 'drone' ? <DroneIcon /> : <GroundIcon />}
                </span>
                <span className="unit__copy">
                  <span className="unit__title">
                    <span className="unit__call">{unit.callsign}</span>
                    <span className={`status status--${unit.status}`}>
                      {statusLabel(unit.status)}
                    </span>
                  </span>
                  <span className="unit__meta">
                    {kindLabel(unit.kind)} · {unit.routeName}
                  </span>
                  <span className="meter-row">
                    <span
                      className={meterClass(unit.batteryPct)}
                      role="meter"
                      aria-valuenow={unit.batteryPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${unit.callsign} battery`}
                    >
                      <span style={{ width: `${unit.batteryPct}%` }} />
                    </span>
                    <span className="unit__pct">{unit.batteryPct}%</span>
                  </span>
                </span>
                <span className="unit__stat">
                  <span>{unit.speedKph}</span>
                  <span>km/h</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
