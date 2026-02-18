import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Users,
  CheckSquare,
  MessageSquare,
  Terminal,
  AlertTriangle,
  Info,
} from 'lucide-react';

const ICON_MAP = {
  team: Users,
  task: CheckSquare,
  message: MessageSquare,
  output: Terminal,
  system: AlertTriangle,
  info: Info,
};

const COLOR_MAP = {
  team: 'text-blue-400',
  task: 'text-green-400',
  message: 'text-claude-orange',
  output: 'text-purple-400',
  system: 'text-red-400',
  info: 'text-gray-400',
};

function formatRelativeTime(timestamp) {
  const now = Date.now();
  const ts = new Date(timestamp).getTime();
  const diffSec = Math.floor((now - ts) / 1000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function groupNotifications(notifications) {
  const now = Date.now();
  const groups = { justNow: [], today: [], earlier: [] };

  notifications.forEach(n => {
    const ts = new Date(n.timestamp).getTime();
    const diffMs = now - ts;
    const ONE_MIN = 60 * 1000;
    const ONE_DAY = 24 * 60 * 60 * 1000;

    if (diffMs < ONE_MIN) {
      groups.justNow.push(n);
    } else if (diffMs < ONE_DAY) {
      groups.today.push(n);
    } else {
      groups.earlier.push(n);
    }
  });

  return groups;
}

function NotificationItem({ notification, onMarkRead, onNavigate }) {
  const IconComponent = ICON_MAP[notification.type] || Info;
  const colorClass = COLOR_MAP[notification.type] || 'text-gray-400';

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    if (notification.tab && onNavigate) {
      onNavigate(notification.tab);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`notif-item w-full text-left flex items-start gap-3 px-4 py-3 ${
        !notification.read ? 'unread' : ''
      }`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${colorClass}`}>
        <IconComponent className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate" style={{ color: !notification.read ? 'var(--text-heading)' : 'var(--text-primary)' }}>
            {notification.title}
          </span>
          {!notification.read && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-claude-orange" />
          )}
        </div>
        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {notification.message}
        </p>
        <span className="text-xs mt-1 block" style={{ color: 'var(--text-muted)' }}>
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
  return (
    <div>
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
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

export function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  markAllRead,
  markAsRead,
  clearAll,
  onNavigate,
}) {
  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Delay to avoid catching the opening click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  const groups = groupNotifications(notifications);
  const hasNotifications = notifications.length > 0;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notification Center"
        aria-modal="true"
        className={`fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-claude-orange" />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-claude-orange text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="notif-item p-1.5 rounded-lg transition-colors"
            aria-label="Close notifications"
          >
            <X className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Actions Bar */}
        {hasNotifications && (
          <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <button
              onClick={markAllRead}
              className="notif-item flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'var(--tab-inactive-bg)' }}
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
            <button
              onClick={clearAll}
              className="notif-item flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'var(--tab-inactive-bg)' }}
              title="Clear all notifications"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {hasNotifications ? (
            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              <NotificationGroup label="Just Now" notifications={groups.justNow} onMarkRead={markAsRead} onNavigate={onNavigate} />
              <NotificationGroup label="Today" notifications={groups.today} onMarkRead={markAsRead} onNavigate={onNavigate} />
              <NotificationGroup label="Earlier" notifications={groups.earlier} onMarkRead={markAsRead} onNavigate={onNavigate} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
              <BellOff className="h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No notifications yet</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Notifications from team updates, tasks, and messages will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
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
