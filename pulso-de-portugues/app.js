'use strict';

const KEY = 'pulso-de-portugues:v1';
const DOMAINS = {
  Oralidade: ['fluência', 'entoação', 'clareza', 'participação', 'argumentação'],
  Leitura: ['fluência', 'entoação', 'descodificação'],
  Compreensão: ['compreensão literal', 'compreensão inferencial', 'compreensão crítica'],
  Escrita: ['planificação', 'textualização', 'revisão', 'ortografia', 'pontuação', 'coesão', 'vocabulário'],
  'Conhecimento Linguístico': ['gramática', 'concordância', 'tempos verbais', 'vocabulário', 'pontuação', 'ortografia'],
  Atitudes: ['autonomia', 'cooperação', 'persistência', 'participação']
};
const LEVELS = ['A desenvolver', 'Em desenvolvimento', 'Consolidado'];
const SCHOOL_LEVELS = ['Insuficiente', 'Suficiente', 'Bom', 'Muito bom'];
const LEVEL_DETAILS = {
  'A desenvolver': ['AD', 'low'],
  'Em desenvolvimento': ['ED', 'mid'],
  Consolidado: ['C', 'high'],
  Insuficiente: ['I', 'low'],
  Suficiente: ['S', 'mid'],
  Bom: ['B', 'high'],
  'Muito bom': ['MB', 'high']
};
const isDifficulty = record => record.nivel === 'Insuficiente' || record.nivel === 'A desenvolver';
const TASKS = {
  leitura: ['Leitura em voz alta', 'Leitura'],
  ditado: ['Ditado', 'Escrita'],
  gramatica: ['Correção gramatical', 'Conhecimento Linguístico'],
  apresentacao: ['Apresentação oral', 'Oralidade'],
  escuta: ['Compreensão oral', 'Compreensão']
};
const VIEWS = { aula: 'Aula', turmas: 'Turmas', relatorios: 'Relatórios', definicoes: 'Definições' };
const $ = selector => document.querySelector(selector);
const main = $('#main');
const quick = $('#quick');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const id = () => Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16).padStart(8, '0')).join('');
const now = () => new Date().toISOString();
const formatDate = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
const dayFormat = new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit' });
const localDay = date => dayFormat.format(new Date(date));
const blank = () => ({ versao: 1, turmas: [], registos: [], definicoes: { tema: 'claro', pin: '', turmaId: '' } });

let data = blank();
let storageSnapshot = null;
let startupError = '';
try {
  storageSnapshot = localStorage.getItem(KEY);
  if (storageSnapshot !== null) data = validate(JSON.parse(storageSnapshot));
} catch {
  startupError = 'Não foi possível ler os dados locais. Verifique as permissões do navegador ou importe um backup em Definições.';
}
let locked = Boolean(data.definicoes.pin);
let view = startupError ? 'definicoes' : 'aula';
let activeId = data.definicoes.turmaId;
let layout = 'lista';
let task = '';
let domain = 'Oralidade';
let editing = '';
let quickStudent = '';
let quickTrigger = '';
let rosterEditing = '';
let toastTimer;
let filters = { aluno: '', dominio: '', inicio: '', fim: '' };

const current = () => data.turmas.find(turma => turma.id === activeId);
const records = () => data.registos.filter(record => record.turmaId === activeId);
const studentName = student => student.numero ? student.numero + ' · ' + student.nome : student.nome;
const option = (value, label, selected) =>
  '<option value="' + escape(value) + '"' + (value === selected ? ' selected' : '') + '>' + escape(label) + '</option>';
const options = (items, selected) => items.map(item => option(item, item, selected)).join('');
const button = (action, label, style = '', value = '') =>
  '<button type="button" class="' + style + '" data-action="' + action + '" data-value="' + escape(value) + '">' + escape(label) + '</button>';
const field = (label, control) => '<label class="field">' + label + control + '</label>';
const empty = message => '<p class="muted">' + escape(message) + '</p>';
const heading = (area, title, detail = '', actions = '') => '<div class="heading"><div><p class="kicker">' + area +
  '</p><h1>' + escape(title) + '</h1>' + (detail ? empty(detail) : '') + '</div>' + actions + '</div>';

function alertError(message) {
  const error = $('#error');
  error.hidden = !message;
  error.textContent = message;
}

function announce(message) {
  clearTimeout(toastTimer);
  $('#feedback').textContent = message;
  toastTimer = setTimeout(() => { $('#feedback').textContent = ''; }, 4200);
}

// Persistir antes de trocar o estado em memória. Uma alteração noutra aba
// bloqueia escritas antigas, evitando substituir dados com uma cópia desatualizada.
function commit(change, { recover = false } = {}) {
  if (startupError && !recover) {
    alertError(startupError);
    return false;
  }
  try {
    if (localStorage.getItem(KEY) !== storageSnapshot) {
      alertError('Os dados mudaram noutra aba. Recarregue esta página antes de guardar.');
      return false;
    }
    const next = JSON.parse(JSON.stringify(data));
    change(next);
    const snapshot = JSON.stringify(next);
    localStorage.setItem(KEY, snapshot);
    data = next;
    storageSnapshot = snapshot;
    startupError = '';
    alertError('');
    return true;
  } catch {
    alertError('Não foi possível guardar. Verifique o espaço e as permissões do navegador.');
    return false;
  }
}

// Validar e reconstruir apenas os campos conhecidos antes de importar.
function validate(source) {
  const require = condition => { if (!condition) throw new Error('Backup inválido ou incompatível.'); };
  const str = (value, max, required = false) => {
    require(typeof value === 'string' && value.length <= max && (!required || value.trim()));
    return value;
  };
  const identifier = value => {
    require(typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value));
    return value;
  };
  const date = value => {
    require(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)));
    return value;
  };
  const unique = list => require(new Set(list.map(item => item.id)).size === list.length);
  require(source && source.versao === 1 && Array.isArray(source.turmas) && Array.isArray(source.registos));
  const turmas = source.turmas.map(turma => {
    const { linhas, colunas } = turma.planta;
    require([linhas, colunas].every(n => Number.isInteger(n) && n >= 1 && n <= 12));
    require(Array.isArray(turma.alunos));
    const alunos = turma.alunos.map(aluno => {
      require(aluno.posicao === null || (Number.isInteger(aluno.posicao) && aluno.posicao >= 0 && aluno.posicao < linhas * colunas));
      return { id: identifier(aluno.id), nome: str(aluno.nome, 100, true), numero: str(aluno.numero, 12), posicao: aluno.posicao };
    });
    unique(alunos);
    const occupied = alunos.filter(aluno => aluno.posicao !== null).map(aluno => aluno.posicao);
    require(new Set(occupied).size === occupied.length);
    return {
      id: identifier(turma.id), nome: str(turma.nome, 80, true), anoCiclo: str(turma.anoCiclo, 40, true),
      turno: str(turma.turno, 60), observacoes: str(turma.observacoes, 600),
      criadaEm: date(turma.criadaEm), planta: { linhas, colunas }, alunos
    };
  });
  unique(turmas);
  const enrolments = new Map(turmas.map(turma => [turma.id, new Set(turma.alunos.map(aluno => aluno.id))]));
  const registos = source.registos.map(record => {
    require(enrolments.get(record.turmaId)?.has(record.alunoId));
    require(Object.hasOwn(DOMAINS, record.dominio) &&
      (LEVELS.includes(record.nivel) || (!record.tarefaId && SCHOOL_LEVELS.includes(record.nivel))));
    require(Array.isArray(record.etiquetas) && record.etiquetas.length <= 30 &&
      record.etiquetas.every(tag => Object.values(DOMAINS).flat().includes(tag)));
    require(record.tarefaId === '' || Object.hasOwn(TASKS, record.tarefaId));
    return {
      id: identifier(record.id), turmaId: record.turmaId, alunoId: record.alunoId,
      dataHora: date(record.dataHora), dominio: record.dominio, nivel: record.nivel,
      etiquetas: [...new Set(record.etiquetas)], tarefaId: record.tarefaId, notaTexto: str(record.notaTexto, 500)
    };
  });
  unique(registos);
  const { tema, pin, turmaId } = source.definicoes;
  require(['claro', 'escuro'].includes(tema) && typeof pin === 'string' && /^(?:\d{4,8})?$/.test(pin));
  require(turmaId === '' || enrolments.has(turmaId));
  return { versao: 1, turmas, registos, definicoes: { tema, pin, turmaId } };
}

function render() {
  document.documentElement.dataset.theme = data.definicoes.tema === 'escuro' ? 'dark' : 'light';
  $('#shell').hidden = locked;
  $('#lock').hidden = !locked;
  if (locked) {
    main.replaceChildren();
    $('#active-class').replaceChildren();
    $('#lock').innerHTML = '<section class="card"><h1>Acesso bloqueado</h1><p>Introduza o PIN deste navegador.</p>' +
      '<form class="stack" data-form="unlock">' + field('PIN', '<input name="pin" type="password" inputmode="numeric" required maxlength="8">') +
      '<div><button class="primary">Desbloquear</button></div></form></section>';
    $('#lock input').focus();
    return;
  }
  $('#lock').replaceChildren();
  $('#nav').innerHTML = Object.entries(VIEWS).map(([key, label]) =>
    '<button type="button" data-action="navigate" data-value="' + key + '"' +
    (key === view ? ' aria-current="page"' : '') + '>' + label + '</button>').join('');
  $('#active-class').innerHTML = option('', 'Selecionar turma', activeId) +
    data.turmas.map(turma => option(turma.id, turma.nome, activeId)).join('');
  $('#active-class').disabled = !data.turmas.length;
  const screens = { aula: classroom, turmas: classes, relatorios: reports, definicoes: settings };
  main.innerHTML = screens[view]();
}

function classroom() {
  const turma = current();
  if (!turma) return heading('Modo aula', 'Registo rápido', 'Crie ou selecione uma turma para começar.') +
    button('navigate', 'Gerir turmas', 'primary', 'turmas');

  const date = localDay(now());
  const today = records().filter(record => localDay(record.dataHora) === date);
  const scope = task ? today.filter(record => record.tarefaId === task) : today;
  const seen = new Set(scope.map(record => record.alunoId));
  const tiles = aluno => '<button type="button" class="student' + (seen.has(aluno.id) ? ' done' : '') +
    '" data-action="quick" data-value="' + escape(aluno.id) + '"><span>' + escape(studentName(aluno)) +
    '</span><small>' + (seen.has(aluno.id) ? '✓ Com evidência' : 'Por observar') + '</small></button>';
  const displayed = layout === 'planta'
    ? plan(turma, tiles) + '<h3>Sem lugar atribuído</h3><div class="students">' +
      (turma.alunos.filter(aluno => aluno.posicao === null).map(tiles).join('') || empty('Todos os alunos têm lugar.')) + '</div>'
    : '<div class="students">' + turma.alunos.map(tiles).join('') + '</div>';

  return heading('Modo aula', turma.nome, 'Toque num aluno e escolha um nível para guardar.', '<div class="actions">' +
    '<button type="button" data-action="undo"' + (records().length ? '' : ' disabled') + '>Desfazer último registo</button></div>') +
    '<div class="card fields">' +
    field('Tarefa rápida', '<select id="task">' + option('', 'Observação livre', task) +
      Object.entries(TASKS).map(([key, entry]) => option(key, entry[0], task)).join('') + '</select>') +
    field('Domínio ativo', '<select id="domain"' + (task ? ' disabled' : '') + '>' +
      options(Object.keys(DOMAINS), task ? TASKS[task][1] : domain) + '</select>') + '</div>' +
    '<div class="classroom"><section class="card" aria-label="Alunos"><div class="heading"><h2>Alunos</h2><div class="actions">' +
    ['lista', 'planta'].map(key => '<button type="button" data-action="layout" data-value="' + key +
      '" aria-pressed="' + (layout === key) + '">' + (key === 'lista' ? 'Lista' : 'Planta') + '</button>').join('') +
    '</div></div>' + (turma.alunos.length ? displayed : empty('Adicione alunos na área Turmas.')) +
    '</section><aside class="card" aria-label="Pulso da turma">' + dashboard(turma, scope, seen, today) + '</aside></div>';
}

function plan(turma, tile, configuring = false) {
  const { linhas, colunas } = turma.planta;
  const placed = new Map(turma.alunos.filter(aluno => aluno.posicao !== null).map(aluno => [aluno.posicao, aluno]));
  return '<div class="front">Frente da sala</div><div class="plan-scroll" tabindex="0" role="region" aria-label="Grelha da planta"><div class="plan" style="--cols:' + colunas + '">' +
    Array.from({ length: linhas * colunas }, (_, index) => {
      const aluno = placed.get(index);
      const place = 'Fila ' + (Math.floor(index / colunas) + 1) + ', lugar ' + (index % colunas + 1);
      return '<div class="seat">' + (configuring ? button('seat', place + (aluno ? ' · ' + studentName(aluno) : ''), '', index)
        : aluno ? tile(aluno) : '<small>' + place + '</small>') + '</div>';
    }).join('') + '</div></div>';
}

function distribution(items, taskSelected = false) {
  const levels = taskSelected ? LEVELS : [
    ...SCHOOL_LEVELS, ...LEVELS.filter(level => items.some(record => record.nivel === level))
  ];
  return '<div class="table-scroll"><table><thead><tr><th scope="col">Domínio</th>' +
    levels.map(level => {
      const [short, color] = LEVEL_DETAILS[level];
      return '<th scope="col" class="' + color + '" aria-label="' + level + '">' + short + '</th>';
    }).join('') +
    '</tr></thead><tbody>' + [['Total', items], ...Object.keys(DOMAINS).map(key => [key, items.filter(record => record.dominio === key)])]
      .map(([label, group]) => '<tr><th scope="row">' + label + '</th>' + levels.map(level =>
        '<td>' + group.filter(record => record.nivel === level).length + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div><p class="legend">' + levels.map(level => LEVEL_DETAILS[level][0] + ' · ' + level).join(' | ') + '</p>';
}

function dashboard(turma, scope, seen, today) {
  const missing = turma.alunos.length - seen.size;
  const history = records();
  const punctuation = new Map();
  for (const record of history) {
    if (isDifficulty(record) && record.etiquetas.includes('pontuação')) {
      punctuation.set(record.alunoId, (punctuation.get(record.alunoId) || 0) + 1);
    }
  }
  const recurring = [...punctuation.values()].filter(n => n >= 2).length;
  const tagCount = (tag, matches) => new Set(scope.filter(record => record.etiquetas.includes(tag) && matches(record))
    .map(record => record.alunoId)).size;
  const literal = tagCount('compreensão literal', record => ['Muito bom', 'Consolidado'].includes(record.nivel));
  const inferential = tagCount('compreensão inferencial', isDifficulty);
  const alerts = [];
  if (missing) alerts.push(missing === 1 ? '1 aluno sem evidência neste recorte.' : missing + ' alunos sem evidência neste recorte.');
  if (recurring) alerts.push(recurring + (recurring === 1 ? ' aluno com' : ' alunos com') + ' pelo menos dois registos de dificuldade em pontuação (histórico).');
  if (literal >= 2 && inferential >= 2) {
    alerts.push(literal + ' alunos com nível mais elevado em compreensão literal e ' + inferential +
      ' com evidência de dificuldade em compreensão inferencial.');
  }
  if (today.length >= Math.max(15, turma.alunos.length * 2)) alerts.push('Já há várias observações hoje. Pode focar os próximos registos nas evidências mais úteis.');
  return '<p class="kicker">Hoje' + (task ? ' · ' + TASKS[task][0] : '') + '</p><h2>Pulso da turma</h2>' +
    '<div class="metrics">' + [[seen.size, 'Com evidência'], [missing, 'Sem evidência'], [scope.length, 'Registos']]
      .map(([n, label]) => '<div class="metric"><strong>' + n + '</strong>' + label + '</div>').join('') + '</div>' +
    distribution(scope, Boolean(task)) + (alerts.length ? '<ul class="alerts">' + alerts.map(item => '<li>' + item + '</li>').join('') + '</ul>' : '');
}

function openQuick(alunoId) {
  const aluno = current()?.alunos.find(item => item.id === alunoId);
  if (!aluno) return;
  quickStudent = alunoId;
  quickTrigger = alunoId;
  const activeDomain = task ? TASKS[task][1] : domain;
  quick.innerHTML = '<div class="dialog-head"><div><p class="kicker">' + (task ? TASKS[task][0] : 'Observação livre') +
    '</p><h2 id="quick-title">' + escape(studentName(aluno)) + '</h2></div>' + button('close-quick', 'Fechar') +
    '</div><form id="quick-form" data-form="quick">' +
    field('Domínio', '<select name="dominio" id="quick-domain"' + (task ? ' disabled' : '') + '>' +
      options(Object.keys(DOMAINS), activeDomain) + '</select>') +
    '<p class="muted">O nível guarda o registo. Para acrescentar contexto, selecione as etiquetas ou escreva a nota primeiro.</p>' +
    '<div class="levels" aria-label="Nível da evidência">' +
    (task ? LEVELS : SCHOOL_LEVELS).map(level => '<button type="submit" name="nivel" value="' + level + '" class="' + LEVEL_DETAILS[level][1] + '">' + level + '</button>').join('') +
    '</div><h3>Etiquetas opcionais</h3><div class="chips" id="tags"></div>' +
    '<details><summary>Nota e últimos registos</summary>' +
    field('Nota opcional', '<textarea name="nota" maxlength="500" rows="2"></textarea>') +
    recent(records().filter(record => record.alunoId === alunoId)) + '</details></form>';
  renderTags(activeDomain);
  quick.showModal();
}

function renderTags(selectedDomain) {
  $('#tags').innerHTML = DOMAINS[selectedDomain].map(tag =>
    '<label><input type="checkbox" name="tag" value="' + tag + '"><span>' + tag + '</span></label>').join('');
}

function ordered(items) {
  return [...items].sort((a, b) => Date.parse(a.dataHora) - Date.parse(b.dataHora));
}

function recent(items) {
  const last = ordered(items).slice(-3).reverse();
  return last.length ? '<ul class="alerts">' + last.map(record => '<li>' + formatDate.format(new Date(record.dataHora)) +
    ' · ' + record.dominio + ' · ' + record.nivel + '</li>').join('') + '</ul>' : empty('Ainda sem evidências.');
}

function classes() {
  const turma = current();
  const edit = editing && data.turmas.find(item => item.id === editing);
  const editor = editing ? '<section class="card"><h2>' + (edit ? 'Editar turma' : 'Nova turma') + '</h2>' +
    '<form data-form="class"><div class="fields">' +
    field('Nome da turma', '<input name="nome" required maxlength="80" value="' + escape(edit?.nome) + '" placeholder="Ex.: 7.º A">') +
    field('Ano ou ciclo', '<input name="ano" required maxlength="40" value="' + escape(edit?.anoCiclo) + '" placeholder="Ex.: 7.º ano">') +
    field('Turno (opcional)', '<input name="turno" maxlength="60" value="' + escape(edit?.turno) + '">') +
    '</div>' + field('Observações (opcional)', '<textarea name="obs" rows="2" maxlength="600">' + escape(edit?.observacoes) + '</textarea>') +
    '<div class="actions"><button class="primary">Guardar turma</button>' + button('cancel-class', 'Cancelar') + '</div></form></section>' : '';
  return heading('Organização', 'Turmas', 'Organize a lista de alunos e os lugares na sala.',
    button('new-class', 'Criar turma', 'primary')) + editor + (turma ? classDetails(turma) : empty('Ainda não há uma turma selecionada.'));
}

function classDetails(turma) {
  const pupil = turma.alunos.find(aluno => aluno.id === rosterEditing);
  const pupilForm = '<form data-form="student"><div class="fields">' +
    field('Nome ou iniciais', '<input name="nome" required maxlength="100" value="' + escape(pupil?.nome) + '">') +
    field('Número (opcional)', '<input name="numero" inputmode="numeric" maxlength="12" value="' + escape(pupil?.numero) + '">') +
    '</div><div class="actions"><button class="primary">' + (pupil ? 'Guardar aluno' : 'Adicionar aluno') + '</button>' +
    (pupil ? button('edit-student', 'Cancelar') : '') + '</div></form>';
  return '<section class="card"><div class="heading"><div><h2>' + escape(turma.nome) + '</h2>' +
    '<p>' + [turma.anoCiclo, turma.turno].filter(Boolean).map(escape).join(' · ') + '</p>' +
    (turma.observacoes ? empty(turma.observacoes) : '') + '</div><div class="actions">' +
    button('edit-class', 'Editar turma') + button('duplicate', 'Duplicar turma') + button('delete-class', 'Apagar turma', 'danger') +
    '</div></div><h3>Alunos · ' + turma.alunos.length + '</h3>' + pupilForm +
    '<details><summary>Colar lista de alunos</summary><form class="stack" data-form="roster">' +
    field('Um aluno por linha', '<textarea name="lista" rows="5" required placeholder="1 Ana\n2 · Bruno\nCarolina"></textarea>') +
    '<small>Use nomes ou iniciais. Se indicar um número, coloque-o no início da linha.</small><div><button>Adicionar lista</button></div></form></details>' +
    (turma.alunos.length ? '<details><summary>Ver e gerir a lista</summary><div class="table-scroll"><table><thead><tr><th scope="col">Aluno</th><th scope="col">Ações</th></tr></thead><tbody>' +
      turma.alunos.map(aluno => '<tr><th scope="row">' + escape(studentName(aluno)) + '</th><td><div class="actions">' +
        button('edit-student', 'Editar ' + aluno.nome, '', aluno.id) +
        button('delete-student', 'Remover ' + aluno.nome, 'danger', aluno.id) + '</div></td></tr>').join('') + '</tbody></table></div></details>' : '') +
    '</section><section class="card"><h2>Planta da sala</h2><form data-form="dimensions"><div class="fields">' +
    field('Filas', '<input type="number" name="linhas" min="1" max="12" required value="' + turma.planta.linhas + '">') +
    field('Lugares por fila', '<input type="number" name="colunas" min="1" max="12" required value="' + turma.planta.colunas + '">') +
    '</div><button>Guardar dimensões</button></form><p class="legend">Selecione um aluno e depois um lugar. Se o lugar estiver ocupado, os alunos trocam de posição.</p>' +
    field('Aluno para posicionar', '<select id="seat-student">' + option('', 'Selecionar aluno', seating) +
      turma.alunos.map(aluno => option(aluno.id, studentName(aluno), seating)).join('') + '</select>') +
    '<div class="actions">' + button('clear-seat', 'Retirar aluno do lugar') + '</div>' +
    plan(turma, null, true) + '</section>';
}

function reportItems() {
  return ordered(records().filter(record => {
    const date = localDay(record.dataHora);
    return (!filters.aluno || record.alunoId === filters.aluno) &&
      (!filters.dominio || record.dominio === filters.dominio) &&
      (!filters.inicio || date >= filters.inicio) && (!filters.fim || date <= filters.fim);
  }));
}

function reports() {
  const turma = current();
  if (!turma) return heading('Acompanhamento', 'Relatórios', 'Selecione uma turma.');
  const items = reportItems();
  const aluno = turma.alunos.find(item => item.id === filters.aluno);
  const lookup = new Map(turma.alunos.map(item => [item.id, studentName(item)]));
  const dateLabel = value => value.split('-').reverse().join('/');
  const period = [filters.inicio ? 'Desde ' + dateLabel(filters.inicio) : '', filters.fim ? 'Até ' + dateLabel(filters.fim) : '']
    .filter(Boolean).join(' · ') || 'Todo o histórico';
  return heading('Acompanhamento formativo', turma.nome, [aluno ? studentName(aluno) : 'Turma completa',
    filters.dominio || 'Todos os domínios', period].join(' · ')) +
    '<section class="card no-print"><h2>Filtros e exportação</h2><div class="fields">' +
    field('Aluno', '<select data-filter="aluno">' + option('', 'Todos', filters.aluno) +
      turma.alunos.map(item => option(item.id, studentName(item), filters.aluno)).join('') + '</select>') +
    field('Domínio', '<select data-filter="dominio">' + option('', 'Todos', filters.dominio) + options(Object.keys(DOMAINS), filters.dominio) + '</select>') +
    field('De (inclusive)', '<input type="date" data-filter="inicio" value="' + escape(filters.inicio) + '">') +
    field('Até (inclusive)', '<input type="date" data-filter="fim" value="' + escape(filters.fim) + '">') +
    '</div>' + (filters.inicio && filters.fim && filters.inicio > filters.fim ? '<p role="status">A data inicial é posterior à data final.</p>' : '') +
    '<div class="actions">' + button('csv', 'Exportar CSV') + button('report-json', 'Exportar JSON') + button('print', 'Imprimir', 'primary') + '</div></section>' +
    '<section class="card"><h2>Distribuição · ' + items.length + ' registos</h2>' + distribution(items) + '</section>' +
    (aluno ? studentReport(items) : '') +
    '<section class="card"><h2>Evidências</h2>' + (items.length ?
      '<div class="table-scroll"><table><thead><tr>' + ['Data e hora', 'Aluno', 'Domínio', 'Nível', 'Tarefa', 'Etiquetas', 'Nota']
        .map(label => '<th scope="col">' + label + '</th>').join('') + '</tr></thead><tbody>' +
      [...items].reverse().map(record => '<tr>' + [formatDate.format(new Date(record.dataHora)), lookup.get(record.alunoId),
        record.dominio, record.nivel, TASKS[record.tarefaId]?.[0] || '', record.etiquetas.join(', '), record.notaTexto]
        .map((value, i) => '<td' + (i === 6 ? ' class="note"' : '') + '>' + escape(value) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>' : empty('Sem evidências para os filtros selecionados.')) + '</section>';
}

function studentReport(items) {
  const domains = Object.keys(DOMAINS).map(domainName => [domainName, items.filter(record => record.dominio === domainName)]);
  const fragile = domains.map(([label, group]) => [label, group.filter(isDifficulty).length])
    .filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const trends = domains.filter(([, group]) => group.length >= 2);
  return '<section class="card"><h2>Indicadores do aluno</h2><h3>Últimos registos no período</h3>' + recent(items) +
    '<h3>Domínios com evidências de dificuldade</h3>' +
    (fragile.length ? '<ul class="alerts">' + fragile.map(([label, n]) => '<li>' + label + ' · ' + n + '</li>').join('') + '</ul>'
      : empty('Sem registos «Insuficiente» ou «A desenvolver» para os filtros selecionados.')) +
    '<h3>Evolução no período</h3><p class="legend">Primeira e última evidência de cada domínio. Podem corresponder a tarefas diferentes.</p>' +
    (trends.length ? '<ul class="alerts">' + trends.map(([label, group]) =>
      '<li>' + label + ' · ' + group[0].nivel + ' → ' + group[group.length - 1].nivel + ' (' + group.length + ' registos)</li>').join('') + '</ul>'
      : empty('São necessárias pelo menos duas evidências no mesmo domínio.')) + '</section>';
}

function settings() {
  return heading('Dados neste dispositivo', 'Definições') +
    '<section class="card"><h2>Privacidade e acesso</h2><p>Os dados ficam neste navegador. A aplicação não os envia para servidores. ' +
    'Use iniciais ou nomes curtos e evite informação sensível nas notas.</p><p>O PIN apenas reduz acessos casuais. ' +
    'Os dados locais e as cópias de segurança ficam sem encriptação.</p>' +
    '<form data-form="settings"><div class="fields">' +
    field('Tema', '<select name="tema">' + option('claro', 'Claro', data.definicoes.tema) + option('escuro', 'Escuro', data.definicoes.tema) + '</select>') +
    field('Novo PIN (4 a 8 dígitos)', '<input name="pin" type="password" inputmode="numeric" autocomplete="new-password" pattern="[0-9]{4,8}" maxlength="8">') +
    '</div><p class="legend">O PIN está ' + (data.definicoes.pin ? 'ativo' : 'desativado') + '. Deixe o campo vazio para manter a configuração atual.</p>' +
    '<div class="actions"><button class="primary">Guardar definições</button>' +
    (data.definicoes.pin ? button('lock', 'Bloquear agora') + button('clear-pin', 'Remover PIN') : '') + '</div></form></section>' +
    '<section class="card stack"><h2>Backup e reposição</h2><p>Faça backups regulares e guarde-os num local protegido. ' +
    'A importação de um backup substitui os dados atuais depois de os validar e de pedir confirmação.</p>' +
    '<div class="actions">' + button('backup', 'Exportar backup JSON') + button('import', 'Importar backup JSON') +
    '<input id="backup-file" type="file" accept=".json,application/json" hidden>' + button('erase', 'Apagar todos os dados', 'danger') +
    '</div></section>';
}

let seating = '';
function switchClass(value, focus = true) {
  if (!commit(next => { next.definicoes.turmaId = value; })) {
    $('#active-class').value = activeId;
    return;
  }
  resetClassContext(value);
  refresh(focus ? '#active-class' : '');
}

function resetClassContext(value) {
  activeId = value;
  filters = { aluno: '', dominio: '', inicio: '', fim: '' };
  seating = '';
  rosterEditing = '';
  editing = '';
  task = '';
}

function refresh(selector = '') {
  render();
  if (selector) ($(selector) || main).focus({ preventScroll: true });
}

function updateClass(change) {
  return commit(next => change(next.turmas.find(turma => turma.id === activeId), next));
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function exportReport(asCsv) {
  const turma = current();
  const byId = new Map(turma.alunos.map(aluno => [aluno.id, aluno]));
  const items = reportItems().map(record => ({
    ...record, aluno: byId.get(record.alunoId).nome, numero: byId.get(record.alunoId).numero
  }));
  if (!asCsv) {
    download('pulso-relatorio.json', JSON.stringify({ turma: turma.nome, filtros: filters, registos: items }, null, 2), 'application/json');
    return;
  }
  // Proteger conteúdo introduzido pelo utilizador de fórmulas de folha de cálculo.
  const cell = value => {
    const text = String(value);
    const safe = /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
  };
  const rows = [['Turma', 'Número', 'Aluno', 'Data e hora', 'Domínio', 'Nível', 'Tarefa', 'Etiquetas', 'Nota'],
    ...items.map(record => [turma.nome, record.numero, record.aluno, formatDate.format(new Date(record.dataHora)),
      record.dominio, record.nivel, TASKS[record.tarefaId]?.[0] || '', record.etiquetas.join(', '), record.notaTexto])];
  download('pulso-relatorio.csv', '\uFEFF' + rows.map(row => row.map(cell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
}

const actions = {
  navigate(value) {
    view = value;
    editing = '';
    refresh('#main');
  },
  layout(value) {
    layout = value;
    refresh('[data-action="layout"][aria-pressed="true"]');
  },
  quick: openQuick,
  'close-quick'() { quick.close(); },
  undo() {
    const latest = records().at(-1);
    if (latest && commit(next => { next.registos = next.registos.filter(item => item.id !== latest.id); })) {
      refresh('[data-action="undo"]:enabled');
      announce('Último registo desfeito.');
    }
  },
  'new-class'() {
    editing = 'nova';
    refresh('[data-form="class"] input');
  },
  'edit-class'() {
    editing = activeId;
    refresh('[data-form="class"] input');
  },
  'cancel-class'() {
    editing = '';
    refresh('[data-action="new-class"]');
  },
  duplicate() {
    const newId = id();
    if (!updateClass((turma, next) => {
      next.turmas.push({
        ...turma, id: newId, nome: turma.nome.slice(0, 72) + ' (cópia)', criadaEm: now(),
        alunos: turma.alunos.map(aluno => ({ ...aluno, id: id() }))
      });
      next.definicoes.turmaId = newId;
    })) return;
    resetClassContext(newId);
    refresh('#main');
    announce('Turma duplicada com alunos e lugares. A cópia começa sem registos.');
  },
  'delete-class'() {
    if (!confirm('Apagar a turma «' + current().nome + '», os alunos e todas as suas evidências?')) return;
    if (!updateClass((turma, next) => {
      next.turmas = next.turmas.filter(item => item.id !== turma.id);
      next.registos = next.registos.filter(item => item.turmaId !== turma.id);
      next.definicoes.turmaId = next.turmas[0]?.id || '';
    })) return;
    resetClassContext(data.definicoes.turmaId);
    refresh('#main');
    announce('Turma apagada.');
  },
  'edit-student'(value) {
    rosterEditing = value;
    refresh('[data-form="student"] input');
  },
  'delete-student'(value) {
    const aluno = current().alunos.find(item => item.id === value);
    if (!confirm('Remover «' + aluno.nome + '» e todas as suas evidências?')) return;
    if (!updateClass((turma, next) => {
      turma.alunos = turma.alunos.filter(item => item.id !== value);
      next.registos = next.registos.filter(item => item.turmaId !== turma.id || item.alunoId !== value);
    })) return;
    if (seating === value) seating = '';
    if (rosterEditing === value) rosterEditing = '';
    if (filters.aluno === value) filters.aluno = '';
    refresh('[data-form="student"] input');
    announce('Aluno removido.');
  },
  seat(value) {
    if (!seating) {
      announce('Selecione primeiro um aluno.');
      $('#seat-student').focus();
      return;
    }
    const position = Number(value);
    if (!updateClass(turma => {
      const aluno = turma.alunos.find(item => item.id === seating);
      const occupant = turma.alunos.find(item => item.posicao === position && item.id !== seating);
      if (occupant) occupant.posicao = aluno.posicao;
      aluno.posicao = position;
    })) return;
    refresh('[data-action="seat"][data-value="' + position + '"]');
    announce('Lugar atualizado.');
  },
  'clear-seat'() {
    if (!seating) {
      announce('Selecione primeiro um aluno.');
      $('#seat-student').focus();
      return;
    }
    if (!updateClass(turma => { turma.alunos.find(item => item.id === seating).posicao = null; })) return;
    refresh('#seat-student');
    announce('Lugar libertado.');
  },
  csv() { exportReport(true); },
  'report-json'() { exportReport(false); },
  print() { window.print(); },
  backup() {
    if (startupError) {
      alertError(startupError);
      return;
    }
    // O PIN é específico do navegador. O backup inclui as restantes definições.
    const backup = { ...data, definicoes: { ...data.definicoes, pin: '' } };
    download('pulso-backup-' + localDay(now()) + '.json', JSON.stringify(backup, null, 2), 'application/json');
  },
  import() { $('#backup-file').click(); },
  erase() {
    if (!confirm('Apagar todas as turmas, registos e definições neste navegador? Tenha uma cópia de segurança antes de continuar.')) return;
    if (!commit(next => Object.assign(next, blank()), { recover: true })) return;
    resetClassContext('');
    refresh('#main');
    announce('Dados apagados.');
  },
  lock() {
    locked = true;
    $('#feedback').textContent = '';
    alertError('');
    render();
  },
  'clear-pin'() {
    if (!commit(next => { next.definicoes.pin = ''; })) return;
    refresh('[data-form="settings"] select');
    announce('PIN removido.');
  }
};

const submissions = {
  unlock(form) {
    if (form.get('pin') !== data.definicoes.pin) {
      alertError('PIN incorreto.');
      $('#lock input').select();
      return;
    }
    alertError('');
    locked = false;
    refresh('#main');
  },
  class(form) {
    const nome = form.get('nome').trim();
    const anoCiclo = form.get('ano').trim();
    if (!nome || !anoCiclo) {
      announce('Indique o nome e o ano ou ciclo da turma.');
      return;
    }
    const newId = editing === 'nova' ? id() : editing;
    if (!commit(next => {
      let turma = next.turmas.find(item => item.id === newId);
      if (!turma) {
        turma = { id: newId, criadaEm: now(), alunos: [], planta: { linhas: 5, colunas: 6 } };
        next.turmas.push(turma);
      }
      Object.assign(turma, { nome, anoCiclo, turno: form.get('turno').trim(), observacoes: form.get('obs').trim() });
      next.definicoes.turmaId = newId;
    })) return;
    resetClassContext(newId);
    refresh('[data-form="student"] input');
    announce('Turma guardada.');
  },
  student(form) {
    const nome = form.get('nome').trim();
    if (!nome) {
      announce('Indique um nome ou iniciais.');
      return;
    }
    if (!updateClass(turma => {
      const aluno = turma.alunos.find(item => item.id === rosterEditing);
      const fields = { nome, numero: form.get('numero').trim() };
      if (aluno) Object.assign(aluno, fields);
      else turma.alunos.push({ id: id(), posicao: null, ...fields });
    })) return;
    rosterEditing = '';
    refresh('[data-form="student"] input');
    announce('Aluno guardado.');
  },
  roster(form) {
    const lines = form.get('lista').split(/\r\n?|\n/).map(line => line.trim()).filter(Boolean);
    const alunos = lines.map(line => {
      const match = line.match(/^(\d+)(?:\s*[.·;,:\-–)]\s*|\s+)(\S.*)$/);
      return { id: id(), nome: match ? match[2] : line, numero: match ? match[1] : '', posicao: null };
    });
    if (!alunos.length || alunos.some(aluno => aluno.nome.length > 100 || aluno.numero.length > 12)) {
      announce('Indique pelo menos um aluno. Use até 100 caracteres por nome e 12 por número.');
      return;
    }
    if (!updateClass(turma => { turma.alunos.push(...alunos); })) return;
    refresh('[data-form="roster"]');
    const details = $('[data-form="roster"]').closest('details');
    details.querySelector('summary').focus();
    announce(alunos.length + (alunos.length === 1 ? ' aluno adicionado.' : ' alunos adicionados.'));
  },
  dimensions(form) {
    const linhas = Number(form.get('linhas'));
    const colunas = Number(form.get('colunas'));
    if (!updateClass(turma => {
      const oldCols = turma.planta.colunas;
      for (const aluno of turma.alunos) {
        if (aluno.posicao === null) continue;
        const row = Math.floor(aluno.posicao / oldCols);
        const column = aluno.posicao % oldCols;
        aluno.posicao = row < linhas && column < colunas ? row * colunas + column : null;
      }
      turma.planta = { linhas, colunas };
    })) return;
    refresh('[data-form="dimensions"] button');
    announce('Dimensões guardadas.');
  },
  quick(form, submitter) {
    const nivel = submitter?.value;
    if (!(task ? LEVELS : SCHOOL_LEVELS).includes(nivel)) return;
    const dominio = task ? TASKS[task][1] : form.get('dominio');
    const record = {
      id: id(), turmaId: activeId, alunoId: quickStudent, dataHora: now(), dominio, nivel,
      etiquetas: form.getAll('tag'), tarefaId: task, notaTexto: form.get('nota').trim()
    };
    if (!commit(next => { next.registos.push(record); })) {
      let error = quick.querySelector('[role="alert"]');
      if (!error) {
        error = document.createElement('p');
        error.setAttribute('role', 'alert');
        quick.prepend(error);
      }
      error.textContent = $('#error').textContent;
      return;
    }
    if (!task) domain = dominio;
    quick.close();
    refresh();
    announce('Evidência guardada.');
  },
  settings(form) {
    if (!commit(next => {
      next.definicoes.tema = form.get('tema');
      if (form.get('pin')) next.definicoes.pin = form.get('pin');
    })) return;
    refresh('[data-form="settings"] button');
    announce('Definições guardadas.');
  }
};

document.addEventListener('click', event => {
  const target = event.target.closest('button[data-action]');
  if (target && !locked) actions[target.dataset.action](target.dataset.value);
});

document.addEventListener('submit', event => {
  const name = event.target.dataset.form;
  if (!name) return;
  event.preventDefault();
  if (!locked || name === 'unlock') submissions[name](new FormData(event.target), event.submitter);
});

document.addEventListener('change', async event => {
  const target = event.target;
  if (target.id === 'active-class') switchClass(target.value);
  if (target.id === 'task') {
    task = target.value;
    refresh('#task');
  }
  if (target.id === 'domain') domain = target.value;
  if (target.id === 'quick-domain') renderTags(target.value);
  if (target.id === 'seat-student') seating = target.value;
  if (target.dataset.filter) {
    filters[target.dataset.filter] = target.value;
    refresh('[data-filter="' + target.dataset.filter + '"]');
  }
  if (target.id === 'backup-file' && target.files[0]) {
    const file = target.files[0];
    target.value = '';
    let imported;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('size');
      imported = validate(JSON.parse(await file.text()));
    } catch {
      alertError('Backup inválido, incompatível ou superior a 10 MB. Os dados atuais foram preservados.');
      return;
    }
    if (locked || !confirm('Substituir os dados atuais por ' + imported.turmas.length + ' turmas e ' +
      imported.registos.length + ' registos deste backup?')) return;
    imported.definicoes.pin = data.definicoes.pin;
    if (!commit(next => Object.assign(next, imported), { recover: true })) return;
    resetClassContext(data.definicoes.turmaId);
    refresh('[data-action="import"]');
    announce('Backup importado.');
  }
});

quick.addEventListener('close', () => {
  if (quick.open) return;
  quick.replaceChildren();
  $('[data-action="quick"][data-value="' + quickTrigger + '"]')?.focus({ preventScroll: true });
});

window.addEventListener('storage', event => {
  if (event.key === KEY || event.key === null) {
    alertError('Os dados mudaram noutra aba. Recarregue esta página para os atualizar.');
  }
});

render();
if (startupError) alertError(startupError);

// Ficheiros locais já funcionam offline. Em HTTPS, guardar a aplicação para visitas offline.
if (location.protocol !== 'file:' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {
    announce('O navegador não ativou a cópia offline. Pode abrir os ficheiros locais sem ligação.');
  });
}
