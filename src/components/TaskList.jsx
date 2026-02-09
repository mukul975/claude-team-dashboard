import React from 'react';
import { Circle, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';

export function TaskList({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No tasks yet</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Circle className="h-5 w-5 text-yellow-400" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-400" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status, blockedBy) => {
    if (blockedBy && blockedBy.length > 0) {
      return <span className="badge badge-blocked">Blocked</span>;
    }
    switch (status) {
      case 'pending':
        return <span className="badge badge-pending">Pending</span>;
      case 'in_progress':
        return <span className="badge badge-in-progress">In Progress</span>;
      case 'completed':
        return <span className="badge badge-completed">Completed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <div
          key={task.id || index}
          className="bg-gray-700/30 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {getStatusIcon(task.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h5 className="text-white font-medium">{task.subject}</h5>
                {getStatusBadge(task.status, task.blockedBy)}
              </div>

              {task.description && (
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-2">
                {task.owner && (
                  <div className="flex items-center gap-1.5 bg-gray-700/50 px-2 py-1 rounded text-xs text-gray-300">
                    <User className="h-3 w-3" />
                    <span>{task.owner}</span>
                  </div>
                )}

                {task.blockedBy && task.blockedBy.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded text-xs text-red-400 border border-red-500/30">
                    <AlertCircle className="h-3 w-3" />
                    <span>Blocked by {task.blockedBy.length} task(s)</span>
                  </div>
                )}

                {task.blocks && task.blocks.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-orange-500/10 px-2 py-1 rounded text-xs text-orange-400 border border-orange-500/30">
                    <AlertCircle className="h-3 w-3" />
                    <span>Blocks {task.blocks.length} task(s)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
