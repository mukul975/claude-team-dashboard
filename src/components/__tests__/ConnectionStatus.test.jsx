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
    const { container } = render(<ConnectionStatus isConnected={true} error={null} />);

    // Check for green color classes
    const statusDiv = container.querySelector('.bg-green-500\\/20');
    expect(statusDiv).toBeInTheDocument();
    expect(statusDiv).toHaveClass('text-green-400');
  });

  it('displays red indicator when error occurs', () => {
    const { container } = render(<ConnectionStatus isConnected={false} error="Error" />);

    // Check for red color classes
    const statusDiv = container.querySelector('.bg-red-500\\/20');
    expect(statusDiv).toBeInTheDocument();
    expect(statusDiv).toHaveClass('text-red-400');
  });

  it('displays yellow indicator when connecting', () => {
    const { container } = render(<ConnectionStatus isConnected={false} error={null} />);

    // Check for yellow color classes
    const statusDiv = container.querySelector('.bg-yellow-500\\/20');
    expect(statusDiv).toBeInTheDocument();
    expect(statusDiv).toHaveClass('text-yellow-400');
  });
});
