import React from 'react';
import { Server, Database, Wifi, Clock, RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const STATUS_CONFIG = {
  connected:    { label: 'Connected',    color: 'text-green-400' },
  connecting:   { label: 'Connecting',   color: 'text-yellow-400' },
  reconnecting: { label: 'Reconnecting', color: 'text-yellow-400' },
  offline:      { label: 'Offline',      color: 'text-gray-400' },
  error:        { label: 'Error',        color: 'text-red-400' },
};

export function SystemStatus({ isConnected, lastUpdate, connectionStatus, reconnectAttempts }) {
  const statusInfo = STATUS_CONFIG[connectionStatus] || STATUS_CONFIG.connecting;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Server aria-hidden="true" className="h-5 w-5 text-claude-orange" />
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>System Status</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-2">
            <Wifi aria-hidden="true" className={`h-4 w-4 ${statusInfo.color}`} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>WebSocket</span>
          </div>
          <div className="flex items-center gap-2">
            {connectionStatus === 'reconnecting' && (
              <RefreshCw aria-hidden="true" className="h-3 w-3 text-yellow-400 animate-spin" />
            )}
            <span className={`text-xs font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {reconnectAttempts > 0 && connectionStatus !== 'connected' && (
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-2">
              <RefreshCw aria-hidden="true" className="h-4 w-4 text-yellow-400" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reconnect Attempts</span>
            </div>
            <span className="text-xs font-semibold text-yellow-400">
              {reconnectAttempts}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-2">
            <Server aria-hidden="true" className="h-4 w-4 text-blue-400" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Backend API</span>
          </div>
          <span className="text-xs font-semibold text-green-400">Running</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-2">
            <Database aria-hidden="true" className="h-4 w-4 text-purple-400" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>File Watchers</span>
          </div>
          <span className="text-xs font-semibold text-green-400">Active</span>
        </div>

        {lastUpdate && (
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-2">
              <Clock aria-hidden="true" className="h-4 w-4 text-cyan-400" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Last Update</span>
            </div>
            <span className="text-xs font-semibold text-cyan-400">
              {dayjs(new Date(lastUpdate.timestamp || Date.now())).fromNow()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
