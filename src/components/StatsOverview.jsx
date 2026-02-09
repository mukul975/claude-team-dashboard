import React from 'react';
import PropTypes from 'prop-types';
import { Users, ListTodo, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function StatsOverview({ stats }) {
  if (!stats) return null;

  const statCards = [
    {
      label: 'Active Teams',
      value: stats.totalTeams,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Total Agents',
      value: stats.totalAgents,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: 'Total Tasks',
      value: stats.totalTasks,
      icon: ListTodo,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    },
    {
      label: 'In Progress',
      value: stats.inProgressTasks,
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Completed',
      value: stats.completedTasks,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Blocked',
      value: stats.blockedTasks,
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    }
  ];

  return (
    <div className="card p-4 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="flex items-center gap-3">
              <div className={`${stat.bgColor} p-2 rounded-lg flex-shrink-0`}>
                <Icon className={`${stat.color} h-4 w-4`} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

StatsOverview.propTypes = {
  stats: PropTypes.shape({
    totalTeams: PropTypes.number,
    totalAgents: PropTypes.number,
    totalTasks: PropTypes.number,
    pendingTasks: PropTypes.number,
    inProgressTasks: PropTypes.number,
    completedTasks: PropTypes.number,
    blockedTasks: PropTypes.number
  })
};
