import React, { useMemo } from 'react';
import { Trophy, Users, AlertTriangle, Crown, TrendingDown, Zap, Clock, ShieldAlert, CheckCircle } from 'lucide-react';

function getMessageCount(teamInbox) {
  let count = 0;
  if (!teamInbox) return count;
  for (const agentInbox of Object.values(teamInbox)) {
    const msgs = Array.isArray(agentInbox) ? agentInbox : (agentInbox.messages || []);
    count += msgs.length;
  }
  return count;
}

function getActiveAgents(teamInbox, members) {
  if (!teamInbox || !members) return 0;
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
  const activeNames = new Set();
  for (const [agentName, agentInbox] of Object.entries(teamInbox)) {
    const msgs = Array.isArray(agentInbox) ? agentInbox : (agentInbox.messages || []);
    for (const msg of msgs) {
      const ts = msg.timestamp ? new Date(msg.timestamp).getTime() : 0;
      if (ts >= thirtyMinAgo) {
        activeNames.add(agentName);
        if (msg.from) activeNames.add(msg.from);
      }
    }
  }
  return members.filter(m => activeNames.has(m.name)).length;
}

function getTopAgent(allInboxes) {
  const counts = {};
  for (const teamInbox of Object.values(allInboxes)) {
    for (const [agentName, agentInbox] of Object.entries(teamInbox || {})) {
      const msgs = Array.isArray(agentInbox) ? agentInbox : (agentInbox.messages || []);
      for (const msg of msgs) {
        const sender = msg.from || agentName;
        counts[sender] = (counts[sender] || 0) + 1;
      }
    }
  }
  let topName = null;
  let topCount = 0;
  for (const [name, count] of Object.entries(counts)) {
    if (count > topCount) {
      topName = name;
      topCount = count;
    }
  }
  return topName ? { name: topName, count: topCount } : null;
}

function PercentageRing({ value, size = 56, strokeWidth = 5, color, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="text-xs font-bold" style={{ color }}>{value.toFixed(0)}%</span>
      <span className="text-[10px] leading-tight text-center" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

function StatusBadge({ rate }) {
  if (rate > 50) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
        Active
      </span>
    );
  }
  if (rate > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
      Just Started
    </span>
  );
}

function formatDuration(ms) {
  if (ms <= 0) return '0m';
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(16px)',
};

export function TeamPerformancePanel({ teams = [], allInboxes = {} }) {
  const allTasks = useMemo(() => teams.flatMap(t => t.tasks || []), [teams]);

  // Per-team leaderboard with extended metrics
  const leaderboard = useMemo(() => {
    const now = Date.now();
    return teams.map(team => {
      const tasks = team.tasks || [];
      const members = team.config?.members || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
      const inProgressCount = inProgressTasks.length;
      const blockedCount = tasks.filter(t => t.blockedBy && t.blockedBy.length > 0).length;
      const blockerRatio = totalTasks > 0 ? (blockedCount / totalTasks) * 100 : 0;
      const messageCount = getMessageCount(allInboxes[team.name]);
      const activeAgents = getActiveAgents(allInboxes[team.name], members);

      // Agent utilization: agents with in_progress tasks / total agents
      const agentsWithWork = new Set(inProgressTasks.map(t => t.owner).filter(Boolean));
      const utilization = members.length > 0 ? (agentsWithWork.size / members.length) * 100 : 0;

      // Task velocity: completed tasks per hour based on team age
      const teamStart = team.lastUpdated ? new Date(team.lastUpdated).getTime() : now;
      const completedWithTimestamps = tasks.filter(t => t.status === 'completed' && t.completedAt);
      let velocity = 0;
      if (completedTasks > 0) {
        const allTimestamps = tasks.map(t => t.createdAt || t.completedAt || t.updatedAt).filter(Boolean).map(ts => new Date(ts).getTime());
        const earliest = allTimestamps.length > 0 ? Math.min(...allTimestamps) : teamStart;
        const hoursElapsed = Math.max((now - earliest) / 3600000, 0.1);
        velocity = completedTasks / hoursElapsed;
      }

      // Average task age for completed tasks (using timestamps if available)
      let avgTaskAge = 0;
      const completedTasksWithAge = tasks.filter(t => t.status === 'completed' && t.createdAt);
      if (completedTasksWithAge.length > 0) {
        const totalAge = completedTasksWithAge.reduce((sum, t) => {
          const created = new Date(t.createdAt).getTime();
          const completed = t.completedAt ? new Date(t.completedAt).getTime() : now;
          return sum + (completed - created);
        }, 0);
        avgTaskAge = totalAge / completedTasksWithAge.length;
      }

      return {
        name: team.name,
        memberCount: members.length,
        totalTasks,
        completedTasks,
        completionRate,
        inProgressCount,
        blockedCount,
        blockerRatio,
        messageCount,
        activeAgents,
        utilization,
        velocity,
        avgTaskAge,
      };
    }).sort((a, b) => b.completionRate - a.completionRate);
  }, [teams, allInboxes]);

  // Aggregate metrics across all teams
  const aggregateMetrics = useMemo(() => {
    const totalTasks = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'completed').length;
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
    const blocked = allTasks.filter(t => t.blockedBy && t.blockedBy.length > 0).length;
    const totalMembers = teams.reduce((s, t) => s + (t.config?.members?.length || 0), 0);
    const agentsWithWork = new Set(allTasks.filter(t => t.status === 'in_progress').map(t => t.owner).filter(Boolean));

    return {
      completionRate: totalTasks > 0 ? (completed / totalTasks) * 100 : 0,
      utilization: totalMembers > 0 ? (agentsWithWork.size / totalMembers) * 100 : 0,
      blockerRatio: totalTasks > 0 ? (blocked / totalTasks) * 100 : 0,
      totalCompleted: completed,
      totalInProgress: inProgress,
      totalBlocked: blocked,
      totalTasks,
      totalMembers,
    };
  }, [allTasks, teams]);

  const topAgent = useMemo(() => getTopAgent(allInboxes), [allInboxes]);

  // Top performing agents: most completed tasks
  const topPerformers = useMemo(() => {
    const counts = {};
    for (const task of allTasks) {
      if (task.status === 'completed' && task.owner) {
        counts[task.owner] = (counts[task.owner] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, completed: count }));
  }, [allTasks]);

  // Bottleneck tasks: oldest in_progress tasks
  const bottleneckTasks = useMemo(() => {
    const now = Date.now();
    return allTasks
      .filter(t => t.status === 'in_progress')
      .map(t => ({
        id: t.id,
        subject: t.subject || `Task #${t.id}`,
        owner: t.owner || 'unassigned',
        age: t.createdAt ? now - new Date(t.createdAt).getTime() : 0,
        blocked: t.blockedBy && t.blockedBy.length > 0,
      }))
      .sort((a, b) => b.age - a.age)
      .slice(0, 5);
  }, [allTasks]);

  const slowestTeam = useMemo(() => {
    const withTasks = leaderboard.filter(t => t.totalTasks > 0);
    if (withTasks.length === 0) return null;
    return withTasks.reduce((min, t) => t.completionRate < min.completionRate ? t : min, withTasks[0]);
  }, [leaderboard]);

  if (teams.length === 0) {
    return (
      <div className="rounded-2xl p-6" style={cardStyle}>
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="h-6 w-6 text-claude-orange" />
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>Team Performance</h2>
        </div>
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No teams active yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6" style={cardStyle}>
      <div className="flex items-center gap-3 mb-5">
        <Trophy className="h-6 w-6 text-claude-orange" />
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>Team Performance</h2>
        <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
          {teams.length} team{teams.length !== 1 ? 's' : ''} ranked by completion
        </span>
      </div>

      {/* Aggregate Metric Rings */}
      <div className="flex items-center justify-center gap-8 mb-6 py-3">
        <PercentageRing
          value={aggregateMetrics.completionRate}
          color={aggregateMetrics.completionRate > 75 ? '#22c55e' : aggregateMetrics.completionRate > 40 ? '#eab308' : '#f97316'}
          label="Completion"
        />
        <PercentageRing
          value={aggregateMetrics.utilization}
          color={aggregateMetrics.utilization > 60 ? '#3b82f6' : '#a855f7'}
          label="Utilization"
        />
        <PercentageRing
          value={aggregateMetrics.blockerRatio}
          color={aggregateMetrics.blockerRatio > 30 ? '#ef4444' : aggregateMetrics.blockerRatio > 10 ? '#eab308' : '#22c55e'}
          label="Blocked"
        />
        <div className="flex flex-col items-center gap-1">
          <div className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>{aggregateMetrics.totalCompleted}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Done</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-xl font-bold text-blue-400">{aggregateMetrics.totalInProgress}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Active</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-xl font-bold" style={{ color: 'var(--text-secondary)' }}>{aggregateMetrics.totalMembers}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Agents</div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
              <th className="text-left py-2 pr-4 font-medium">#</th>
              <th className="text-left py-2 pr-4 font-medium">Team</th>
              <th className="text-center py-2 px-2 font-medium">Members</th>
              <th className="text-center py-2 px-2 font-medium">Tasks</th>
              <th className="text-center py-2 px-2 font-medium">Completion</th>
              <th className="text-center py-2 px-2 font-medium">Utilization</th>
              <th className="text-center py-2 px-2 font-medium">Velocity</th>
              <th className="text-center py-2 px-2 font-medium">Messages</th>
              <th className="text-center py-2 px-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((team, index) => (
              <tr
                key={team.name}
                className="transition-colors"
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                <td className="py-3 pr-4">
                  <span className={`font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                    {index + 1}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate max-w-[180px]" style={{ color: 'var(--text-heading)' }}>{team.name}</span>
                    {team.blockedCount > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-red-400" title={`${team.blockedCount} blocked`}>
                        <AlertTriangle className="h-3 w-3" />
                        {team.blockedCount}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-center" style={{ color: 'var(--text-secondary)' }}>{team.memberCount}</td>
                <td className="py-3 px-2 text-center">
                  <span style={{ color: 'var(--text-secondary)' }}>{team.completedTasks}/{team.totalTasks}</span>
                  {team.inProgressCount > 0 && (
                    <span className="text-xs text-blue-400 ml-1">({team.inProgressCount})</span>
                  )}
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(team.completionRate, 100)}%`,
                          backgroundColor: team.completionRate > 75 ? '#22c55e' : team.completionRate > 40 ? '#eab308' : '#f97316',
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs w-9 text-right" style={{ color: 'var(--text-primary)' }}>
                      {team.completionRate.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(team.utilization, 100)}%`,
                          backgroundColor: team.utilization > 60 ? '#3b82f6' : '#a855f7',
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs w-9 text-right" style={{ color: 'var(--text-muted)' }}>
                      {team.utilization.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{team.velocity.toFixed(1)}/h</span>
                </td>
                <td className="py-3 px-2 text-center" style={{ color: 'var(--text-secondary)' }}>{team.messageCount}</td>
                <td className="py-3 px-2 text-center">
                  <StatusBadge rate={team.completionRate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom section: highlights, top performers, bottlenecks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Highlights */}
        <div className="space-y-3">
          {topAgent && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Crown className="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-yellow-400/70 font-medium">Most Active Agent</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{topAgent.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{topAgent.count} messages</div>
              </div>
            </div>
          )}
          {slowestTeam && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <TrendingDown className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-red-400/70 font-medium">Needs Attention</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{slowestTeam.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{slowestTeam.completionRate.toFixed(0)}% ({slowestTeam.completedTasks}/{slowestTeam.totalTasks})</div>
              </div>
            </div>
          )}
        </div>

        {/* Top Performing Agents */}
        <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Top Performers</span>
          </div>
          {topPerformers.length === 0 ? (
            <div className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No completed tasks yet</div>
          ) : (
            <div className="space-y-1.5">
              {topPerformers.map((agent, i) => (
                <div key={agent.name} className="flex items-center gap-2">
                  <span className={`text-xs font-bold w-4 ${i === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>{i + 1}</span>
                  <span className="text-xs truncate flex-1" style={{ color: 'var(--text-heading)' }}>{agent.name}</span>
                  <div className="flex items-center gap-1">
                    <div className="h-1 rounded-full overflow-hidden" style={{ width: 40, background: 'var(--bg-secondary)' }}>
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${topPerformers[0] ? (agent.completed / topPerformers[0].completed) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-green-400 font-mono w-6 text-right">{agent.completed}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottleneck Tasks */}
        <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Bottleneck Tasks</span>
          </div>
          {bottleneckTasks.length === 0 ? (
            <div className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No in-progress tasks</div>
          ) : (
            <div className="space-y-1.5">
              {bottleneckTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2">
                  {task.blocked && <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />}
                  <span className="text-xs truncate flex-1" style={{ color: 'var(--text-heading)' }} title={task.subject}>{task.subject}</span>
                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{task.owner}</span>
                  {task.age > 0 && (
                    <span className="text-[10px] text-orange-400 font-mono flex-shrink-0">{formatDuration(task.age)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
