import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Maximize2, Minimize2, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { SkeletonOutputViewer } from './SkeletonLoader';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export function AgentOutputViewer({ agentOutputs }) {
  const [selectedOutput, setSelectedOutput] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [localOutputs, setLocalOutputs] = useState(agentOutputs || []);
  const outputRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Fetch outputs from API
  const fetchOutputs = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setRefreshError(null);

      const response = await fetch(`http://${window.location.hostname}:3001/api/agent-outputs`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.outputs && Array.isArray(data.outputs)) {
        setLocalOutputs(data.outputs);
        return data.outputs;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching agent outputs:', error);
      setRefreshError(error.message);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    await fetchOutputs();
  }, [fetchOutputs]);

  // Use WebSocket data when available, fallback to polling
  useEffect(() => {
    if (agentOutputs && agentOutputs.length > 0) {
      setLocalOutputs(agentOutputs);
      setRefreshError(null);
    }
  }, [agentOutputs]);

  // Fallback polling mechanism (only if no WebSocket data)
  useEffect(() => {
    // If we haven't received any data via WebSocket, start polling
    if (!agentOutputs || agentOutputs.length === 0) {
      // Initial fetch
      fetchOutputs();

      // Poll every 5 seconds as fallback
      pollingIntervalRef.current = setInterval(() => {
        fetchOutputs();
      }, 5000);
    } else {
      // Clear polling if WebSocket is working
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [agentOutputs, fetchOutputs]);

  useEffect(() => {
    // Auto-select most recent output
    if (localOutputs && localOutputs.length > 0 && !selectedOutput) {
      setSelectedOutput(localOutputs[0]);
    }

    // Update selected output if it exists in new data
    if (selectedOutput && localOutputs && localOutputs.length > 0) {
      const updatedOutput = localOutputs.find(o => o.taskId === selectedOutput.taskId);
      if (updatedOutput && updatedOutput.lastModified !== selectedOutput.lastModified) {
        setSelectedOutput(updatedOutput);
      }
    }
  }, [localOutputs, selectedOutput]);

  useEffect(() => {
    // Auto-scroll to bottom when content updates
    if (autoScroll && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [selectedOutput, autoScroll]);

  const downloadOutput = () => {
    if (!selectedOutput) return;

    const blob = new Blob([selectedOutput.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-${selectedOutput.taskId}-output.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if ((!localOutputs || localOutputs.length === 0) && isRefreshing) {
    return <SkeletonOutputViewer />;
  }

  if (!localOutputs || localOutputs.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-claude-orange" />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>Agent Output Stream</h3>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            aria-label="Refresh outputs"
            title="Refresh outputs"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {refreshError && (
          <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-400 font-medium">Failed to load outputs</p>
              <p className="text-xs text-red-400/80 mt-1">{refreshError}</p>
            </div>
          </div>
        )}

        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <Terminal className="h-16 w-16 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No agent outputs yet. Agent activity will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-claude-orange animate-pulse" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>Agent Output Stream</h3>
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            aria-label="Refresh outputs"
            title="Refresh outputs"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              autoScroll
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : ''
            }`}
            style={!autoScroll ? { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' } : {}}
            aria-label={autoScroll ? "Auto-scroll enabled" : "Enable auto-scroll"}
            title={autoScroll ? "Auto-scroll enabled" : "Enable auto-scroll"}
          >
            {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
          </button>
          <button
            onClick={downloadOutput}
            disabled={!selectedOutput}
            className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            aria-label="Download agent output"
            title="Download agent output"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg transition-colors"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            aria-label={isExpanded ? 'Minimize output viewer' : 'Maximize output viewer'}
            aria-expanded={isExpanded}
            title={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {refreshError && (
        <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-400 font-medium">Connection Issue</p>
            <p className="text-xs text-yellow-400/80 mt-1">
              {refreshError} - Displaying cached data or using fallback polling
            </p>
          </div>
        </div>
      )}

      {/* Output Selector */}
      <div className="mb-4">
        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Select Agent Output:</label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {localOutputs.map((output, index) => (
            <button
              key={output.taskId}
              onClick={() => setSelectedOutput(output)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedOutput?.taskId === output.taskId
                  ? 'bg-claude-orange text-white shadow-lg'
                  : ''
              }`}
              style={selectedOutput?.taskId !== output.taskId
                ? { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', animation: `fadeInScale 0.3s ease-out ${index * 0.05}s backwards` }
                : { animation: `fadeInScale 0.3s ease-out ${index * 0.05}s backwards` }
              }
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                <span>Task {output.taskId}</span>
              </div>
              <div className="text-xs opacity-75 mt-0.5">
                {dayjs(output.lastModified).fromNow()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Output Display */}
      {selectedOutput && (
        <>
          {/* Output Info */}
          <div className="mb-3 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span style={{ color: 'var(--text-muted)' }}>
                  Task ID: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{selectedOutput.taskId}</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  Size: <span style={{ color: 'var(--text-primary)' }}>{formatSize(selectedOutput.size)}</span>
                </span>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>
                Updated: <span style={{ color: 'var(--text-primary)' }}>{dayjs(selectedOutput.lastModified).fromNow()}</span>
              </span>
            </div>
          </div>

          {/* Terminal Output */}
          <div
            ref={outputRef}
            className={`font-mono text-sm rounded-lg p-4 overflow-auto ${
              isExpanded ? 'h-[calc(100vh-300px)]' : 'h-[500px]'
            }`}
            style={{ background: 'var(--code-bg)', border: '1px solid var(--code-border)' }}
            onScroll={(e) => {
              const { scrollTop, scrollHeight, clientHeight } = e.target;
              const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
              if (!isAtBottom && autoScroll) {
                setAutoScroll(false);
              }
            }}
          >
            {selectedOutput.content ? (
              <pre className="whitespace-pre-wrap break-words" style={{ color: 'var(--text-primary)' }}>
                {selectedOutput.content}
              </pre>
            ) : (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium mb-2">No output content available</p>
                <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                  This task output is empty. Agent outputs will appear here when agents write to their output streams during task execution.
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Empty outputs are normal for agents that complete tasks quickly without verbose logging.
                </p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-3 text-xs text-center flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            <span>
              Real-time output from Claude Code agent • Updates via WebSocket
              {!agentOutputs || agentOutputs.length === 0 ? ' (fallback polling active)' : ''}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
