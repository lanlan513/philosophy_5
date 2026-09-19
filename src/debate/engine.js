import { getTradition, questions } from '../data';
import { debateStances } from './debateData';

export const MAX_ROUND = 4;

export function getDebateQuestion(questionId) {
  return questions.find((question) => question.id === questionId);
}

export function getStance(questionId, traditionId) {
  return debateStances[questionId]?.[traditionId];
}

export function getAvailableTraditions(questionId) {
  return Object.entries(debateStances[questionId] ?? {})
    .map(([traditionId, stance]) => {
      const tradition = getTradition(traditionId);
      return tradition ? { ...tradition, stance } : null;
    })
    .filter(Boolean);
}

function argumentId(traditionId, kind, index = 0) {
  return `${traditionId}:${kind}:${index}`;
}

function baseArgument(stance, source, kind, index = 0, payload = {}) {
  return {
    id: payload.id ?? argumentId(stance.traditionId, kind, index),
    kind,
    sideId: stance.side,
    traditionId: stance.traditionId,
    round: source.round,
    title: payload.title,
    body: payload.body,
    tags: payload.tags ?? [],
    isFallback: Boolean(payload.fallback),
    strength: payload.strength ?? 5,
    respondTo: source.respondTo ?? null,
  };
}

function makeOpening(stance) {
  return baseArgument(stance, { round: 1, respondTo: null }, 'opening', 0, stance.data.opening);
}

function makeClosing(stance, round, respondTo) {
  return baseArgument(stance, { round, respondTo }, 'closing', 0, stance.data.closing);
}

function makeResponse(stance, response, round, respondTo, index) {
  return baseArgument(stance, { round, respondTo }, 'response', index, response);
}

function getArgumentsForSide(state, sideId) {
  return state.nodes
    .filter((node) => node.sideId === sideId && node.type === 'argument')
    .map((node) => node.argument);
}

function createNode(argument, type = 'argument') {
  return {
    nodeId: argument.id,
    type,
    sideId: argument.sideId,
    round: argument.round,
    argument,
  };
}

function addEvent(state, draft, event) {
  const next = {
    id: `event-${state.seq.event + 1}`,
    at: event.round ?? state.round,
    archived: false,
    ...event,
  };
  draft.seq.event += 1;
  draft.events.push(next);
  return next;
}

function makeSide(questionId, traditionId, side) {
  const tradition = getTradition(traditionId);
  const data = getStance(questionId, traditionId);
  return {
    side,
    traditionId,
    name: tradition?.name ?? traditionId,
    color: tradition?.color ?? '#b9b1a4',
    label: data?.label ?? traditionId,
    posture: data?.posture ?? '本地论证库尚无该组合。',
  };
}

export function createDebate({ questionId, sideAId, sideBId }) {
  const question = getDebateQuestion(questionId);
  const sideA = sideAId && makeSide(questionId, sideAId, 'A');
  const sideB = sideBId && makeSide(questionId, sideBId, 'B');
  const invalid =
    !question ||
    !sideA ||
    !sideB ||
    sideAId === sideBId ||
    !getStance(questionId, sideAId)?.opening ||
    !getStance(questionId, sideBId)?.opening;

  if (invalid) {
    return {
      phase: 'invalid',
      question: question ?? null,
      sides: { A: sideA ?? null, B: sideB ?? null },
      round: 1,
      currentSide: 'A',
      nodes: [],
      checkpoints: {},
      interventions: [],
      events: [],
      archivedBranches: [],
      seq: { event: 0 },
    };
  }

  const state = {
    phase: 'opening',
    question,
    sides: { A: sideA, B: sideB },
    round: 1,
    currentSide: 'A',
    nodes: [],
    checkpoints: {},
    interventions: [],
    events: [],
    archivedBranches: [],
    seq: { event: 0 },
  };

  const openingA = makeOpening({ side: 'A', traditionId: sideAId, data: getStance(questionId, sideAId) });
  const openingB = makeOpening({ side: 'B', traditionId: sideBId, data: getStance(questionId, sideBId) });
  state.nodes.push(createNode(openingA), createNode(openingB));
  addEvent(state, state, {
    type: 'start',
    round: 1,
    text: `${sideA.name} 与 ${sideB.name} 入场`,
  });
  addEvent(state, state, {
    type: 'opening',
    round: 1,
    sideId: 'A',
    nodeId: openingA.id,
    text: `${sideA.name}提出开场主张`,
  });
  state.round = 2;
  state.currentSide = 'B';
  state.phase = 'advancing';
  addEvent(state, state, {
    type: 'turn',
    round: 2,
    sideId: 'B',
    text: '等待第一轮反驳',
  });
  return state;
}

function getResponseCandidates(questionId, side, usedIds) {
  const stance = getStance(questionId, side.traditionId);
  return (stance?.responses ?? [])
    .map((response, index) => ({
      ...response,
      id: argumentId(side.traditionId, 'response', index),
    }))
    .filter((response) => !usedIds.has(response.id));
}

function scoreResponse(candidate, target, round, usedIds) {
  if (usedIds.has(candidate.id)) return { score: -1, reasons: [] };

  let score = (candidate.strength ?? 5) * 10;
  const reasons = [];
  const targetTags = target.tags ?? [];
  const isWildcard = candidate.respondTags?.includes('*') ?? false;
  const overlap = isWildcard ? [] : candidate.respondTags?.filter((tag) => targetTags.includes(tag)) ?? [];
  if (!overlap.length && !candidate.fallback) {
    return { score: -1, reasons: [] };
  }
  if (overlap.length) {
    score += overlap.length * 26;
    reasons.push(`命中上一轮的 ${overlap.join(' / ')} 标签`);
  }
  if (isWildcard) {
    score -= 30;
    reasons.push('没有精确标签命中，改用该流派的通用回应');
  }
  reasons.push(`该回应的论证强度为 ${candidate.strength}`);

  if (candidate.fallback && !isWildcard) {
    score -= 22;
    reasons.push('这是该流派的通用回应');
  }
  if (round === MAX_ROUND) {
    score -= 8;
    reasons.push('第四回合优先收束论证');
  }

  return { score: Math.max(1, score), reasons };
}

function chooseResponse(state, sideId, round, target) {
  const side = state.sides[sideId];
  const usedIds = new Set(getArgumentsForSide(state, sideId).map((argument) => argument.id));
  const candidates = getResponseCandidates(state.question.id, side, usedIds);

  if (!candidates.length || !target) {
    return null;
  }

  const ranked = candidates
    .map((candidate) => {
      const { score, reasons } = scoreResponse(candidate, target, round, usedIds);
      return { candidate, score, reasons };
    })
    .filter((item) => item.score > 0);

  if (!ranked.length) return null;

  ranked.sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));
  return {
    ...ranked[0],
    candidateIndex: candidates.indexOf(ranked[0].candidate),
  };
}

function argumentExists(state, nodeId) {
  return state.nodes.some((node) => node.nodeId === nodeId);
}

function appendArgument(state, draft, argument, relationLabel, matchReasons = []) {
  const node = createNode(argument);
  draft.nodes.push(node);
  const side = draft.sides[argument.sideId];
  addEvent(draft, draft, {
    type: argument.kind,
    round: argument.round,
    sideId: argument.sideId,
    nodeId: argument.id,
    targetNodeId: argument.respondTo,
    relationLabel,
    matchReasons,
    text: `${side.name}${relationLabel}`,
  });
  return node;
}

function finishDebate(draft, reason) {
  draft.phase = 'complete';
  draft.currentSide = null;
  addEvent(draft, draft, {
    type: 'complete',
    round: draft.round,
    text: reason,
  });
}

function prepareNextTurn(draft, lastSide, justSpokeRound) {
  const otherSide = lastSide === 'A' ? 'B' : 'A';
  const otherSpokeThisRound = draft.nodes.some((node) => node.sideId === otherSide && node.round === justSpokeRound);

  // 同一回合双方都已发言：进入下一回合，并按“谁先在上一轮发言”的顺序轮转。
  if (otherSpokeThisRound) {
    if (justSpokeRound >= MAX_ROUND) {
      finishDebate(draft, '双方已完成第四回合，论证收束');
      return;
    }

    draft.round = justSpokeRound + 1;
    draft.currentSide = lastSide;
  } else {
    draft.round = justSpokeRound;
    draft.currentSide = otherSide;
  }

  draft.phase = draft.round >= 3 ? 'intervention' : 'advancing';
  addEvent(draft, draft, {
    type: 'turn',
    round: draft.round,
    sideId: draft.currentSide,
    text: draft.phase === 'intervention' ? '关键回合：你可以介入' : '等待下一轮反驳',
  });
}

function getLatestOpponentNode(state, sideId) {
  const otherSide = sideId === 'A' ? 'B' : 'A';
  return [...state.nodes]
    .filter((node) => node.sideId === otherSide && node.type === 'argument')
    .at(-1)
    ?.argument;
}

function speakClosing(draft, sideId, round, target, label, reasons = []) {
  const side = draft.sides[sideId];
  const stance = getStance(draft.question.id, side.traditionId);
  if (!stance?.closing) {
    return null;
  }
  const closing = makeClosing(
    { side: sideId, traditionId: side.traditionId, data: stance },
    round,
    target?.id ?? null,
  );
  if (argumentExists(draft, closing.id)) {
    return null;
  }
  appendArgument(draft, draft, closing, label, reasons);
  return closing;
}

function advanceOneTurn(state) {
  if (state.phase !== 'advancing') return state;

  const draft = structuredClone(state);
  const sideId = draft.currentSide;
  const round = draft.round;
  const side = draft.sides[sideId];
  const target = getLatestOpponentNode(draft, sideId);

  if (round >= MAX_ROUND) {
    const closing = speakClosing(
      draft,
      sideId,
      MAX_ROUND,
      target,
      round === MAX_ROUND && draft.nodes.some((node) => node.round === MAX_ROUND) ? '提出最终收束' : '提出结辩',
      ['到达第四回合，使用结辩收束本线'],
    );
    if (closing) {
      prepareNextTurn(draft, sideId, MAX_ROUND);
    } else {
      finishDebate(draft, `${side.name}没有未使用的结辩，辩论提前结束`);
    }
    return draft;
  }

  const selected = chooseResponse(draft, sideId, round, target);
  const stance = getStance(draft.question.id, side.traditionId);

  if (!selected && stance?.closing) {
    const closing = speakClosing(
      draft,
      sideId,
      round,
      target,
      '无更合适反驳，提前收束',
      ['本地论证库没有未使用且达到匹配阈值的反驳'],
    );
    if (closing) {
      finishDebate(draft, `${side.name}没有更合适的反驳，以收束提前结束`);
      return draft;
    }
  }

  if (!selected) {
    finishDebate(draft, `${side.name}没有合适反驳，论证在此中断`);
    return draft;
  }

  const response = makeResponse(
    { side: sideId, traditionId: side.traditionId },
    selected.candidate,
    round,
    target?.id ?? null,
    selected.candidateIndex,
  );

  appendArgument(
    draft,
    draft,
    response,
    round === 2 ? '提出第一轮反驳' : draft.interventions.length ? '提出反反驳' : '提出下一轮反驳',
    selected.reasons,
  );
  prepareNextTurn(draft, sideId, round);
  return draft;
}

export function skipIntervention(state) {
  if (state.phase !== 'intervention') return state;
  const draft = structuredClone(state);
  addEvent(draft, draft, {
    type: 'skip',
    round: draft.round,
    text: '你选择旁观，双方继续交锋',
  });
  draft.phase = 'advancing';
  return draft;
}

function appendUserIntervention(draft, supportedSideId, round, reinforcedArgument, pressureNodeId = null, previousInterventionId = null) {
  const nodeId = `user:intervention:${draft.seq.event + 1}`;
  draft.nodes.push({
    nodeId,
    type: 'user',
    sideId: null,
    supportedSideId,
    pressureNodeId,
    round,
    argument: {
      id: nodeId,
      kind: 'support',
      title: `你支持${draft.sides[supportedSideId].name}`,
      body: '在关键回合，你把论证压力推向另一方。',
      tags: ['user'],
    },
  });
  draft.interventions.push({
    id: nodeId,
    round,
    supportedSideId,
    reinforcedNodeId: reinforcedArgument?.id ?? null,
    pressureNodeId,
    revisedFrom: previousInterventionId,
    active: true,
  });
  addEvent(draft, draft, {
    type: 'support',
    round,
    nodeId,
    supportedSideId,
    text: `你介入并支持${draft.sides[supportedSideId].name}`,
  });
  return nodeId;
}

export function supportSide(state, supportedSideId) {
  if (state.phase !== 'intervention' || !state.sides[supportedSideId]) return state;

  const draft = structuredClone(state);
  const round = draft.round;
  const side = draft.sides[supportedSideId];
  const target = getLatestOpponentNode(draft, supportedSideId);

  // 检查点保留“支持前”的完整状态，使后续可以返回修改。
  draft.checkpoints[round] = structuredClone({
    round,
    currentSide: draft.currentSide,
    phase: draft.phase,
    nodes: draft.nodes,
    interventions: draft.interventions,
    events: draft.events,
    archivedBranches: draft.archivedBranches,
    checkpoints: draft.checkpoints,
    seq: draft.seq,
  });

  const userNodeId = appendUserIntervention(draft, supportedSideId, round, null, target?.id ?? null);
  const selected = chooseResponse(draft, supportedSideId, round, target);
  let reinforcedArgument = null;

  if (selected) {
    const response = makeResponse(
      { side: supportedSideId, traditionId: side.traditionId },
      selected.candidate,
      round,
      target?.id ?? null,
      selected.candidateIndex,
    );
    response.kind = 'reinforced-response';
    response.tags = [...response.tags, 'user-supported'];
    response.supportedByNodeId = userNodeId;
    reinforcedArgument = appendArgument(
      draft,
      draft,
      response,
      '在你的支持下提出反反驳',
      [...selected.reasons, '用户介入为该方提供一次关键推进'],
    ).argument;
    draft.interventions.find((item) => item.id === userNodeId).reinforcedNodeId = reinforcedArgument.id;
  } else {
    addEvent(draft, draft, {
      type: 'exhausted',
      round,
      sideId: supportedSideId,
      text: `${side.name}获得支持，但本地论证库已没有未使用的合适反驳`,
    });
  }

  if (!reinforcedArgument) {
    finishDebate(draft, `${side.name}获得支持后仍无合适反驳，辩论收束`);
    return draft;
  }

  const opponentSide = supportedSideId === 'A' ? 'B' : 'A';
  const opponentTarget = reinforcedArgument;
  const opponentSelected = chooseResponse(draft, opponentSide, round, opponentTarget);

  if (round >= MAX_ROUND) {
    const closing = speakClosing(
      draft,
      opponentSide,
      MAX_ROUND,
      opponentTarget,
      '提出最终收束',
      ['到达第四回合，使用结辩回应介入'],
    );
    if (!closing) finishDebate(draft, `${draft.sides[opponentSide].name}无法回应介入，论证提前收束`);
    else finishDebate(draft, '第四回合结束，论证关系图已生成');
    return draft;
  }

  if (!opponentSelected) {
    const closing = speakClosing(
      draft,
      opponentSide,
      round,
      opponentTarget,
      '面对介入，无更合适反驳，提前收束',
      ['本地论证库没有未使用且达到匹配阈值的回应'],
    );
    if (closing) finishDebate(draft, `${draft.sides[opponentSide].name}以收束回应你的介入`);
    else finishDebate(draft, `${draft.sides[opponentSide].name}无法回应介入，论证提前结束`);
    return draft;
  }

  const opponentResponse = makeResponse(
    { side: opponentSide, traditionId: draft.sides[opponentSide].traditionId },
    opponentSelected.candidate,
    round,
    opponentTarget.id,
    opponentSelected.candidateIndex,
  );
  appendArgument(draft, draft, opponentResponse, '回应你的介入', opponentSelected.reasons);

  draft.round = round + 1;
  draft.currentSide = supportedSideId;
  draft.phase = draft.round >= MAX_ROUND ? 'advancing' : 'intervention';
  addEvent(draft, draft, {
    type: 'turn',
    round: draft.round,
    sideId: draft.currentSide,
    text: draft.phase === 'intervention' ? '下一关键回合：你可以继续介入或修改选择' : '等待最终收束',
  });
  return draft;
}

export function reviseIntervention(state, checkpointRound) {
  const checkpoint = state.checkpoints?.[checkpointRound];
  if (!checkpoint) return state;

  const draft = structuredClone(state);
  const cutoffRound = checkpoint.round;
  const abandonedNodes = draft.nodes.filter((node) => node.round >= cutoffRound);
  const retainedEventIds = new Set(checkpoint.events.map((event) => event.id));
  const abandonedEventIds = new Set(
    draft.events
      .filter((event) => !event.archived && !retainedEventIds.has(event.id))
      .map((event) => event.id),
  );

  const archive = {
    checkpointRound: cutoffRound,
    abandonedAt: new Date().toISOString(),
    nodes: abandonedNodes,
    eventIds: [...abandonedEventIds],
  };

  draft.events = draft.events.map((event) =>
    abandonedEventIds.has(event.id) ? { ...event, archived: true, archivedReason: '用户返回修改了支持选择' } : event,
  );

  const largestEventNumber = draft.events.reduce((max, event) => {
    const matched = event.id.match(/event-(\d+)/);
    return matched ? Math.max(max, Number(matched[1])) : max;
  }, 0);

  draft.nodes = checkpoint.nodes;
  draft.interventions = checkpoint.interventions;
  draft.events = draft.events;
  draft.archivedBranches = [...checkpoint.archivedBranches, archive];
  draft.checkpoints = checkpoint.checkpoints;
  draft.round = checkpoint.round;
  draft.currentSide = checkpoint.currentSide;
  draft.phase = 'intervention';
  draft.seq = { ...checkpoint.seq, event: Math.max(checkpoint.seq.event, largestEventNumber) };

  addEvent(draft, draft, {
    type: 'revise',
    round: cutoffRound,
    text: `你返回第 ${cutoffRound} 回合，修改支持选择`,
  });

  return draft;
}

export function finishEarly(state, reason = '你手动结束交锋，生成当前论证图') {
  if (!['advancing', 'intervention'].includes(state.phase)) return state;
  const draft = structuredClone(state);
  finishDebate(draft, reason);
  return draft;
}

export { advanceOneTurn as advance };
