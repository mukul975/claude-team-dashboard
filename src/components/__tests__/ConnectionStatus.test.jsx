import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionStatus } from '../ConnectionStatus';

describe('ConnectionStatus Component', () => {
  it('renders connected status correctly', () => {
    render(<ConnectionStatus isConnected={true} error={null} />);

    const statusText = screen.getByText(/connected/i);
    expect(statusText).toBeInTheDocument();
  });

  it('renders connecting status when disconnected without error', () => {
    render(<ConnectionStatus isConnected={false} error={null} />);

    const statusText = screen.getByText(/connecting/i);
    expect(statusText).toBeInTheDocument();
  });

  it('renders error message when error provided', () => {
    const errorMessage = 'Connection failed';
    render(<ConnectionStatus isConnected={false} error={errorMessage} />);

    const errorText = screen.getByText(errorMessage);
    expect(errorText).toBeInTheDocument();
  });

  it('displays green indicator when connected', () => {
    render(<ConnectionStatus isConnected={true} error={null} />);

    // Component uses aria-label for accessibility; connected state renders a status element
    const statusEl = screen.getByRole('status', { name: /connection status: connected/i });
    expect(statusEl).toBeInTheDocument();
  });

  it('displays red indicator when error occurs', () => {
    render(<ConnectionStatus isConnected={false} error="Error" />);

    // Error state renders an alert role element
    const alertEl = screen.getByRole('alert');
    expect(alertEl).toBeInTheDocument();
  });

  it('displays yellow indicator when connecting', () => {
    render(<ConnectionStatus isConnected={false} error={null} />);

    // Connecting state renders a status element with aria-busy
    const statusEl = screen.getByRole('status', { name: /connection status: connecting/i });
    expect(statusEl).toBeInTheDocument();
    expect(statusEl).toHaveAttribute('aria-busy', 'true');
  });
});
