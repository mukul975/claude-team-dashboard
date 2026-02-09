import React from 'react';
import { Bot, Crown, Cpu } from 'lucide-react';

export function AgentCard({ agent, isLead }) {
  return (
    <div className={`bg-gray-700/50 rounded-lg p-4 border ${
      isLead ? 'border-yellow-500/50' : 'border-gray-600'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${
            isLead ? 'bg-yellow-500/20' : 'bg-blue-500/20'
          }`}>
            {isLead ? (
              <Crown className="h-5 w-5 text-yellow-400" />
            ) : (
              <Bot className="h-5 w-5 text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h5 className="text-white font-semibold truncate">{agent.name}</h5>
              {isLead && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                  Lead
                </span>
              )}
            </div>
            {agent.agentType && (
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <Cpu className="h-3.5 w-3.5" />
                <span className="truncate">{agent.agentType}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1 truncate" title={agent.agentId}>
              ID: {agent.agentId?.substring(0, 8)}...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
