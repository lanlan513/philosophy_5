import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, RotateCcw, Swords, Users } from 'lucide-react';
import { questions } from '../data';
import ArgumentMap from './ArgumentMap';
import {
  MAX_ROUND,
  advance,
  createDebate,
  finishEarly,
  getAvailableTraditions,
  getDebateQuestion,
  reviseIntervention,
  skipIntervention,
  supportSide,
} from './engine';

const phaseLabels = {
  opening: '开场',
  advancing: '自动选择反驳',
  intervention: '等待用户介入',
  complete: '论证图完成',
  invalid: '组合无效',
};

const kindLabels = {
  opening: '开场主张',
  response: '反驳 / 反反驳',
  'reinforced-response': '获得支持的反反驳',
  closing: '结辩',
};

export function ArenaSetup() {
  const { questionId: presetQuestionId } = useParams();
  const validPreset = getDebateQuestion(presetQuestionId) ? presetQuestionId : questions[0].id;
  const [questionId, setQuestionId] = useState(validPreset);
  const available = getAvailableTraditions(questionId);
  const [selections, setSelections] = useState({ A: available[0]?.id, B: available[1]?.id });

  function chooseQuestion(id) {
    const next = getAvailableTraditions(id);
    setQuestionId(id);
    setSelections({ A: next[0]?.id, B: next[1]?.id });
  }

  function chooseSide(slot, traditionId) {
    setSelections((current) => {
      const otherSlot = slot === 'A' ? 'B' : 'A';
      if (current[otherSlot] === traditionId) {
        return { ...current, [slot]: traditionId, [otherSlot]: current[slot] };
      }
      return { ...current, [slot]: traditionId };
    });
  }

  const question = getDebateQuestion(questionId);
  const canStart = selections.A && selections.B && selections.A !== selections.B;

  return (
    <main className="page-main arena-setup section-pad">
      <div className="page-intro arena-intro">
        <span className="kicker">PHILOSOPHY ARENA</span>
        <h1>哲学思想竞技场。</h1>
        <p>先选择一个共同问题，再从本地论证库动态匹配两种流派。下一条反驳不会预先写死，而会根据上一轮主张的标签与强度即时选择。</p>
      </div>

      <section className="setup-block">
        <span className="setup-step">01 / 选择共同问题</span>
        <div className="arena-question-picker">
          {questions.map((item) => (
            <button
              key={item.id}
              className={item.id === questionId ? 'is-active' : ''}
              style={{ '--accent': item.accent }}
              onClick={() => chooseQuestion(item.id)}
            >
              <span>{item.number}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>
        <p className="setup-question-copy">{question.description}</p>
      </section>

      <section className="setup-block">
        <span className="setup-step">02 / 动态匹配两支流派</span>
        <div className="side-picker-grid">
          {['A', 'B'].map((slot) => (
            <div className={`side-slot side-slot-${slot}`} key={slot}>
              <header>
                <span>{slot === 'A' ? '阵营 A · 先行开场' : '阵营 B · 首轮反驳'}</span>
              </header>
              <div className="side-choice-list">
                {available.map((tradition) => (
                  <button
                    key={tradition.id}
                    className={selections[slot] === tradition.id ? 'is-active' : ''}
                    style={{ '--side-color': tradition.color }}
                    onClick={() => chooseSide(slot, tradition.id)}
                  >
                    <span>{tradition.name}</span>
                    <small>{tradition.stance.label}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="setup-start-row">
        <p>同一问题共有 <b>{available.length}</b> 个可匹配流派；没有为任何固定组合单独配置页面。</p>
        {canStart ? (
          <Link className="arena-button" to={`/arena/match/${questionId}/${selections.A}/${selections.B}`}>
            开始交锋 <Swords size={16} />
          </Link>
        ) : (
          <button className="arena-button is-disabled" disabled>请选择两个不同流派</button>
        )}
      </div>
    </main>
  );
}

function ArgumentCard({ node, side, event }) {
  return (
    <article className={`speech-card speech-card-${node.sideId}`} style={{ '--side': side.color }}>
      <header>
        <span>{side.name}</span>
        <span>{kindLabels[node.argument.kind] ?? '论证'}</span>
      </header>
      <h3>{node.argument.title}</h3>
      <p>{node.argument.body}</p>
      {event?.matchReasons?.length > 0 && (
        <footer>
          <b>动态匹配：</b>
          {event.matchReasons.join('；')}
        </footer>
      )}
      {event?.relationLabel && !event?.matchReasons?.length && <footer>{event.relationLabel}</footer>}
    </article>
  );
}

function MachineStatus({ state }) {
  const steps = [
    { key: 'opening', label: '开场' },
    { key: 'advancing', label: '动态反驳' },
    { key: 'intervention', label: '用户介入' },
    { key: 'complete', label: '关系图' },
  ];
  return (
    <div className={`machine-status machine-${state.phase}`}>
      {steps.map((step, index) => {
        const active = state.phase === step.key;
        return (
          <React.Fragment key={step.key}>
            <span className={active ? 'is-current' : ''}>{step.label}</span>
            {index < steps.length - 1 && <i />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function ArenaMatch() {
  const { questionId, sideAId, sideBId } = useParams();
  const [state, setState] = useState(() => createDebate({ questionId, sideAId, sideBId }));

  const eventsByNode = useMemo(() => {
    const map = {};
    state.events.forEach((event) => {
      if (event.archived || !event.nodeId) return;
      map[event.nodeId] = event;
    });
    return map;
  }, [state.events]);

  if (state.phase === 'invalid') {
    return (
      <main className="page-main section-pad">
        <div className="page-intro">
          <span className="kicker">INVALID MATCH</span>
          <h1>这组流派无法在本地论证库中匹配。</h1>
          <p>可能是问题缺少开场论证，或两个阵营选择了同一个流派。</p>
          <Link className="text-link" to="/arena">返回竞技场重新匹配 <ArrowUpRight size={16} /></Link>
        </div>
      </main>
    );
  }

  const visibleRounds = Math.max(
    state.round,
    ...state.nodes.map((node) => node.round),
    1,
  );
  const currentSide = state.sides[state.currentSide];
  const activeCheckpoints = Object.keys(state.checkpoints)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <main className="arena-page section-pad">
      <Link className="back-link" to={`/arena/match-select/${questionId}`}>
        <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />重新匹配流派
      </Link>

      <section className="arena-hero">
        <div>
          <span className="kicker">ROUND {Math.min(state.round, MAX_ROUND)} / {MAX_ROUND} · {phaseLabels[state.phase]}</span>
          <h1>{state.question.title}</h1>
          <p>{state.question.description}</p>
        </div>
        <MachineStatus state={state} />
      </section>

      <section className="arena-combatants">
        {['A', 'B'].map((sideId) => {
          const side = state.sides[sideId];
          const isCurrent = state.currentSide === sideId;
          return (
            <article key={sideId} style={{ '--side': side.color }} className={isCurrent ? 'is-current' : ''}>
              <span>{sideId === 'A' ? '阵营 A' : '阵营 B'}</span>
              <h2>{side.name}</h2>
              <p>{side.posture}</p>
              {isCurrent && state.phase !== 'complete' && <b>当前待发言</b>}
            </article>
          );
        })}
      </section>

      <section className="arena-transcript">
        {Array.from({ length: visibleRounds }, (_, index) => index + 1).map((round) => {
          const roundNodes = state.nodes.filter((node) => node.round === round);
          const userNode = roundNodes.find((node) => node.type === 'user');
          return (
            <div className={`debate-round ${round === state.round ? 'is-current-round' : ''}`} key={round}>
              <div className="round-marker"><span>ROUND {round}</span></div>
              <div className="round-lanes">
                <div className="round-lane round-lane-A">
                  {roundNodes.filter((node) => node.type === 'argument' && node.sideId === 'A').map((node) => (
                    <ArgumentCard key={node.nodeId} node={node} side={state.sides.A} event={eventsByNode[node.nodeId]} />
                  ))}
                  {round === state.round && state.currentSide === 'A' && state.phase === 'advancing' && (
                    <div className="pending-card">等待引擎选择下一条反驳…</div>
                  )}
                </div>
                <div className="round-lane round-lane-center">
                  {userNode ? (
                    <article className={`intervention-card support-${userNode.supportedSideId}`}>
                      <Users size={16} />
                      <span>第 {round} 回合介入</span>
                      <strong>{userNode.argument.title}</strong>
                    </article>
                  ) : round === state.round && state.phase === 'intervention' ? (
                    <div className="intervention-pending">关键回合<br />可选择支持一方</div>
                  ) : null}
                </div>
                <div className="round-lane round-lane-B">
                  {roundNodes.filter((node) => node.type === 'argument' && node.sideId === 'B').map((node) => (
                    <ArgumentCard key={node.nodeId} node={node} side={state.sides.B} event={eventsByNode[node.nodeId]} />
                  ))}
                  {round === state.round && state.currentSide === 'B' && state.phase === 'advancing' && (
                    <div className="pending-card">等待引擎选择下一条反驳…</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="arena-controls">
        {state.phase === 'advancing' && (
          <>
            <p>轮到 <b>{currentSide.name}</b>。引擎将读取对方最新主张的标签，从该流派未使用的本地论证中评分选择。</p>
            <button className="arena-button" onClick={() => setState(advance(state))}>
              推进本回合 <ChevronRight size={16} />
            </button>
          </>
        )}

        {state.phase === 'intervention' && (
          <>
            <p>你可以在关键回合把论证压力推向一方；若该方没有未使用的合适反驳，流程会自动进入提前收束。</p>
            <div className="support-buttons">
              <button className="arena-button" style={{ '--side': state.sides.A.color }} onClick={() => setState(supportSide(state, 'A'))}>
                支持{state.sides.A.name}
              </button>
              <button className="arena-button secondary" onClick={() => setState(skipIntervention(state))}>
                旁观，让双方继续
              </button>
              <button className="arena-button" style={{ '--side': state.sides.B.color }} onClick={() => setState(supportSide(state, 'B'))}>
                支持{state.sides.B.name}
              </button>
            </div>
          </>
        )}

        {state.phase === 'complete' && (
          <div className="complete-panel">
            <p>交锋结束。主张、反驳、反反驳、结辩以及你的介入位置已经整理成下方论证关系图。</p>
            <Link className="arena-button secondary" to={`/arena/match-select/${questionId}`}>
              <RotateCcw size={15} /> 重新匹配一场
            </Link>
          </div>
        )}

        {state.phase !== 'complete' && (
          <button className="text-button" onClick={() => setState(finishEarly(state))}>
            双方论证提前结束：用当前记录生成关系图
          </button>
        )}

        {activeCheckpoints.length > 0 && (
          <div className="revision-row">
            <span>返回修改支持选择：</span>
            {activeCheckpoints.map((round) => (
              <button key={round} onClick={() => setState(reviseIntervention(state, round))}>
                第 {round} 回合
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="arena-history">
        <div>
          <h2>历史记录与非理想流程</h2>
          <p>归档记录保留被“返回修改”放弃的分支；当前关系图只展示仍有效的论证树。</p>
        </div>
        <ol>
          {state.events.map((event) => (
            <li key={event.id} className={event.archived ? 'is-archived' : ''}>
              <span>R{event.round ?? '-'}</span>
              <b>{event.text}</b>
              {event.archived && <small>{event.archivedReason}</small>}
            </li>
          ))}
        </ol>
        {state.archivedBranches.length > 0 && (
          <div className="abandoned-branches">
            <span>已放弃分支：{state.archivedBranches.length} 条</span>
            {state.archivedBranches.map((branch, index) => (
              <small key={index}>第 {branch.checkpointRound} 回合之后的 {branch.nodes.length} 个节点已归档</small>
            ))}
          </div>
        )}
      </section>

      {state.phase === 'complete' && (
        <section className="map-section">
          <div className="map-heading">
            <span className="kicker">ARGUMENT MAP</span>
            <h2>论证关系图</h2>
            <p>虚线连接共同问题；实线箭头指向被回应的主张；中线节点标记用户介入。</p>
          </div>
          <ArgumentMap state={state} />
        </section>
      )}
    </main>
  );
}
