import React, { useState, useEffect } from 'react';
import { Users, Zap, Brain, CheckSquare } from 'lucide-react';

export function AgentActivity({ teams }) {
  const [activeAgents, setActiveAgents] = useState([]);

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
      setActiveAgents(agents.slice(0, 10)); // Show top 10
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

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-claude-orange" />
          <h3 className="text-lg font-semibold text-white">Agent Activity</h3>
        </div>
        <span className="text-sm text-gray-400">{activeAgents.length} agents</span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activeAgents.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active agents</p>
          </div>
        ) : (
          activeAgents.map((agent, index) => (
            <div
              key={`${agent.team}-${agent.name}-${index}`}
              className="p-3 rounded-lg bg-gray-700/50 border border-gray-600 hover:border-claude-orange transition-all"
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
                    <span className="text-sm font-semibold text-white truncate">
                      {agent.name}
                    </span>
                    {agent.activeTasks > 0 && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <Zap className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mb-1">{agent.agentType}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
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
                  <div className="text-xs text-gray-400">tasks</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
