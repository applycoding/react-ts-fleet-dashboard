import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeControl } from './ThemeControl';

describe('ThemeControl', () => {
  it('pins the document to dark', async () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'color-scheme');
    meta.setAttribute('content', 'light dark');
    document.head.append(meta);
    const user = userEvent.setup();
    render(<ThemeControl />);

    await user.click(screen.getByRole('button', { name: 'Dark' }));
    expect(meta.getAttribute('content')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /System, currently/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    meta.remove();
  });
});
