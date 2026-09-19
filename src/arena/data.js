// 本地论证数据：流派、问题与可被状态机动态检索的论证片段。
// moves 不是为某一对流派写死的页面，而是通过 tags 与上一轮主张动态匹配。

export const arenaQuestions = [
  {
    id: 'knowledge',
    number: 'K',
    title: '知识从哪里来？',
    description: '当理性、经验、实践与具体处境给出不同答案时，哪一种路径更能支撑“我知道”？',
    prompt: '请围绕知识的来源、确定性与限度展开四轮交锋。',
  },
  {
    id: 'life',
    number: 'L',
    title: '怎样过一种好生活？',
    description: '好生活究竟来自顺应自然、承担自由、培育德性，还是清醒地安排快乐？',
    prompt: '请围绕好生活的判准、实践方式与可能代价展开四轮交锋。',
  },
  {
    id: 'moral',
    number: 'M',
    title: '行为在什么时候是道德的？',
    description: '道德价值来自普遍法则、可计算的后果、稳定的品格，还是具体处境中的自由承担？',
    prompt: '请围绕道德判断的根据、例外与责任展开四轮交锋。',
  },
];

export const arenaSchools = [
  { id: 'rationalism', name: '理性主义', short: '理性', english: 'Rationalism', tradition: 'modern', thinkers: '笛卡尔、斯宾诺莎', color: '#8b7bd7', stance: '可靠知识来自清楚明白的理性结构。' },
  { id: 'empiricism', name: '经验主义', short: '经验', english: 'Empiricism', tradition: 'modern', thinkers: '洛克、贝克莱、休谟', color: '#b4864d', stance: '一切观念最终都要追溯到经验。' },
  { id: 'pragmatism', name: '实用主义', short: '实效', english: 'Pragmatism', tradition: 'modern', thinkers: '皮尔士、詹姆斯、杜威', color: '#70a36b', stance: '观念的意义在于它产生的实践差别。' },
  { id: 'existentialism', name: '存在主义', short: '存在', english: 'Existentialism', tradition: 'existentialism', thinkers: '萨特、波伏瓦、加缪', color: '#d16a61', stance: '意义不是被发现的，而是在处境中被承担出来的。' },
  { id: 'stoicism', name: '斯多葛主义', short: '斯多葛', english: 'Stoicism', tradition: 'ancient-greece', thinkers: '芝诺、爱比克泰德、奥勒留', color: '#77a8b5', stance: '区分可控与不可控，才能守住内在自由。' },
  { id: 'skepticism', name: '怀疑主义', short: '怀疑', english: 'Skepticism', tradition: 'ancient-greece', thinkers: '皮浪、塞克斯都·恩披里柯', color: '#9b9588', stance: '悬置判断可以避开独断带来的烦扰。', sparse: true },
  { id: 'virtue-ethics', name: '德性伦理学', short: '德性', english: 'Virtue Ethics', tradition: 'ancient-greece', thinkers: '亚里士多德、孔子（跨传统参照）', color: '#c2a14f', stance: '道德与好生活都落实为稳定而卓越的品格。' },
  { id: 'epicureanism', name: '伊壁鸠鲁主义', short: '快乐', english: 'Epicureanism', tradition: 'ancient-greece', thinkers: '伊壁鸠鲁、卢克莱修', color: '#78ad88', stance: '没有痛苦与恐惧的简朴快乐，才是安宁的基础。' },
  { id: 'deontology', name: '义务论', short: '义务', english: 'Deontology', tradition: 'german-idealism', thinkers: '康德、罗斯', color: '#8795c7', stance: '行为的道德价值出于可普遍化的义务与对人格的尊重。' },
  { id: 'utilitarianism', name: '功利主义', short: '功利', english: 'Utilitarianism', tradition: 'modern', thinkers: '边沁、密尔、西季威克', color: '#69a7a0', stance: '正确的行为应带来最大整体福祉并减少伤害。' },
];

// attackTags：这一步攻击上一轮的哪些前提；supportTags：这一步自己依赖的前提。
// minRound 控制论证节奏；同一方不会重复使用已经出现过的 move。
export const argumentMoves = [
  // —— 知识：理性主义 ——
  {
    id: 'k-rat-open', questionId: 'knowledge', schoolId: 'rationalism', kind: 'opening', minRound: 0,
    title: '感官会欺骗，理性才给出普遍结构',
    text: '同一根木棍在水中看似弯折，梦境也可能模仿现实。个别的感官流不保证真理；数学与逻辑中的清楚明白观念，才提供可共享、可推演的确定性。',
    attackTags: ['sense-experience'], supportTags: ['reason', 'certainty', 'universal-structure'],
  },
  {
    id: 'k-rat-counter-emp', questionId: 'knowledge', schoolId: 'rationalism', kind: 'rebuttal', minRound: 1,
    title: '经验自身不能证明“必然如此”',
    text: '经验只能告诉我已经发生什么，却不能告诉我必然如此。因果必然性与归纳的有效性，必须依赖理性中的结构，否则再多重复观察也只是习惯。',
    attackTags: ['sense-experience', 'custom', 'certainty'], supportTags: ['reason', 'certainty'],
  },
  {
    id: 'k-rat-counter-prag', questionId: 'knowledge', schoolId: 'rationalism', kind: 'rebuttal', minRound: 1,
    title: '有用不等于真',
    text: '一个错误信念也可能在短期内带来安慰或效率。若把真理完全兑换成效果，就会取消“看起来有用”和“实际为真”之间的区别。',
    attackTags: ['practical-consequence', 'pragmatic-truth', 'fixed-truth'], supportTags: ['reason', 'fixed-truth'],
  },
  {
    id: 'k-rat-order', questionId: 'knowledge', schoolId: 'rationalism', kind: 'rebuttal', minRound: 1,
    title: '接纳世界之前，仍要判断什么可被接纳',
    text: '区分可控与不可控是一种实践智慧，但它不能代替真假判断。什么属于自然、什么只是意见，仍要依靠理性审查；否则宁静可能把未经检验的偏见当作命运接受。',
    attackTags: ['control', 'nature', 'inner-judgment', 'acceptance'], supportTags: ['reason', 'universal-structure'],
  },
  {
    id: 'k-rat-situated', questionId: 'knowledge', schoolId: 'rationalism', kind: 'rebuttal', minRound: 1,
    title: '处境可以改变显现，却不能取消有效性',
    text: '我当然总是在某种历史和身体处境中理解世界，但这只说明认识有发生条件，并不说明有效性也可还原为处境。若一切都只是处境，批评与论证也失去普遍约束力。',
    attackTags: ['situated-freedom', 'embodied-life', 'value-neutral-knowledge'], supportTags: ['reason', 'universal-structure'],
  },
  {
    id: 'k-rat-self-ref', questionId: 'knowledge', schoolId: 'rationalism', kind: 'rebuttal', minRound: 1,
    title: '悬置判断不能悬置正在进行的论证',
    text: '怀疑若要说服我，就必须承认至少这一步推论是可理解的：前提冲突、标准有别、因此应当悬置。它可以怀疑具体结论，却不能在反驳中同时废除反驳本身。',
    attackTags: ['suspension', 'doubt', 'skepticism'], supportTags: ['reason', 'universal-structure'],
  },
  {
    id: 'k-rat-evidence', questionId: 'knowledge', schoolId: 'rationalism', kind: 'rebuttal', minRound: 2,
    title: '证据不是未经组织的感觉',
    text: '观察要成为证据，必须先被表述为命题、纳入推论并接受一致性检查。没有理性的组织，感觉只是流变；有了逻辑结构，它才可能支持一个知识主张。',
    attackTags: ['sense-experience', 'empirical-test', 'passive-custom', 'inner-judgment', 'practice'], supportTags: ['reason', 'universal-structure', 'certainty'],
  },
  {
    id: 'k-rat-close', questionId: 'knowledge', schoolId: 'rationalism', kind: 'closing', minRound: 3,
    title: '怀疑也必须使用理性',
    text: '当怀疑论论证说“每个判断都可被反对”时，它已经在使用矛盾律和推论规则。彻底悬置理性无法表达自身，因此理性仍是知识不可退出的法庭。',
    attackTags: ['suspension', 'doubt', 'skepticism'], supportTags: ['reason', 'certainty'],
  },

  // —— 知识：经验主义 ——
  {
    id: 'k-emp-open', questionId: 'knowledge', schoolId: 'empiricism', kind: 'opening', minRound: 0,
    title: '没有经验，理性只能操作空概念',
    text: '若心灵最初是一张白纸，理性可以整理观念，却不能凭空创造内容。关于世界的知识必须从知觉、观察与可检验的证据开始。',
    attackTags: ['reason', 'metaphysics'], supportTags: ['sense-experience', 'empirical-test'],
  },
  {
    id: 'k-emp-counter', questionId: 'knowledge', schoolId: 'empiricism', kind: 'rebuttal', minRound: 1,
    title: '所谓确定性只是观念间的关系',
    text: '数学当然确定，但它只说明符号之间的关系；一旦谈到世界，我们仍需经验证据。不能把概念内部的必然性误当成外在世界的必然性。',
    attackTags: ['certainty', 'reason', 'abstract-theory', 'situated-freedom', 'embodied-life', 'pragmatic-truth', 'practical-consequence'], supportTags: ['sense-experience', 'empirical-test'],
  },
  {
    id: 'k-emp-contingency', questionId: 'knowledge', schoolId: 'empiricism', kind: 'rebuttal', minRound: 2,
    title: '世界存在并不保证理性体系为真',
    text: '理性可以推出许多内部一致的体系，但哪一个描述现实，只能由观察来决定。形式必然性告诉我们概念如何相连；存在与否、规律是否成立，仍要回到经验。',
    attackTags: ['reason', 'universal-structure', 'detached-reason', 'situated-freedom', 'embodied-life', 'pragmatic-truth', 'inquiry'], supportTags: ['sense-experience', 'empirical-test', 'contingent-world'],
  },
  {
    id: 'k-emp-close', questionId: 'knowledge', schoolId: 'empiricism', kind: 'closing', minRound: 3,
    title: '可修正的证据胜过不可触碰的体系',
    text: '经验知识不假装一次性完成，它允许观察推翻理论。正是这种可修正性，使知识能够接触世界，而不是封闭在自洽的形而上学体系里。',
    attackTags: ['abstract-theory', 'metaphysics', 'dogmatism'], supportTags: ['sense-experience', 'empirical-test'],
  },

  // —— 知识：实用主义 ——
  {
    id: 'k-prag-open', questionId: 'knowledge', schoolId: 'pragmatism', kind: 'opening', minRound: 0,
    title: '观念的意义在于它造成的差别',
    text: '如果两个信念对行动、预测和经验后果没有任何可想象的差别，它们的争论就是字面之争。知识不是静态摹本，而是成功应对问题的工具。',
    attackTags: ['abstract-theory', 'fixed-truth'], supportTags: ['practical-consequence', 'pragmatic-truth'],
  },
  {
    id: 'k-prag-counter', questionId: 'knowledge', schoolId: 'pragmatism', kind: 'rebuttal', minRound: 1,
    title: '追求绝对确定性会瘫痪探究',
    text: '真实的研究总是在不确定中提出假设、接受检验并继续修正。把知识定义为绝对无谬，只会让绝大多数实际知识失去资格。',
    attackTags: ['absolute-certainty', 'detached-reason', 'dogmatism', 'reason', 'situated-freedom'], supportTags: ['practical-consequence', 'inquiry', 'pragmatic-truth'],
  },
  {
    id: 'k-prag-meaning', questionId: 'knowledge', schoolId: 'pragmatism', kind: 'rebuttal', minRound: 1,
    title: '经验必须被问题组织起来',
    text: '零散感觉不会自动成为知识。只有当经验被置入假设、操作和可验证后果之中，它才从“发生了某事”变成“我们知道了什么”。',
    attackTags: ['passive-custom', 'sense-experience', 'situated-freedom', 'embodied-life', 'detached-reason', 'universal-structure', 'inner-judgment', 'practice', 'empirical-test'], supportTags: ['pragmatic-truth', 'empirical-test', 'inquiry'],
  },
  {
    id: 'k-prag-close', questionId: 'knowledge', schoolId: 'pragmatism', kind: 'closing', minRound: 3,
    title: '真理是在持续探究中站稳的信念',
    text: '我们不必在独断的绝对真理与任意意见之间二选一。能够经受公开检验、解决问题并继续指导行动的信念，就是知识在人类生活中的实际形态。',
    attackTags: ['dogmatism', 'fixed-truth', 'skepticism'], supportTags: ['pragmatic-truth', 'inquiry'],
  },

  // —— 知识：存在主义 ——
  {
    id: 'k-ex-open', questionId: 'knowledge', schoolId: 'existentialism', kind: 'opening', minRound: 0,
    title: '认识者首先是有处境的存在者',
    text: '知识并不发生在世界之外的旁观位置。认识者已经带着身体、情绪、历史与关切进入世界；这些不是知识的障碍，而是事物得以显现的条件。',
    attackTags: ['value-neutral-knowledge', 'detached-reason'], supportTags: ['situated-freedom', 'embodied-life'],
  },
  {
    id: 'k-ex-counter', questionId: 'knowledge', schoolId: 'existentialism', kind: 'rebuttal', minRound: 1,
    title: '抽象体系不能替代存在者的理解',
    text: '理性可以构造对象化的世界图景，却无法说明“我正在世界中理解和选择”这一原初事实。把人缩成认识对象，恰恰遗漏了进行认识的存在。',
    attackTags: ['abstract-theory', 'fixed-truth', 'detached-reason', 'reason', 'universal-structure'], supportTags: ['embodied-life', 'situated-freedom'],
  },
  {
    id: 'k-ex-radical', questionId: 'knowledge', schoolId: 'existentialism', kind: 'rebuttal', minRound: 2,
    title: '先有反思的主体，才有对象化的知识',
    text: '当理性主义把一切对象整理为必然结构时，进行整理的这个存在者已经先在世界中关切、行动并承担。抽掉这一层，知识会变成无人生的命题集合。',
    attackTags: ['reason', 'universal-structure', 'certainty', 'empirical-test'], supportTags: ['embodied-life', 'situated-freedom', 'commitment'],
  },
  {
    id: 'k-ex-close', questionId: 'knowledge', schoolId: 'existentialism', kind: 'closing', minRound: 3,
    title: '真正的知识要回到具体处境',
    text: '普遍命题若不能回到我所面对的情境、责任与选择，就只是安全的文字游戏。知识的严肃性体现在它如何改变一个具体存在者的立场。',
    attackTags: ['detached-reason', 'value-neutral-knowledge', 'empirical-test'], supportTags: ['situated-freedom', 'commitment', 'embodied-life'],
  },

  // —— 知识：斯多葛 ——
  {
    id: 'k-sto-judgement', questionId: 'knowledge', schoolId: 'stoicism', kind: 'opening', minRound: 0,
    title: '扰动我们的不是印象，而是对印象的判断',
    text: '感官给出的只是直接印象。心灵可以在同意之前审查它：这显得如此，但它是否真的如此？知识的第一步是训练不被印象直接拖走。',
    attackTags: ['external-control', 'sense-experience'], supportTags: ['inner-judgment', 'reason'],
  },
  {
    id: 'k-sto-practice', questionId: 'knowledge', schoolId: 'stoicism', kind: 'rebuttal', minRound: 1,
    title: '知道还要落实为可实践的判断训练',
    text: '无论知识始于经验还是理性，若不能训练我们如何面对不确定、如何区分显象与判断，它就仍停留在外部理论。知识最终要改善心灵使用印象的方式。',
    attackTags: ['detached-reason', 'passive-custom', 'value-neutral-knowledge', 'abstract-theory', 'practice', 'character', 'flourishing', 'pragmatic-truth', 'practical-consequence', 'inquiry', 'certainty', 'reason', 'universal-structure'], supportTags: ['inner-judgment', 'practice', 'reason'],
  },
  {
    id: 'k-sto-discipline', questionId: 'knowledge', schoolId: 'stoicism', kind: 'rebuttal', minRound: 2,
    title: '同意需要接受内在纪律',
    text: '感官不会自动强迫我承认一切显现，理性也不能消除所有未知。成熟的认识者会暂缓轻率同意，只在可审查的范围内行动，并把其余部分交给持续探究。',
    attackTags: ['certainty', 'sense-experience', 'pragmatic-truth', 'suspension', 'doubt', 'freedom', 'authenticity', 'commitment'], supportTags: ['limits-of-reason', 'inner-judgment', 'inquiry'],
  },
  {
    id: 'k-sto-limits', questionId: 'knowledge', schoolId: 'stoicism', kind: 'closing', minRound: 3,
    title: '承认不可主宰之事，是知识的节制',
    text: '并非一切都能获得绝对把握。对自然运行保持谦逊，对自己的判断保持负责，比用宏大体系填满未知更能保护理性与安宁。',
    attackTags: ['intellectual-hubris', 'absolute-certainty'], supportTags: ['limits-of-reason', 'inner-judgment', 'acceptance'],
  },

  // —— 知识：怀疑主义（故意较少，用于触发“无合适反驳”分支）——
  {
    id: 'k-skeptic-open', questionId: 'knowledge', schoolId: 'skepticism', kind: 'opening', minRound: 0,
    title: '每个判断都能遇到相反的可信论证',
    text: '不同文化、感官条件与理论框架都会给出冲突说法。既然我们没有毫无争议的判准，最稳妥的回应不是抢占答案，而是悬置未经证明的判断。',
    attackTags: ['dogmatism', 'certainty'], supportTags: ['suspension', 'doubt'],
  },
  {
    id: 'k-skeptic-counter', questionId: 'knowledge', schoolId: 'skepticism', kind: 'rebuttal', minRound: 1,
    title: '你的第一原则仍需要证明',
    text: '理性主义诉诸理性原则，经验主义诉诸经验标准；但标准本身不能由同一标准证明，否则就是循环。于是论证在开端处已经要求我们保留判断。',
    attackTags: ['fixed-truth', 'reason', 'sense-experience'], supportTags: ['doubt', 'suspension'],
  },

  // —— 好生活：斯多葛 ——
  {
    id: 'l-stoic-open', questionId: 'life', schoolId: 'stoicism', kind: 'opening', minRound: 0,
    title: '好生活始于控制二分',
    text: '财富、名声与他人的评价不完全取决于我；判断、欲求与行动方式才由我主宰。把幸福押在不可控之事上，等于把安宁交给偶然世界。',
    attackTags: ['external-control', 'anxiety'], supportTags: ['control', 'nature', 'inner-judgment'],
  },
  {
    id: 'l-stoic-counter-exist', questionId: 'life', schoolId: 'stoicism', kind: 'rebuttal', minRound: 1,
    title: '没有约束的绝对自由会变成新的负担',
    text: '若一切意义都必须由我凭空创造，选择将失去任何可依靠的尺度。自由不是不断否定处境，而是在承认自然与社会条件之后，仍对判断负责。',
    attackTags: ['absolute-freedom', 'bad-faith', 'freedom', 'authenticity', 'responsibility', 'pleasure'], supportTags: ['acceptance', 'control', 'reason'],
  },
  {
    id: 'l-stoic-counter-virtue', questionId: 'life', schoolId: 'stoicism', kind: 'rebuttal', minRound: 1,
    title: '德性不能只靠习俗中的“好人”形象',
    text: '社会称赞的品格可能只是适应既有秩序。德性必须经过理性审查：我培养的是真正的判断力，还是对掌声和身份的依赖？',
    attackTags: ['abstract-virtue', 'convention', 'virtue-as-habit', 'character', 'flourishing', 'practice'], supportTags: ['nature', 'inner-judgment', 'virtue-as-habit'],
  },
  {
    id: 'l-stoic-joy', questionId: 'life', schoolId: 'stoicism', kind: 'rebuttal', minRound: 2,
    title: '没有恐惧的快乐仍需要稳固的判断',
    text: '简朴与友谊确实减少纷扰，但什么是真正必要的欲望、何种关系不会变成依赖，仍要靠理性判断。快乐若未经审查，也可能从安宁的结果变成新的主人。',
    attackTags: ['simplicity', 'friendship', 'moderation', 'pleasure', 'prudence'], supportTags: ['reason', 'inner-judgment', 'virtue-as-habit'],
  },
  {
    id: 'l-stoic-close', questionId: 'life', schoolId: 'stoicism', kind: 'closing', minRound: 3,
    title: '安宁不是冷漠，而是不被外物奴役',
    text: '接纳不可控之事并不意味着退出公共生活；相反，它让人清醒地承担可承担之事，不因恐惧、虚荣或过度欲望而背叛理性。',
    attackTags: ['escapism', 'excess', 'external-control', 'pleasure', 'virtue-as-habit'], supportTags: ['acceptance', 'control', 'virtue-as-habit'],
  },

  // —— 好生活：存在主义 ——
  {
    id: 'l-ex-open', questionId: 'life', schoolId: 'existentialism', kind: 'opening', minRound: 0,
    title: '没有现成剧本，人被判定为自由',
    text: '人首先存在、遭遇世界，然后才通过选择定义自己。没有天职、本性或宇宙秩序能替我回答“我要成为谁”；自由无法上交。',
    attackTags: ['fixed-essence', 'bad-faith', 'control', 'acceptance', 'virtue-as-habit', 'pleasure'], supportTags: ['freedom', 'authenticity', 'responsibility'],
  },
  {
    id: 'l-ex-absurd', questionId: 'life', schoolId: 'existentialism', kind: 'rebuttal', minRound: 1,
    title: '对意义的渴望未必得到世界回答',
    text: '人渴望意义，世界却保持沉默，这就是荒诞。真正的反抗不是假装已有宇宙秩序，也不是逃避到盲从之中，而是看清无意义后仍继续投入。',
    attackTags: ['escapism', 'conformity', 'abstract-virtue', 'control', 'virtue-as-habit', 'pleasure'], supportTags: ['absurd-revolt', 'commitment', 'authenticity'],
  },
  {
    id: 'l-ex-counter-stoic', questionId: 'life', schoolId: 'existentialism', kind: 'rebuttal', minRound: 1,
    title: '把不可控之事让渡给自然，也可能是逃避',
    text: '历史与他人当然不能完全被我支配，但它们并不只是需要接纳的自然事实。若过早把不公交给“自然”，自由就会伪装成宁静，放弃改变处境。',
    attackTags: ['acceptance', 'indifference', 'control', 'inner-judgment', 'nature'], supportTags: ['authenticity', 'freedom', 'responsibility'],
  },
  {
    id: 'l-ex-close', questionId: 'life', schoolId: 'existentialism', kind: 'closing', minRound: 3,
    title: '好生活是持续承担选择的后果',
    text: '快乐、安宁或德性都不能替我作决定。好生活不在某个安全终点，而在一次次承认“这是我的选择”，并在后果中不逃避地成为自己。',
    attackTags: ['stagnation', 'escapism', 'conformity', 'control', 'pleasure', 'virtue-as-habit'], supportTags: ['commitment', 'authenticity', 'freedom'],
  },

  // —— 好生活：德性伦理学 ——
  {
    id: 'l-virtue-open', questionId: 'life', schoolId: 'virtue-ethics', kind: 'opening', minRound: 0,
    title: '好生活是合德性的实现活动',
    text: '幸福不是短暂感觉，也不是外在物品，而是人在完整一生中持续实现自身的卓越。勇敢、节制、正义与实践智慧，通过习惯成为第二天性。',
    attackTags: ['hedonism', 'rigid-rule', 'pleasure', 'control', 'freedom'], supportTags: ['virtue-as-habit', 'flourishing', 'character'],
  },
  {
    id: 'l-virtue-practice', questionId: 'life', schoolId: 'virtue-ethics', kind: 'rebuttal', minRound: 1,
    title: '有德性不是知道规则，而是成为那种人',
    text: '一个人可以背诵正确原则，却在恐惧或诱惑面前失败。实践智慧通过反复行动养成，使我们在具体情境中自然看见什么合宜、什么过度。',
    attackTags: ['abstract-ideal', 'moral-math', 'control', 'freedom'], supportTags: ['practice', 'character', 'practical-wisdom'],
  },
  {
    id: 'l-virtue-courage', questionId: 'life', schoolId: 'virtue-ethics', kind: 'rebuttal', minRound: 1,
    title: '安宁若缺少卓越，可能只是缩小生活',
    text: '通过降低期待可以避免失望，却也可能让人避开友谊、政治与伟大事业。好生活不是把风险降到最低，而是在风险中实践高贵与勇敢。',
    attackTags: ['escapism', 'indifference', 'acceptance', 'control', 'inner-judgment', 'practice', 'simplicity', 'moderation', 'friendship', 'pleasure', 'prudence'], supportTags: ['flourishing', 'character', 'virtue-as-habit'],
  },
  {
    id: 'l-virtue-community', questionId: 'life', schoolId: 'virtue-ethics', kind: 'rebuttal', minRound: 2,
    title: '简朴若脱离共同善，仍可能是私人逃避',
    text: '友谊值得珍惜，但好生活不只包括远离纷扰的小圈子。正义、公民友谊与共同实践让人的善得以展开；把风险全部删除，也可能删掉高贵的可能。',
    attackTags: ['simplicity', 'friendship', 'moderation', 'pleasure', 'prudence', 'control', 'acceptance'], supportTags: ['flourishing', 'community', 'practical-wisdom'],
  },
  {
    id: 'l-virtue-close', questionId: 'life', schoolId: 'virtue-ethics', kind: 'closing', minRound: 3,
    title: '中道不是平庸，而是对过度与不及的判断',
    text: '德性把激情与行动安置在合宜的尺度上：勇敢介于鲁莽与怯懦，节制介于放纵与麻木。这个尺度不能机械化，只能由有实践智慧的人把握。',
    attackTags: ['excess', 'conformity', 'rigid-rule', 'freedom', 'control'], supportTags: ['virtue-as-habit', 'flourishing', 'practical-wisdom'],
  },

  // —— 好生活：伊壁鸠鲁主义 ——
  {
    id: 'l-epic-open', questionId: 'life', schoolId: 'epicureanism', kind: 'opening', minRound: 0,
    title: '快乐是幸福生活的开端与目的',
    text: '生命唯有此生可感，道德若长期制造痛苦、恐惧与自我压抑，就需要被重新衡量。快乐不是放纵，而是身体无痛苦、灵魂无纷扰。',
    attackTags: ['repression', 'empty-duty', 'abstract-virtue', 'virtue-as-habit', 'control', 'freedom'], supportTags: ['pleasure', 'prudence'],
  },
  {
    id: 'l-epic-simple', questionId: 'life', schoolId: 'epicureanism', kind: 'rebuttal', minRound: 1,
    title: '越追逐无限欲望，越被匮乏支配',
    text: '奢华常常制造新的饥渴。真正可靠的快乐来自简朴饮食、安全环境、真诚友谊与对自然的清醒理解；这些不依赖巨额财富和众人掌声。',
    attackTags: ['excess', 'status', 'abstract-virtue', 'virtue-as-habit', 'flourishing', 'freedom'], supportTags: ['simplicity', 'friendship', 'moderation'],
  },
  {
    id: 'l-epic-fear', questionId: 'life', schoolId: 'epicureanism', kind: 'rebuttal', minRound: 1,
    title: '许多崇高追求由对匮乏的恐惧驱动',
    text: '人们追逐名声、权力和无止境的事业，常是因为无法面对有限与不安。可一旦把幸福无限推迟，当下生活就被持续焦虑吞掉；简朴并非贫乏，而是自由。',
    attackTags: ['flourishing', 'practice', 'responsibility', 'commitment', 'control'], supportTags: ['simplicity', 'prudence', 'friendship'],
  },
  {
    id: 'l-epic-friendship', questionId: 'life', schoolId: 'epicureanism', kind: 'rebuttal', minRound: 2,
    title: '共同生活的价值不必建立在沉重责任上',
    text: '友谊不是英雄式承担，也不是品格训练的工具；它因安全、善意与共同快乐而珍贵。轻一些的共同生活，往往比崇高却紧绷的秩序更持久。',
    attackTags: ['responsibility', 'authenticity', 'virtue-as-habit', 'nature', 'absurd-revolt'], supportTags: ['friendship', 'moderation', 'pleasure'],
  },
  {
    id: 'l-epic-close', questionId: 'life', schoolId: 'epicureanism', kind: 'closing', minRound: 3,
    title: '审慎地快乐，比痛苦地崇高更诚实',
    text: '德性若脱离快乐与痛苦的人类经验，就会变成冷酷虚名。明智地选择快乐、避免未来痛苦、珍惜友谊，才让好生活可感也可持续。',
    attackTags: ['anxiety', 'repression', 'stagnation', 'virtue-as-habit', 'control', 'freedom'], supportTags: ['pleasure', 'moderation', 'prudence'],
  },

  // —— 道德：义务论 ——
  {
    id: 'm-deon-open', questionId: 'moral', schoolId: 'deontology', kind: 'opening', minRound: 0,
    title: '道德价值出于义务，而非结果的偶然',
    text: '一个行动可能因运气产生好结果，却不因此有道德价值。只有当我出于可普遍化的原则、并把人格当作目的而不仅是手段时，行动才真正道德。',
    attackTags: ['moral-math', 'calculation', 'utility', 'welfare', 'character', 'radical-freedom'], supportTags: ['duty', 'universal-law', 'human-dignity'],
  },
  {
    id: 'm-deon-counter-util', questionId: 'moral', schoolId: 'deontology', kind: 'rebuttal', minRound: 1,
    title: '总体福祉不能吞没个体人格',
    text: '若仅仅为了更大利益就牺牲无辜者，人格就被降格为计算单位。道德必须保留不可交易的底线，否则多数人的幸福会为严重不义发证。',
    attackTags: ['consequence', 'moral-math', 'utility', 'welfare'], supportTags: ['duty', 'human-dignity', 'universal-law'],
  },
  {
    id: 'm-deon-counter-virtue', questionId: 'moral', schoolId: 'deontology', kind: 'rebuttal', minRound: 1,
    title: '良善品格仍需要正当原则约束',
    text: '忠诚、勇敢与仁爱若服务于错误事业，可能造成更深伤害。品格解释行动者的稳定倾向，却不能单独决定一个行为是否正当。',
    attackTags: ['character', 'partiality', 'virtue-as-habit', 'practical-wisdom'], supportTags: ['universal-law', 'duty', 'human-dignity'],
  },
  {
    id: 'm-deon-counter-exist', questionId: 'moral', schoolId: 'deontology', kind: 'rebuttal', minRound: 1,
    title: '自由选择不等于任意选择',
    text: '说人必须选择，并不能推出任何选择都同样道德。真正的自由要服从自己理性给出的普遍法则；否则选择只是偏好和权力的扩张。',
    attackTags: ['radical-freedom', 'bad-faith', 'freedom', 'authenticity', 'responsibility'], supportTags: ['duty', 'responsibility', 'human-dignity'],
  },
  {
    id: 'm-deon-conscience', questionId: 'moral', schoolId: 'deontology', kind: 'rebuttal', minRound: 2,
    title: '道德经验中存在不可交易的底线',
    text: '当我们谴责欺骗、酷刑或把人仅当工具时，并非只是在说结果不划算，而是在承认人格有不可替换的地位。公共制度若失去这条底线，福祉计算很快会变成强者语言。',
    attackTags: ['utility', 'welfare', 'consequence', 'virtue-as-habit', 'authenticity'], supportTags: ['duty', 'human-dignity', 'universal-law'],
  },
  {
    id: 'm-deon-close', questionId: 'moral', schoolId: 'deontology', kind: 'closing', minRound: 3,
    title: '正当优先于好处',
    text: '道德的严格性正在于它不随结果、身份或自我理解而轻易弯曲。尊重每个人的人格，即使代价更高，也构成共同自由得以存在的条件。',
    attackTags: ['moral-math', 'special-relation', 'radical-freedom', 'freedom', 'character', 'utility'], supportTags: ['duty', 'human-dignity', 'universal-law'],
  },

  // —— 道德：功利主义 ——
  {
    id: 'm-util-open', questionId: 'moral', schoolId: 'utilitarianism', kind: 'opening', minRound: 0,
    title: '道德不能对真实苦难无动于衷',
    text: '规则若在具体情境中造成可避免的痛苦，就不应仅因“符合规则”而被崇拜。道德思考应衡量福祉、伤害与后果，平等考虑每个受影响者。',
    attackTags: ['empty-duty', 'rigid-rule', 'duty', 'universal-law', 'human-dignity', 'radical-freedom'], supportTags: ['utility', 'welfare', 'harm-reduction'],
  },
  {
    id: 'm-util-counter', questionId: 'moral', schoolId: 'utilitarianism', kind: 'rebuttal', minRound: 1,
    title: '普遍法则也必须接受后果检验',
    text: '一条原则若普遍化后带来巨大苦难，就不能靠“纯粹”逃避批评。没有现实后果的道德纯洁，可能把人变成原则的祭品。',
    attackTags: ['universal-law', 'abstract-duty', 'radical-freedom', 'duty', 'human-dignity', 'freedom'], supportTags: ['consequence', 'welfare', 'utility'],
  },
  {
    id: 'm-util-character', questionId: 'moral', schoolId: 'utilitarianism', kind: 'rebuttal', minRound: 1,
    title: '品格值得培养，是因为它通常带来好后果',
    text: '诚实、仁慈与可靠并非悬浮的装饰。它们降低合作风险、减少伤害并增进共同生活；品格的重要性可以在后果框架内得到说明。',
    attackTags: ['character', 'partiality', 'bad-faith', 'virtue-as-habit', 'practical-wisdom', 'community', 'flourishing'], supportTags: ['welfare', 'impartiality', 'harm-reduction'],
  },
  {
    id: 'm-util-evidence', questionId: 'moral', schoolId: 'utilitarianism', kind: 'rebuttal', minRound: 2,
    title: '道德严肃感要求看清真实影响',
    text: '义务、品格和自我承担都可能被真诚地误用。正因如此，我们需要调查行动将如何影响具体的人，而不是只确认内心是否纯粹；苦难不会因动机高贵就消失。',
    attackTags: ['duty', 'human-dignity', 'virtue-as-habit', 'radical-freedom', 'authenticity'], supportTags: ['consequence', 'welfare', 'impartiality'],
  },
  {
    id: 'm-util-close', questionId: 'moral', schoolId: 'utilitarianism', kind: 'closing', minRound: 3,
    title: '减少伤害比维护抽象纯洁更紧迫',
    text: '复杂情境中没有零代价选择。公正地收集信息、预见后果、平等权衡痛苦与幸福，比坚守不产生差别的规则更能回应道德生活。',
    attackTags: ['rigid-rule', 'special-relation', 'empty-duty', 'duty', 'universal-law', 'radical-freedom', 'authenticity'], supportTags: ['utility', 'impartiality', 'welfare'],
  },

  // —— 道德：德性伦理学 ——
  {
    id: 'm-virtue-open', questionId: 'moral', schoolId: 'virtue-ethics', kind: 'opening', minRound: 0,
    title: '道德首先关乎成为什么样的人',
    text: '把道德压成规则或后果计算，会遗漏行动者的动机、情感与长期生活。正义、诚实、节制与仁爱是在共同体中养成的稳定品格。',
    attackTags: ['rigid-rule', 'moral-math', 'duty', 'universal-law', 'utility', 'welfare', 'radical-freedom'], supportTags: ['character', 'flourishing', 'practical-wisdom'],
  },
  {
    id: 'm-virtue-character', questionId: 'moral', schoolId: 'virtue-ethics', kind: 'rebuttal', minRound: 1,
    title: '脱离品格的公平会变成抽象冷酷',
    text: '具体关系、责任与共同生活并不是道德噪音。实践智慧要在这些关系中判断合宜之事，而不是把所有情境都塞进同一个外部公式。',
    attackTags: ['radical-freedom', 'abstraction', 'freedom', 'authenticity', 'responsibility'], supportTags: ['character', 'community', 'practical-wisdom'],
  },
  {
    id: 'm-virtue-consequences', questionId: 'moral', schoolId: 'virtue-ethics', kind: 'rebuttal', minRound: 1,
    title: '后果需要由有品格的人来权衡',
    text: '减少痛苦当然重要，但什么算伤害、哪些福祉更可欲、当下收益如何影响共同生活，并不能从数字中自动读出。没有实践智慧，后果计算会把丰富的人类善压扁为单一指标。',
    attackTags: ['utility', 'welfare', 'harm-reduction', 'moral-math'], supportTags: ['character', 'flourishing', 'practical-wisdom'],
  },
  {
    id: 'm-virtue-formation', questionId: 'moral', schoolId: 'virtue-ethics', kind: 'rebuttal', minRound: 2,
    title: '规则与后果都要由成熟行动者来把握',
    text: '抽象规则需要解释，后果预测需要判断轻重，个人选择也需要理解处境。没有实践智慧的培养，规则会变成形式，计算会变成短视，自由会变成孤立。',
    attackTags: ['duty', 'universal-law', 'utility', 'welfare', 'radical-freedom'], supportTags: ['character', 'practical-wisdom', 'community'],
  },
  {
    id: 'm-virtue-close', questionId: 'moral', schoolId: 'virtue-ethics', kind: 'closing', minRound: 3,
    title: '正当行动来自看世界的成熟方式',
    text: '道德成熟不只是会演算或服从，而是在恐惧、欲望、同情与责任交织时仍能看见合宜目标。好判断最终是一种被长期培育的品格成就。',
    attackTags: ['calculation', 'rigid-rule', 'radical-freedom', 'utility', 'duty', 'freedom'], supportTags: ['practical-wisdom', 'character', 'flourishing'],
  },

  // —— 道德：存在主义 ——
  {
    id: 'm-ex-open', questionId: 'moral', schoolId: 'existentialism', kind: 'opening', minRound: 0,
    title: '道德选择是在具体处境中创造价值',
    text: '没有任何抽象法则能完整告诉我在这个独特处境中该怎么办。我必须选择，并意识到我的选择也在塑造所有人可能如何生活的形象。',
    attackTags: ['fixed-rule', 'bad-faith', 'moral-math', 'duty', 'universal-law', 'utility', 'welfare', 'virtue-as-habit'], supportTags: ['radical-freedom', 'authenticity', 'responsibility'],
  },
  {
    id: 'm-ex-counter', questionId: 'moral', schoolId: 'existentialism', kind: 'rebuttal', minRound: 1,
    title: '诉诸法则或后果都可能成为逃避责任',
    text: '“规则命令我”或“数字要求我”都可能掩盖一个事实：仍是我决定承认这个规则、采用这种算法。外在权威不能替我承担选择。',
    attackTags: ['external-authority', 'universal-law', 'utility', 'duty', 'welfare', 'character'], supportTags: ['authenticity', 'responsibility', 'radical-freedom'],
  },
  {
    id: 'm-ex-situation', questionId: 'moral', schoolId: 'existentialism', kind: 'rebuttal', minRound: 2,
    title: '处境中的冲突无法被体系完全预约',
    text: '忠诚与真理、同情与正义、个体责任与共同福祉会在同一时刻冲突。原则和计算能提供线索，却不能取消我在此处作出不可替代选择的重量。',
    attackTags: ['duty', 'universal-law', 'utility', 'welfare', 'virtue-as-habit'], supportTags: ['radical-freedom', 'commitment', 'responsibility'],
  },
  {
    id: 'm-ex-close', questionId: 'moral', schoolId: 'existentialism', kind: 'closing', minRound: 3,
    title: '承担无法被公式消除的不确定性',
    text: '道德处境没有完全透明的计算表，也没有永恒担保人。真正的道德勇气，是在不确定中作出选择，并不把后果转嫁给规则、群体或历史。',
    attackTags: ['calculation', 'conformity', 'external-authority', 'duty', 'utility', 'virtue-as-habit'], supportTags: ['commitment', 'radical-freedom', 'responsibility'],
  },
];

export function getArenaQuestion(id) {
  return arenaQuestions.find((question) => question.id === id);
}

export function getArenaSchool(id) {
  return arenaSchools.find((school) => school.id === id);
}

export function getMovesForQuestion(questionId) {
  return argumentMoves.filter((move) => move.questionId === questionId);
}
