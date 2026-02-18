import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Bot, Crown, Cpu, Zap } from 'lucide-react';

export function AgentCard({ agent, isLead, agentStatus }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group rounded-2xl p-5 transition-all duration-300"
      style={{
        background: isLead
          ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(202, 138, 4, 0.08) 100%)'
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)',
        border: `2px solid ${isLead ? 'rgba(234, 179, 8, 0.3)' : 'rgba(59, 130, 246, 0.25)'}`,
        boxShadow: isHovered
          ? `0 8px 24px ${isLead ? 'rgba(234, 179, 8, 0.25)' : 'rgba(59, 130, 246, 0.2)'}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
          : '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient Border Animation */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: isLead
            ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), transparent 50%, rgba(234, 179, 8, 0.1))'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), transparent 50%, rgba(59, 130, 246, 0.1))',
          pointerEvents: 'none'
        }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-start gap-4 flex-1">
          {/* Icon Container with Glow */}
          <div
            className="relative p-3 rounded-xl transition-all duration-300"
            style={{
              background: isLead
                ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.25) 0%, rgba(202, 138, 4, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)',
              boxShadow: isHovered
                ? `0 4px 16px ${isLead ? 'rgba(234, 179, 8, 0.4)' : 'rgba(59, 130, 246, 0.35)'}, inset 0 1px 0 rgba(255, 255, 255, 0.15)`
                : `0 2px 8px ${isLead ? 'rgba(234, 179, 8, 0.3)' : 'rgba(59, 130, 246, 0.25)'}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
              border: `1px solid ${isLead ? 'rgba(234, 179, 8, 0.4)' : 'rgba(59, 130, 246, 0.35)'}`,
              transform: isHovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1) rotate(0deg)'
            }}
          >
            {isLead ? (
              <Crown
                className="h-6 w-6"
                aria-hidden="true"
                style={{
                  color: '#facc15',
                  filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.6))'
                }}
              />
            ) : (
              <Bot
                className="h-6 w-6"
                aria-hidden="true"
                style={{
                  color: '#60a5fa',
                  filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
                }}
              />
            )}

            {/* Pulsing Glow Effect */}
            {isHovered && (
              <div
                className="absolute inset-0 rounded-xl animate-pulse"
                style={{
                  background: isLead
                    ? 'radial-gradient(circle, rgba(234, 179, 8, 0.3), transparent 70%)'
                    : 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent 70%)',
                  zIndex: -1
                }}
              />
            )}
          </div>

          {/* Agent Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {agentStatus && (
                <div className="relative group/status" title={agentStatus.tooltipText}>
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${agentStatus.pulse ? 'animate-pulse' : ''}`}
                    style={{
                      backgroundColor: agentStatus.color,
                      boxShadow: agentStatus.pulse ? `0 0 8px ${agentStatus.color}` : 'none'
                    }}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-xs text-gray-200 rounded whitespace-nowrap opacity-0 group-hover/status:opacity-100 transition-opacity pointer-events-none z-20 border border-gray-700">
                    {agentStatus.tooltipText}
                  </div>
                </div>
              )}
              <h5
                className="text-white font-bold text-lg truncate"
                style={{
                  letterSpacing: '-0.01em',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
              >
                {agent.name}
              </h5>

              {isLead && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(202, 138, 4, 0.2) 100%)',
                    color: '#facc15',
                    border: '1px solid rgba(234, 179, 8, 0.5)',
                    boxShadow: '0 2px 8px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                    textShadow: '0 0 10px rgba(234, 179, 8, 0.4)'
                  }}
                >
                  <Zap className="h-3 w-3" aria-hidden="true" />
                  Lead
                </span>
              )}
            </div>

            {agent.agentType && (
              <div
                className="flex items-center gap-2 mb-2 px-2.5 py-1 rounded-lg inline-flex"
                style={{
                  background: 'rgba(55, 65, 81, 0.4)',
                  border: '1px solid rgba(75, 85, 99, 0.3)'
                }}
              >
                <Cpu className="h-4 w-4 text-gray-400" aria-hidden="true" />
                <span className="text-sm text-gray-300 truncate font-medium">
                  {agent.agentType}
                </span>
              </div>
            )}

            <p
              className="text-xs font-mono truncate"
              style={{
                color: 'rgba(156, 163, 175, 0.8)'
              }}
              title={agent.agentId}
            >
              ID: {agent.agentId?.substring(0, 12)}...
            </p>
          </div>
        </div>
      </div>

      {/* Shine Effect on Hover */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)',
            animation: 'shimmer 2s ease-in-out infinite'
          }}
        />
      )}
    </div>
  );
}

AgentCard.propTypes = {
  agent: PropTypes.shape({
    name: PropTypes.string.isRequired,
    agentId: PropTypes.string.isRequired,
    agentType: PropTypes.string,
    model: PropTypes.string
  }).isRequired,
  isLead: PropTypes.bool,
  agentStatus: PropTypes.shape({
    status: PropTypes.string,
    color: PropTypes.string,
    label: PropTypes.string,
    dot: PropTypes.string,
    pulse: PropTypes.bool,
    tooltipText: PropTypes.string
  })
};
