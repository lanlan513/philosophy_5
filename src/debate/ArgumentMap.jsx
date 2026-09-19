import React from 'react';
import { MAX_ROUND } from './engine';

const ROOT = { id: 'question-root', x: 360, y: 28, width: 360, height: 92 };
const LANE_X = { A: 70, B: 830 };
const USER_X = 450;
const CARD_W = 300;
const CARD_H = 148;
const USER_W = 180;
const USER_H = 92;
const TOP = 190;
const ROW_GAP = 78;
const ROW_HEIGHT = CARD_H + ROW_GAP;
const CANVAS_W = 1200;
const CANVAS_H = TOP + MAX_ROUND * ROW_HEIGHT + 40;

const kindLabels = {
  opening: '开场主张',
  response: '反驳 / 反反驳',
  'reinforced-response': '用户支持的反反驳',
  closing: '结辩',
  support: '用户介入',
};

export function getArgumentMapLayout(state) {
  const positions = new Map();
  positions.set(ROOT.id, ROOT);

  state.nodes.forEach((node) => {
    if (node.type === 'user') {
      positions.set(node.nodeId, {
        id: node.nodeId,
        x: USER_X,
        y: TOP + (node.round - 1) * ROW_HEIGHT + 22,
        width: USER_W,
        height: USER_H,
      });
    } else {
      positions.set(node.nodeId, {
        id: node.nodeId,
        x: LANE_X[node.sideId],
        y: TOP + (node.round - 1) * ROW_HEIGHT,
        width: CARD_W,
        height: CARD_H,
      });
    }
  });

  return { positions, width: CANVAS_W, height: CANVAS_H };
}

function pointOnEdge(rect, target, sideId) {
  const sourceCenterY = rect.y + rect.height / 2;
  if (sideId === 'A') {
    return target.y < sourceCenterY
      ? { x: rect.x + rect.width, y: rect.y + rect.height / 2 }
      : { x: rect.x + rect.width / 2, y: rect.y + rect.height };
  }
  return target.y < sourceCenterY
    ? { x: rect.x, y: rect.y + rect.height / 2 }
    : { x: rect.x + rect.width / 2, y: rect.y + rect.height };
}

function targetPoint(rect, sourceRect, type) {
  const sourceCenterY = sourceRect.y + sourceRect.height / 2;
  if (type === 'user') {
    return { x: rect.x + rect.width / 2, y: rect.y };
  }
  const sourceOnRight = sourceRect.x > rect.x;
  return {
    x: sourceOnRight ? rect.x + rect.width : rect.x,
    y: sourceCenterY >= rect.y ? rect.y + rect.height / 2 : rect.y,
  };
}

function pathForEdge(edge, rects) {
  const source = rects.get(edge.from);
  const target = rects.get(edge.to);
  if (!source || !target) return null;

  const end = targetPoint(target, source, edge.type);

  let start;
  if (edge.type === 'root') {
    start = {
      x: edge.sideId === 'A' ? source.x + 80 : source.x + source.width - 80,
      y: source.y + source.height,
    };
  } else if (edge.type === 'user') {
    start = { x: source.x + source.width / 2, y: source.y + source.height };
  } else {
    start = pointOnEdge(source, end, edge.sideId);
  }

  const midY = (start.y + end.y) / 2;
  return {
    d: `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`,
    end,
  };
}

function buildEdges(state, positions) {
  const rects = positions;
  const edges = [];

  state.nodes
    .filter((node) => node.type === 'argument')
    .forEach((node) => {
      const opening = node.argument.kind === 'opening';
      if (opening) {
        edges.push({
          id: `root-${node.nodeId}`,
          from: ROOT.id,
          to: node.nodeId,
          sideId: node.sideId,
          type: 'root',
          label: null,
        });
      }

      if (!opening && node.argument.respondTo && positions.has(node.argument.respondTo)) {
        edges.push({
          id: `reply-${node.nodeId}`,
          from: node.nodeId,
          to: node.argument.respondTo,
          sideId: node.sideId,
          type: 'rebuttal',
          label: node.argument.kind === 'closing' ? '结辩收束' : '反驳',
        });
      }
    });

  state.nodes
    .filter((node) => node.type === 'user')
    .forEach((node) => {
      const intervention = state.interventions.find((item) => item.id === node.nodeId);
      const targetNodeId = intervention?.reinforcedNodeId ?? intervention?.pressureNodeId;
      if (targetNodeId && positions.has(targetNodeId)) {
        edges.push({
          id: `support-${node.nodeId}`,
          from: node.nodeId,
          to: targetNodeId,
          sideId: node.supportedSideId,
          type: 'user',
          label: intervention?.reinforcedNodeId ? '你的介入' : '施加论证压力',
        });
      }
    });

  return edges.map((edge) => ({ ...edge, path: pathForEdge(edge, rects) })).filter((edge) => edge.path);
}

export default function ArgumentMap({ state }) {
  const { positions, width, height } = getArgumentMapLayout(state);
  const edges = buildEdges(state, positions);

  return (
    <div className="map-scroll">
      <div className="argument-map" style={{ width, height }}>
        <svg className="map-lines" width={width} height={height} aria-hidden="true">
          <defs>
            {Object.entries(state.sides).map(([sideId, side]) => (
              <marker
                key={sideId}
                id={`arrow-${sideId}`}
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill={side.color} />
              </marker>
            ))}
          </defs>
          {edges.map((edge) => (
            <g key={edge.id} className={`map-edge map-edge-${edge.type}`}>
              <path
                d={edge.path.d}
                fill="none"
                stroke={state.sides[edge.sideId]?.color}
                strokeWidth={edge.type === 'root' ? 1.4 : 2.2}
                strokeDasharray={edge.type === 'root' ? '4 6' : undefined}
                markerEnd={`url(#arrow-${edge.sideId})`}
              />
              {edge.label && (
                <text
                  x={(edge.path.end.x + positions.get(edge.from).x + positions.get(edge.from).width / 2) / 2}
                  y={(edge.path.end.y + positions.get(edge.from).y + positions.get(edge.from).height / 2) / 2 - 8}
                  textAnchor="middle"
                >
                  {edge.label}
                </text>
              )}
            </g>
          ))}
        </svg>

        <section className="map-question-node" style={ROOT}>
          <span>共同问题</span>
          <h3>{state.question.title}</h3>
        </section>

        {state.nodes.map((node) => {
          if (node.type === 'user') {
            return (
              <article key={node.nodeId} className="map-node map-user-node" style={positions.get(node.nodeId)}>
                <span className="map-node-kind">关键介入 · 第 {node.round} 回合</span>
                <h3>{node.argument.title}</h3>
                <p>{node.argument.body}</p>
              </article>
            );
          }

          const side = state.sides[node.sideId];
          const argument = node.argument;
          return (
            <article
              key={node.nodeId}
              className="map-node map-argument-node"
              style={{ ...positions.get(node.nodeId), '--side': side.color }}
            >
              <div className="map-node-top">
                <span className="map-node-kind">{kindLabels[argument.kind] ?? '论证'}</span>
                <span>第 {node.round} 回合</span>
              </div>
              <h3>{argument.title}</h3>
              <p>{argument.body}</p>
              <footer>
                <span>{side.name}</span>
                {argument.kind === 'reinforced-response' && <b>获得你的支持</b>}
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
