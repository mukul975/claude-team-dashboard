import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';

export function ExportMenu({ teams, allInboxes }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportTeamsJSON = () => {
    const data = teams.map(t => ({
      name: t.name || '',
      members: (t.members || []).map(m => m.name || m).join('; '),
      taskCount: (t.tasks || []).length
    }));
    exportToJSON(data, 'teams-export');
    setOpen(false);
  };

  const handleExportTasksCSV = () => {
    const data = teams.flatMap(t =>
      (t.tasks || []).map(task => ({
        team: t.name || '',
        subject: task.subject || task.title || '',
        status: task.status || '',
        owner: task.owner || ''
      }))
    );
    exportToCSV(data, 'tasks-export');
    setOpen(false);
  };

  const handleExportMessagesCSV = () => {
    const data = [];
    Object.entries(allInboxes).forEach(([teamName, teamInboxes]) => {
      Object.entries(teamInboxes).forEach(([agent, messages]) => {
        if (Array.isArray(messages)) {
          messages.forEach(msg => {
            data.push({
              team: teamName,
              agent: agent,
              from: msg.from || msg.sender || '',
              message: msg.message || msg.content || msg.text || '',
              timestamp: msg.timestamp || msg.time || ''
            });
          });
        }
      });
    });
    exportToCSV(data, 'messages-export');
    setOpen(false);
  };

  const handleExportFullReport = () => {
    const report = {
      exportedAt: new Date().toISOString(),
      teams: teams.map(t => ({
        name: t.name || '',
        members: t.members || [],
        tasks: t.tasks || []
      })),
      inboxes: allInboxes
    };
    exportToJSON(report, 'full-report');
    setOpen(false);
  };

  const menuItems = [
    { label: 'Export Teams (JSON)', icon: FileJson, handler: handleExportTeamsJSON },
    { label: 'Export Tasks (CSV)', icon: FileSpreadsheet, handler: handleExportTasksCSV },
    { label: 'Export Messages (CSV)', icon: FileText, handler: handleExportMessagesCSV },
    { label: 'Export Full Report (JSON)', icon: FileJson, handler: handleExportFullReport }
  ];

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 var(--inset-highlight)',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Export data"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span>Export</span>
        <span className="text-xs" aria-hidden="true">&#9662;</span>
      </button>

      {open && (
        <div
          className="rounded-lg overflow-hidden z-50"
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '8px',
            width: '224px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: '12px'
          }}
          role="menu"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.handler}
                className="flex items-center gap-3 px-4 py-3 text-sm text-left"
                style={{
                  width: '100%',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border-color)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
                  e.currentTarget.style.color = 'var(--text-heading)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                role="menuitem"
                aria-label={item.label}
              >
                <Icon className="h-4 w-4 text-claude-orange" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

ExportMenu.propTypes = {
  teams: PropTypes.array.isRequired,
  allInboxes: PropTypes.object.isRequired
};
