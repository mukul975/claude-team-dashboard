import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  X, Bell, BellOff,
  Users, CheckSquare, MessageSquare, Terminal, AlertTriangle, Info,
} from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

const ICON_MAP = {
  team: Users, task: CheckSquare, message: MessageSquare,
  output: Terminal, system: AlertTriangle, info: Info,
};

const TYPE_COLORS = {
  team:    { border: '#3b82f6', bg: 'rgba(59,130,246,0.09)',  icon: '#60a5fa' },
  task:    { border: '#22c55e', bg: 'rgba(34,197,94,0.09)',   icon: '#4ade80' },
  message: { border: '#f97316', bg: 'rgba(249,115,22,0.09)',  icon: '#fb923c' },
  output:  { border: '#a855f7', bg: 'rgba(168,85,247,0.09)',  icon: '#c084fc' },
  system:  { border: '#ef4444', bg: 'rgba(239,68,68,0.09)',   icon: '#f87171' },
  info:    { border: '#6b7280', bg: 'rgba(107,114,128,0.09)', icon: '#9ca3af' },
};

function formatRelativeTime(timestamp) {
  const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function groupNotifications(notifications) {
  const now = Date.now();
  const ONE_MIN = 60_000;
  const ONE_DAY = 86_400_000;
  const groups = { justNow: [], today: [], earlier: [] };
  notifications.forEach(n => {
    const diff = now - new Date(n.timestamp).getTime();
    if (diff < ONE_MIN) groups.justNow.push(n);
    else if (diff < ONE_DAY) groups.today.push(n);
    else groups.earlier.push(n);
  });
  return groups;
}

function NotificationItem({ notification, onMarkRead, onNavigate }) {
  const IconComponent = ICON_MAP[notification.type] || Info;
  const colors = TYPE_COLORS[notification.type] || TYPE_COLORS.info;

  const handleClick = () => {
    if (!notification.read) onMarkRead(notification.id);
    if (notification.tab && onNavigate) onNavigate(notification.tab);
  };

  const ariaLabel = [notification.title, notification.message, notification.tab ? `Go to ${notification.tab}` : ''].filter(Boolean).join(' — ');

  return (
    <button
      onClick={handleClick}
      aria-label={ariaLabel}
      className="notif-item w-full text-left flex items-start"
      style={{
        gap: 12,
        padding: '12px 16px',
        borderLeft: `3px solid ${colors.border}`,
        background: !notification.read ? colors.bg : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: colors.bg,
          color: colors.icon,
          marginTop: 2,
        }}
      >
        <IconComponent style={{ width: 14, height: 14 }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between" style={{ gap: 8 }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)', lineHeight: 1.3 }}>
            {notification.title}
          </span>
          {!notification.read && (
            <span style={{
              flexShrink: 0,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#e8750a',
              marginTop: 4,
              display: 'inline-block',
            }} />
          )}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {notification.message}
        </p>
        <span className="text-xs block" style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 11 }}>
          {formatRelativeTime(notification.timestamp)}
        </span>
      </div>
    </button>
  );
}

NotificationItem.propTypes = {
  notification: PropTypes.object.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onNavigate: PropTypes.func,
};

function NotificationGroup({ label, notifications, onMarkRead, onNavigate }) {
  if (notifications.length === 0) return null;
  const groupId = `notif-group-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div role="group" aria-labelledby={groupId}>
      <div
        id={groupId}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          padding: '6px 16px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          background: 'var(--bg-primary)',
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border-color)',
          borderLeft: '2px solid #e8750a',
        }}
      >
        {label}
      </div>
      {notifications.map(n => (
        <NotificationItem
          key={n.id}
          notification={n}
          onMarkRead={onMarkRead}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

NotificationGroup.propTypes = {
  label: PropTypes.string.isRequired,
  notifications: PropTypes.array.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onNavigate: PropTypes.func,
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ padding: '56px 32px' }}>
      <div
        className="flex items-center justify-center"
        style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--bg-primary)', marginBottom: 16 }}
      >
        <BellOff style={{ width: 32, height: 32, color: 'var(--text-muted)' }} />
      </div>
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 6 }}>
        All caught up!
      </h3>
      <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
        No new notifications. We&apos;ll let you know when something happens.
      </p>
    </div>
  );
}

export function NotificationCenter({
  isOpen, onClose, notifications, unreadCount,
  markAllRead, markAsRead, clearAll, onNavigate,
}) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const trapRef = useFocusTrap(isOpen);
  const mergedRef = useCallback((node) => {
    panelRef.current = node;
    trapRef.current = node;
  }, [trapRef]);

  // Focus close button when opened
  useEffect(() => {
    if (isOpen && closeRef.current) {
      const t = setTimeout(() => closeRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 100);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handleClick); };
  }, [isOpen, onClose]);

  const groups = groupNotifications(notifications);
  const hasNotifications = notifications.length > 0;

  return (
    <div
      ref={mergedRef}
      role="dialog"
      aria-label="Notification Center"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 68,
        right: 16,
        zIndex: 70,
        width: 400,
        maxHeight: 560,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        // Dropdown animation via opacity + transform
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'opacity 0.18s cubic-bezier(0.16,1,0.3,1), transform 0.18s cubic-bezier(0.16,1,0.3,1)',
        transformOrigin: 'top right',
      }}
    >
      {/* Caret arrow pointing up toward bell */}
      <div style={{
        position: 'absolute',
        top: -7,
        right: 32,
        width: 14,
        height: 14,
        transform: 'rotate(45deg)',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        borderLeft: '1px solid var(--border-color)',
        zIndex: 1,
      }} />

      {/* Header */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
          flexShrink: 0,
        }}
      >
        <div className="flex items-center" style={{ gap: 10 }}>
          <Bell style={{ width: 18, height: 18, color: '#e8750a' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span
              className="notif-badge-appear"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#e8750a',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 9999,
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                lineHeight: 1,
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <button
          ref={closeRef}
          onClick={onClose}
          className="notif-item"
          aria-label="Close notifications"
          style={{
            padding: '6px',
            borderRadius: 8,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Actions bar */}
      {hasNotifications && (
        <div
          className="flex items-center justify-between flex-shrink-0 text-xs"
          style={{
            padding: '8px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            flexShrink: 0,
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
          </span>
          <div className="flex items-center" style={{ gap: 12 }}>
            <button
              onClick={markAllRead}
              className="font-medium"
              style={{ color: '#e8750a', transition: 'opacity 0.15s' }}
              aria-label="Mark all notifications as read"
              title="Mark all as read"
              onMouseEnter={e => e.target.style.opacity = '0.7'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              Mark all read
            </button>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <button
              onClick={clearAll}
              className="font-medium"
              style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }}
              aria-label="Clear all notifications"
              title="Clear all notifications"
              onMouseEnter={e => e.target.style.color = '#ef4444'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Notification list */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {hasNotifications ? (
          <div>
            <NotificationGroup label="Just Now" notifications={groups.justNow} onMarkRead={markAsRead} onNavigate={onNavigate} />
            <NotificationGroup label="Today"    notifications={groups.today}   onMarkRead={markAsRead} onNavigate={onNavigate} />
            <NotificationGroup label="Earlier"  notifications={groups.earlier} onMarkRead={markAsRead} onNavigate={onNavigate} />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

NotificationCenter.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  notifications: PropTypes.array.isRequired,
  unreadCount: PropTypes.number.isRequired,
  markAllRead: PropTypes.func.isRequired,
  markAsRead: PropTypes.func.isRequired,
  clearAll: PropTypes.func.isRequired,
  onNavigate: PropTypes.func,
};

NotificationCenter.defaultProps = {
  onNavigate: null,
};
