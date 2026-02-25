import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentCard } from '../AgentCard';
import { getAgentInitials, getAgentColor } from '../../utils/formatting';

// Mock lucide-react icons (Bot removed — no longer used by AgentCard)
vi.mock('lucide-react', () => ({
  Crown: (props) => <span data-testid="icon-crown" {...props} />,
  Cpu: (props) => <span data-testid="icon-cpu" {...props} />,
  Zap: (props) => <span data-testid="icon-zap" {...props} />,
}));

// Mock formatting utils — pass through real implementations by default
vi.mock('../../utils/formatting', async () => {
  const actual = await vi.importActual('../../utils/formatting');
  return {
    ...actual,
    getAgentInitials: vi.fn(actual.getAgentInitials),
    getAgentColor: vi.fn(actual.getAgentColor),
  };
});

describe('AgentCard', () => {
  const mockAgent = {
    name: 'test-agent',
    agentId: 'abc123def456ghi789',
    agentType: 'claude-sonnet-4-6',
  };

  const mockAgentStatus = {
    status: 'active',
    color: '#4ade80',
    label: 'Active',
    pulse: true,
    tooltipText: 'Agent is actively working',
  };

  it('renders agent name', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('test-agent')).toBeInTheDocument();
  });

  it('renders agent type', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('claude-sonnet-4-6')).toBeInTheDocument();
  });

  it('renders truncated agent ID', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('ID: abc123def456...')).toBeInTheDocument();
  });

  it('shows Lead badge when isLead is true', () => {
    render(<AgentCard agent={mockAgent} isLead={true} />);
    expect(screen.getByText('Lead')).toBeInTheDocument();
  });

  it('does not show Lead badge when isLead is false', () => {
    render(<AgentCard agent={mockAgent} isLead={false} />);
    expect(screen.queryByText('Lead')).not.toBeInTheDocument();
  });

  it('shows Crown icon for lead agent', () => {
    render(<AgentCard agent={mockAgent} isLead={true} />);
    expect(screen.getByTestId('icon-crown')).toBeInTheDocument();
  });

  it('shows agent initials in avatar', () => {
    render(<AgentCard agent={mockAgent} isLead={false} />);
    expect(screen.getByText('TA')).toBeInTheDocument();
  });

  it('shows Crown badge for lead agent', () => {
    render(<AgentCard agent={mockAgent} isLead={true} />);
    const crown = screen.getByTestId('icon-crown');
    expect(crown).toBeInTheDocument();
    // Initials should also be present alongside the crown badge
    expect(screen.getByText('TA')).toBeInTheDocument();
  });

  it('avatar uses correct background color for known agent', () => {
    const { container } = render(<AgentCard agent={mockAgent} />);
    // getAgentColor('test-agent') -> 'bg-yellow-600' -> '#ca8a04' -> rgb(202, 138, 4)
    const avatarDiv = container.querySelector('div[style*="border-radius: 50%"]');
    expect(avatarDiv).not.toBeNull();
    expect(avatarDiv.style.backgroundColor).toBe('rgb(202, 138, 4)');
    expect(screen.getByText('TA')).toBeInTheDocument();
  });

  it('avatar falls back to gray for unknown color', () => {
    getAgentColor.mockReturnValueOnce('bg-unknown-999');
    const unknownAgent = { name: 'zzz-unknown', agentId: 'unknownid12345' };
    const { container } = render(<AgentCard agent={unknownAgent} />);
    const avatarDiv = container.querySelector('div[style*="border-radius: 50%"]');
    expect(avatarDiv).not.toBeNull();
    // Fallback gray: #6b7280 -> rgb(107, 114, 128)
    expect(avatarDiv.style.backgroundColor).toBe('rgb(107, 114, 128)');
    // Initials should still render (getAgentInitials is not mocked here, uses real impl)
    expect(screen.getByText('ZU')).toBeInTheDocument();
  });

  it('renders status indicator dot with correct color', () => {
    const { container } = render(
      <AgentCard agent={mockAgent} agentStatus={mockAgentStatus} />
    );
    const dot = container.querySelector('.rounded-full');
    expect(dot).not.toBeNull();
    expect(dot.style.backgroundColor).toBe('rgb(74, 222, 128)');
  });

  it('renders status tooltip text', () => {
    render(<AgentCard agent={mockAgent} agentStatus={mockAgentStatus} />);
    // Tooltip text is rendered but visually hidden (opacity 0) until hover
    expect(screen.getByText('Agent is actively working')).toBeInTheDocument();
  });

  it('renders without agentStatus gracefully', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('test-agent')).toBeInTheDocument();
  });

  it('renders without agentType gracefully', () => {
    const agentNoType = { name: 'simple-agent', agentId: 'xyz789000111' };
    render(<AgentCard agent={agentNoType} />);
    expect(screen.getByText('simple-agent')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-cpu')).not.toBeInTheDocument();
  });

  it('shows idle status with different color', () => {
    const idleStatus = {
      status: 'idle',
      color: '#fbbf24',
      label: 'Idle',
      pulse: false,
      tooltipText: 'Agent is idle',
    };
    const { container } = render(
      <AgentCard agent={mockAgent} agentStatus={idleStatus} />
    );
    const dot = container.querySelector('.rounded-full');
    expect(dot.style.backgroundColor).toBe('rgb(251, 191, 36)');
  });
});
