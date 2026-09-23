import { countText, cleanText, uniqueLines, convertList, dateDifference, percentage, formatJSON, convertTable } from './utils.js';

const paths = {
  type: '<path d="M4 5h16M12 5v15M8 20h8M4 5v3M20 5v3"/>',
  clean: '<path d="m14 4 6 6M12 6l6 6-9 9H3v-6zM4 14l6 6M19 2v4M17 4h4"/>',
  unique: '<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3m4-2 2 2 3-4"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12M3 5h1v3M3 11h2l-2 3h2M3 17h2v3H3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/>',
  percent: '<path d="m5 19 14-14"/><circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
  table: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
const tools = [
  { id: 'counter', name: '글자 수 세기', group: '텍스트', icon: 'type', desc: '글자 수부터 UTF-8 용량까지, 입력하는 순간 바로 확인하세요.', short: '글자·단어·바이트를 한눈에', sample: '작은 도구가 만드는 가벼운 업무.\n반복되는 일은 줄이고, 중요한 일에 집중하세요.', tags: '문자 단어 바이트 count', tip: '공백 포함 글자 수에는 띄어쓰기와 줄바꿈도 포함돼요. 이모지는 화면에 보이는 한 글자로 계산합니다.' },
  { id: 'cleanup', name: '텍스트 정리', group: '텍스트', icon: 'clean', desc: '복사한 문서의 불필요한 공백과 빈 줄을 깔끔하게 정리하세요.', short: '공백과 빈 줄을 깔끔하게', sample: '   주간 업무 보고   \n\n  프로젝트     진행 상황\n\n\n  다음 주   할 일  ', tags: '공백 줄바꿈 trim', tip: '원본과 정리 결과를 나란히 비교하세요. 원하는 정리 옵션만 선택해서 사용할 수 있어요.' },
  { id: 'unique', name: '중복 줄 제거', group: '텍스트', icon: 'unique', desc: '반복된 항목은 한 번만. 목록에서 필요한 내용만 남기세요.', short: '겹치는 항목 없이 간결하게', sample: '기획팀\n디자인팀\n개발팀\n기획팀\n운영팀\n개발팀', tags: '중복 목록 unique', tip: '처음 나타난 항목을 남기고 빈 줄은 제외합니다. 대소문자 구분과 정렬 여부도 선택할 수 있어요.' },
  { id: 'list', name: '목록 변환', group: '텍스트', icon: 'list', desc: '한 줄에 하나씩 적으면, 바로 붙여 넣을 수 있는 목록이 됩니다.', short: '번호·글머리·체크리스트', sample: '회의 안건 준비\n주간 보고서 작성\n팀 피드백 정리\n다음 일정 공유', tags: '번호 체크리스트 쉼표 bullet', tip: '빈 줄은 자동으로 제외합니다. 체크리스트 형식은 Markdown을 지원하는 문서에 붙여 넣기 좋아요.' },
  { id: 'dates', name: '날짜 계산', group: '계산', icon: 'calendar', desc: '일정 사이의 날짜와 평일 수를 간편하게 계산하세요.', short: '두 날짜 사이, 얼마나 남았을까', tags: '기간 일수 평일 주말 date', tip: '기본 계산은 시작일을 포함하고 종료일은 제외합니다. 평일은 월~금 기준이며 공휴일은 제외하지 않아요.' },
  { id: 'percent', name: '퍼센트 계산', group: '계산', icon: 'percent', desc: '비율, 백분율, 증감률. 복잡한 계산식 없이 숫자만 입력하세요.', short: '비율과 증감률을 빠르게', tags: '비율 증감률 퍼센트 할인 percent', tip: '증감률은 (변경 값 − 기존 값) ÷ |기존 값| × 100으로 계산합니다. 결과는 소수점 여섯 자리까지 표시해요.' },
  { id: 'json', name: 'JSON 정리', group: '데이터', icon: 'code', desc: '읽기 어려운 JSON을 정돈하고 문법 오류를 확인하세요.', short: '데이터를 보기 좋은 형태로', sample: '{"project":"Simple Utils","version":1,"tools":["텍스트","계산","데이터"],"free":true}', tags: 'json 포맷 검증 pretty', tip: 'JSON 문법을 확인한 뒤 들여쓰기를 적용합니다. JavaScript 숫자 정밀도를 넘는 긴 ID는 문자열로 감싸서 사용하세요.' },
  { id: 'table', name: '표 변환', group: '데이터', icon: 'table', desc: '엑셀에서 복사한 표를 Markdown 표나 CSV로 바꾸세요.', short: '엑셀 표를 문서와 연결하기', sample: '항목\t담당자\t상태\n기획\t김민수\t완료\n디자인\t이서연\t진행 중\n개발\t박지훈\t예정', tags: '엑셀 tsv csv markdown 표', tip: '엑셀이나 스프레드시트에서 셀 영역을 복사해 붙여 넣으세요. 첫 행은 Markdown 표의 제목 행이 됩니다. CSV는 수식으로 해석될 내용을 포함할 수 있으니 외부 자료는 확인 후 여세요.' },
];
const drafts = Object.fromEntries(tools.map((tool) => [tool.id, '']));
let active = tools.find((tool) => `#${tool.id}` === location.hash) || tools[0];
let currentOutput = '';
let toastTimer;
const $ = (selector) => document.querySelector(selector);
const fmt = (n) => n.toLocaleString('ko-KR', { maximumFractionDigits: 6 });

$('#app').innerHTML = `
  <aside class="sidebar">
    <a class="brand" href="#counter" aria-label="Simple Utils 홈"><span class="brand-mark">s<span>u</span></span><span>simple<span class="brand-light">utils</span><small>작지만 쓸모있는 도구들</small></span></a>
    <div class="nav-heading">WORKSPACE <span>08</span></div>
    <nav id="navigation" aria-label="유틸리티 선택"></nav>
    <div class="sidebar-note"><span class="note-icon">${icon('shield')}</span><strong>당신의 데이터는, 당신에게만.</strong><p>입력한 내용은 서버로 전송하지 않고<br>이 브라우저에서만 처리해요.</p><span class="local-label"><i></i> 브라우저 내 처리</span></div>
    <div class="sidebar-bottom"><span class="mini-brand">su.</span><span>LESS BUSY. MORE SIMPLE.</span></div>
  </aside>
  <div class="main-wrap">
    <header class="topbar"><div class="breadcrumb">내 작업 공간 ${icon('chevron')} <span id="crumb">텍스트</span></div><span class="top-label">${icon('sun')} 오늘도, 조금 더 간단하게</span><a class="github-link" href="https://github.com/shhyceo-hub/simple-utils" target="_blank" rel="noopener noreferrer">GitHub ↗</a></header>
    <main id="workspace" tabindex="-1">
      <section class="intro"><div><span class="eyebrow"><i></i> YOUR EVERYDAY TOOLKIT</span><h1>작은 도구, <span>가벼운 업무.</span></h1><p>매일 반복되는 작업을 조금 더 쉽고 빠르게.</p></div><div class="intro-art" aria-hidden="true"><span class="art-sheet"><b>Aa</b><i></i><i></i></span><span class="art-check">${icon('check')}</span><span class="art-spark">✳</span></div></section>
      <div class="discovery"><div class="filter-tabs" role="group" aria-label="도구 카테고리"><button class="filter active" data-group="전체">전체 도구 <span>8</span></button><button class="filter" data-group="텍스트">텍스트</button><button class="filter" data-group="계산">계산</button><button class="filter" data-group="데이터">데이터</button></div><label class="search">${icon('search')}<input id="tool-search" type="search" placeholder="필요한 도구 찾기" aria-label="도구 검색"><kbd>/</kbd></label></div>
      <div id="tool-cards" class="tool-cards" aria-label="도구 목록"></div>
      <section class="workbench" aria-labelledby="tool-title"><div class="workbench-header"><div class="tool-heading"><span class="tool-symbol" id="tool-symbol"></span><div><div class="title-line"><h2 id="tool-title"></h2><span class="live-badge"><i></i> 실시간</span></div><p id="tool-description"></p></div></div><button class="text-button" id="sample-button">${icon('spark')} 예시 불러오기</button></div><div id="tool-body"></div></section>
      <div class="bottom-notes"><p>${icon('shield')} 가입 없이, 설치 없이, 데이터 전송 없이.</p><p>${icon('info')} <span id="tool-tip"></span></p></div>
      <footer><span>© ${new Date().getFullYear()} Simple Utils</span><span>복잡한 하루에, 단순한 도구 하나.</span><span class="footer-status"><i></i> 모든 도구 무료</span></footer>
    </main>
  </div>`;

$('#navigation').innerHTML = ['텍스트', '계산', '데이터'].map((group) => `<div class="nav-group"><p>${group}</p>${tools.filter((tool) => tool.group === group).map((tool) => `<a href="#${tool.id}" class="nav-item" data-tool="${tool.id}">${icon(tool.icon)}<span>${tool.name}</span><span class="nav-dot"></span></a>`).join('')}</div>`).join('');

function renderCards() {
  const group = $('.filter.active').dataset.group;
  const search = $('#tool-search').value.trim().toLocaleLowerCase();
  const matches = tools.filter((tool) => (group === '전체' || tool.group === group) && `${tool.name} ${tool.tags}`.toLocaleLowerCase().includes(search));
  $('#tool-cards').innerHTML = matches.length ? matches.map((tool) => `<a href="#${tool.id}" class="tool-card ${active.id === tool.id ? 'selected' : ''}" ${active.id === tool.id ? 'aria-current="true"' : ''}><span class="card-icon tone-${tool.group === '텍스트' ? 'green' : tool.group === '계산' ? 'orange' : 'blue'}">${icon(tool.icon)}</span><span><strong>${tool.name}</strong><small>${tool.short}</small></span>${icon('arrow', 'card-arrow')}</a>`).join('') : '<div class="empty-search">검색 결과가 없어요. 다른 이름으로 찾아보세요.</div>';
}

const checkbox = (id, label, checked = false) => `<label class="checkbox"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>${label}</label>`;
const select = (id, label, choices) => `<label class="select-label">${label}<select id="${id}">${choices.map(([value, title]) => `<option value="${value}">${title}</option>`).join('')}</select></label>`;
const actions = () => `<div class="result-actions"><button class="button secondary" id="download">${icon('download')} 다운로드</button><button class="button primary" id="copy">${icon('copy')} 결과 복사</button></div>`;
function options() {
  if (active.id === 'cleanup') return checkbox('trim', '줄 양끝 공백 제거', true) + checkbox('spaces', '연속 공백 하나로', true) + checkbox('empty', '빈 줄 제거');
  if (active.id === 'unique') return checkbox('trim', '양끝 공백 무시', true) + checkbox('ignoreCase', '대소문자 무시') + checkbox('sort', '가나다순 정렬');
  if (active.id === 'list') return select('list-mode', '목록 형식', [['number', '번호 목록'], ['bullet', '글머리 기호'], ['check', '체크리스트'], ['comma', '쉼표로 연결']]);
  if (active.id === 'json') return checkbox('compact', '한 줄로 압축');
  if (active.id === 'table') return select('table-mode', '변환 형식', [['markdown', 'Markdown 표'], ['csv', 'CSV 파일']]);
  return '';
}

function renderTool() {
  currentOutput = '';
  $('#tool-title').textContent = active.name;
  $('#tool-description').textContent = active.desc;
  $('#tool-tip').textContent = active.tip;
  $('#tool-symbol').innerHTML = icon(active.icon);
  $('#crumb').textContent = active.group;
  $('#sample-button').hidden = !active.sample;
  document.title = `${active.name} — Simple Utils`;
  document.querySelectorAll('.nav-item').forEach((el) => { const selected = el.dataset.tool === active.id; el.classList.toggle('active', selected); if (selected) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
  renderCards();
  if (active.id === 'dates') renderDates();
  else if (active.id === 'percent') renderPercent();
  else renderText();
}

function renderText() {
  const counter = active.id === 'counter';
  $('#tool-body').innerHTML = `${counter ? '<div class="metrics" id="metrics"></div>' : `<div class="options-bar">${options()}</div>`}
    <div class="editors ${counter ? 'single' : ''}"><div class="editor"><div class="editor-top"><label for="input">${counter ? '텍스트 입력' : '원본 텍스트'}</label><button id="clear" class="text-button muted">지우기</button></div><textarea id="input" spellcheck="false" placeholder="${active.id === 'table' ? '엑셀에서 복사한 표를 여기에 붙여 넣으세요.\n탭으로 구분된 데이터를 자동으로 인식합니다.' : '여기에 텍스트를 입력하거나 붙여 넣으세요.\n작은 작업은 Simple Utils에 맡겨두세요.'}"></textarea><div class="editor-bottom"><span>${icon('shield')} 입력 내용은 저장되지 않아요</span><span id="input-size">0자</span></div></div>${counter ? '' : '<div class="editor output-editor"><div class="editor-top"><label for="output">변환 결과</label><span class="output-label">OUTPUT</span></div><textarea id="output" readonly spellcheck="false" placeholder="변환 결과가 여기에 표시됩니다."></textarea><div class="editor-bottom"><span id="result-meta">입력을 기다리고 있어요</span><span id="output-size">0자</span></div></div>'}</div>
    <div class="workbench-bottom"><span class="helper" id="feedback" role="status">${icon('check')} ${counter ? '입력과 동시에 자동으로 계산됩니다' : '옵션을 바꾸면 결과에 바로 반영됩니다'}</span>${actions()}</div>`;
  $('#input').value = drafts[active.id];
  $('#input').addEventListener('input', () => { drafts[active.id] = $('#input').value; updateText(); });
  $('#clear').addEventListener('click', () => { $('#input').value = ''; drafts[active.id] = ''; updateText(); $('#input').focus(); });
  document.querySelectorAll('.options-bar input, .options-bar select').forEach((el) => el.addEventListener('change', updateText));
  $('#copy').addEventListener('click', () => copy(currentOutput));
  $('#download').addEventListener('click', download);
  updateText();
}

function updateText() {
  const text = $('#input').value;
  const counts = countText(text);
  $('#input-size').textContent = `${fmt(counts.characters)}자`;
  $('#feedback').classList.remove('error');
  $('#feedback').innerHTML = `${icon('check')} ${active.id === 'counter' ? '입력과 동시에 자동으로 계산됩니다' : '옵션을 바꾸면 결과에 바로 반영됩니다'}`;
  try {
    if (active.id === 'counter') {
      $('#metrics').innerHTML = [['공백 포함', counts.characters, '자', '전체 글자 수'], ['공백 제외', counts.noSpaces, '자', '띄어쓰기·줄바꿈 제외'], ['단어', counts.words, '개', '공백으로 구분한 단어'], ['줄', counts.lines, '줄', '줄바꿈으로 구분'], ['UTF-8 용량', counts.bytes, 'B', '한글은 보통 3바이트']].map(([label, number, unit, desc], i) => `<div class="metric ${i === 0 ? 'featured' : ''}"><span>${label}</span><strong>${fmt(number)}<small>${unit}</small></strong><p>${desc}</p></div>`).join('');
      currentOutput = text;
    } else {
      const checked = (id) => $(`#${id}`)?.checked;
      if (active.id === 'cleanup') currentOutput = cleanText(text, { trim: checked('trim'), spaces: checked('spaces'), empty: checked('empty') });
      if (active.id === 'unique') currentOutput = uniqueLines(text, { trim: checked('trim'), ignoreCase: checked('ignoreCase'), sort: checked('sort') });
      if (active.id === 'list') currentOutput = convertList(text, $('#list-mode').value);
      if (active.id === 'json') currentOutput = formatJSON(text, checked('compact'));
      if (active.id === 'table') currentOutput = convertTable(text, $('#table-mode').value);
      $('#output').value = currentOutput;
      $('#output-size').textContent = `${fmt(countText(currentOutput).characters)}자`;
      $('#result-meta').textContent = !text.trim() ? '입력을 기다리고 있어요' : active.id === 'unique' ? `${fmt(text.split(/\r?\n/).filter((l) => l.trim()).length - currentOutput.split('\n').filter(Boolean).length)}개의 중복 줄을 제거했어요` : '변환이 완료되었어요';
    }
  } catch (error) {
    currentOutput = '';
    $('#output').value = '';
    $('#output-size').textContent = '0자';
    $('#result-meta').textContent = '입력 내용을 확인해 주세요';
    $('#feedback').classList.add('error');
    $('#feedback').textContent = active.id === 'json' ? `JSON 형식을 확인해 주세요: ${error.message}` : error.message;
  }
  $('#copy').disabled = !currentOutput;
  $('#download').disabled = !currentOutput;
}

function localDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function renderDates() {
  const start = new Date(), end = new Date(); end.setDate(end.getDate() + 30);
  $('#tool-body').innerHTML = `<div class="calculator"><div class="calc-inputs"><span class="section-kicker">기간 설정</span><div class="date-inputs"><label>시작일<input id="date-start" type="date" value="${localDate(start)}"></label><span class="date-divider">→</span><label>종료일<input id="date-end" type="date" value="${localDate(end)}"></label></div>${checkbox('inclusive', '종료일도 포함해서 계산')}<div class="callout">${icon('info')} 평일은 월요일~금요일입니다.<br>공휴일과 대체공휴일은 별도로 확인해 주세요.</div></div><div class="calc-result"><span class="section-kicker">두 날짜 사이의 기간</span><div id="date-result"></div></div></div><div class="workbench-bottom"><span class="helper" id="feedback" role="status">${icon('check')} 날짜를 바꾸면 자동으로 계산됩니다</span><button class="button primary" id="copy">${icon('copy')} 결과 복사</button></div>`;
  const update = () => {
    try {
      const result = dateDifference($('#date-start').value, $('#date-end').value, $('#inclusive').checked);
      $('#date-result').innerHTML = `<div class="big-number">${fmt(result.days)}<span>일</span></div><div class="result-pills"><span>평일 <b>${fmt(result.weekdays)}일</b></span><span>주말 <b>${fmt(result.weekends)}일</b></span></div><p class="result-caption">${$('#inclusive').checked ? '시작일과 종료일 포함' : '시작일 포함 · 종료일 제외'}</p>`;
      currentOutput = `${$('#date-start').value} ~ ${$('#date-end').value}: ${result.days}일 (평일 ${result.weekdays}일, 주말 ${result.weekends}일 / ${$('#inclusive').checked ? '종료일 포함' : '종료일 제외'}, 공휴일 미반영)`;
      $('#feedback').textContent = '날짜를 바꾸면 자동으로 계산됩니다'; $('#feedback').classList.remove('error'); $('#copy').disabled = false;
    } catch (error) { $('#date-result').innerHTML = '<div class="big-number">—</div>'; $('#feedback').textContent = error.message; $('#feedback').classList.add('error'); currentOutput = ''; $('#copy').disabled = true; }
  };
  document.querySelectorAll('.calculator input').forEach((el) => el.addEventListener('input', update));
  $('#copy').addEventListener('click', () => copy(currentOutput)); update();
}

function renderPercent() {
  $('#tool-body').innerHTML = `<div class="options-bar">${select('percent-mode', '계산 방식', [['part', '전체 값의 몇 %는?'], ['ratio', '전체에서 차지하는 비율'], ['change', '기존 값 대비 증감률']])}</div><div class="calculator"><div class="calc-inputs"><div class="number-inputs"><label><span id="label-a">전체 값</span><input id="number-a" type="number" step="any" placeholder="예: 100000" value="100000"></label><label><span id="label-b">비율 (%)</span><input id="number-b" type="number" step="any" placeholder="예: 15" value="15"></label></div><p class="calc-explanation" id="formula"></p></div><div class="calc-result"><span class="section-kicker">계산 결과</span><div class="big-number" id="percent-result"></div><p class="result-caption">소수점 여섯 자리까지 표시</p></div></div><div class="workbench-bottom"><span class="helper" id="feedback" role="status">숫자를 바꾸면 자동으로 계산됩니다</span><button class="button primary" id="copy">${icon('copy')} 결과 복사</button></div>`;
  const update = () => {
    const mode = $('#percent-mode').value;
    $('#label-a').textContent = mode === 'part' ? '전체 값' : mode === 'ratio' ? '일부 값' : '기존 값';
    $('#label-b').textContent = mode === 'part' ? '비율 (%)' : mode === 'ratio' ? '전체 값' : '변경 값';
    $('#formula').textContent = mode === 'part' ? '전체 값 × 비율 ÷ 100' : mode === 'ratio' ? '일부 값 ÷ 전체 값 × 100' : '(변경 값 − 기존 값) ÷ |기존 값| × 100';
    try {
      const result = percentage($('#number-a').value, $('#number-b').value, mode);
      currentOutput = `${mode === 'change' && result > 0 ? '+' : ''}${fmt(result)}${mode === 'part' ? '' : '%'}`;
      $('#percent-result').textContent = currentOutput;
      $('#feedback').textContent = '숫자를 바꾸면 자동으로 계산됩니다'; $('#feedback').classList.remove('error'); $('#copy').disabled = false;
    } catch (error) { currentOutput = ''; $('#percent-result').textContent = '—'; $('#feedback').textContent = error.message; $('#feedback').classList.add('error'); $('#copy').disabled = true; }
  };
  document.querySelectorAll('.calculator input, #percent-mode').forEach((el) => el.addEventListener('input', update));
  $('#copy').addEventListener('click', () => copy(currentOutput)); update();
}

function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3000); }
async function copy(text) {
  if (!text) return;
  try { await navigator.clipboard.writeText(text); toast('클립보드에 복사했어요.'); }
  catch { toast('복사가 허용되지 않았어요. 결과를 선택해 직접 복사해 주세요.'); }
}
function download() {
  if (!currentOutput) return;
  const csv = active.id === 'table' && $('#table-mode').value === 'csv';
  const extension = active.id === 'json' ? 'json' : active.id === 'table' ? csv ? 'csv' : 'md' : 'txt';
  const url = URL.createObjectURL(new Blob([csv ? '\uFEFF' + currentOutput : currentOutput], { type: csv ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = `simple-utils-${active.id}.${extension}`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('파일을 다운로드했어요.');
}
$('#sample-button').addEventListener('click', () => { if ($('#input').value.trim() && !confirm('입력한 내용을 예시로 바꿀까요? 현재 내용은 지워집니다.')) return; $('#input').value = active.sample; drafts[active.id] = active.sample; updateText(); });
$('#tool-search').addEventListener('input', renderCards);
document.querySelectorAll('.filter').forEach((el) => {
  el.setAttribute('aria-pressed', String(el.classList.contains('active')));
  el.addEventListener('click', () => { document.querySelectorAll('.filter').forEach((tab) => { tab.classList.toggle('active', el === tab); tab.setAttribute('aria-pressed', String(el === tab)); }); renderCards(); });
});
window.addEventListener('hashchange', () => { active = tools.find((tool) => `#${tool.id}` === location.hash) || tools[0]; renderTool(); });
document.addEventListener('keydown', (event) => { if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { event.preventDefault(); $('#tool-search').focus(); } });
renderTool();
