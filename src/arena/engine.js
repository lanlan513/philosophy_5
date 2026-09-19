import { arenaQuestions, arenaSchools, getArenaQuestion, getArenaSchool, getMovesForQuestion } from './data.js';

export const ARENA_RULES = {
  totalTurns: 8,
  interventionAfterTurn: 4,
  minimumRelevantScore: 18,
};

const overlap = (left = [], right = []) => left.filter((tag) => right.includes(tag));

function getSchoolMoves(questionId, schoolId) {
  return getMovesForQuestion(questionId).filter((move) => move.schoolId === schoolId);
}

function usedMoveIds(nodes) {
  return new Set(nodes.filter((node) => node.type === 'move').map((node) => node.moveId));
}

function getSideNodes(nodes, side) {
  return nodes.filter((node) => node.type === 'move' && node.side === side);
}

function makeNodeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// 依据上一条论证的 supportTags / attackTags 给候选下一步打分。
export function scoreMove(candidate, previousMove, sideRound, boostTags = []) {
  const directChallenges = overlap(candidate.attackTags, previousMove.supportTags);
  const answersAttack = overlap(previousMove.attackTags, candidate.supportTags);
  const sharedTerms = overlap(candidate.attackTags, previousMove.attackTags);
  const boosted = overlap(boostTags, candidate.supportTags);

  let score = 0;
  score += directChallenges.length * 24;
  score += answersAttack.length * 8;
  score += sharedTerms.length * 3;
  score += boosted.length * 12;

  if (candidate.kind === 'rebuttal' && sideRound < 3) score += 7;
  if (candidate.kind === 'closing') {
    score += sideRound >= 3 ? 22 : -40;
  }
  if (candidate.minRound === sideRound) score += 3;

  return {
    score,
    matchedTags: [...new Set([...directChallenges, ...answersAttack, ...boosted])],
    confidence: score >= 58 ? '高' : score >= ARENA_RULES.minimumRelevantScore ? '中' : '低',
  };
}

export function chooseReply({ questionId, schoolId, nodes, side, previousMove, boostTags = [] }) {
  const used = usedMoveIds(nodes);
  const sideRound = getSideNodes(nodes, side).length;

  const candidates = getSchoolMoves(questionId, schoolId)
    .filter((move) => !used.has(move.id))
    .filter((move) => move.kind !== 'opening')
    .filter((move) => move.minRound <= sideRound)
    .filter((move) => {
      // 每个流派只保留一个开场；之后两轮必须给反驳，最后一轮才允许收束。
      if (sideRound >= 3) return move.kind === 'closing';
      return move.kind === 'rebuttal';
    })
    .map((move) => ({ move, ...scoreMove(move, previousMove, sideRound, boostTags) }))
    .sort((a, b) => b.score - a.score || a.move.id.localeCompare(b.move.id));

  const best = candidates[0];
  if (!best || best.score < ARENA_RULES.minimumRelevantScore) {
    return { move: null, confidence: '无', matchedTags: [], score: best?.score ?? 0, candidates };
  }
  return { ...best, candidates };
}

function chooseOpening(questionId, schoolId, nodes) {
  const used = usedMoveIds(nodes);
  return getSchoolMoves(questionId, schoolId).find((move) => move.kind === 'opening' && !used.has(move.id)) || null;
}

function moveToNode(move, side, turnNumber, extra = {}) {
  return {
    id: makeNodeId('node'),
    type: 'move',
    side,
    schoolId: move.schoolId,
    moveId: move.id,
    kind: move.kind,
    title: move.title,
    text: move.text,
    attackTags: move.attackTags,
    supportTags: move.supportTags,
    turn: turnNumber,
    ...extra,
  };
}

function edge(source, target, type, label) {
  return { id: `${source}->${target}->${type}`, source, target, type, label };
}

export function simulatePair(questionId, sideAId, sideBId) {
  let nodes = [];
  const openingA = getSchoolMoves(questionId, sideAId).find((move) => move.kind === 'opening');
  const openingB = getSchoolMoves(questionId, sideBId).find((move) => move.kind === 'opening');
  if (!openingA || !openingB) return { completedTurns: 0, confidenceTotal: -999, exhausted: true };

  let previous = openingA;
  nodes.push(moveToNode(openingA, 'A', 1));
  nodes.push(moveToNode(openingB, 'B', 2));
  previous = openingB;
  let confidenceTotal = 20;

  for (let turn = 3; turn <= ARENA_RULES.totalTurns; turn += 1) {
    const side = turn % 2 === 1 ? 'A' : 'B';
    const schoolId = side === 'A' ? sideAId : sideBId;
    const reply = chooseReply({ questionId, schoolId, nodes, side, previousMove: previous });
    if (!reply.move) {
      return { completedTurns: turn - 1, confidenceTotal, exhausted: true, lastTurn: turn };
    }
    const node = moveToNode(reply.move, side, turn, { confidence: reply.confidence, matchedTags: reply.matchedTags });
    nodes.push(node);
    previous = reply.move;
    confidenceTotal += reply.confidence === '高' ? 3 : reply.confidence === '中' ? 1 : -2;
  }

  return { completedTurns: ARENA_RULES.totalTurns, confidenceTotal, exhausted: false };
}

const traditionContrast = (a, b) => (a.tradition === b.tradition ? -2 : 10);

export function getPairings(questionId) {
  const available = arenaSchools.filter((school) =>
    getSchoolMoves(questionId, school.id).some((move) => move.kind === 'opening')
  );
  const pairings = [];

  for (let i = 0; i < available.length; i += 1) {
    for (let j = i + 1; j < available.length; j += 1) {
      const a = available[i];
      const b = available[j];
      const simulation = simulatePair(questionId, a.id, b.id);
      const moveCount = getSchoolMoves(questionId, a.id).length + getSchoolMoves(questionId, b.id).length;
      const score = simulation.completedTurns * 18
        + simulation.confidenceTotal * 4
        + moveCount
        + traditionContrast(a, b)
        + (simulation.exhausted ? -18 : 12);

      pairings.push({
        key: `${a.id}__${b.id}`,
        schools: [a.id, b.id],
        score,
        completedTurns: simulation.completedTurns,
        exhausted: simulation.exhausted,
        moveCount,
        rationale: simulation.exhausted
          ? `本地论证库可支撑 ${simulation.completedTurns} 个回合，随后进入“无合适反驳”分支`
          : '双方在四轮交锋中均能找到相关回应',
      });
    }
  }

  return pairings.sort((a, b) => b.score - a.score);
}

export function createDebate(questionId, [schoolAId, schoolBId]) {
  const question = getArenaQuestion(questionId);
  const schoolA = getArenaSchool(schoolAId);
  const schoolB = getArenaSchool(schoolBId);
  if (!question || !schoolA || !schoolB) throw new Error('Invalid debate setup');

  const openingMove = chooseOpening(questionId, schoolAId, []);
  if (!openingMove) throw new Error('The first school has no opening move');

  const root = {
    id: 'question-root',
    type: 'question',
    title: question.title,
    text: question.prompt,
  };
  const opening = moveToNode(openingMove, 'A', 1, { round: 0, confidence: '开场' });

  return {
    phase: 'debating',
    questionId,
    schools: {
      A: schoolAId,
      B: schoolBId,
    },
    turnNumber: 1,
    roundNumber: 1,
    nextSide: 'B',
    nodes: [root, opening],
    edges: [edge(root.id, opening.id, 'opening', '开场主张')],
    pendingInfluence: null,
    endReason: null,
    history: [
      `匹配 ${schoolA.name} 与 ${schoolB.name}，由 ${schoolA.name} 先提出主张。`,
    ],
    past: [],
  };
}

function clone(state) {
  return JSON.parse(JSON.stringify(state));
}

function snapshot(state) {
  state.past = [...(state.past || []), JSON.parse(JSON.stringify(state))];
  return state;
}

function getPreviousMove(nodes) {
  return [...nodes].reverse().find((node) => node.type === 'move');
}

export function advance(state) {
  if (!state || state.phase !== 'debating') return state;

  const next = snapshot(clone(state));
  const side = next.nextSide;
  const schoolId = next.schools[side];
  const sideRound = getSideNodes(next.nodes, side).length;
  const previous = getPreviousMove(next.nodes);
  const turnNumber = next.turnNumber + 1;

  let selected;
  if (sideRound === 0) {
    const move = chooseOpening(next.questionId, schoolId, next.nodes);
    selected = move ? { move, confidence: '开场', matchedTags: [], score: 0 } : null;
  } else {
    selected = chooseReply({
      questionId: next.questionId,
      schoolId,
      nodes: next.nodes,
      side,
      previousMove: previous,
      boostTags: next.pendingInfluence?.tags || [],
    });
  }

  if (!selected?.move) {
    const school = getArenaSchool(schoolId);
    const noReply = {
      id: makeNodeId('no-reply'),
      type: 'no-reply',
      side,
      schoolId,
      title: `${school.short}方暂无合适反驳`,
      text: '本地论证库中没有一条未使用、且能回应上一轮前提的论证。流程不会编造论点，而是进入提前收束分支。',
      turn: turnNumber,
    };
    next.nodes.push(noReply);
    next.edges.push(edge(previous.id, noReply.id, 'no-reply', '无合适反驳'));
    next.phase = 'exhausted';
    next.endReason = 'no-reply';
    next.nextSide = side;
    next.history.push(`第 ${turnNumber} 回合：${school.name} 没有匹配到合适反驳。`);
    return next;
  }

  const node = moveToNode(selected.move, side, turnNumber, {
    round: sideRound,
    confidence: selected.confidence,
    matchedTags: selected.matchedTags,
    userBoosted: Boolean(next.pendingInfluence && overlap(next.pendingInfluence.tags, selected.move.supportTags).length),
  });
  next.nodes.push(node);
  next.edges.push(edge(previous.id, node.id, 'rebuttal', selected.move.kind === 'closing' ? '收束' : '回应'));

  if (next.pendingInfluence) {
    next.edges.push(edge(next.pendingInfluence.nodeId, node.id, 'influence', '影响下一条'));
    next.pendingInfluence = null;
  }

  next.turnNumber = turnNumber;
  next.roundNumber = Math.ceil(turnNumber / 2);
  next.nextSide = side === 'A' ? 'B' : 'A';

  if (turnNumber === ARENA_RULES.interventionAfterTurn) {
    next.phase = 'awaiting-user';
    next.history.push('关键回合暂停：等待用户介入。');
  } else if (turnNumber >= ARENA_RULES.totalTurns) {
    next.phase = 'completed';
    next.endReason = 'completed';
    next.history.push('四轮交锋完成，论证关系图已闭合。');
  } else {
    next.history.push(`第 ${turnNumber} 回合：${getArenaSchool(schoolId).name} 提出${selected.move.kind === 'closing' ? '收束' : '反驳'}。`);
  }

  return next;
}

export function chooseSupport(state, side) {
  if (!state || state.phase !== 'awaiting-user') return state;
  const next = snapshot(clone(state));
  const previous = getPreviousMove(next.nodes);
  const supportedSchoolId = side === 'neutral' ? null : next.schools[side];
  const supportedSchool = supportedSchoolId ? getArenaSchool(supportedSchoolId) : null;
  const boostTags = supportedSchoolId
    ? getSchoolMoves(next.questionId, supportedSchoolId).flatMap((move) => move.supportTags)
    : [];

  const intervention = {
    id: makeNodeId('intervention'),
    type: 'intervention',
    side,
    title: side === 'neutral' ? '用户要求保持中立' : `用户介入：支持${supportedSchool.short}方`,
    text: side === 'neutral'
      ? '不向任何一方增加偏好权重，后半场按论证标签匹配自然推进。'
      : `下一轮 ${supportedSchool.name} 的论证若与其核心前提相符，会获得更高匹配权重。`,
    boostTags: [...new Set(boostTags)],
    turn: ARENA_RULES.interventionAfterTurn + 0.5,
  };

  next.nodes.push(intervention);
  next.edges.push(edge(previous.id, intervention.id, 'decision', side === 'neutral' ? '中立继续' : '用户选择'));
  next.pendingInfluence = { nodeId: intervention.id, side, tags: intervention.boostTags };
  next.phase = 'debating';
  next.userChoice = side;
  next.history.push(intervention.title);
  return next;
}

export function finishWithClosing(state) {
  if (!state || state.phase !== 'exhausted') return state;
  const failedSide = state.nextSide;
  const opponentSide = failedSide === 'A' ? 'B' : 'A';
  const opponentSchoolId = state.schools[opponentSide];
  const used = usedMoveIds(state.nodes);
  const closing = getSchoolMoves(state.questionId, opponentSchoolId)
    .filter((move) => !used.has(move.id))
    .sort((a, b) => Number(b.kind === 'closing') - Number(a.kind === 'closing') || a.minRound - b.minRound)[0];

  if (!closing) return finishNow(state);

  const next = snapshot(clone(state));
  const noReply = [...next.nodes].reverse().find((node) => node.type === 'no-reply');
  const node = moveToNode(closing, opponentSide, next.turnNumber + 1, {
    round: getSideNodes(next.nodes, opponentSide).length,
    confidence: '收束',
    earlyClosing: true,
  });
  next.nodes.push(node);
  next.edges.push(edge(noReply.id, node.id, 'closing', '对方收束'));
  next.turnNumber += 1;
  next.phase = 'completed';
  next.endReason = 'early-closing';
  next.history.push(`${getArenaSchool(opponentSchoolId).name} 使用已有论证提前收束。`);
  return next;
}

export function finishNow(state) {
  if (!state || state.phase !== 'exhausted') return state;
  const next = snapshot(clone(state));
  next.phase = 'completed';
  next.endReason = 'no-reply';
  next.history.push('论证提前结束，直接生成当前论证关系图。');
  return next;
}

export function undo(state) {
  if (!state?.past?.length) return state;
  const past = [...state.past];
  const previous = past.pop();
  return { ...previous, past };
}

export function getSchoolSideMap(state) {
  return {
    A: getArenaSchool(state.schools.A),
    B: getArenaSchool(state.schools.B),
  };
}

export function isArenaQuestion(id) {
  return arenaQuestions.some((question) => question.id === id);
}
