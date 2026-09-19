import React from 'react';
import { getArenaSchool } from './data';

const WIDTH = 1000;
const NODE_W = 320;
const NODE_H = 108;
const CENTER_W = 300;
const CENTER_H = 112;
const START_Y = 126;
const GAP_Y = 134;

function nodeFrame(node) {
  if (node.type === 'question') {
    return { x: (WIDTH - 310) / 2, y: 18, width: 310, height: 74 };
  }

  const y = START_Y + (node.turn - 1) * GAP_Y;

  if (node.type === 'intervention') {
    return { x: (WIDTH - CENTER_W) / 2, y, width: CENTER_W, height: CENTER_H };
  }

  return {
    x: node.side === 'A' ? 38 : WIDTH - 38 - NODE_W,
    y,
    width: NODE_W,
    height: node.type === 'no-reply' ? 112 : NODE_H,
  };
}

function getAnchor(node, frame, point) {
  if (node.type === 'question') {
    return { x: frame.x + frame.width / 2, y: frame.y + frame.height };
  }
  if (node.type === 'intervention') {
    if (point === 'left') return { x: frame.x, y: frame.y + frame.height / 2 };
    if (point === 'right') return { x: frame.x + frame.width, y: frame.y + frame.height / 2 };
    return { x: frame.x + frame.width / 2, y: frame.y };
  }
  if (point === 'in') return { x: frame.x + frame.width / 2, y: frame.y };
  if (node.side === 'A') return { x: frame.x + frame.width, y: frame.y + frame.height / 2 };
  return { x: frame.x, y: frame.y + frame.height / 2 };
}

function pathFor(edge, frames) {
  const sourceFrame = frames.get(edge.source);
  const targetFrame = frames.get(edge.target);
  const sourceNode = sourceFrame.node;
  const targetNode = targetFrame.node;

  if (sourceNode.type === 'question') {
    const start = getAnchor(sourceNode, sourceFrame, 'bottom');
    const end = { x: targetFrame.x + targetFrame.width / 2, y: targetFrame.y };
    return `M ${start.x},${start.y} C ${start.x},108 ${end.x},106 ${end.x},${end.y}`;
  }

  const start = getAnchor(sourceNode, sourceFrame, 'right');
  const end = getAnchor(targetNode, targetFrame, targetNode.type === 'intervention' ? 'left' : 'in');

  if (targetNode.type === 'intervention') {
    return `M ${start.x},${start.y} C ${start.x + 110},${start.y} ${end.x - 110},${end.y} ${end.x},${end.y}`;
  }

  if (sourceNode.type === 'intervention') {
    const influenceStart = getAnchor(sourceNode, sourceFrame, 'bottom');
    const influenceEnd = { x: targetFrame.x + targetFrame.width / 2, y: targetFrame.y };
    return `M ${influenceStart.x},${influenceStart.y} C ${influenceStart.x},${influenceStart.y + 42} ${influenceEnd.x},${influenceEnd.y - 42} ${influenceEnd.x},${influenceEnd.y}`;
  }

  const direction = targetNode.side === 'A' ? -1 : 1;
  return `M ${start.x},${start.y} C ${start.x + direction * 110},${start.y} ${end.x - direction * 110},${end.y} ${end.x},${end.y}`;
}

function labelPosition(edge, frames) {
  const d = pathFor(edge, frames).replace(/[MCL]/g, ' ').trim().split(/\s+/).map(Number);
  const x = d[0] + (d[d.length - 2] - d[0]) * 0.52;
  const y = d[1] + (d[d.length - 1] - d[1]) * 0.32;
  return { x, y };
}

function MapNode({ node, frame }) {
  const school = node.schoolId ? getArenaSchool(node.schoolId) : null;
  const className = [
    'map-node',
    `map-node-${node.type}`,
    node.side ? `map-side-${node.side.toLowerCase()}` : '',
  ].filter(Boolean).join(' ');

  return (
    <foreignObject x={frame.x} y={frame.y} width={frame.width} height={frame.height}>
      <div
        className={className}
        style={{ '--school-color': school?.color || '#d9d3c8', height: frame.height }}
      >
        {node.type === 'move' && <span className="map-node-kind">{node.side}方 · 第 {node.round + 1} 层</span>}
        {node.type === 'intervention' && <span className="map-node-kind">用户介入点</span>}
        {node.type === 'no-reply' && <span className="map-node-kind">状态机分支</span>}
        {node.type === 'question' && <span className="map-node-kind">共同问题</span>}
        <strong>{node.title}</strong>
        {node.type === 'move' && <small>{school.name} · {node.confidence}匹配</small>}
      </div>
    </foreignObject>
  );
}

export default function ArenaMap({ state }) {
  const frameEntries = state.nodes.map((node) => [node.id, { node, ...nodeFrame(node) }]);
  const frames = new Map(frameEntries);
  const lastNode = state.nodes[state.nodes.length - 1];
  const lastFrame = frames.get(lastNode.id);
  const height = Math.max(620, lastFrame.y + lastFrame.height + 90);

  return (
    <div className="arena-graph-card">
      <div className="arena-graph-head">
        <div>
          <span className="kicker">ARGUMENT RELATION GRAPH</span>
          <h3>论证关系图</h3>
        </div>
        <div className="graph-legend">
          <span><i className="legend-rebuttal" />主张 / 反驳</span>
          <span><i className="legend-decision" />用户介入</span>
          <span><i className="legend-empty" />无合适反驳</span>
        </div>
      </div>
      <div className="arena-graph-scroll">
        <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label="主张、反驳、反反驳与用户介入关系图">
          <defs>
            <marker id="arrow-rebuttal" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="#b9b2a4" />
            </marker>
            <marker id="arrow-decision" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="#e0b45d" />
            </marker>
            <marker id="arrow-empty" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="#d46f67" />
            </marker>
          </defs>

          {state.edges.map((edge) => {
            const isDecision = edge.type === 'decision' || edge.type === 'influence';
            const isEmpty = edge.type === 'no-reply' || edge.type === 'closing';
            const point = labelPosition(edge, frames);
            return (
              <g key={edge.id}>
                <path
                  className={`map-edge map-edge-${edge.type}`}
                  d={pathFor(edge, frames)}
                  markerEnd={`url(#${isDecision ? 'arrow-decision' : isEmpty ? 'arrow-empty' : 'arrow-rebuttal'})`}
                />
                <foreignObject x={point.x - 42} y={point.y - 13} width="84" height="26">
                  <div className={`edge-label edge-label-${edge.type}`}>{edge.label}</div>
                </foreignObject>
              </g>
            );
          })}

          {state.nodes.map((node) => <MapNode key={node.id} node={node} frame={frames.get(node.id)} />)}
        </svg>
      </div>
    </div>
  );
}
