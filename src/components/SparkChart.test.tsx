import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SparkChart } from './SparkChart';

describe('SparkChart', () => {
  it('draws a line and names the latest reading', () => {
    const { container } = render(
      <SparkChart
        label="Speed"
        unit="km/h"
        tone="speed"
        rangeLabel="Last 4 min"
        values={[10, 20, 15]}
      />,
    );
    expect(
      screen.getByRole('img', { name: /Speed in km\/h, Last 4 min, latest 15/ }),
    ).toBeInTheDocument();
    expect(container.querySelector('.chart__line')?.getAttribute('d')).toMatch(/^M/);
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('explains a missing series', () => {
    render(
      <SparkChart
        label="Battery"
        unit="%"
        tone="battery"
        rangeLabel="Last 4 min"
        values={[]}
      />,
    );
    expect(screen.getByText('No samples')).toBeInTheDocument();
  });
});
