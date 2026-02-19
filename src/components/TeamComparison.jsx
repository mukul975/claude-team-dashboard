import { useState, useMemo } from 'react';
import { Crown, GitCompare } from 'lucide-react';
import { safePropKey, getInboxMessages } from '../utils/safeKey';

function getTeamMessageCount(teamInbox) {
  let count = 0;
  if (!teamInbox) return count;
  for (const agentInbox of Object.values(teamInbox)) {
    const msgs = getInboxMessages(agentInbox);
    count += msgs.length;
  }
  return count;
}

function getTaskVelocity(tasks) {
  const completed = tasks.filter(t => t.status === 'completed');
  if (completed.length === 0) return 0;
  const timestamps = completed
    .map(t => t.completedAt || t.updatedAt || t.timestamp)
    .filter(Boolean)
    .map(ts => new Date(ts).getTime())
    .filter(ts => !isNaN(ts));
  if (timestamps.length < 2) return completed.length;
  const earliest = Math.min(...timestamps);
  const latest = Math.max(...timestamps);
  const hoursSpan = Math.max((latest - earliest) / (1000 * 60 * 60), 1);
  return parseFloat((completed.length / hoursSpan).toFixed(1));
}

function getOldestPendingAge(tasks) {
  const pending = tasks.filter(t => t.status === 'pending');
  if (pending.length === 0) return null;
  const now = Date.now();
  let oldest = 0;
  for (const t of pending) {
    const ts = t.createdAt || t.timestamp || t.updatedAt;
    if (ts) {
      const age = now - new Date(ts).getTime();
      if (!isNaN(age) && age > oldest) oldest = age;
    }
  }
  if (oldest === 0) return null;
  const minutes = Math.floor(oldest / 60000);
  if (minutes < 60) return { label: `${minutes}m`, minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { label: `${hours}h ${minutes % 60}m`, minutes };
  const days = Math.floor(hours / 24);
  return { label: `${days}d ${hours % 24}h`, minutes };
}

function getMostActiveAgent(teamInbox) {
  if (!teamInbox) return null;
  const counts = {};
  for (const [agentName, agentInbox] of Object.entries(teamInbox)) {
    const msgs = getInboxMessages(agentInbox);
    for (const msg of msgs) {
      const sender = msg.from || agentName;
      const sk = safePropKey(sender);
      if (sk !== null) {
        counts[sk] = (counts[sk] || 0) + 1;
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

function ComparisonBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(55,65,81,0.6)' }}>
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${pct}%`,
          background: color,
          boxShadow: `0 0 6px ${color}55`,
        }}
      />
    </div>
  );
}

function WinnerBadge() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-green-400 text-xs font-bold flex-shrink-0" style={{ background: 'rgba(34,197,94,0.2)' }}>
      &#10003;
    </span>
  );
}

function MetricRow({ label, valueA, valueB, higherIsBetter = true, formatFn, unitSuffix = '' }) {
  const numA = typeof valueA === 'number' ? valueA : 0;
  const numB = typeof valueB === 'number' ? valueB : 0;
  const maxVal = Math.max(numA, numB, 1);

  const aWins = higherIsBetter ? numA > numB : numA < numB;
  const bWins = higherIsBetter ? numB > numA : numB < numA;
  const tie = numA === numB;

  const displayA = formatFn ? formatFn(valueA) : `${valueA}${unitSuffix}`;
  const displayB = formatFn ? formatFn(valueB) : `${valueB}${unitSuffix}`;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid rgba(55,65,81,0.5)' }}>
      {/* Team A side */}
      <div className="flex items-center gap-2">
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            {(aWins || tie) && <WinnerBadge />}
            <span className="text-lg font-bold" style={{ color: aWins ? '#4ade80' : tie ? '#60a5fa' : '#d1d5db' }}>
              {displayA}
            </span>
          </div>
          <div className="mt-1">
            <ComparisonBar value={numA} max={maxVal} color={aWins ? '#22c55e' : tie ? '#3b82f6' : '#6b7280'} />
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="text-center px-3" style={{ minWidth: 140 }}>
        <span className="text-sm font-medium text-gray-400">{label}</span>
      </div>

      {/* Team B side */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: bWins ? '#4ade80' : tie ? '#60a5fa' : '#d1d5db' }}>
              {displayB}
            </span>
            {(bWins || tie) && <WinnerBadge />}
          </div>
          <div className="mt-1">
            <ComparisonBar value={numB} max={maxVal} color={bWins ? '#22c55e' : tie ? '#3b82f6' : '#6b7280'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StringMetricRow({ label, valueA, valueB }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid rgba(55,65,81,0.5)' }}>
      <div className="text-right">
        <span className="text-sm font-semibold text-gray-200">{valueA || '--'}</span>
      </div>
      <div className="text-center px-3" style={{ minWidth: 140 }}>
        <span className="text-sm font-medium text-gray-400">{label}</span>
      </div>
      <div>
        <span className="text-sm font-semibold text-gray-200">{valueB || '--'}</span>
      </div>
    </div>
  );
}

export function TeamComparison({ teams, allInboxes }) {
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');

  const teamA = useMemo(() => teams.find(t => t.name === teamAName) || null, [teams, teamAName]);
  const teamB = useMemo(() => teams.find(t => t.name === teamBName) || null, [teams, teamBName]);

  const computeMetrics = useMemo(() => (team) => {
    if (!team) return null;
    const tasks = team.tasks || [];
    const memberCount = (team.config.members || []).length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    const teamKey = safePropKey(team.name);
    const teamInbox = teamKey !== null ? allInboxes[teamKey] : undefined;
    const totalMessages = getTeamMessageCount(teamInbox);
    const mostActive = getMostActiveAgent(teamInbox);
    const avgMsgsPerAgent = memberCount > 0 ? parseFloat((totalMessages / memberCount).toFixed(1)) : 0;
    const velocity = getTaskVelocity(tasks);
    const oldestPending = getOldestPendingAge(tasks);
    return {
      members: memberCount,
      totalTasks: tasks.length,
      completed,
      completionRate,
      inProgress,
      blocked,
      totalMessages,
      avgMsgsPerAgent,
      velocity,
      oldestPending,
      mostActive,
    };
  }, [allInboxes]);

  const metricsA = useMemo(() => computeMetrics(teamA), [computeMetrics, teamA]);
  const metricsB = useMemo(() => computeMetrics(teamB), [computeMetrics, teamB]);

  if (!teams || teams.length < 2) {
    return (
      <div className="card text-center py-12">
        <GitCompare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Not Enough Teams</h3>
        <p className="text-gray-400">You need at least two active teams to use the comparison view.</p>
      </div>
    );
  }

  const bothSelected = metricsA && metricsB;

  return (
    <div className="space-y-6">
      {/* Team Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Team A</label>
          <select
            value={teamAName}
            onChange={e => setTeamAName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:border-transparent"
          >
            <option value="">Select Team A</option>
            {teams.map(t => (
              <option key={t.name} value={t.name} disabled={t.name === teamBName}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Team B</label>
          <select
            value={teamBName}
            onChange={e => setTeamBName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:border-transparent"
          >
            <option value="">Select Team B</option>
            {teams.map(t => (
              <option key={t.name} value={t.name} disabled={t.name === teamAName}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!bothSelected ? (
        <div className="card text-center py-12">
          <GitCompare className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">Select two teams to compare</p>
        </div>
      ) : (
        <div className="card">
          {/* Header row with team names */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #4b5563' }}>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Crown className="h-5 w-5 text-claude-orange" />
                <h3 className="text-lg font-bold text-white truncate">{teamA.name}</h3>
              </div>
            </div>
            <div className="text-center px-3" style={{ minWidth: 140 }}>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">VS</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white truncate">{teamB.name}</h3>
                <Crown className="h-5 w-5 text-claude-orange" />
              </div>
            </div>
          </div>

          {/* Metric Rows */}
          <MetricRow
            label="Members"
            valueA={metricsA.members}
            valueB={metricsB.members}
          />
          <MetricRow
            label="Total Tasks"
            valueA={metricsA.totalTasks}
            valueB={metricsB.totalTasks}
          />
          <MetricRow
            label="Completed"
            valueA={metricsA.completed}
            valueB={metricsB.completed}
          />
          <MetricRow
            label="Completion Rate"
            valueA={metricsA.completionRate}
            valueB={metricsB.completionRate}
            unitSuffix="%"
          />
          <MetricRow
            label="In Progress"
            valueA={metricsA.inProgress}
            valueB={metricsB.inProgress}
          />
          <MetricRow
            label="Blocked"
            valueA={metricsA.blocked}
            valueB={metricsB.blocked}
            higherIsBetter={false}
          />
          <MetricRow
            label="Total Messages"
            valueA={metricsA.totalMessages}
            valueB={metricsB.totalMessages}
          />
          <MetricRow
            label="Avg Msgs / Agent"
            valueA={metricsA.avgMsgsPerAgent}
            valueB={metricsB.avgMsgsPerAgent}
          />
          <MetricRow
            label="Task Velocity (/hr)"
            valueA={metricsA.velocity}
            valueB={metricsB.velocity}
          />
          <MetricRow
            label="Oldest Pending"
            valueA={metricsA.oldestPending ? metricsA.oldestPending.minutes : 0}
            valueB={metricsB.oldestPending ? metricsB.oldestPending.minutes : 0}
            higherIsBetter={false}
            formatFn={(v) => {
              if (v === 0) return 'None';
              const mins = typeof v === 'number' ? v : 0;
              if (mins < 60) return `${mins}m`;
              const hrs = Math.floor(mins / 60);
              if (hrs < 24) return `${hrs}h ${mins % 60}m`;
              const days = Math.floor(hrs / 24);
              return `${days}d ${hrs % 24}h`;
            }}
          />
          <StringMetricRow
            label="Most Active Agent"
            valueA={metricsA.mostActive ? `${metricsA.mostActive.name} (${metricsA.mostActive.count})` : 'None'}
            valueB={metricsB.mostActive ? `${metricsB.mostActive.name} (${metricsB.mostActive.count})` : 'None'}
          />
        </div>
      )}
    </div>
  );
}
