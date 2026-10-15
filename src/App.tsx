import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AlertsPanel } from './components/AlertsPanel';
import { FleetList } from './components/FleetList';
import { MapPanel } from './components/MapPanel';
import { TelemetryPanel } from './components/TelemetryPanel';
import { TopBar } from './components/TopBar';
import { browserEngine } from './data/browserEngine';
import { useDataMode, useFleetStream } from './data/useFleetLink';
import { isHistory, isSnapshot } from './guards';
import { sortUnits } from './filters';
import { useUiStore } from './store/ui';
import type { FleetSnapshot } from './types';

async function loadSnapshot(mode: 'live' | 'browser'): Promise<FleetSnapshot> {
  if (mode === 'browser') return browserEngine.snapshot();
  const response = await fetch('/api/snapshot');
  if (!response.ok) throw new Error(`Snapshot failed (${response.status})`);
  const body: unknown = await response.json();
  if (!isSnapshot(body)) throw new Error('Snapshot payload was not valid');
  return body;
}

async function loadHistory(mode: 'live' | 'browser', unitId: string) {
  if (mode === 'browser') return browserEngine.history(unitId);
  const response = await fetch(`/api/units/${encodeURIComponent(unitId)}/history?points=48`);
  if (!response.ok) throw new Error(`History failed (${response.status})`);
  const body: unknown = await response.json();
  if (!isHistory(body)) throw new Error('History payload was not valid');
  return body.samples;
}

export function App() {
  useDataMode();
  useFleetStream();

  const mode = useUiStore((state) => state.dataMode);
  const linkNote = useUiStore((state) => state.linkNote);
  const selectedId = useUiStore((state) => state.selectedId);
  const setSelectedId = useUiStore((state) => state.setSelectedId);
  const acknowledged = useUiStore((state) => state.acknowledged);
  const acknowledge = useUiStore((state) => state.acknowledge);

  const fleet = useQuery({
    queryKey: ['fleet', mode],
    enabled: mode === 'live' || mode === 'browser',
    queryFn: () => loadSnapshot(mode === 'live' ? 'live' : 'browser'),
  });

  const history = useQuery({
    queryKey: ['history', mode, selectedId],
    enabled: Boolean(selectedId) && (mode === 'live' || mode === 'browser'),
    queryFn: () => loadHistory(mode === 'live' ? 'live' : 'browser', selectedId ?? ''),
    refetchInterval: 5_000,
  });

  const units = fleet.data?.units ?? [];

  useEffect(() => {
    if (selectedId) return;
    const next = fleet.data?.units;
    if (!next || next.length === 0) return;
    const first = sortUnits(next)[0];
    if (first) setSelectedId(first.id);
  }, [fleet.data, selectedId, setSelectedId]);

  const selected = units.find((unit) => unit.id === selectedId) ?? null;
  const alerts = (fleet.data?.alerts ?? []).filter((alert) => !acknowledged[alert.id]);
  const loading = mode === 'detecting' || fleet.isPending;

  const onAcknowledge = (id: string) => {
    acknowledge(id);
    if (mode !== 'live') return;
    void fetch(`/api/alerts/${encodeURIComponent(id)}/ack`, { method: 'POST' }).catch(() => {
      // The alert stays hidden locally even if the simulator is gone.
    });
  };

  return (
    <div className="shell">
      <TopBar mode={mode} linkNote={linkNote} units={units} alertCount={alerts.length} />
      <main className="workspace">
        <FleetList
          units={units}
          loading={loading}
          error={fleet.isError ? 'The fleet snapshot could not be loaded.' : null}
          onRetry={() => {
            void fleet.refetch();
          }}
        />
        <MapPanel
          units={units}
          zone={fleet.data?.zone ?? null}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <TelemetryPanel
          unit={selected}
          samples={history.data ?? []}
          loading={history.isPending}
        />
        <AlertsPanel
          alerts={alerts}
          now={fleet.data?.serverTime ?? 0}
          onAcknowledge={onAcknowledge}
        />
      </main>
    </div>
  );
}
