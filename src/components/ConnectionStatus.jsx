import React from 'react';
import PropTypes from 'prop-types';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function ConnectionStatus({ isConnected, error }) {
  if (isConnected) {
    return (
      <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full border border-green-500/30">
        <Wifi className="h-4 w-4" />
        <span className="text-sm font-medium">Connected</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full border border-red-500/30">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-500/30">
      <RefreshCw className="h-4 w-4 animate-spin" />
      <span className="text-sm font-medium">Connecting...</span>
    </div>
  );
}

ConnectionStatus.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  error: PropTypes.string
};
