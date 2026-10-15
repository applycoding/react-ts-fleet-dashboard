import { alertCodeLabel, formatAge, severityLabel } from '../format';
import type { Alert } from '../types';

export function AlertsPanel({
  alerts,
  now,
  onAcknowledge,
}: {
  alerts: Alert[];
  now: number;
  onAcknowledge: (id: string) => void;
}) {
  return (
    <section aria-label="Alerts" className="panel alerts">
      <header className="panel__head">
        <h2>Alerts</h2>
        <p className="panel__meta" aria-live="polite">
          {alerts.length} open
        </p>
      </header>
      {alerts.length === 0 ? (
        <p className="empty">No open alerts. Degraded links and low batteries show up here.</p>
      ) : (
        <div className="scroll">
          <ul className="alert-list">
            {alerts.map((alert) => (
              <li key={alert.id} className={`alert alert--${alert.severity}`}>
                <p className="alert__sev">
                  {severityLabel(alert.severity)} · {alertCodeLabel(alert.code)}
                </p>
                <p className="alert__msg">{alert.message}</p>
                <p className="alert__meta">
                  {alert.callsign} · {formatAge(alert.at, now)}
                </p>
                <button
                  type="button"
                  className="chip"
                  aria-label={`Acknowledge ${alert.callsign} ${alertCodeLabel(alert.code)}`}
                  onClick={() => onAcknowledge(alert.id)}
                >
                  Acknowledge
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
