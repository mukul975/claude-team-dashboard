import React from 'react';
import PropTypes from 'prop-types';
import { WifiOff, RefreshCw, Zap } from 'lucide-react';

export function ConnectionStatus({ isConnected, error }) {
  if (isConnected) {
    return (
      <div
        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 group"
        role="status"
        aria-live="polite"
        aria-label="Connection status: Connected"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(21, 128, 61, 0.15) 100%)',
          color: '#4ade80',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          textShadow: '0 0 10px rgba(34, 197, 94, 0.4)'
        }}
      >
        {/* Animated Pulse Indicator */}
        <div className="relative">
          <Zap
            className="h-4 w-4 group-hover:scale-110 transition-transform duration-300"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.6))'
            }}
          />
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: 'rgba(34, 197, 94, 0.4)'
            }}
          />
        </div>

        <span className="tracking-wide">Connected</span>

        {/* Live Indicator Dot */}
        <div
          className="h-2 w-2 rounded-full animate-pulse"
          style={{
            background: '#4ade80',
            boxShadow: '0 0 8px rgba(34, 197, 94, 0.8), 0 0 16px rgba(34, 197, 94, 0.4)'
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300"
        role="alert"
        aria-live="assertive"
        aria-label={`Connection error: ${error}`}
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.15) 100%)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          textShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
          animation: 'shake 0.5s ease-in-out'
        }}
      >
        <WifiOff
          className="h-4 w-4"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.6))'
          }}
        />
        <span className="tracking-wide truncate max-w-xs">{error}</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300"
      role="status"
      aria-live="polite"
      aria-label="Connection status: Connecting"
      aria-busy="true"
      style={{
        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.25) 0%, rgba(202, 138, 4, 0.15) 100%)',
        color: '#facc15',
        border: '1px solid rgba(234, 179, 8, 0.4)',
        boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        textShadow: '0 0 10px rgba(234, 179, 8, 0.4)'
      }}
    >
      <RefreshCw
        className="h-4 w-4 animate-spin"
        style={{
          filter: 'drop-shadow(0 0 6px rgba(234, 179, 8, 0.6))',
          animationDuration: '2s'
        }}
      />
      <span className="tracking-wide">Connecting...</span>

      {/* Pulsing Dots */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: '#facc15',
              animation: 'pulse 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
              boxShadow: '0 0 6px rgba(234, 179, 8, 0.6)'
            }}
          />
        ))}
      </div>
    </div>
  );
}

ConnectionStatus.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  error: PropTypes.string
};
