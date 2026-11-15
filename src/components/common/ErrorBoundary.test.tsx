import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('shows a recoverable error screen and can render children again', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const MaybeThrow: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
      if (shouldThrow) throw new Error('Unexpected render failure');
      return <p>Recovered content</p>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <MaybeThrow shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    rerender(
      <ErrorBoundary>
        <MaybeThrow shouldThrow={false} />
      </ErrorBoundary>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Recovered content')).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
