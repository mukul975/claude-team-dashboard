import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useFocusTrap } from '../hooks/useFocusTrap';

const STATUS_COLORS = {
  pending: {
    bg: 'rgba(234, 179, 8, 0.15)',
    border: 'rgba(234, 179, 8, 0.5)',
    text: '#facc15',
    glow: 'rgba(234, 179, 8, 0.3)',
    fill: '#eab308',
    columnBg: 'rgba(234, 179, 8, 0.06)',
    columnBorder: 'rgba(234, 179, 8, 0.2)',
    label: 'Pending',
    barFill: 'rgba(234, 179, 8, 0.6)',
  },
  in_progress: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.5)',
    text: '#60a5fa',
    glow: 'rgba(59, 130, 246, 0.3)',
    fill: '#3b82f6',
    columnBg: 'rgba(59, 130, 246, 0.06)',
    columnBorder: 'rgba(59, 130, 246, 0.2)',
    label: 'In Progress',
    barFill: 'rgba(59, 130, 246, 0.6)',
  },
  completed: {
    bg: 'rgba(34, 197, 94, 0.15)',
    border: 'rgba(34, 197, 94, 0.5)',
    text: '#4ade80',
    glow: 'rgba(34, 197, 94, 0.3)',
    fill: '#22c55e',
    columnBg: 'rgba(34, 197, 94, 0.06)',
    columnBorder: 'rgba(34, 197, 94, 0.2)',
    label: 'Completed',
    barFill: 'rgba(34, 197, 94, 0.6)',
  },
  blocked: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.5)',
    text: '#f87171',
    glow: 'rgba(239, 68, 68, 0.3)',
    fill: '#ef4444',
    columnBg: 'rgba(239, 68, 68, 0.06)',
    columnBorder: 'rgba(239, 68, 68, 0.2)',
    label: 'Blocked',
    barFill: 'rgba(239, 68, 68, 0.6)',
  },
};

function getEffectiveStatus(task) {
  if (task.blockedBy && task.blockedBy.length > 0) return 'blocked';
  return task.status || 'pending';
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

// Floating detail card shown when a task is clicked
function TaskInfoCard({ task, onClose }) {
  const trapRef = useFocusTrap(!!task);
  if (!task) return null;
  const status = getEffectiveStatus(task);
  const color = STATUS_COLORS[status] || STATUS_COLORS.pending;

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Task details"
    >
      <div
        className="rounded-xl p-5 max-w-md w-full mx-4 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
          border: `1px solid ${color.border}`,
          boxShadow: `0 0 40px ${color.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mb-2"
              style={{
                fontSize: 10,
                background: color.bg,
                color: color.text,
                border: `1px solid ${color.border}`,
              }}
            >
              {color.label}
            </span>
            <h4 className="text-white font-bold text-base leading-tight">{task.subject}</h4>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1 rounded-lg transition-colors flex-shrink-0"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(55,65,81,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            aria-label="Close task details"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-gray-300 text-sm leading-relaxed mb-4" style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {task.description}
          </p>
        )}

        {/* Metadata */}
        <div className="space-y-2">
          {task._teamName && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-20 flex-shrink-0">Team</span>
              <span className="text-gray-300 text-xs font-medium">{task._teamName}</span>
            </div>
          )}
          {task.owner && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-20 flex-shrink-0">Owner</span>
              <span className="text-gray-300 text-xs font-medium">{task.owner}</span>
            </div>
          )}
          {task.id && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-20 flex-shrink-0">Task ID</span>
              <span className="text-gray-400 text-xs font-mono">{task.id}</span>
            </div>
          )}
          {task.blockedBy && task.blockedBy.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-20 flex-shrink-0">Blocked by</span>
              <div className="flex flex-wrap gap-1">
                {task.blockedBy.map((bid) => (
                  <span key={bid} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    #{bid}
                  </span>
                ))}
              </div>
            </div>
          )}
          {task.blocks && task.blocks.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-20 flex-shrink-0">Blocks</span>
              <div className="flex flex-wrap gap-1">
                {task.blocks.map((bid) => (
                  <span key={bid} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#fdba74', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                    #{bid}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hover tooltip for SVG graph nodes
function SvgTooltip({ task, x, y, svgRect }) {
  if (!task || !svgRect) return null;
  const status = getEffectiveStatus(task);
  const color = STATUS_COLORS[status] || STATUS_COLORS.pending;

  const tooltipW = 240;
  const tooltipH = task.description ? 100 : 70;
  // Position relative to the SVG container's screen position
  let left = x + 10;
  let top = y - tooltipH - 10;
  if (top < 0) top = y + 20;
  if (left + tooltipW > svgRect.width) left = x - tooltipW - 10;

  return (
    <div
      className="absolute pointer-events-none z-40 rounded-lg p-3 shadow-xl"
      style={{
        left,
        top,
        width: tooltipW,
        background: 'rgba(17, 24, 39, 0.95)',
        border: `1px solid ${color.border}`,
        boxShadow: `0 0 20px ${color.glow}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center mb-1.5" style={{ gap: 8 }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color.fill }} />
        <span className="text-white text-xs font-bold leading-tight">{truncate(task.subject, 40)}</span>
      </div>
      {task.description && (
        <p className="text-gray-400 leading-relaxed mb-1.5" style={{ fontSize: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>
      )}
      <div className="flex items-center" style={{ gap: 12, fontSize: 10 }}>
        {task._teamName && <span className="text-gray-500">{task._teamName}</span>}
        {task.owner && <span style={{ color: color.text }}>{task.owner}</span>}
        <span className="font-semibold uppercase" style={{ color: color.text }}>{color.label}</span>
      </div>
    </div>
  );
}

const StatusBoard = React.memo(function StatusBoard({ allTasks, onTaskClick }) {
  const columns = useMemo(() => {
    const cols = { pending: [], in_progress: [], completed: [], blocked: [] };
    allTasks.forEach((task) => {
      const status = getEffectiveStatus(task);
      if (cols[status]) {
        cols[status].push(task);
      } else {
        cols.pending.push(task);
      }
    });
    return cols;
  }, [allTasks]);

  const columnOrder = ['pending', 'in_progress', 'completed', 'blocked'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columnOrder.map((statusKey) => {
        const color = STATUS_COLORS[statusKey];
        const tasks = columns[statusKey];
        return (
          <div
            key={statusKey}
            className="rounded-xl overflow-hidden"
            style={{
              background: color.columnBg,
              border: `1px solid ${color.columnBorder}`,
            }}
          >
            {/* Column Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{
                background: color.bg,
                borderBottom: `1px solid ${color.columnBorder}`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: color.fill, boxShadow: `0 0 8px ${color.glow}` }}
                />
                <span className="text-sm font-semibold" style={{ color: color.text }}>
                  {color.label}
                </span>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: color.bg,
                  color: color.text,
                  border: `1px solid ${color.border}`,
                }}
              >
                {tasks.length}
              </span>
            </div>

            {/* Scrollable Task Cards */}
            <div className="p-3 space-y-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: 420 }}>
              {tasks.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-xs">No tasks</p>
                </div>
              ) : (
                tasks.map((task, idx) => (
                  <div
                    key={task.id || idx}
                    className="rounded-lg p-3 transition-all duration-200 cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.6) 100%)',
                      border: '1px solid rgba(75, 85, 99, 0.3)',
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => onTaskClick(task)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTaskClick(task); } }}
                    aria-label={`View details for task: ${truncate(task.subject, 40)}`}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = color.border;
                      e.currentTarget.style.boxShadow = `0 2px 12px ${color.glow}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.3)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {task._teamName && (
                      <span
                        className="font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1.5 inline-block"
                        style={{
                          fontSize: 10,
                          background: 'rgba(249, 115, 22, 0.15)',
                          color: '#fb923c',
                          border: '1px solid rgba(249, 115, 22, 0.3)',
                        }}
                      >
                        {task._teamName}
                      </span>
                    )}
                    <p className="text-white text-sm font-medium leading-snug mb-1.5">
                      {truncate(task.subject, 60)}
                    </p>
                    {task.owner && (
                      <div className="flex items-center" style={{ gap: 6 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span className="text-gray-400 text-xs">{task.owner}</span>
                      </div>
                    )}
                    {task.blockedBy && task.blockedBy.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                        <span className="text-xs" style={{ color: '#fca5a5' }}>
                          Blocked by {task.blockedBy.length} task{task.blockedBy.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

const DependencyGraph = React.memo(function DependencyGraph({ allTasks, onTaskClick }) {
  const [hoveredTask, setHoveredTask] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [containerRect, setContainerRect] = useState(null);

  const hasDeps = useMemo(() => allTasks.some(
    (t) => (t.blockedBy && t.blockedBy.length > 0) || (t.blocks && t.blocks.length > 0)
  ), [allTasks]);

  const containerRef = useCallback((node) => {
    if (node) {
      setContainerRect({ width: node.offsetWidth, height: node.offsetHeight });
    }
  }, []);

  // Memoize the expensive graph layout computation
  const graphLayout = useMemo(() => {
    if (!hasDeps) return null;

    // Build a task map by id
    const taskMap = {};
    allTasks.forEach((t) => {
      if (t.id) taskMap[t.id] = t;
    });

    // Collect only tasks involved in dependencies
    const involvedIds = new Set();
    allTasks.forEach((t) => {
      if (t.blockedBy && t.blockedBy.length > 0) {
        involvedIds.add(t.id);
        t.blockedBy.forEach((bid) => involvedIds.add(bid));
      }
      if (t.blocks && t.blocks.length > 0) {
        involvedIds.add(t.id);
        t.blocks.forEach((bid) => involvedIds.add(bid));
      }
    });

    const involvedTasks = allTasks.filter((t) => involvedIds.has(t.id));

    // Compute depth (layer) for each task via BFS from roots (topological sort)
    const childrenMap = {};
    involvedTasks.forEach((t) => {
      if (t.blockedBy) {
        t.blockedBy.forEach((parentId) => {
          if (!childrenMap[parentId]) childrenMap[parentId] = [];
          childrenMap[parentId].push(t.id);
        });
      }
    });

    const depthMap = {};
    const roots = involvedTasks.filter(
      (t) => !t.blockedBy || t.blockedBy.length === 0
    );

    // BFS to assign depths
    const queue = roots.map((t) => ({ id: t.id, depth: 0 }));
    const visited = new Set();
    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (visited.has(id)) {
        depthMap[id] = Math.max(depthMap[id] || 0, depth);
        continue;
      }
      visited.add(id);
      depthMap[id] = Math.max(depthMap[id] || 0, depth);
      const children = childrenMap[id] || [];
      children.forEach((cid) => {
        queue.push({ id: cid, depth: depth + 1 });
      });
    }

    involvedTasks.forEach((t) => {
      if (depthMap[t.id] === undefined) depthMap[t.id] = 0;
    });

    // Group tasks by depth
    const layers = {};
    involvedTasks.forEach((t) => {
      const d = depthMap[t.id];
      if (!layers[d]) layers[d] = [];
      layers[d].push(t);
    });

    const layerKeys = Object.keys(layers)
      .map(Number)
      .sort((a, b) => a - b);

    // Layout constants
    const nodeW = 210;
    const nodeH = 68;
    const hGap = 80;
    const vGap = 24;
    const padX = 40;
    const padY = 40;

    const maxPerLayer = Math.max(...layerKeys.map((k) => layers[k].length));
    const svgWidth = padX * 2 + layerKeys.length * (nodeW + hGap) - hGap;
    const svgHeight = padY * 2 + maxPerLayer * (nodeH + vGap) - vGap;

    // Compute positions
    const positions = {};
    layerKeys.forEach((layer, li) => {
      const tasks = layers[layer];
      const colX = padX + li * (nodeW + hGap);
      const totalH = tasks.length * nodeH + (tasks.length - 1) * vGap;
      const startY = padY + (svgHeight - padY * 2 - totalH) / 2;
      tasks.forEach((t, ti) => {
        positions[t.id] = {
          x: colX,
          y: startY + ti * (nodeH + vGap),
        };
      });
    });

    // Build edges: from blocker to blocked task
    const edges = [];
    involvedTasks.forEach((t) => {
      if (t.blockedBy) {
        t.blockedBy.forEach((parentId) => {
          if (positions[parentId] && positions[t.id]) {
            edges.push({ from: parentId, to: t.id });
          }
        });
      }
    });

    return { involvedTasks, positions, edges, svgWidth, svgHeight, nodeW, nodeH };
  }, [allTasks, hasDeps]);

  const handleNodeMouseEnter = useCallback((task, e) => {
    const container = e.currentTarget.closest('.dep-graph-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      setHoverPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setContainerRect({ width: rect.width, height: rect.height });
    }
    setHoveredTask(task);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredTask(null);
  }, []);

  if (!hasDeps) {
    return (
      <div className="text-center py-16">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
        </svg>
        <p className="text-gray-400 text-base font-medium">No task dependencies found</p>
        <p className="text-gray-500 text-sm mt-1">Dependencies will appear here when tasks have blockedBy relationships</p>
      </div>
    );
  }

  const { involvedTasks, positions, edges, svgWidth, svgHeight, nodeW, nodeH } = graphLayout;

  return (
    <div className="relative overflow-x-auto overflow-y-auto custom-scrollbar dep-graph-container" ref={containerRef} style={{ maxHeight: '520px' }}>
      {hoveredTask && (
        <SvgTooltip task={hoveredTask} x={hoverPos.x} y={hoverPos.y} svgRect={containerRect} />
      )}
      <svg
        width={Math.max(svgWidth, 600)}
        height={Math.max(svgHeight, 200)}
        viewBox={`0 0 ${Math.max(svgWidth, 600)} ${Math.max(svgHeight, 200)}`}
        style={{ minWidth: svgWidth }}
      >
        <defs>
          <marker
            id="dep-arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
          </marker>
          <marker
            id="dep-arrowhead-hl"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#f97316" />
          </marker>
          <filter id="dep-node-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.4)" />
          </filter>
          <filter id="dep-node-glow">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="rgba(249,115,22,0.5)" />
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const fromPos = positions[edge.from];
          const toPos = positions[edge.to];
          const x1 = fromPos.x + nodeW;
          const y1 = fromPos.y + nodeH / 2;
          const x2 = toPos.x;
          const y2 = toPos.y + nodeH / 2;
          const cx1 = x1 + (x2 - x1) * 0.4;
          const cx2 = x2 - (x2 - x1) * 0.4;
          const isHighlighted = hoveredTask && (hoveredTask.id === edge.from || hoveredTask.id === edge.to);
          return (
            <path
              key={`edge-${i}`}
              d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke={isHighlighted ? '#f97316' : '#4b5563'}
              strokeWidth={isHighlighted ? 2.5 : 1.5}
              markerEnd={isHighlighted ? 'url(#dep-arrowhead-hl)' : 'url(#dep-arrowhead)'}
              opacity={isHighlighted ? 1 : 0.6}
              style={{ transition: 'all 0.2s ease' }}
            />
          );
        })}

        {/* Nodes */}
        {involvedTasks.map((task) => {
          const pos = positions[task.id];
          if (!pos) return null;
          const status = getEffectiveStatus(task);
          const color = STATUS_COLORS[status] || STATUS_COLORS.pending;
          const isHovered = hoveredTask && hoveredTask.id === task.id;
          return (
            <g
              key={task.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
              onMouseEnter={(e) => handleNodeMouseEnter(task, e)}
              onMouseLeave={handleNodeMouseLeave}
              onClick={() => onTaskClick(task)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTaskClick(task); } }}
              aria-label={`Task: ${truncate(task.subject, 40)}`}
            >
              <rect
                width={nodeW}
                height={nodeH}
                rx="10"
                ry="10"
                fill="rgba(17, 24, 39, 0.9)"
                stroke={isHovered ? '#f97316' : color.fill}
                strokeWidth={isHovered ? 2.5 : 1.5}
                filter={isHovered ? 'url(#dep-node-glow)' : 'url(#dep-node-shadow)'}
              />
              {/* Status indicator bar */}
              <rect
                x="0"
                y="0"
                width="4"
                height={nodeH}
                rx="2"
                fill={color.fill}
              />
              {/* Task subject */}
              <text
                x="14"
                y="24"
                fill="white"
                fontSize="12"
                fontWeight="600"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {truncate(task.subject, 24)}
              </text>
              {/* Team + owner */}
              <text
                x="14"
                y="42"
                fill="#9ca3af"
                fontSize="10"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {task._teamName ? truncate(task._teamName, 12) : ''}{task._teamName && task.owner ? ' / ' : ''}{task.owner ? truncate(task.owner, 12) : ''}
              </text>
              {/* Status badge */}
              <rect
                x={nodeW - 72}
                y="6"
                width="62"
                height="18"
                rx="9"
                fill={color.bg}
                stroke={color.border}
                strokeWidth="0.5"
              />
              <text
                x={nodeW - 41}
                y="18"
                fill={color.text}
                fontSize="8"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {color.label.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

// Gantt-style horizontal bar chart showing all tasks grouped by status
const GanttView = React.memo(function GanttView({ allTasks, onTaskClick }) {
  const statusOrder = ['in_progress', 'pending', 'blocked', 'completed'];
  const grouped = useMemo(() => {
    const groups = {};
    statusOrder.forEach((s) => { groups[s] = []; });
    allTasks.forEach((task) => {
      const status = getEffectiveStatus(task);
      if (groups[status]) {
        groups[status].push(task);
      } else {
        groups.pending.push(task);
      }
    });
    return groups;
  }, [allTasks]);

  const barH = 32;
  const rowGap = 6;
  const labelW = 200;
  const padX = 20;
  const padY = 16;
  const barAreaW = 500;

  // Calculate total rows
  let totalRows = 0;
  const sectionOffsets = {};
  statusOrder.forEach((s) => {
    if (grouped[s].length > 0) {
      sectionOffsets[s] = totalRows;
      totalRows += grouped[s].length + 1; // +1 for section header
    }
  });

  const svgHeight = padY * 2 + totalRows * (barH + rowGap);
  const svgWidth = labelW + padX * 2 + barAreaW + 40;

  // Generate bar widths based on task status/importance
  const getBarWidth = (task) => {
    const status = getEffectiveStatus(task);
    switch (status) {
      case 'completed': return barAreaW;
      case 'in_progress': return barAreaW * 0.6;
      case 'pending': return barAreaW * 0.2;
      case 'blocked': return barAreaW * 0.15;
      default: return barAreaW * 0.3;
    }
  };

  let currentRow = 0;

  return (
    <div className="overflow-x-auto overflow-y-auto custom-scrollbar" style={{ maxHeight: '520px' }}>
      <svg
        width={Math.max(svgWidth, 600)}
        height={Math.max(svgHeight, 100)}
        viewBox={`0 0 ${Math.max(svgWidth, 600)} ${Math.max(svgHeight, 100)}`}
        style={{ minWidth: svgWidth }}
      >
        <defs>
          <filter id="gantt-bar-shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.3)" />
          </filter>
        </defs>

        {statusOrder.map((statusKey) => {
          const tasks = grouped[statusKey];
          if (tasks.length === 0) return null;
          const color = STATUS_COLORS[statusKey];
          // Section header
          const headerY = padY + currentRow * (barH + rowGap);
          currentRow++;

          const taskRows = tasks.map((task, ti) => {
            const rowY = padY + currentRow * (barH + rowGap);
            currentRow++;
            const bw = getBarWidth(task);
            return (
              <g key={task.id || ti} style={{ cursor: 'pointer' }} onClick={() => onTaskClick(task)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTaskClick(task); } }} aria-label={`Task: ${truncate(task.subject, 40)}`}>
                {/* Row background on hover */}
                <rect
                  x="0"
                  y={rowY - 2}
                  width={svgWidth}
                  height={barH + 4}
                  rx="4"
                  fill="transparent"
                  onMouseEnter={(e) => { e.currentTarget.setAttribute('fill', 'rgba(255,255,255,0.03)'); }}
                  onMouseLeave={(e) => { e.currentTarget.setAttribute('fill', 'transparent'); }}
                />
                {/* Task label */}
                <text
                  x={padX}
                  y={rowY + barH / 2 + 4}
                  fill="#d1d5db"
                  fontSize="11"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight="500"
                >
                  {truncate(task.subject, 28)}
                </text>
                {/* Owner */}
                {task.owner && (
                  <text
                    x={padX + labelW - 10}
                    y={rowY + barH / 2 + 4}
                    fill="#6b7280"
                    fontSize="9"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    textAnchor="end"
                  >
                    {truncate(task.owner, 14)}
                  </text>
                )}
                {/* Bar */}
                <rect
                  x={labelW + padX}
                  y={rowY + 4}
                  width={bw}
                  height={barH - 8}
                  rx="6"
                  fill={color.barFill}
                  stroke={color.fill}
                  strokeWidth="0.5"
                  filter="url(#gantt-bar-shadow)"
                  onMouseEnter={(e) => {
                    e.currentTarget.setAttribute('fill', color.fill);
                    e.currentTarget.setAttribute('stroke-width', '1.5');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.setAttribute('fill', color.barFill);
                    e.currentTarget.setAttribute('stroke-width', '0.5');
                  }}
                />
                {/* Bar label */}
                <text
                  x={labelW + padX + 8}
                  y={rowY + barH / 2 + 3}
                  fill="white"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {truncate(task.subject, 20)}
                </text>
              </g>
            );
          });

          return (
            <g key={statusKey}>
              {/* Section header */}
              <rect
                x="0"
                y={headerY - 2}
                width={svgWidth}
                height={barH + 4}
                fill={color.bg}
                rx="6"
              />
              <circle
                cx={padX + 6}
                cy={headerY + barH / 2}
                r="4"
                fill={color.fill}
              />
              <text
                x={padX + 18}
                y={headerY + barH / 2 + 4}
                fill={color.text}
                fontSize="12"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {color.label} ({tasks.length})
              </text>
              {taskRows}
            </g>
          );
        })}

        {/* Vertical guide line */}
        <line
          x1={labelW + padX}
          y1={padY - 4}
          x2={labelW + padX}
          y2={svgHeight - padY}
          stroke="rgba(75, 85, 99, 0.3)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      </svg>
    </div>
  );
});

export const TaskDependencyGraph = React.memo(function TaskDependencyGraph({ teams }) {
  const [view, setView] = useState('board');
  const [selectedTask, setSelectedTask] = useState(null);

  const allTasks = useMemo(() => {
    return teams.flatMap((t) =>
      (t.tasks || []).map((task) => ({
        ...task,
        _teamName: t.name,
      }))
    );
  }, [teams]);

  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task);
  }, []);

  if (allTasks.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center mt-6"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%)',
          border: '1px dashed rgba(156, 163, 175, 0.3)',
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <p className="text-gray-400 text-sm">No tasks to display</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl mt-6 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%)',
        border: '1px solid rgba(75, 85, 99, 0.3)',
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(75, 85, 99, 0.3)' }}>
        <div className="flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <path d="M10 6.5h4" />
            <path d="M6.5 10v4" />
            <path d="M17.5 10v4" />
          </svg>
          <h3 className="text-lg font-bold text-white">Task Dependency Graph</h3>
          <span className="text-xs text-gray-400 font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(75, 85, 99, 0.3)' }}>
            {allTasks.length} task{allTasks.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Toggle Buttons */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(17, 24, 39, 0.5)' }}>
          {[
            { key: 'board', label: 'Status Board' },
            { key: 'graph', label: 'Dependency Graph' },
            { key: 'gantt', label: 'Gantt View' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200"
              style={{
                background: view === tab.key ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
                color: view === tab.key ? '#fb923c' : '#9ca3af',
                border: view === tab.key ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              }}
              aria-label={`Switch to ${tab.label} view`}
              aria-pressed={view === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {view === 'board' && (
          <StatusBoard allTasks={allTasks} onTaskClick={handleTaskClick} />
        )}
        {view === 'graph' && (
          <DependencyGraph allTasks={allTasks} onTaskClick={handleTaskClick} />
        )}
        {view === 'gantt' && (
          <GanttView allTasks={allTasks} onTaskClick={handleTaskClick} />
        )}
      </div>

      {/* Task Info Card Modal */}
      {selectedTask && (
        <TaskInfoCard task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
});

TaskDependencyGraph.propTypes = {
  teams: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      tasks: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          subject: PropTypes.string,
          description: PropTypes.string,
          status: PropTypes.string,
          owner: PropTypes.string,
          blockedBy: PropTypes.array,
          blocks: PropTypes.array,
        })
      ),
    })
  ).isRequired,
};
