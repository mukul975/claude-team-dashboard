import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp, Activity, Clock } from 'lucide-react';
import { AgentCard } from './AgentCard';
import { TaskList } from './TaskList';
import { formatDistanceToNow } from 'date-fns';

export function TeamCard({ team }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const { name, config, tasks, lastUpdated } = team;
  const members = config.members || [];
  const lead = members.find(m => m.name === config.leadName);

  const taskStats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  return (
    <div className="card border-l-4 border-l-claude-orange">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-claude-orange/20 p-2 rounded-lg">
            <Users className="h-6 w-6 text-claude-orange" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{name}</h3>
            {config.description && (
              <p className="text-gray-400 text-sm mt-1">{config.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-1 rounded-full">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-300">{members.length} agents</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-1 rounded-full">
          <Activity className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-300">{tasks.length} tasks</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-1 rounded-full">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-300">
            {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <span className="badge badge-pending">
          {taskStats.pending} pending
        </span>
        <span className="badge badge-in-progress">
          {taskStats.inProgress} in progress
        </span>
        <span className="badge badge-completed">
          {taskStats.completed} completed
        </span>
      </div>

      {isExpanded && (
        <div className="space-y-6 mt-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lead && (
                <AgentCard agent={lead} isLead={true} />
              )}
              {members
                .filter(m => m.name !== config.leadName)
                .map((agent, index) => (
                  <AgentCard key={index} agent={agent} isLead={false} />
                ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Tasks
            </h4>
            <TaskList tasks={tasks} />
          </div>
        </div>
      )}
    </div>
  );
}
