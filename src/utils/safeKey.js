/**
 * Validates a property key to prevent prototype pollution via dynamic access.
 * Returns null for unsafe keys (__proto__, constructor, prototype).
 */
export function safePropKey(key) {
  const k = String(key ?? '');
  if (k === '__proto__' || k === 'constructor' || k === 'prototype') return null;
  return k;
}

/**
 * Normalizes an inbox value to a flat array of messages.
 * Handles both the array format and the { messages: [] } object format.
 */
export function getInboxMessages(inbox) {
  return Array.isArray(inbox) ? inbox : (inbox?.messages || []);
}
