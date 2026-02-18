import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Zap, TrendingUp, Users, Clock, CheckCircle, Loader, AlertTriangle } from 'lucide-react';

// Tiny SVG sparkline from an array of numbers
function Sparkline({ data, width = 40, height = 20, color = '#10b981' }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Animated counter that ticks toward its target value
function AnimatedCounter({ value, duration = 400 }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    startRef.current = performance.now();

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <>{display}</>;
}

export function LiveMetrics({ stats, allInboxes, isConnected, lastRawMessage }) {
  const [pulse, setPulse] = useState(false);

  // --- Message rate tracking (events per minute) ---
  const eventTimestampsRef = useRef([]);
  const [messageRate, setMessageRate] = useState(0);

  // --- Sparkline ring buffers (last 20 readings) ---
  const SPARK_SIZE = 20;
  const rateHistoryRef = useRef([]);
  const [rateHistory, setRateHistory] = useState([]);
  const completionHistoryRef = useRef([]);
  const [completionHistory, setCompletionHistory] = useState([]);
  const agentsHistoryRef = useRef([]);
  const [agentsHistory, setAgentsHistory] = useState([]);

  // --- Connection uptime tracking ---
  const connectedSinceRef = useRef(null);
  const [uptime, setUptime] = useState('');

  // Track when connection state changes
  useEffect(() => {
    if (isConnected) {
      if (!connectedSinceRef.current) {
        connectedSinceRef.current = Date.now();
      }
    } else {
      connectedSinceRef.current = null;
      setUptime('');
    }
  }, [isConnected]);

  // Update uptime string every second
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      if (!connectedSinceRef.current) return;
      const diff = Math.floor((Date.now() - connectedSinceRef.current) / 1000);
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setUptime(m > 0 ? `${m}m ${s}s` : `${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Record event timestamps when new messages arrive
  useEffect(() => {
    if (!lastRawMessage) return;
    const now = Date.now();
    eventTimestampsRef.current.push(now);
    // Keep only last 60 events
    if (eventTimestampsRef.current.length > 60) {
      eventTimestampsRef.current = eventTimestampsRef.current.slice(-60);
    }
    // Calculate events per minute from timestamps within the last 60 seconds
    const cutoff = now - 60000;
    const recent = eventTimestampsRef.current.filter(t => t >= cutoff);
    setMessageRate(recent.length);
  }, [lastRawMessage]);

  // Update sparkline histories every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Rate
      const now = Date.now();
      const cutoff = now - 60000;
      const recent = eventTimestampsRef.current.filter(t => t >= cutoff);
      const rate = recent.length;
      rateHistoryRef.current = [...rateHistoryRef.current, rate].slice(-SPARK_SIZE);
      setRateHistory([...rateHistoryRef.current]);

      // Completion %
      if (stats) {
        const pct = stats.totalTasks > 0
          ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
          : 0;
        completionHistoryRef.current = [...completionHistoryRef.current, pct].slice(-SPARK_SIZE);
        setCompletionHistory([...completionHistoryRef.current]);
      }

      // Active agents
      const count = computeActiveAgents(allInboxes);
      agentsHistoryRef.current = [...agentsHistoryRef.current, count].slice(-SPARK_SIZE);
      setAgentsHistory([...agentsHistoryRef.current]);
    }, 3000);
    return () => clearInterval(interval);
  }, [stats, allInboxes]);

  // Pulse on stats update
  useEffect(() => {
    if (stats) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(timer);
    }
  }, [stats]);

  if (!stats) return null;

  const taskCompletionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const activeTasksRate = stats.totalTasks > 0
    ? Math.round((stats.inProgressTasks / stats.totalTasks) * 100)
    : 0;

  // Color-coded thresholds for completion rate
  const completionColor = taskCompletionRate > 50
    ? '#10b981'   // green
    : taskCompletionRate >= 20
      ? '#eab308' // yellow
      : '#ef4444'; // red

  const completionGradient = taskCompletionRate > 50
    ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
    : taskCompletionRate >= 20
      ? 'linear-gradient(90deg, #eab308 0%, #fbbf24 100%)'
      : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)';

  // Active agents: unique agents with messages in last 5 minutes
  const activeAgentCount = computeActiveAgents(allInboxes);

  return (
    <div className="card" style={{ background: 'var(--bg-card-gradient)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${pulse ? 'animate-pulse' : ''}`} style={{ background: '#f97316' }}>
          <Zap aria-hidden="true" className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>Live Metrics</h3>
        {uptime && (
          <span className="ml-2 text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Clock aria-hidden="true" className="h-3 w-3" />
            Connected for {uptime}
          </span>
        )}
        <span className="ml-auto text-xs flex items-center gap-1" style={{ color: isConnected ? '#4ade80' : '#f87171' }}>
          <span className="h-2 w-2 rounded-full" style={{ background: isConnected ? '#4ade80' : '#f87171', animation: isConnected ? 'pulse 2s infinite' : 'none' }}></span>
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Progress bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              {taskCompletionRate > 50 ? <CheckCircle aria-hidden="true" className="h-3 w-3" style={{ color: completionColor }} /> : taskCompletionRate >= 20 ? <Loader aria-hidden="true" className="h-3 w-3" style={{ color: completionColor }} /> : <AlertTriangle aria-hidden="true" className="h-3 w-3" style={{ color: completionColor }} />}
              Task Completion
            </span>
            <div className="flex items-center gap-2">
              <Sparkline data={completionHistory} color={completionColor} />
              <span className="text-sm font-semibold" style={{ color: completionColor }}>
                <AnimatedCounter value={taskCompletionRate} />%
              </span>
            </div>
          </div>
          <div className="w-full rounded-full h-2" role="progressbar" aria-valuenow={taskCompletionRate} aria-valuemin={0} aria-valuemax={100} aria-label="Task completion progress" style={{ background: 'var(--bg-secondary)' }}>
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${taskCompletionRate}%`, background: completionGradient }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active Tasks</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
              <AnimatedCounter value={activeTasksRate} />%
            </span>
          </div>
          <div className="w-full rounded-full h-2" role="progressbar" aria-valuenow={activeTasksRate} aria-valuemin={0} aria-valuemax={100} aria-label="Active tasks progress" style={{ background: 'var(--bg-secondary)' }}>
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${activeTasksRate}%`,
                background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Bottom stat cards */}
      <div className="grid grid-cols-4 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }} aria-live="polite">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Sparkline data={agentsHistory} color="#a78bfa" />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>
            <AnimatedCounter value={activeAgentCount} />
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Active Agents</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Sparkline data={rateHistory} color="#f97316" />
          </div>
          <div className="text-2xl font-bold text-orange-400">
            <AnimatedCounter value={messageRate} />
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Events/min</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            <AnimatedCounter value={stats.inProgressTasks} />
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Working Now</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: completionColor }}>
            <AnimatedCounter value={stats.completedTasks} />
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Completed</div>
        </div>
      </div>
    </div>
  );
}

// Compute unique agents with messages in the last 5 minutes from allInboxes
function computeActiveAgents(allInboxes) {
  if (!allInboxes || typeof allInboxes !== 'object') return 0;
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const agents = new Set();
  Object.values(allInboxes).forEach(teamInboxes => {
    if (!teamInboxes || typeof teamInboxes !== 'object') return;
    Object.entries(teamInboxes).forEach(([agentName, messages]) => {
      if (!Array.isArray(messages)) return;
      const hasRecent = messages.some(msg => {
        if (!msg) return false;
        const ts = msg.timestamp || msg.ts || msg.created_at;
        if (!ts) return true; // if no timestamp, count the agent as active
        const msgTime = typeof ts === 'number' ? ts : new Date(ts).getTime();
        return msgTime >= fiveMinAgo;
      });
      if (hasRecent) agents.add(agentName);
    });
  });
  return agents.size;
}

LiveMetrics.propTypes = {
  stats: PropTypes.shape({
    totalTeams: PropTypes.number,
    totalAgents: PropTypes.number,
    totalTasks: PropTypes.number,
    inProgressTasks: PropTypes.number,
    completedTasks: PropTypes.number,
    blockedTasks: PropTypes.number
  }),
  allInboxes: PropTypes.object,
  isConnected: PropTypes.bool,
  lastRawMessage: PropTypes.any
};
