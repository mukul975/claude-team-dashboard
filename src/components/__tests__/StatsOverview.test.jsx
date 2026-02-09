import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsOverview } from '../StatsOverview';

describe('StatsOverview Component', () => {
  const mockStats = {
    totalTeams: 4,
    totalAgents: 19,
    totalTasks: 42,
    inProgressTasks: 18,
    completedTasks: 16,
    blockedTasks: 2
  };

  it('renders all stats correctly', () => {
    render(<StatsOverview stats={mockStats} />);

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('19')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders nothing when no stats provided', () => {
    const { container } = render(<StatsOverview stats={null} />);

    // Component returns null when stats is null
    expect(container.firstChild).toBeNull();
  });

  it('renders all stat labels correctly', () => {
    render(<StatsOverview stats={mockStats} />);

    expect(screen.getByText('Active Teams')).toBeInTheDocument();
    expect(screen.getByText('Total Agents')).toBeInTheDocument();
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  it('renders with correct grid layout', () => {
    const { container } = render(<StatsOverview stats={mockStats} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-6');
  });

  it('renders icons for each stat', () => {
    const { container } = render(<StatsOverview stats={mockStats} />);

    // Check for 6 icon containers (one for each stat)
    const iconContainers = container.querySelectorAll('.flex-shrink-0');
    expect(iconContainers.length).toBe(6);
  });

  it('displays stat values with correct formatting', () => {
    render(<StatsOverview stats={mockStats} />);

    // Check that values are displayed as bold white text
    const valueElements = screen.getByText('4').closest('p');
    expect(valueElements).toHaveClass('text-xl', 'font-bold', 'text-white');
  });
});
