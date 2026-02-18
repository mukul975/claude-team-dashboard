import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export function useToastNotifications({ teams, allInboxes, lastRawMessage }) {
  const seenInboxCountsRef = useRef({});
  const initializedRef = useRef(false);
  const seenRawMessagesRef = useRef(new Set());

  // Toast for new inbox messages
  useEffect(() => {
    if (!allInboxes || typeof allInboxes !== 'object') return;

    // On first render, snapshot current counts without firing toasts
    if (!initializedRef.current) {
      Object.entries(allInboxes).forEach(([teamName, agents]) => {
        Object.entries(agents || {}).forEach(([agentName, inbox]) => {
          const key = `${teamName}/${agentName}`;
          seenInboxCountsRef.current[key] = (inbox.messages || []).length;
        });
      });
      initializedRef.current = true;
      return;
    }

    Object.entries(allInboxes).forEach(([teamName, agents]) => {
      Object.entries(agents || {}).forEach(([agentName, inbox]) => {
        const key = `${teamName}/${agentName}`;
        const messages = inbox.messages || [];
        const currentCount = messages.length;
        const seenCount = seenInboxCountsRef.current[key] ?? currentCount;

        if (currentCount > seenCount) {
          const newMessages = messages.slice(seenCount);
          newMessages.forEach(msg => {
            const from = msg.from || 'Unknown';
            const text = (msg.summary || msg.text || '').slice(0, 60);
            toast(`${from} \u2192 ${agentName}: ${text}`, { icon: '\uD83D\uDCE8' });
          });
        }

        seenInboxCountsRef.current[key] = currentCount;
      });
    });
  }, [allInboxes]);

  // Toast for teams_update and task_update via lastRawMessage
  useEffect(() => {
    if (!lastRawMessage || !lastRawMessage.type) return;

    // Create a fingerprint to avoid duplicate toasts for the same message
    const fingerprint = JSON.stringify({
      type: lastRawMessage.type,
      ts: lastRawMessage.timestamp || lastRawMessage.ts,
      team: lastRawMessage.teamName || lastRawMessage.team,
    });

    if (seenRawMessagesRef.current.has(fingerprint)) return;
    seenRawMessagesRef.current.add(fingerprint);

    // Cap the seen set size to prevent memory leaks
    if (seenRawMessagesRef.current.size > 500) {
      const entries = Array.from(seenRawMessagesRef.current);
      seenRawMessagesRef.current = new Set(entries.slice(entries.length - 250));
    }

    if (lastRawMessage.type === 'teams_update') {
      const teamNames = (lastRawMessage.data || []).map(t => t.name).filter(Boolean);
      const label = teamNames.length > 0 ? teamNames.join(', ') : 'Teams';
      toast(`Team updated: ${label}`, { icon: '\uD83D\uDC65' });
    }

    if (lastRawMessage.type === 'task_update') {
      const teamName = lastRawMessage.teamName || lastRawMessage.team || 'a team';
      toast(`Task updated in ${teamName}`, { icon: '\u2705' });
    }
  }, [lastRawMessage]);

  return null;
}
