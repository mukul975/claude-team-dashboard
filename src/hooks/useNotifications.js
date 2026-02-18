import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'dashboard-notifications';
const MAX_NOTIFICATIONS = 100;

function loadNotifications() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // corrupted storage, reset
  }
  return [];
}

function saveNotifications(notifications) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
  } catch (e) {
    // storage full or unavailable
  }
}

export function useNotifications({ lastRawMessage } = {}) {
  const [notifications, setNotifications] = useState(loadNotifications);
  const seenFingerprintsRef = useRef(new Set());
  const initializedRef = useRef(false);

  // Persist whenever notifications change
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  const addNotification = useCallback((notification) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: notification.type || 'info',
      title: notification.title || '',
      message: notification.message || '',
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false,
      tab: notification.tab || null,
    };
    setNotifications(prev => [entry, ...prev].slice(0, MAX_NOTIFICATIONS));
    return entry;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Watch WebSocket events and auto-generate notifications
  useEffect(() => {
    if (!lastRawMessage || !lastRawMessage.type) return;

    // Skip on first mount to avoid replaying stale data
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    const fingerprint = JSON.stringify({
      type: lastRawMessage.type,
      ts: lastRawMessage.timestamp || lastRawMessage.ts,
      team: lastRawMessage.teamName || lastRawMessage.team,
    });

    if (seenFingerprintsRef.current.has(fingerprint)) return;
    seenFingerprintsRef.current.add(fingerprint);

    // Cap the seen set
    if (seenFingerprintsRef.current.size > 500) {
      const entries = Array.from(seenFingerprintsRef.current);
      seenFingerprintsRef.current = new Set(entries.slice(entries.length - 250));
    }

    const msgType = lastRawMessage.type;

    if (msgType === 'teams_update') {
      const teamNames = (lastRawMessage.data || []).map(t => t.name).filter(Boolean);
      const label = teamNames.length > 0 ? teamNames.join(', ') : 'Teams';
      addNotification({
        type: 'team',
        title: 'Team Updated',
        message: `Team data refreshed: ${label}`,
        tab: 'teams',
      });
    }

    if (msgType === 'task_update') {
      const teamName = lastRawMessage.teamName || lastRawMessage.team || 'a team';
      addNotification({
        type: 'task',
        title: 'Task Updated',
        message: `A task was updated in ${teamName}`,
        tab: 'teams',
      });
    }

    if (msgType === 'inbox_update') {
      const teamName = lastRawMessage.teamName || lastRawMessage.team || '';
      const agentName = lastRawMessage.agentName || lastRawMessage.agent || '';
      addNotification({
        type: 'message',
        title: 'New Inbox Message',
        message: agentName ? `${agentName} received a message${teamName ? ` in ${teamName}` : ''}` : `New inbox activity${teamName ? ` in ${teamName}` : ''}`,
        tab: 'inboxes',
      });
    }

    if (msgType === 'agent_output') {
      const agentName = lastRawMessage.agentName || lastRawMessage.agent || 'An agent';
      addNotification({
        type: 'output',
        title: 'Agent Output',
        message: `${agentName} produced new output`,
        tab: 'history',
      });
    }

    if (msgType === 'connection' || msgType === 'status') {
      const status = lastRawMessage.status || lastRawMessage.state || '';
      if (status === 'disconnected' || status === 'error') {
        addNotification({
          type: 'system',
          title: 'Connection Issue',
          message: `WebSocket ${status}`,
          tab: 'monitoring',
        });
      }
    }
  }, [lastRawMessage, addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllRead,
    clearAll,
  };
}
