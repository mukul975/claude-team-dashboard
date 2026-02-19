import { useEffect, useState, useRef, useCallback } from 'react';
import { apiFetch } from '../utils/api.js';

// How long without a WS data message before falling back to REST polling
const WS_STALE_THRESHOLD_MS = 20_000;
// How often to poll via REST when WS is stale/disconnected
const REST_POLL_INTERVAL_MS = 15_000;

/** Reject prototype-polluting keys from server-supplied property names. */
const safeTeamKey = (key) => {
  const k = String(key ?? '');
  if (k === '__proto__' || k === 'constructor' || k === 'prototype' || k === '') return null;
  return k;
};

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
  const prevUrlRef = useRef(url);
  const lastDataReceivedRef = useRef(0); // timestamp of last meaningful WS data message
  urlRef.current = url;

  const connect = useCallback(() => {
    if (isPausedRef.current) return;
    // Don't connect without a token — server will reject with 4001 anyway
    if (!urlRef.current.includes('token=')) return;

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
          lastDataReceivedRef.current = Date.now();

          if (message.type === 'initial_data') {
            if (message.data) setTeams(message.data);
            if (message.stats) setStats(message.stats);
            if (message.teamHistory) setTeamHistory(message.teamHistory);
            if (message.allInboxes) setAllInboxes(message.allInboxes);
            if (message.agentOutputs || message.outputs) setAgentOutputs(message.agentOutputs || message.outputs);
          } else if (message.type === 'inbox_update') {
            const teamKey = safeTeamKey(message.teamName);
            if (teamKey !== null) {
              setAllInboxes(prev => ({ ...prev, [teamKey]: message.inboxes }));
            }
          } else if (message.type === 'task_update' && message.data) {
            setTeams(message.data);
          } else if (message.type === 'teams_update' && message.data) {
            setTeams(message.data);
            if (message.removedTeam) {
              const removedKey = safeTeamKey(message.removedTeam);
              if (removedKey !== null) {
                setAllInboxes(prev => {
                  const next = { ...prev };
                  delete next[removedKey];
                  return next;
                });
              }
            }
          } else if (message.type === 'agent_outputs_update') {
            setAgentOutputs(message.outputs);
          } else {
            console.warn('[WS] Unrecognized message type:', message.type, message);
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err, event.data);
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

  // When the URL gains a token (after login/setup), cancel any pending backoff
  // and reconnect immediately instead of waiting up to 30 seconds
  useEffect(() => {
    if (prevUrlRef.current === url) return;
    prevUrlRef.current = url;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttempts.current = 0;
    connect();
  }, [url, connect]);

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

  // REST polling fallback — kicks in when WS is disconnected OR has gone quiet
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const wsIsStale = Date.now() - lastDataReceivedRef.current > WS_STALE_THRESHOLD_MS;
      const wsDown = !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN;
      if (!wsIsStale && !wsDown) return; // WS is live and fresh — skip REST poll

      try {
        const res = await apiFetch('/api/teams');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.teams)) setTeams(data.teams);
        if (data.stats) setStats(data.stats);
        if (Array.isArray(data.teamHistory)) setTeamHistory(data.teamHistory);
        lastDataReceivedRef.current = Date.now();
      } catch {
        // silently ignore poll errors — WS will reconnect on its own
      }
    }, REST_POLL_INTERVAL_MS);

    return () => clearInterval(pollInterval);
  }, []);

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
