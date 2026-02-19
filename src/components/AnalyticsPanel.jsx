import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { getInboxMessages } from '../utils/safeKey';

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#eab308', '#06b6d4', '#ef4444', '#6366f1', '#14b8a6'];

const PIE_COLORS = {
  pending: '#eab308',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  blocked: '#ef4444',
};

function flattenAllMessages(allInboxes) {
  const messages = [];
  for (const [teamName, agents] of Object.entries(allInboxes)) {
    for (const [agentName, inbox] of Object.entries(agents || {})) {
      const msgs = getInboxMessages(inbox);
      for (const msg of msgs) {
        messages.push({ ...msg, teamName, agentName });
      }
    }
  }
  return messages;
}

function EmptyState({ label }) {
  return (
    <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
      No data yet
    </div>
  );
}

function ChartCard({ title, children, hasData }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--bg-card-gradient)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
        backdropFilter: 'blur(16px)',
        height: 300,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>{title}</h3>
      <div style={{ flex: 1, minHeight: 0 }}>
        {hasData ? children : <EmptyState label={title} />}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill || '#f97316' }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export function AnalyticsPanel({ teams = [], allInboxes = {} }) {
  const allMessages = useMemo(() => flattenAllMessages(allInboxes), [allInboxes]);

  // --- LineChart: message activity over last 24h, bucketed by hour ---
  const messageActivityData = useMemo(() => {
    if (allMessages.length === 0) return [];
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    const buckets = {};
    for (let h = 0; h < 24; h++) {
      const bucketTime = new Date(twentyFourHoursAgo + h * 60 * 60 * 1000);
      const key = `${String(bucketTime.getHours()).padStart(2, '0')}:00`;
      buckets[key] = 0;
    }
    for (const msg of allMessages) {
      const ts = msg.timestamp ? new Date(msg.timestamp).getTime() : 0;
      if (ts >= twentyFourHoursAgo && ts <= now) {
        const d = new Date(ts);
        const key = `${String(d.getHours()).padStart(2, '0')}:00`;
        if (key in buckets) {
          buckets[key]++;
        }
      }
    }
    return Object.entries(buckets).map(([hour, count]) => ({ hour, messages: count }));
  }, [allMessages]);

  // --- BarChart: top 10 agents by message count ---
  const topAgentsData = useMemo(() => {
    if (allMessages.length === 0) return [];
    const counts = {};
    for (const msg of allMessages) {
      const name = msg.from || msg.agentName || 'unknown';
      counts[name] = (counts[name] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        name: name.length > 12 ? name.slice(0, 12) + '..' : name,
        messages: count,
      }));
  }, [allMessages]);

  // --- PieChart: task status distribution ---
  const taskStatusData = useMemo(() => {
    const allTasks = teams.flatMap(t => t.tasks || []);
    if (allTasks.length === 0) return [];
    const counts = { pending: 0, in_progress: 0, completed: 0, blocked: 0 };
    for (const task of allTasks) {
      const isBlocked = task.blockedBy && task.blockedBy.length > 0;
      if (isBlocked) {
        counts.blocked++;
      } else if (task.status in counts) {
        counts[task.status]++;
      }
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([status, count]) => ({
        name: status.replace('_', ' '),
        value: count,
        status,
      }));
  }, [teams]);

  // --- AreaChart: team comparison - total messages per team ---
  const teamComparisonData = useMemo(() => {
    if (Object.keys(allInboxes).length === 0) return [];
    return Object.entries(allInboxes).map(([teamName, agents]) => {
      let total = 0;
      for (const inbox of Object.values(agents || {})) {
        const msgs = getInboxMessages(inbox);
        total += msgs.length;
      }
      return {
        name: teamName.length > 18 ? teamName.slice(0, 18) + '..' : teamName,
        messages: total,
      };
    }).sort((a, b) => b.messages - a.messages);
  }, [allInboxes]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-6 w-6 text-claude-orange" />
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>Analytics</h2>
        <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
          {allMessages.length} total messages across {Object.keys(allInboxes).length} teams
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Message Activity */}
        <ChartCard title="Message Activity (Last 24h)" hasData={messageActivityData.length > 0}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={messageActivityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="hour" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 3 }}
                activeDot={{ r: 5, fill: '#fb923c' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bar Chart - Top Agents */}
        <ChartCard title="Top 10 Agents by Message Count" hasData={topAgentsData.length > 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topAgentsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="messages" radius={[4, 4, 0, 0]}>
                {topAgentsData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie Chart - Task Status */}
        <ChartCard title="Task Status Distribution" hasData={taskStatusData.length > 0}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name} (${value})`}
              >
                {taskStatusData.map((entry, i) => (
                  <Cell key={i} fill={PIE_COLORS[entry.status] || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }}
                formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Area Chart - Team Comparison */}
        <ChartCard title="Team Comparison - Messages per Team" hasData={teamComparisonData.length > 0}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={teamComparisonData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#analyticsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
