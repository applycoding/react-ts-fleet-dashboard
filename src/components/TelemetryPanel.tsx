import {
  formatCoord,
  formatHeading,
  historyWindowLabel,
  kindLabel,
  statusLabel,
} from '../format';
import type { FleetUnit, TelemetrySample } from '../types';
import { SparkChart } from './SparkChart';

function HeadingDial({ heading }: { heading: number }) {
  return (
    <svg
      className="dial"
      viewBox="0 0 48 48"
      role="img"
      aria-label={`Heading ${formatHeading(heading)}`}
    >
      <circle cx="24" cy="24" r="16" />
      <path d="M24 8 L27 24 L24 21 L21 24 Z" transform={`rotate(${heading} 24 24)`} />
    </svg>
  );
}

export function TelemetryPanel({
  unit,
  samples,
  loading,
}: {
  unit: FleetUnit | null;
  samples: TelemetrySample[];
  loading: boolean;
}) {
  const rangeLabel = historyWindowLabel();

  return (
    <section aria-label="Telemetry" className="panel telemetry">
      <header className="panel__head">
        <h2>Telemetry</h2>
        <p className="panel__meta">{unit ? unit.callsign : 'No selection'}</p>
      </header>
      {!unit ? (
        <p className="empty">Select a unit to read speed, battery, and altitude.</p>
      ) : (
        <div className="scroll telemetry__body">
          <div className="telemetry__identity">
            <div>
              <p className="telemetry__name">
                {unit.callsign}
                <span className={`status status--${unit.status}`}>
                  {statusLabel(unit.status)}
                </span>
              </p>
              <p className="unit__meta">
                {kindLabel(unit.kind)} · {unit.routeName} · {unit.payload}
              </p>
              <p className="unit__meta">
                {unit.desk} · {formatCoord(unit.lat)}, {formatCoord(unit.lng)}
              </p>
            </div>
            <HeadingDial heading={unit.heading} />
          </div>
          <dl className="readouts">
            <div className="readout">
              <dt>Speed</dt>
              <dd>{unit.speedKph} km/h</dd>
            </div>
            <div className="readout">
              <dt>Battery</dt>
              <dd className={unit.batteryPct < 20 ? 'is-critical' : undefined}>
                {unit.batteryPct}%
              </dd>
            </div>
            <div className="readout">
              <dt>Altitude</dt>
              <dd>{unit.altitudeM} m</dd>
            </div>
            <div className="readout">
              <dt>Heading</dt>
              <dd>{formatHeading(unit.heading)}</dd>
            </div>
          </dl>
          {loading && samples.length === 0 ? (
            <p className="empty">Loading history…</p>
          ) : (
            <div className="charts">
              <SparkChart
                label="Speed"
                unit="km/h"
                tone="speed"
                rangeLabel={rangeLabel}
                values={samples.map((sample) => sample.speedKph)}
              />
              <SparkChart
                label="Battery"
                unit="%"
                tone="battery"
                rangeLabel={rangeLabel}
                values={samples.map((sample) => sample.batteryPct)}
              />
              <SparkChart
                label="Altitude"
                unit="m"
                tone="altitude"
                rangeLabel={rangeLabel}
                values={samples.map((sample) => sample.altitudeM)}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
