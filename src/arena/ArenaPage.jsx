import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Flag, GitBranch, RefreshCcw, Scale, Undo2, Zap } from 'lucide-react';
import { arenaQuestions, arenaSchools, getArenaQuestion, getArenaSchool } from './data';
import {
  ARENA_RULES,
  advance,
  chooseSupport,
  createDebate,
  finishNow,
  finishWithClosing,
  getPairings,
  undo,
} from './engine';
import ArenaMap from './ArenaMap';

function QuestionPicker() {
  return (
    <main className="arena-main section-pad">
      <div className="arena-intro">
        <span className="kicker">PHILOSOPHY THOUGHT ARENA</span>
        <h1>哲学思想<br /><em>竞技场。</em></h1>
        <p>两个流派不会拿到预先写好的完整台词。每一次反驳都会根据上一轮主张的标签、当前回合与本地论证库动态匹配；你可以在关键回合介入，最后生成完整论证关系图。</p>
        <div className="arena-rule-strip">
          <span><strong>4</strong>轮交锋</span>
          <span><strong>{arenaSchools.length}</strong>个本地流派</span>
          <span><strong>2</strong>种非理想结局</span>
        </div>
      </div>

      <section className="arena-question-grid">
        {arenaQuestions.map((question) => (
          <Link key={question.id} to={`/arena/${question.id}`} className="arena-question-card">
            <span>{question.number}</span>
            <h2>{question.title}</h2>
            <p>{question.description}</p>
            <small>动态匹配流派 <ArrowRight size={14} /></small>
          </Link>
        ))}
      </section>
    </main>
  );
}

function PairingSetup({ question, onStart }) {
  const pairings = useMemo(() => getPairings(question.id), [question.id]);
  const [selectedKey, setSelectedKey] = useState(pairings[0]?.key || '');

  useEffect(() => setSelectedKey(pairings[0]?.key || ''), [pairings]);

  return (
    <main className="arena-main section-pad">
      <Link to="/arena" className="back-link"><ArrowLeft size={15} />返回竞技场</Link>
      <header className="arena-setup-head">
        <span className="kicker">LOCAL ARGUMENT MATCHING</span>
        <h1>{question.title}</h1>
        <p>{question.description}</p>
      </header>

      <div className="pairing-note">
        <GitBranch size={18} />
        <p>以下组合不是独立页面。系统会扫描同一问题下的本地论证片段，模拟每对流派的开场、反驳与收束，并按匹配度和可持续回合排序。</p>
      </div>

      <section className="pairing-list">
        {pairings.map((pair) => {
          const [a, b] = pair.schools.map(getArenaSchool);
          const selected = selectedKey === pair.key;
          return (
            <button
              key={pair.key}
              type="button"
              className={selected ? 'pairing-card is-selected' : 'pairing-card'}
              onClick={() => setSelectedKey(pair.key)}
              style={{ '--school-a': a.color, '--school-b': b.color }}
            >
              <span className="pairing-versus">
                <i style={{ background: a.color }} />
                <em>VS</em>
                <i style={{ background: b.color }} />
              </span>
              <span className="pairing-copy">
                <strong>{a.name}<small>{a.english}</small></strong>
                <em>对</em>
                <strong>{b.name}<small>{b.english}</small></strong>
              </span>
              <span className="pairing-meta">
                <b>{pair.exhausted ? '提前收束' : '完整四轮'}</b>
                <small>{pair.rationale}</small>
              </span>
            </button>
          );
        })}
      </section>

      <div className="setup-actions">
        <button type="button" className="primary-action" disabled={!selectedKey} onClick={() => onStart(pairings.find((pair) => pair.key === selectedKey))}>
          <Zap size={16} />开始动态交锋
        </button>
        <p>没有“胜负判定”。本竞技场只呈现论证如何被选择、连接、中断与收束。</p>
      </div>
    </main>
  );
}

function NodeTimeline({ state, schools }) {
  const visible = state.nodes.filter((node) => node.type === 'move' || node.type === 'no-reply');
  return (
    <section className="debate-timeline">
      {visible.map((node) => {
        const school = schools[node.side];
        if (node.type === 'no-reply') {
          return (
            <article key={node.id} className="debate-node debate-empty" style={{ '--school-color': school.color }}>
              <span className="node-meta"><Flag size={13} />第 {node.turn} 回合 · 非理想分支</span>
              <h3>{node.title}</h3>
              <p>{node.text}</p>
            </article>
          );
        }
        return (
          <article key={node.id} className="debate-node" style={{ '--school-color': school.color }}>
            <span className="node-meta">
              <i style={{ background: school.color }} />
              第 {node.turn} 回合 · {school.name} · {node.kind === 'opening' ? '开场主张' : node.kind === 'closing' ? '收束' : '动态反驳'}
              {node.userBoosted && <b>用户加权生效</b>}
            </span>
            <h3>{node.title}</h3>
            <p>{node.text}</p>
            <footer>
              <span>匹配度：{node.confidence}</span>
              {node.matchedTags?.length > 0 && <span>回应标签：{node.matchedTags.join(' / ')}</span>}
            </footer>
          </article>
        );
      })}
    </section>
  );
}

function InterventionPanel({ state, onChoose }) {
  const schools = { A: getArenaSchool(state.schools.A), B: getArenaSchool(state.schools.B) };
  return (
    <section className="intervention-panel">
      <div className="intervention-copy">
        <span className="kicker">KEY TURN / USER INTERVENTION</span>
        <h2>后半场开始前，你要介入吗？</h2>
        <p>双方已经各完成两层论证。选择一方会提高与其核心前提相符的下一条反驳权重；保持中立则让系统继续按匹配度选择。你之后可以返回修改这次选择。</p>
      </div>
      <div className="intervention-actions">
        <button type="button" onClick={() => onChoose('A')} style={{ '--school-color': schools.A.color }}>
          <Scale size={17} />支持 {schools.A.name}
        </button>
        <button type="button" className="neutral-action" onClick={() => onChoose('neutral')}>
          保持中立
        </button>
        <button type="button" onClick={() => onChoose('B')} style={{ '--school-color': schools.B.color }}>
          <Scale size={17} />支持 {schools.B.name}
        </button>
      </div>
    </section>
  );
}

function Debate({ initialPair, question, onRematch }) {
  const [state, setState] = useState(() => createDebate(question.id, initialPair.schools));
  const schools = {
    A: getArenaSchool(state.schools.A),
    B: getArenaSchool(state.schools.B),
  };

  const nextSchool = schools[state.nextSide];
  const progress = Math.min(100, ((state.turnNumber) / ARENA_RULES.totalTurns) * 100);

  return (
    <main className="arena-session section-pad">
      <div className="session-topline">
        <Link to={`/arena/${question.id}`} className="back-link"><ArrowLeft size={15} />重新选择组合</Link>
        <button type="button" className="ghost-button" disabled={!state.past?.length} onClick={() => setState(undo(state))}>
          <Undo2 size={14} />返回修改
        </button>
      </div>

      <header className="arena-battle-head">
        <div className="battle-school" style={{ '--school-color': schools.A.color }}>
          <span>{schools.A.english}</span>
          <h2>{schools.A.name}</h2>
          <p>{schools.A.stance}</p>
        </div>
        <div className="battle-center">
          <span>ROUND {state.roundNumber}/4</span>
          <strong>VS</strong>
          <small>{question.title}</small>
        </div>
        <div className="battle-school reverse" style={{ '--school-color': schools.B.color }}>
          <span>{schools.B.english}</span>
          <h2>{schools.B.name}</h2>
          <p>{schools.B.stance}</p>
        </div>
      </header>

      <div className="turn-meter">
        <span style={{ width: `${progress}%` }} />
        <small>当前回合 {Math.min(state.turnNumber + (state.phase === 'awaiting-user' ? 0 : 1), ARENA_RULES.totalTurns)} / {ARENA_RULES.totalTurns}</small>
      </div>

      <div className="session-grid">
        <div>
          <NodeTimeline state={state} schools={schools} />

          {state.phase === 'awaiting-user' && <InterventionPanel state={state} onChoose={(side) => setState(chooseSupport(state, side))} />}

          {state.phase === 'debating' && (
            <section className="advance-panel">
              <p>下一步：<b style={{ color: nextSchool.color }}>{nextSchool.name}</b> 将根据上一轮前提，从本地论证库选择未使用的反驳。</p>
              <button type="button" className="primary-action" onClick={() => setState(advance(state))}>
                揭示下一条论证 <ArrowRight size={16} />
              </button>
            </section>
          )}

          {state.phase === 'exhausted' && (
            <section className="advance-panel exhausted-panel">
              <span className="kicker">NON-IDEAL FLOW</span>
              <h2>本地论证库提前枯竭</h2>
              <p>系统没有编造新论点。你可以让对方使用已有论证收束，也可以直接结束并生成截至当前的关系图。</p>
              <div className="setup-actions inline">
                <button type="button" className="primary-action" onClick={() => setState(finishWithClosing(state))}>
                  让{schools[state.nextSide === 'A' ? 'B' : 'A'].name}收束
                </button>
                <button type="button" className="ghost-button" onClick={() => setState(finishNow(state))}>
                  <Flag size={14} />直接结束
                </button>
              </div>
            </section>
          )}

          {state.phase === 'completed' && (
            <section className="advance-panel complete-panel">
              <span className="kicker">DEBATE CLOSED</span>
              <h2>{state.endReason === 'completed' ? '四轮交锋完成' : '论证已提前收束'}</h2>
              <p>图中包含主张、反驳、反反驳、用户介入点，以及论证库无法继续匹配时的中断位置。</p>
              <div className="setup-actions inline">
                <button type="button" className="primary-action" onClick={onRematch}>
                  <RefreshCcw size={15} />重新匹配一局
                </button>
                <Link className="ghost-link" to="/arena">换一个问题</Link>
              </div>
            </section>
          )}
        </div>

        <aside className="session-side">
          <div className="state-card">
            <span className="kicker">STATE MACHINE</span>
            <h3>当前状态</h3>
            <dl>
              <dt>阶段</dt><dd>{state.phase === 'awaiting-user' ? '等待用户' : state.phase === 'exhausted' ? '论证枯竭' : state.phase === 'completed' ? '已完成' : '交锋中'}</dd>
              <dt>下一方</dt><dd>{nextSchool.name}</dd>
              <dt>已用论证</dt><dd>{state.nodes.filter((node) => node.type === 'move').length} 条</dd>
              <dt>用户选择</dt><dd>{state.userChoice ? (state.userChoice === 'neutral' ? '中立' : schools[state.userChoice].name) : '尚未介入'}</dd>
            </dl>
          </div>
          <div className="history-card">
            <span className="kicker">HISTORY LOG</span>
            <h3>历史记录</h3>
            <ol>
              {state.history.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
            </ol>
          </div>
        </aside>
      </div>

      <ArenaMap state={state} />
    </main>
  );
}

export default function ArenaPage() {
  const { questionId } = useParams();
  const [pair, setPair] = useState(null);

  if (!questionId) return <QuestionPicker />;
  const question = getArenaQuestion(questionId);
  if (!question) return <Navigate to="/arena" replace />;
  if (!pair) return <PairingSetup question={question} onStart={(selected) => setPair(selected)} />;

  return <Debate key={`${question.id}-${pair.key}`} initialPair={pair} question={question} onRematch={() => setPair(null)} />;
}
