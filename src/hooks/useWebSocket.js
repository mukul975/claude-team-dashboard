import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * WebSocket hook with structured per-type state, exponential backoff,
 * and online/offline awareness.
 * @param {string} url - WebSocket URL to connect to
 * @returns {Object} Typed WebSocket state
 */
export function useWebSocket(url) {
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState(null);
  const [teamHistory, setTeamHistory] = useState([]);
  const [agentOutputs, setAgentOutputs] = useState([]);
  const [allInboxes, setAllInboxes] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastRawMessage, setLastRawMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const isPausedRef = useRef(false);
  const urlRef = useRef(url);
  urlRef.current = url;

  const connect = useCallback(() => {
    if (isPausedRef.current) return;

    try {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      setConnectionStatus(reconnectAttempts.current > 0 ? 'reconnecting' : 'connecting');
      const ws = new WebSocket(urlRef.current);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastRawMessage(message);

          if (message.stats) setStats(message.stats);
          if (message.teamHistory) setTeamHistory(message.teamHistory);
          if (message.allInboxes) setAllInboxes(message.allInboxes);

          if (message.type === 'initial_data') {
            if (message.data) setTeams(message.data);
            if (message.agentOutputs || message.outputs) setAgentOutputs(message.agentOutputs || message.outputs);
          } else if (message.type === 'inbox_update') {
            setAllInboxes(prev => ({ ...prev, [message.teamName]: message.inboxes }));
          } else if (message.type === 'task_update' && message.data) {
            setTeams(message.data);
          } else if (message.type === 'teams_update' && message.data) {
            setTeams(message.data);
            if (message.removedTeam) {
              setAllInboxes(prev => {
                const next = { ...prev };
                delete next[message.removedTeam];
                return next;
              });
            }
          } else if (message.type === 'agent_outputs_update') {
            setAgentOutputs(message.outputs);
          } else if (message.data) {
            // Fallback: any message with .data updates teams
            setTeams(message.data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error');
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        if (!navigator.onLine) {
          setConnectionStatus('offline');
          isPausedRef.current = true;
          return;
        }

        setConnectionStatus('reconnecting');

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to connect');
      setConnectionStatus('error');
    }
  }, []);

  useEffect(() => {
    connect();

    const handleOnline = () => {
      isPausedRef.current = false;
      reconnectAttempts.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      connect();
    };

    const handleOffline = () => {
      isPausedRef.current = true;
      setConnectionStatus('offline');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    teams,
    stats,
    teamHistory,
    agentOutputs,
    allInboxes,
    isConnected,
    error,
    lastRawMessage,
    connectionStatus,
    reconnectAttempts: reconnectAttempts.current,
  };
}
