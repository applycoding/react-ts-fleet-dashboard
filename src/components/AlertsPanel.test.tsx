import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Alert } from '../types';
import { AlertsPanel } from './AlertsPanel';

const alert: Alert = {
  id: 'link:m-09',
  unitId: 'm-09',
  callsign: 'M-09',
  severity: 'warning',
  code: 'link-degraded',
  message: 'M-09 telemetry link is intermittent',
  at: 1_000,
};

describe('AlertsPanel', () => {
  it('acknowledges a specific alert', async () => {
    const user = userEvent.setup();
    const onAcknowledge = vi.fn();
    render(<AlertsPanel alerts={[alert]} now={12_000} onAcknowledge={onAcknowledge} />);
    expect(screen.getByText('M-09 telemetry link is intermittent')).toBeInTheDocument();
    expect(screen.getByText(/11s ago/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Acknowledge M-09 Link' }));
    expect(onAcknowledge).toHaveBeenCalledWith('link:m-09');
  });

  it('shows the quiet state', () => {
    render(<AlertsPanel alerts={[]} now={0} onAcknowledge={() => undefined} />);
    expect(screen.getByText(/No open alerts/)).toBeInTheDocument();
  });
});
