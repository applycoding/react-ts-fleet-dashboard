import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

vi.mock('./components/MapPanel', async () => {
  const React = await import('react');
  return {
    MapPanel: () => React.createElement('section', { 'aria-label': 'Live map' }),
  };
});

function renderApp() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(createElement(QueryClientProvider, { client }, createElement(App)));
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
  });

  it('falls back to the in-browser fleet and filters drones', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(
      await screen.findByRole('option', { name: /M-14/ }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Browser sim')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Live map' })).toBeInTheDocument();

    await user.click(
      within(screen.getByRole('group', { name: 'Unit kind' })).getByRole('button', {
        name: 'Drones',
      }),
    );
    expect(screen.queryByRole('option', { name: /M-14/ })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /D-12/ })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: /D-12/ }));
    expect(screen.getByRole('region', { name: 'Telemetry' })).toHaveTextContent('D-12');
    expect(screen.getByRole('img', { name: /Speed in km\/h/ })).toBeInTheDocument();
  });
});
