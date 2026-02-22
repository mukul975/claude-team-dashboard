import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Crown, Cpu, Zap } from 'lucide-react';
import { getAgentInitials, getAgentColor } from "../utils/formatting";
import { copyToClipboard } from "../utils/clipboard";

const TAILWIND_TO_HEX = {
  'bg-blue-600': '#2563eb',
  'bg-purple-600': '#9333ea',
  'bg-green-600': '#16a34a',
  'bg-red-600': '#dc2626',
  'bg-yellow-600': '#ca8a04',
  'bg-pink-600': '#db2777',
  'bg-indigo-600': '#4f46e5',
  'bg-orange-500': '#f97316',
};

export function AgentCard({ agent, isLead, agentStatus }) {
  const [isHovered, setIsHovered] = useState(false);
  const [statusHovered, setStatusHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const agentColorClass = getAgentColor(agent?.name);
  const avatarHex = TAILWIND_TO_HEX[agentColorClass] ?? '#6b7280';

  // Added copy handler
  const handleCopy = async () => {
    const success = await copyToClipboard(agent.agentId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="p-5"
      role="article"
      tabIndex={0}
      aria-label={`Agent ${agent.name}${isLead ? ', team lead' : ''}`}
      style={{
        position: 'relative',
        borderRadius: '16px',
        transition: 'all 0.3s',
        background: isLead
          ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(202, 138, 4, 0.08) 100%)'
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)',
        border: `2px solid ${isLead ? 'rgba(234, 179, 8, 0.3)' : 'rgba(59, 130, 246, 0.25)'}`,
        boxShadow: isHovered
          ? `0 8px 24px ${isLead ? 'rgba(234, 179, 8, 0.25)' : 'rgba(59, 130, 246, 0.2)'}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
          : 'var(--card-shadow)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {/* Everything above unchanged */}

      <div className="flex items-start justify-between" style={{ position: 'relative', zIndex: 10 }}>
        <div className="flex items-start gap-4 flex-1">

          {/* Avatar Circle */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#ffffff',
              border: isLead ? '2px solid #facc15' : '2px solid transparent',
              backgroundColor: avatarHex,
              boxShadow: isHovered ? `0 0 12px ${avatarHex}` : 'none',
              position: 'relative',
              transition: 'all 0.3s',
              flexShrink: 0,
            }}
          >
            {getAgentInitials(agent?.name)}

            {isLead && (
              <Crown
                size={12}
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--bg-card)',
                  borderRadius: '50%',
                  padding: '2px',
                  color: '#facc15',
                }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {/* Existing code unchanged */}
              <h5
                className="font-bold text-lg truncate"
                style={{
                  color: 'var(--text-heading)',
                  letterSpacing: '-0.01em',
                }}
              >
                {agent.name}
              </h5>

              {isLead && (
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider"
                  style={{
                    textTransform: 'uppercase',
                    gap: '6px',
                    background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(202, 138, 4, 0.2) 100%)',
                    color: '#facc15',
                    border: '1px solid rgba(234, 179, 8, 0.5)',
                    boxShadow: '0 2px 8px rgba(234, 179, 8, 0.3)',
                  }}
                >
                  <Zap className="h-3 w-3" aria-hidden="true" />
                  Lead
                </span>
              )}
            </div>

            {agent.agentType && (
              <div
                className="flex items-center gap-2 mb-2 py-1 rounded-lg inline-flex"
                style={{
                  paddingLeft: '10px',
                  paddingRight: '10px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <Cpu className="h-4 w-4" aria-hidden="true" style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm truncate font-medium" style={{ color: 'var(--text-muted)' }}>
                  {agent.agentType}
                </span>
              </div>
            )}

            {/*  UPDATED ID SECTION WITH COPY BUTTON */}
            <div
              className="flex items-center gap-2"
              style={{
                fontFamily: 'monospace',
                color: 'var(--text-muted)',
              }}
            >
              <p
                className="text-xs truncate"
                title={agent.agentId}
              >
                ID: {agent.agentId?.substring(0, 12)}...
              </p>

              <button
                onClick={handleCopy}
                title="Copy agent ID"
                aria-label="Copy agent ID"
                style={{
                  fontSize: '12px',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? '✓ Copied!' : '📋'}
              </button>
            </div>

          </div>
        </div>
      </div>

      {isHovered && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '16px',
            pointerEvents: 'none',
            background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)',
            animation: 'shimmer 2s ease-in-out infinite',
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
    model: PropTypes.string,
  }).isRequired,
  isLead: PropTypes.bool,
  agentStatus: PropTypes.shape({
    status: PropTypes.string,
    color: PropTypes.string,
    label: PropTypes.string,
    dot: PropTypes.string,
    pulse: PropTypes.bool,
    tooltipText: PropTypes.string,
  }),
};
