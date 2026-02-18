import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InboxViewer } from '../InboxViewer';

// Mock scrollIntoView which is not available in jsdom
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});

describe('InboxViewer Component', () => {
  const sampleInboxes = {
    'my-team': {
      'agent-1': {
        messages: [
          {
            from: 'lead',
            text: 'hello',
            timestamp: '2026-02-18T10:00:00Z',
            read: false,
          },
        ],
        messageCount: 1,
      },
    },
  };

  it('renders empty state when allInboxes is empty object', () => {
    render(<InboxViewer allInboxes={{}} />);
    expect(screen.getByText('No Inbox Messages Yet')).toBeInTheDocument();
  });

  it('renders empty state when allInboxes is null', () => {
    render(<InboxViewer allInboxes={null} />);
    expect(screen.getByText('No Inbox Messages Yet')).toBeInTheDocument();
  });

  it('renders empty state when allInboxes is undefined', () => {
    render(<InboxViewer />);
    expect(screen.getByText('No Inbox Messages Yet')).toBeInTheDocument();
  });

  it('renders team names from allInboxes keys', () => {
    render(<InboxViewer allInboxes={sampleInboxes} />);
    // Team name appears in sidebar and possibly in agent header
    const teamElements = screen.getAllByText('my-team');
    expect(teamElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders agent names within expanded team', () => {
    render(<InboxViewer allInboxes={sampleInboxes} />);
    // Agent name appears in sidebar and in the thread header
    const agentElements = screen.getAllByText('agent-1');
    expect(agentElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows unread badge when messages have read:false', () => {
    render(<InboxViewer allInboxes={sampleInboxes} />);
    expect(screen.getByText('1 unread')).toBeInTheDocument();
  });

  it('does not show unread badge when all messages are read', () => {
    const readInboxes = {
      'my-team': {
        'agent-1': {
          messages: [
            {
              from: 'lead',
              text: 'hello',
              timestamp: '2026-02-18T10:00:00Z',
              read: true,
            },
          ],
          messageCount: 1,
        },
      },
    };
    render(<InboxViewer allInboxes={readInboxes} />);
    expect(screen.queryByText(/unread/)).not.toBeInTheDocument();
  });

  it('renders multiple teams', () => {
    const multiTeamInboxes = {
      'team-alpha': {
        'dev-1': {
          messages: [],
          messageCount: 0,
        },
      },
      'team-beta': {
        'dev-2': {
          messages: [],
          messageCount: 0,
        },
      },
    };
    render(<InboxViewer allInboxes={multiTeamInboxes} />);
    // Use getAllByText since team names may appear in multiple places (sidebar + header)
    expect(screen.getAllByText('team-alpha').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('team-beta').length).toBeGreaterThanOrEqual(1);
  });

  it('displays the Inboxes header', () => {
    render(<InboxViewer allInboxes={sampleInboxes} />);
    expect(screen.getByText('Inboxes')).toBeInTheDocument();
  });

  it('displays team count text', () => {
    render(<InboxViewer allInboxes={sampleInboxes} />);
    // The text "1 team" is rendered with interpolation, so use regex
    expect(screen.getByText(/1\s*team/)).toBeInTheDocument();
  });

  it('displays plural team count', () => {
    const multiTeam = {
      'team-a': { 'ag-1': { messages: [], messageCount: 0 } },
      'team-b': { 'ag-2': { messages: [], messageCount: 0 } },
    };
    render(<InboxViewer allInboxes={multiTeam} />);
    expect(screen.getByText(/2\s*teams/)).toBeInTheDocument();
  });

  it('shows message count for selected agent', () => {
    render(<InboxViewer allInboxes={sampleInboxes} />);
    // The message count text may be split across text nodes; use a function matcher
    const messageCountEl = screen.getByText((content, element) => {
      return element?.tagName === 'P' && element?.textContent?.includes('1 message');
    });
    expect(messageCountEl).toBeInTheDocument();
  });

  it('renders the message sender name in the thread', () => {
    render(<InboxViewer allInboxes={sampleInboxes} />);
    const senderElements = screen.getAllByText('lead');
    expect(senderElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the message text content', () => {
    render(<InboxViewer allInboxes={sampleInboxes} />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    render(<InboxViewer allInboxes={sampleInboxes} />);
    expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
  });
});
