import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Activity, Circle } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export function ActivityFeed({ updates }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (updates) {
      const newActivity = {
        id: Date.now(),
        type: updates.type,
        timestamp: new Date().toISOString(),
        message: getActivityMessage(updates)
      };

      setActivities(prev => [newActivity, ...prev].slice(0, 50));
    }
  }, [updates]);

  const getActivityMessage = (update) => {
    switch (update.type) {
      case 'initial_data':
        return `Connected to dashboard - ${update.data?.length || 0} teams loaded`;
      case 'teams_update':
        return 'Team configuration updated';
      case 'task_update':
        return 'Task status changed';
      default:
        return 'System event';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'initial_data':
        return 'text-green-400';
      case 'teams_update':
        return 'text-blue-400';
      case 'task_update':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-claude-orange" />
        <h3 className="text-lg font-semibold text-white">Activity Feed</h3>
        <span className="ml-auto text-sm text-gray-400">
          {activities.length} events
        </span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No activity yet</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-gray-700/30 rounded-lg p-3 border border-gray-600"
            >
              <div className="flex items-start gap-3">
                <Circle
                  className={`h-3 w-3 mt-1 ${getActivityColor(activity.type)}`}
                  fill="currentColor"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{activity.message}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

ActivityFeed.propTypes = {
  updates: PropTypes.shape({
    type: PropTypes.string,
    data: PropTypes.array,
    stats: PropTypes.object
  })
};
