import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Users, ChevronDown, ChevronUp, Activity, Clock, CheckCircle, Loader, Mail, Inbox } from 'lucide-react';
import { AgentCard } from './AgentCard';
import { TaskList } from './TaskList';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { safePropKey, getInboxMessages } from '../utils/safeKey';

dayjs.extend(relativeTime);

/**
 * Derives the latest message timestamp for a given agent from the team inbox data.
 * Searches allInboxes[teamName][agentName].messages for the most recent timestamp.
 */
function getLatestTimestamp(allInboxes, teamName, agentName) {
  const teamKey = safePropKey(teamName);
  const teamInboxes = teamKey !== null ? allInboxes[teamKey] : undefined;
  if (!teamInboxes) return null;

  // Check direct agent inbox
  const agentKey = safePropKey(agentName);
  const agentInbox = agentKey !== null ? teamInboxes[agentKey] : undefined;
  let latest = null;

  if (agentInbox) {
    const messages = getInboxMessages(agentInbox);
    for (const msg of messages) {
      const ts = msg.timestamp || msg.createdAt || msg.date || msg.sentAt;
      if (ts) {
        const d = new Date(ts);
        if (!isNaN(d.getTime()) && (!latest || d > latest)) {
          latest = d;
        }
      }
    }
  }

  // Also scan all inboxes for messages from this agent (sender field)
  for (const [, inbox] of Object.entries(teamInboxes)) {
    const messages = getInboxMessages(inbox);
    for (const msg of messages) {
      if (msg.from === agentName || msg.sender === agentName || msg.agentName === agentName) {
        const ts = msg.timestamp || msg.createdAt || msg.date || msg.sentAt;
        if (ts) {
          const d = new Date(ts);
          if (!isNaN(d.getTime()) && (!latest || d > latest)) {
            latest = d;
          }
        }
      }
    }
  }

  return latest;
}

function getAgentStatus(latestTimestamp) {
  if (!latestTimestamp) return { status: 'idle', color: '#6b7280', label: 'Idle', dot: 'bg-gray-500' };

  const now = new Date();
  const diffMs = now - latestTimestamp;
  const diffMin = diffMs / 60000;

  if (diffMin <= 5) {
    return { status: 'active', color: '#22c55e', label: 'Active', dot: 'bg-green-500', pulse: true };
  } else if (diffMin <= 30) {
    return { status: 'recent', color: '#eab308', label: 'Recent', dot: 'bg-yellow-500', pulse: false };
  }
  return { status: 'idle', color: '#6b7280', label: 'Idle', dot: 'bg-gray-500', pulse: false };
}

function formatLastActive(latestTimestamp) {
  if (!latestTimestamp) return 'No activity recorded';
  const now = new Date();
  const diffMs = now - latestTimestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Active just now';
  if (diffMin < 60) return `Last active: ${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Last active: ${diffHours}h ago`;
  return `Last active: ${Math.floor(diffHours / 24)}d ago`;
}

function TaskCompletionRing({ completed, total, size = 36 }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(75, 85, 99, 0.5)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progress >= 0.75 ? '#22c55e' : progress >= 0.4 ? '#eab308' : '#f97316'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="absolute font-bold text-white" style={{ fontSize: 9 }}>
        {total > 0 ? Math.round(progress * 100) : 0}%
      </span>
    </div>
  );
}

export function TeamCard({ team, inboxes = {}, allInboxes = {}, onNavigateToInboxes }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const { name, config = {}, tasks = [], lastUpdated } = team;
  const members = config.members || [];
  // Detect this team's lead per team: config.leadName → agentType contains 'lead'/'manager'/'coordinator' → member named 'team-lead' → first member
  const lead = members.find(m => m.name === config.leadName)
    || members.find(m => /lead|manager|coordinator/i.test(m.agentType || ''))
    || members.find(m => m.name === 'team-lead')
    || members[0]
    || null;

  const inboxEntries = Object.values(inboxes);
  const totalMessages = inboxEntries.reduce((total, agentInbox) => {
    return total + getInboxMessages(agentInbox).length;
  }, 0);
  const unreadCount = inboxEntries.reduce((total, agentInbox) => {
    const msgs = getInboxMessages(agentInbox);
    return total + msgs.filter(m => m.read === false).length;
  }, 0);

  const taskStats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  // Compute agent statuses from real message timestamps
  const agentStatuses = useMemo(() => {
    const statuses = {};
    for (const member of members) {
      const latestTs = getLatestTimestamp(allInboxes, name, member.name);
      const mk = safePropKey(member.name);
      if (mk !== null) {
        statuses[mk] = {
          ...getAgentStatus(latestTs),
          latestTimestamp: latestTs,
          tooltipText: formatLastActive(latestTs)
        };
      }
    }
    return statuses;
  }, [allInboxes, name, members]);

  // Team health: % of agents active in last 30 min
  const teamHealth = useMemo(() => {
    if (members.length === 0) return 0;
    const activeCount = members.filter(m => {
      const mk = safePropKey(m.name);
      const s = mk !== null ? agentStatuses[mk] : undefined;
      return s && (s.status === 'active' || s.status === 'recent');
    }).length;
    return Math.round((activeCount / members.length) * 100);
  }, [members, agentStatuses]);

  const healthBarColor = teamHealth > 60 ? '#22c55e' : teamHealth >= 30 ? '#eab308' : '#ef4444';

  return (
    <div className="card border-l-4 border-l-claude-orange">
      {/* Team Health Bar */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: 'rgba(31, 41, 55, 0.6)' }}>
        <div className="flex items-center gap-2 shrink-0">
          <Activity className="h-4 w-4" style={{ color: healthBarColor }} aria-hidden="true" />
          <span className="text-sm font-semibold text-white">Team Health:</span>
          <span className="text-sm font-bold" style={{ color: healthBarColor }}>{teamHealth}%</span>
        </div>
        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(55,65,81,0.7)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${teamHealth}%`,
              background: `linear-gradient(90deg, ${healthBarColor}, ${healthBarColor}dd)`,
              boxShadow: `0 0 8px ${healthBarColor}66`
            }}
          />
        </div>
        <TaskCompletionRing completed={taskStats.completed} total={tasks.length} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(232,117,10,0.2)' }}>
            <Users className="h-6 w-6 text-claude-orange" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center">
              {name}
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 text-center" style={{ minWidth: 20 }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </h3>
            {config.description && (
              <p className="text-gray-400 text-sm mt-1">{config.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label={isExpanded ? "Collapse team details" : "Expand team details"}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(55,65,81,0.5)' }}>
          <Users className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <span className="text-sm text-gray-300">{members.length} agents</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(55,65,81,0.5)' }}>
          <Activity className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <span className="text-sm text-gray-300">{tasks.length} tasks</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(55,65,81,0.5)' }}>
          <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <span className="text-sm text-gray-300">
            {dayjs(new Date(lastUpdated)).fromNow()}
          </span>
        </div>
        {totalMessages > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(55,65,81,0.5)' }}>
            <Mail className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <span className="text-sm text-gray-300">
              {totalMessages} messages{unreadCount > 0 ? `, ${unreadCount} unread` : ''}
            </span>
          </div>
        )}
        {onNavigateToInboxes && (
          <button
            onClick={() => onNavigateToInboxes(name)}
            className="flex items-center gap-2 text-claude-orange px-3 py-1 rounded-full transition-colors text-sm font-medium"
            style={{ background: 'rgba(232,117,10,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,117,10,0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(232,117,10,0.2)'}
            aria-label={`View inboxes for team ${name}`}
          >
            <Inbox className="h-4 w-4" aria-hidden="true" />
            View Inboxes
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <span className="badge badge-pending">
          <Clock className="h-3 w-3 inline-block mr-1" aria-hidden="true" />
          {taskStats.pending} pending
        </span>
        <span className="badge badge-in-progress">
          <Loader className="h-3 w-3 inline-block mr-1 animate-spin" aria-hidden="true" />
          {taskStats.inProgress} in progress
        </span>
        <span className="badge badge-completed">
          <CheckCircle className="h-3 w-3 inline-block mr-1" aria-hidden="true" />
          {taskStats.completed} completed
        </span>
      </div>

      {isExpanded && (
        <div className="space-y-6 mt-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" aria-hidden="true" />
              Team Members
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lead && (
                <AgentCard agent={lead} isLead={true} agentStatus={safePropKey(lead.name) !== null ? agentStatuses[safePropKey(lead.name)] : undefined} />
              )}
              {members
                .filter(m => m !== lead)
                .map((agent, index) => (
                  <AgentCard key={index} agent={agent} isLead={false} agentStatus={safePropKey(agent.name) !== null ? agentStatuses[safePropKey(agent.name)] : undefined} />
                ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5" aria-hidden="true" />
              Tasks
            </h4>
            <TaskList tasks={tasks} />
          </div>
        </div>
      )}
    </div>
  );
}

TeamCard.propTypes = {
  team: PropTypes.shape({
    name: PropTypes.string.isRequired,
    config: PropTypes.shape({
      description: PropTypes.string,
      leadName: PropTypes.string,
      members: PropTypes.arrayOf(PropTypes.object)
    }),
    tasks: PropTypes.array,
    lastUpdated: PropTypes.string
  }).isRequired,
  inboxes: PropTypes.objectOf(
    PropTypes.shape({
      messages: PropTypes.arrayOf(PropTypes.shape({
        read: PropTypes.bool
      }))
    })
  ),
  allInboxes: PropTypes.object,
  onNavigateToInboxes: PropTypes.func
};
