import React, { useState, useEffect, useMemo } from 'react';
import { Users, Zap, Brain, CheckSquare, Grid3X3 } from 'lucide-react';

function getHeatmapColor(count) {
  if (count === 0) return '#374151';
  if (count <= 3) return '#7c4a1a';
  if (count <= 7) return '#b45309';
  if (count <= 15) return '#d97706';
  return '#f97316';
}

function buildHeatmapData(allInboxes) {
  const now = new Date();
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const agentCounts = {};

  for (const [, agents] of Object.entries(allInboxes)) {
    for (const [agentName, inbox] of Object.entries(agents || {})) {
      const messages = Array.isArray(inbox) ? inbox : (inbox.messages || []);
      for (const msg of messages) {
        const sender = msg.from || agentName;
        if (!msg.timestamp) continue;
        const dateStr = new Date(msg.timestamp).toISOString().slice(0, 10);
        if (!days.includes(dateStr)) continue;
        if (!agentCounts[sender]) agentCounts[sender] = {};
        agentCounts[sender][dateStr] = (agentCounts[sender][dateStr] || 0) + 1;
      }
    }
  }

  const sortedAgents = Object.entries(agentCounts)
    .map(([name, dateCounts]) => ({
      name,
      total: Object.values(dateCounts).reduce((a, b) => a + b, 0),
      dateCounts,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return { days, agents: sortedAgents };
}

export function AgentActivity({ teams, allInboxes = {} }) {
  const [activeAgents, setActiveAgents] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    if (teams && teams.length > 0) {
      const agents = [];
      teams.forEach(team => {
        if (team.config && team.config.members) {
          team.config.members.forEach(member => {
            const agentTasks = team.tasks?.filter(t =>
              t.owner === member.name && t.status === 'in_progress'
            ) || [];

            agents.push({
              name: member.name,
              team: team.name,
              agentType: member.agentType,
              activeTasks: agentTasks.length,
              currentTask: agentTasks[0]?.subject || 'Idle',
              color: getAgentColor(member.name)
            });
          });
        }
      });
      setActiveAgents(agents.slice(0, 10));
    }
  }, [teams]);

  const getAgentColor = (name) => {
    const colors = [
      '#60a5fa', '#34d399', '#fbbf24', '#f87171',
      '#c084fc', '#22d3ee', '#fb923c', '#a78bfa'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const heatmap = useMemo(() => buildHeatmapData(allInboxes), [allInboxes]);
  const hasHeatmapData = heatmap.agents.length > 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-claude-orange" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>Agent Activity</h3>
        </div>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{activeAgents.length} agents</span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activeAgents.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active agents</p>
          </div>
        ) : (
          activeAgents.map((agent, index) => (
            <div
              key={`${agent.team}-${agent.name}-${index}`}
              className="p-3 rounded-lg hover:border-claude-orange transition-all"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${agent.color}20` }}
                >
                  <Brain className="h-4 w-4" style={{ color: agent.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-heading)' }}>
                      {agent.name}
                    </span>
                    {agent.activeTasks > 0 && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <Zap className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{agent.agentType}</div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <CheckSquare className="h-3 w-3" />
                    <span className="truncate">{agent.currentTask}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-lg font-bold"
                    style={{ color: agent.color }}
                  >
                    {agent.activeTasks}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>tasks</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Activity Heatmap */}
      <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Grid3X3 className="h-4 w-4 text-claude-orange" />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Activity Heatmap</h4>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 30 days</span>
        </div>

        {!hasHeatmapData ? (
          <div className="text-center py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            No message activity to display
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Day labels row */}
            <div style={{ display: 'grid', gridTemplateColumns: '90px repeat(30, 1fr)', gap: '2px', marginBottom: '2px' }}>
              <div />
              {heatmap.days.map((day, i) => (
                <div key={day} className="text-center" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                  {i % 5 === 0 ? new Date(day + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {heatmap.agents.map((agent) => (
              <div
                key={agent.name}
                style={{ display: 'grid', gridTemplateColumns: '90px repeat(30, 1fr)', gap: '2px', marginBottom: '2px' }}
              >
                <div
                  className="text-xs truncate pr-1"
                  style={{ color: 'var(--text-secondary)', lineHeight: '14px' }}
                  title={agent.name}
                >
                  {agent.name}
                </div>
                {heatmap.days.map((day) => {
                  const count = agent.dateCounts[day] || 0;
                  const isHovered = hoveredCell && hoveredCell.agent === agent.name && hoveredCell.day === day;
                  return (
                    <div
                      key={day}
                      className="relative"
                      style={{
                        width: '100%',
                        paddingBottom: '100%',
                        position: 'relative',
                      }}
                      onMouseEnter={() => setHoveredCell({ agent: agent.name, day, count })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: getHeatmapColor(count),
                          borderRadius: '2px',
                          border: isHovered ? '1px solid #f97316' : '1px solid transparent',
                          cursor: 'pointer',
                        }}
                      />
                      {isHovered && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '110%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            whiteSpace: 'nowrap',
                            zIndex: 50,
                            fontSize: '11px',
                            color: 'var(--text-primary)',
                            pointerEvents: 'none',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                          }}
                        >
                          {agent.name} on {day}: {count} message{count !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Less</span>
              {[0, 2, 5, 10, 20].map((val) => (
                <div
                  key={val}
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: getHeatmapColor(val),
                    borderRadius: '2px',
                  }}
                />
              ))}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>More</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
