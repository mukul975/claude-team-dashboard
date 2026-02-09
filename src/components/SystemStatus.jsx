import React from 'react';
import { Server, Database, Wifi, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function SystemStatus({ isConnected, lastUpdate }) {

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Server className="h-5 w-5 text-claude-orange" />
        <h3 className="text-lg font-semibold text-white">System Status</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#1e293b' }}>
          <div className="flex items-center gap-2">
            <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-sm text-gray-300">WebSocket</span>
          </div>
          <span className={`text-xs font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#1e293b' }}>
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-gray-300">Backend API</span>
          </div>
          <span className="text-xs font-semibold text-green-400">Running</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#1e293b' }}>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-gray-300">File Watchers</span>
          </div>
          <span className="text-xs font-semibold text-green-400">Active</span>
        </div>

        {lastUpdate && (
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#1e293b' }}>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-gray-300">Last Update</span>
            </div>
            <span className="text-xs font-semibold text-cyan-400">
              {formatDistanceToNow(new Date(lastUpdate.timestamp || Date.now()), { addSuffix: true })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
