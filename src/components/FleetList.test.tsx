import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createEngine } from '../sim/engine';
import { useUiStore } from '../store/ui';
import { FleetList } from './FleetList';

const snapshot = createEngine().snapshot(1_700_000_000_000);

function renderList() {
  return render(
    <FleetList units={snapshot.units} loading={false} error={null} onRetry={() => undefined} />,
  );
}

describe('FleetList', () => {
  it('filters by search, kind, and status', async () => {
    const user = userEvent.setup();
    renderList();

    expect(screen.getByRole('option', { name: /M-14/ })).toBeInTheDocument();
    await user.type(
      screen.getByRole('searchbox', { name: 'Search callsign, route, or payload' }),
      'wharf',
    );
    expect(screen.getByRole('option', { name: /M-41/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /M-14/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await user.click(
      within(screen.getByRole('group', { name: 'Unit kind' })).getByRole('button', {
        name: 'Drones',
      }),
    );
    expect(screen.queryByRole('option', { name: /M-14/ })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /D-12/ })).toBeInTheDocument();

    await user.click(
      within(screen.getByRole('group', { name: 'Unit kind' })).getByRole('button', {
        name: 'All',
      }),
    );
    await user.click(
      within(screen.getByRole('group', { name: 'Unit status' })).getByRole('button', {
        name: 'Alert',
      }),
    );
    expect(screen.getByRole('option', { name: /M-09/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /M-03/ })).not.toBeInTheDocument();
  });

  it('selects a unit', async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole('option', { name: /D-12/ }));
    expect(useUiStore.getState().selectedId).toBe('d-12');
    expect(screen.getByRole('option', { name: /D-12/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
