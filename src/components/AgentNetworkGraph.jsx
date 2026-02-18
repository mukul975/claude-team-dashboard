import React, { useRef, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import { Network } from 'lucide-react';

const TEAM_COLORS = [
  '#3b82f6', '#22c55e', '#a855f7', '#06b6d4',
  '#f97316', '#ec4899', '#eab308', '#ef4444',
  '#6366f1', '#14b8a6',
];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function buildGraph(allInboxes, teams) {
  const nodeMap = new Map();
  const edgeMap = new Map();

  const teamColorMap = new Map();
  (teams || []).forEach((team, idx) => {
    const color = TEAM_COLORS[idx % TEAM_COLORS.length];
    teamColorMap.set(team.name, color);
    const members = team.config?.members || [];
    members.forEach(m => {
      if (m.name && !nodeMap.has(m.name)) {
        nodeMap.set(m.name, { id: m.name, team: team.name, color, msgCount: 0 });
      }
    });
  });

  Object.entries(allInboxes || {}).forEach(([teamName, agents]) => {
    const teamColor = teamColorMap.get(teamName) || TEAM_COLORS[hashStr(teamName) % TEAM_COLORS.length];

    Object.entries(agents || {}).forEach(([agentName, agentData]) => {
      if (!nodeMap.has(agentName)) {
        nodeMap.set(agentName, { id: agentName, team: teamName, color: teamColor, msgCount: 0 });
      }

      const messages = Array.isArray(agentData) ? agentData : (agentData?.messages || []);
      messages.forEach(msg => {
        const from = msg.from || 'unknown';
        const to = agentName;

        if (from === to) return;

        if (!nodeMap.has(from)) {
          nodeMap.set(from, { id: from, team: teamName, color: teamColor, msgCount: 0 });
        }

        nodeMap.get(from).msgCount += 1;
        nodeMap.get(to).msgCount += 1;

        const edgeKey = `${from}|||${to}`;
        if (edgeMap.has(edgeKey)) {
          edgeMap.get(edgeKey).count += 1;
        } else {
          edgeMap.set(edgeKey, { source: from, target: to, count: 1 });
        }
      });
    });
  });

  const nodes = Array.from(nodeMap.values());
  const edges = Array.from(edgeMap.values());
  return { nodes, edges };
}

export function AgentNetworkGraph({ allInboxes = {}, teams = [] }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  const { nodes, edges } = useMemo(() => buildGraph(allInboxes, teams), [allInboxes, teams]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setDimensions({ width, height: Math.max(400, Math.min(width * 0.6, 600)) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    const maxMsg = Math.max(1, d3.max(nodes, d => d.msgCount) || 1);
    const radiusScale = d3.scaleSqrt().domain([0, maxMsg]).range([8, 24]);

    const maxEdge = Math.max(1, d3.max(edges, d => d.count) || 1);
    const edgeWidthScale = d3.scaleLinear().domain([1, maxEdge]).range([1.5, 6]);

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(d => radiusScale(d.msgCount) + 10));

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#6b7280');

    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', '#4b5563')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => edgeWidthScale(d.count))
      .attr('marker-end', 'url(#arrowhead)');

    const edgeLabels = g.append('g')
      .selectAll('text')
      .data(edges)
      .join('text')
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('dy', -4)
      .text(d => d.count > 1 ? d.count : '');

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    node.append('circle')
      .attr('r', d => radiusScale(d.msgCount))
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.85)
      .attr('stroke', d => d3.color(d.color).brighter(0.8))
      .attr('stroke-width', 2)
      .style('cursor', 'grab');

    node.append('title')
      .text(d => `${d.id}\nTeam: ${d.team}\nMessages: ${d.msgCount}`);

    // Show labels for nodes with enough space
    node.append('text')
      .attr('dy', d => radiusScale(d.msgCount) + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#d1d5db')
      .attr('font-size', '11px')
      .attr('font-weight', 500)
      .attr('pointer-events', 'none')
      .text(d => {
        const name = d.id;
        return name.length > 14 ? name.slice(0, 12) + '..' : name;
      });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      edgeLabels
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, dimensions]);

  // Collect unique teams for legend
  const teamLegend = useMemo(() => {
    const seen = new Map();
    nodes.forEach(n => {
      if (!seen.has(n.team)) {
        seen.set(n.team, n.color);
      }
    });
    return Array.from(seen.entries());
  }, [nodes]);

  const hasData = nodes.length > 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-claude-orange" />
          <h3 className="text-lg font-semibold text-white">Agent Network Graph</h3>
        </div>
        {hasData && (
          <span className="text-xs text-gray-400">
            {nodes.length} agents, {edges.length} connections
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Network className="h-16 w-16 mb-3 opacity-40" />
          <p className="text-sm">No agent communication data yet</p>
          <p className="text-xs mt-1 text-gray-500">Connections will appear as agents exchange messages</p>
        </div>
      ) : (
        <>
          <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              style={{
                width: '100%',
                height: dimensions.height,
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(55, 65, 81, 0.4)',
              }}
            />
          </div>

          {/* Legend */}
          {teamLegend.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-700">
              <span className="text-xs text-gray-500 font-medium mr-1">Teams:</span>
              {teamLegend.map(([teamName, color]) => (
                <div key={teamName} className="flex items-center gap-1.5">
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: color,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span className="text-xs text-gray-300">{teamName}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            Drag nodes to rearrange. Scroll to zoom. Edge width indicates message volume.
          </p>
        </>
      )}
    </div>
  );
}

AgentNetworkGraph.propTypes = {
  allInboxes: PropTypes.object,
  teams: PropTypes.array,
};
