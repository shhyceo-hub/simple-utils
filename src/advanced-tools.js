import { calculate, compileExpression, formatNumber, graphSegments } from './scientific.js';
import { convertLunar, dateText } from './lunar.js';
import './advanced.css';

const calculatorState = { expression: '', answer: 0, angle: 'DEG', scientific: true, history: [] };
const graphState = { expression: 'sin(x)', angle: 'RAD', range: [-10, 10, -2, 2] };
const $ = (selector) => document.querySelector(selector);
const button = (label, value, cls = '') => `<button type="button" class="calc-key ${cls}" data-value="${value}">${label}</button>`;

export function renderScientific({ copy }) {
  const abort = new AbortController();
  const listen = (target, event, handler) => target.addEventListener(event, handler, { signal: abort.signal });
  $('#tool-body').innerHTML = `<div class="science-toolbar"><div class="mode-switch" role="group" aria-label="계산기 모드"><button id="basic-mode">일반</button><button id="science-mode">공학용</button></div><label class="angle-selector">각도 단위 <select id="calc-angle"><option value="DEG">DEG · 도</option><option value="RAD">RAD · 라디안</option></select></label><a class="graph-link" href="#graph">함수 그래프 그리기 ↗</a></div>
  <div class="science-layout"><section class="calc-console" aria-label="계산기"><div class="calc-display"><label for="calc-expression">계산할 수식</label><input id="calc-expression" type="text" inputmode="decimal" maxlength="300" autocomplete="off" spellcheck="false" placeholder="예: (15000 + 2500) × 3" aria-describedby="calc-help"><output id="calc-result" aria-live="polite">0</output><p id="calc-error" role="status"></p></div>
  <div id="science-keys" class="science-keys">${[['sin','sin('],['cos','cos('],['tan','tan('],['π','pi'],['sin⁻¹','asin('],['cos⁻¹','acos('],['tan⁻¹','atan('],['e','e'],['√','sqrt('],['x²','^2'],['xʸ','^'],['n!','!'],['log₁₀','log('],['ln','ln('],['|x|','abs('],['Ans','ans']].map(([label, value]) => button(label, value)).join('')}</div>
  <div class="number-keys">${[['AC','clear','key-clear'],['(', '('],[')',')'],['⌫','back','key-operation'],['7','7'],['8','8'],['9','9'],['÷','/','key-operation'],['4','4'],['5','5'],['6','6'],['×','*','key-operation'],['1','1'],['2','2'],['3','3'],['−','-','key-operation'],['0','0'],['.','.'],['%','%'],['+','+','key-operation']].map(([label, value, cls]) => button(label, value, cls)).join('')}${button('±', 'sign')}${button('계산하기  =', 'equals', 'key-equals')}</div></section>
  <aside class="calc-side"><div class="calc-side-title"><h3>계산 기록</h3><button class="text-button" id="clear-history">기록 지우기</button></div><div id="calc-history"></div><div class="keyboard-guide"><strong>키보드로 더 빠르게</strong><p><kbd>0–9</kbd> 숫자키·숫자패드</p><p><kbd>+ − * /</kbd> 사칙연산 <kbd>^</kbd> 거듭제곱</p><p><kbd>Enter</kbd> 계산 <kbd>Backspace</kbd> 한 글자 삭제</p><p><kbd>Esc</kbd> 모두 지우기</p><small id="calc-help">함수는 sin(30)처럼 입력하세요.<br>%는 앞의 값을 100으로 나눕니다.<br>숫자 키를 누르면 바로 입력할 수 있어요.</small></div></aside></div>
  <div class="workbench-bottom"><span class="helper">실수 계산 · 결과는 유효숫자 12자리로 표시</span><button id="calc-copy" class="button primary" disabled>결과 복사</button></div>`;
  const input = $('#calc-expression');
  input.value = calculatorState.expression;
  $('#calc-angle').value = calculatorState.angle;
  let output = '', justCalculated = false;
  const refreshMode = () => {
    $('#science-keys').hidden = !calculatorState.scientific;
    ['basic', 'science'].forEach((mode) => { const on = (mode === 'science') === calculatorState.scientific; $(`#${mode}-mode`).classList.toggle('active', on); $(`#${mode}-mode`).setAttribute('aria-pressed', String(on)); });
  };
  const update = () => {
    calculatorState.expression = input.value;
    $('#calc-error').textContent = '';
    output = '';
    try { if (input.value.trim()) output = formatNumber(calculate(input.value, { angle: calculatorState.angle, ans: calculatorState.answer })); } catch { /* Incomplete typing is expected; show errors only when submitting. */ }
    $('#calc-result').textContent = output || (input.value ? '…' : '0');
    $('#calc-copy').disabled = !output;
  };
  const history = () => {
    const container = $('#calc-history'); container.replaceChildren();
    if (!calculatorState.history.length) { const p = document.createElement('p'); p.className = 'history-empty'; p.textContent = '계산한 결과가 여기에 모여요.\n새로고침하면 기록은 지워집니다.'; container.append(p); }
    for (const entry of calculatorState.history) {
      const item = document.createElement('button'); item.className = 'history-item';
      const expression = document.createElement('span'); expression.textContent = `${entry.expression}  · ${entry.angle}`;
      const result = document.createElement('strong'); result.textContent = `= ${entry.result}`;
      item.append(expression, result); container.append(item);
      item.addEventListener('click', () => { input.value = entry.expression; calculatorState.angle = entry.angle; $('#calc-angle').value = entry.angle; justCalculated = false; update(); input.focus(); });
    }
  };
  const execute = () => {
    try {
      const expression = input.value;
      const previousAnswer = calculatorState.answer;
      const value = calculate(expression, { angle: calculatorState.angle, ans: calculatorState.answer });
      output = formatNumber(value);
      calculatorState.answer = value;
      // Store the resolved expression so recalling Ans is reproducible.
      const resolvedExpression = expression.replace(/(?<![a-z])ans(?![a-z])/gi, `(${String(previousAnswer)})`);
      input.value = resolvedExpression;
      calculatorState.expression = resolvedExpression;
      calculatorState.history.unshift({ expression: resolvedExpression, result: output, angle: calculatorState.angle });
      calculatorState.history = calculatorState.history.slice(0, 8);
      $('#calc-result').textContent = output; $('#calc-error').textContent = ''; $('#calc-copy').disabled = false;
      justCalculated = true; history();
    } catch (error) { output = ''; $('#calc-result').textContent = '—'; $('#calc-error').textContent = error.message; $('#calc-copy').disabled = true; }
  };
  const insert = (value) => {
    if (justCalculated) {
      input.value = /^[+*/^!%\-]/.test(value) ? String(calculatorState.answer) : '';
      input.setSelectionRange(input.value.length, input.value.length);
      justCalculated = false;
    }
    const start = input.selectionStart ?? input.value.length, end = input.selectionEnd ?? start;
    if (input.value.length - (end - start) + value.length > 300) return;
    input.setRangeText(value, start, end, 'end'); input.focus(); update();
  };
  const act = (value) => {
    if (value === 'equals') execute();
    else if (value === 'clear') { input.value = ''; justCalculated = false; update(); input.focus(); }
    else if (value === 'back') { const start = input.selectionStart ?? input.value.length, end = input.selectionEnd ?? start; input.setRangeText('', start === end ? Math.max(0, start - 1) : start, end, 'end'); justCalculated = false; update(); input.focus(); }
    else if (value === 'sign') { input.value = input.value ? `-(${input.value})` : '-'; justCalculated = false; update(); input.focus(); }
    else insert(value);
  };
  listen(input, 'input', () => { justCalculated = false; update(); });
  document.querySelectorAll('.calc-key').forEach((key) => listen(key, 'click', () => act(key.dataset.value)));
  listen($('#calc-angle'), 'change', () => { calculatorState.angle = $('#calc-angle').value; justCalculated = false; update(); });
  listen($('#basic-mode'), 'click', () => { calculatorState.scientific = false; refreshMode(); });
  listen($('#science-mode'), 'click', () => { calculatorState.scientific = true; refreshMode(); });
  listen($('#clear-history'), 'click', () => { calculatorState.history = []; history(); });
  listen($('#calc-copy'), 'click', () => copy(output));
  listen(document, 'keydown', (event) => {
    if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target !== input && (target.matches('input, textarea, select') || target.isContentEditable)) return;
    const numpad = /^Numpad\d$/.test(event.code) ? event.code.slice(-1) : { NumpadDecimal: '.', NumpadAdd: '+', NumpadSubtract: '-', NumpadMultiply: '*', NumpadDivide: '/' }[event.code];
    if (numpad) { event.preventDefault(); insert(numpad); return; }
    if (event.key === 'Escape') { event.preventDefault(); act('clear'); }
    else if (event.key === '=' || (event.key === 'Enter' && !target.matches('button, a'))) { event.preventDefault(); act('equals'); }
    else if (event.key === 'Backspace' && target !== input) { event.preventDefault(); act('back'); }
    else if (/^[0-9.+\-*/^()%!]$/.test(event.key) && (target !== input || justCalculated)) { event.preventDefault(); insert(event.key); }
  });
  refreshMode(); update(); history();
  return () => abort.abort();
}

export function renderGraph() {
  const abort = new AbortController();
  const listen = (target, event, handler) => target.addEventListener(event, handler, { signal: abort.signal });
  $('#tool-body').innerHTML = `<div class="graph-controls"><label class="graph-expression-label" for="graph-expression">y =</label><input id="graph-expression" type="text" maxlength="300" spellcheck="false" autocomplete="off" aria-label="그래프 함수" placeholder="예: sin(x) 또는 x^2"><label class="angle-selector">각도 <select id="graph-angle"><option value="RAD">RAD</option><option value="DEG">DEG</option></select></label><button class="button primary" id="graph-draw">그래프 그리기</button></div>
  <div class="graph-presets" role="group" aria-label="그래프 예시"><span>예시</span>${['sin(x)', 'x^2', '1/x', 'sqrt(x)', 'cos(x)'].map((expression) => `<button type="button" data-expression="${expression}">${expression}</button>`).join('')}</div>
  <div class="graph-range">${[['x-min','x 최솟값'],['x-max','x 최댓값'],['y-min','y 최솟값'],['y-max','y 최댓값']].map(([id, label], i) => `<label>${label}<input id="${id}" type="number" step="any" value="${graphState.range[i]}" required></label>`).join('')}<div class="graph-zoom"><button class="button secondary" id="graph-zoom-in" aria-label="그래프 확대">＋</button><button class="button secondary" id="graph-zoom-out" aria-label="그래프 축소">−</button><button class="button secondary" id="graph-reset">초기 범위</button></div></div>
  <div class="graph-frame"><canvas id="graph-canvas" role="img" aria-label="함수 그래프"></canvas><p id="graph-error" role="status"></p></div><div class="graph-readout"><span class="graph-legend"><i></i> <span id="graph-legend-text"></span></span><output id="graph-coordinate">그래프 위를 움직이거나 터치해 좌표를 확인하세요.</output></div>
  <div class="workbench-bottom"><span class="helper" id="graph-summary">함숫값을 촘촘히 계산해 연결한 근사 그래프입니다.</span><button class="button secondary" id="graph-download">그래프 PNG 저장</button></div>`;
  $('#graph-expression').value = graphState.expression; $('#graph-angle').value = graphState.angle;
  const canvas = $('#graph-canvas'), ctx = canvas.getContext('2d');
  let evaluate, range, valid = false, drawing;
  const padding = { left: 46, right: 20, top: 22, bottom: 32 };
  const ranges = ['x-min', 'x-max', 'y-min', 'y-max'];
  let width, height;
  const px = (x) => padding.left + (x - range.xMin) / (range.xMax - range.xMin) * (width - padding.left - padding.right);
  const py = (y) => height - padding.bottom - (y - range.yMin) / (range.yMax - range.yMin) * (height - padding.top - padding.bottom);
  const tickStep = (span) => { const raw = span / 7, base = 10 ** Math.floor(Math.log10(raw)); return [1, 2, 5, 10].find((n) => n * base >= raw) * base; };
  function draw() {
    width = canvas.clientWidth; height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.fillStyle = '#fcfefb'; ctx.fillRect(0, 0, width, height);
    valid = false; evaluate = undefined; $('#graph-download').disabled = true; $('#graph-error').textContent = '';
    $('#graph-coordinate').textContent = '그래프 위를 움직이거나 터치해 좌표를 확인하세요.';
    const expression = $('#graph-expression').value;
    $('#graph-legend-text').textContent = `y = ${expression}`;
    try {
      if (ranges.some((id) => !$(`#${id}`).value.trim())) throw new Error('축의 최솟값과 최댓값을 모두 입력해 주세요.');
      const values = ranges.map((id) => Number($(`#${id}`).value));
      range = Object.fromEntries(['xMin','xMax','yMin','yMax'].map((key, i) => [key, values[i]]));
      evaluate = compileExpression(expression, { angle: $('#graph-angle').value, allowX: true });
      const segments = graphSegments(evaluate, range);
      graphState.expression = expression; graphState.angle = $('#graph-angle').value; graphState.range = values;
      ctx.font = '10px system-ui';
      for (const axis of ['x', 'y']) {
        const min = range[`${axis}Min`], max = range[`${axis}Max`], step = tickStep(max - min);
        for (let n = Math.ceil(min / step) * step, i = 0; n <= max && i < 20; n += step, i++) {
          const value = Math.abs(n) < step / 100 ? 0 : Number(n.toPrecision(8));
          const point = axis === 'x' ? px(value) : py(value);
          ctx.strokeStyle = value === 0 ? '#9fb6a5' : '#e4ece2'; ctx.lineWidth = value === 0 ? 1.4 : 1;
          ctx.beginPath();
          if (axis === 'x') { ctx.moveTo(point, padding.top); ctx.lineTo(point, height - padding.bottom); }
          else { ctx.moveTo(padding.left, point); ctx.lineTo(width - padding.right, point); }
          ctx.stroke(); ctx.fillStyle = '#72826a';
          if (axis === 'x') { ctx.textAlign = 'center'; ctx.fillText(formatNumber(value), point, height - 12); }
          else { ctx.textAlign = 'right'; ctx.fillText(formatNumber(value), padding.left - 8, point + 3); }
        }
      }
      ctx.fillStyle = '#46694a'; ctx.textAlign = 'left'; ctx.fillText('y', 13, 17); ctx.textAlign = 'right'; ctx.fillText('x', width - 9, height - 12);
      ctx.save(); ctx.beginPath(); ctx.rect(padding.left, padding.top, width - padding.left - padding.right, height - padding.top - padding.bottom); ctx.clip();
      ctx.strokeStyle = '#39754b'; ctx.lineWidth = 2.3; ctx.lineJoin = 'round';
      for (const segment of segments) {
        ctx.beginPath(); segment.forEach((point, i) => { const y = Math.max(-height * 10, Math.min(height * 10, py(point.y))); if (i === 0) ctx.moveTo(px(point.x), y); else ctx.lineTo(px(point.x), y); }); ctx.stroke();
      }
      ctx.restore();
      const visiblePoints = segments.flat().filter((point) => point.y >= range.yMin && point.y <= range.yMax).length;
      const summary = visiblePoints ? `x: ${range.xMin} ~ ${range.xMax} · y: ${range.yMin} ~ ${range.yMax} · ${graphState.angle} · 근사 그래프` : '현재 범위에 표시할 실수 함숫값이 없어요. 수식 또는 축 범위를 바꿔보세요.';
      $('#graph-summary').textContent = summary;
      canvas.setAttribute('aria-label', `y = ${expression}. ${summary}`);
      valid = true; $('#graph-download').disabled = false;
    } catch (error) { $('#graph-error').textContent = error.message; $('#graph-summary').textContent = '수식과 범위를 확인해 주세요.'; canvas.setAttribute('aria-label', '유효하지 않은 수식 또는 범위'); }
  }
  const queueDraw = () => { cancelAnimationFrame(drawing); drawing = requestAnimationFrame(draw); };
  document.querySelectorAll('.graph-controls input, .graph-controls select, .graph-range input').forEach((input) => listen(input, 'input', queueDraw));
  listen($('#graph-draw'), 'click', draw);
  listen($('#graph-expression'), 'keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); draw(); } });
  document.querySelectorAll('[data-expression]').forEach((preset) => listen(preset, 'click', () => {
    $('#graph-expression').value = preset.dataset.expression; $('#graph-angle').value = 'RAD';
    const bounds = preset.dataset.expression === 'x^2' ? [-5, 5, -2, 10] : [-10, 10, -2, 2];
    ranges.forEach((id, i) => $(`#${id}`).value = bounds[i]); draw();
  }));
  const zoom = (factor) => {
    for (let i = 0; i < 4; i += 2) {
      const a = Number($(`#${ranges[i]}`).value), b = Number($(`#${ranges[i + 1]}`).value), center = (a + b) / 2, half = (b - a) * factor / 2;
      $(`#${ranges[i]}`).value = formatNumber(center - half); $(`#${ranges[i + 1]}`).value = formatNumber(center + half);
    }
    draw();
  };
  listen($('#graph-zoom-in'), 'click', () => zoom(.5)); listen($('#graph-zoom-out'), 'click', () => zoom(2));
  listen($('#graph-reset'), 'click', () => { [-10, 10, -2, 2].forEach((value, i) => $(`#${ranges[i]}`).value = value); draw(); });
  const coordinate = (event) => {
    if (!valid || !evaluate) return;
    const rect = canvas.getBoundingClientRect(), pos = event.clientX - rect.left;
    if (pos < padding.left || pos > width - padding.right) return;
    const x = range.xMin + (pos - padding.left) / (width - padding.left - padding.right) * (range.xMax - range.xMin);
    try { $('#graph-coordinate').textContent = `x = ${formatNumber(x)}   ·   y = ${formatNumber(evaluate(x))}`; }
    catch { $('#graph-coordinate').textContent = `x = ${formatNumber(x)}   ·   y는 정의되지 않아요`; }
  };
  listen(canvas, 'pointermove', coordinate); listen(canvas, 'pointerdown', coordinate);
  listen($('#graph-download'), 'click', () => { if (!valid) return; const a = document.createElement('a'); a.download = 'simple-utils-graph.png'; a.href = canvas.toDataURL('image/png'); a.click(); });
  const observer = new ResizeObserver(queueDraw); observer.observe(canvas); draw();
  return () => { abort.abort(); observer.disconnect(); cancelAnimationFrame(drawing); };
}

export function renderLunar({ copy }) {
  const abort = new AbortController();
  const listen = (target, event, handler) => target.addEventListener(event, handler, { signal: abort.signal });
  const today = new Date();
  $('#tool-body').innerHTML = `<div class="science-toolbar"><div class="mode-switch" role="group" aria-label="음력 변환 방향"><button id="solar-to-lunar" class="active" aria-pressed="true">양력 → 음력</button><button id="lunar-to-solar" aria-pressed="false">음력 → 양력</button></div><span class="lunar-standard">한국 음력 기준 · 윤달 지원</span></div>
  <div class="lunar-layout"><div class="lunar-inputs"><h3 id="lunar-input-title">양력 날짜 입력</h3><div class="lunar-date-fields"><label>연도<input id="lunar-year" type="number" min="1000" max="2050" step="1" value="${today.getFullYear()}"></label><label>월<input id="lunar-month" type="number" min="1" max="12" step="1" value="${today.getMonth() + 1}"></label><label>일<input id="lunar-day" type="number" min="1" max="31" step="1" value="${today.getDate()}"></label></div><label class="checkbox" id="leap-label" hidden><input id="lunar-leap" type="checkbox">윤달 (음력 윤월)</label><div class="lunar-input-actions"><button id="lunar-today" class="button secondary">오늘 날짜</button><button id="lunar-convert" class="button primary">변환하기 →</button></div><p class="lunar-range">양력: 1000.02.13 ~ 2050.12.31<br>음력: 1000.01.01 ~ 2050.11.18<br>지원 범위 안의 실제 날짜만 변환할 수 있어요.</p></div>
  <div class="lunar-result-box"><span class="section-kicker" id="lunar-result-title">변환된 음력 날짜</span><output id="lunar-result" aria-live="polite"></output><span id="lunar-leap-result" class="lunar-badge"></span><p id="lunar-gapja"></p><p id="lunar-source-date"></p></div></div>
  <div class="workbench-bottom"><span id="lunar-feedback" class="helper" role="status">입력한 날짜를 한국 음력 기준으로 변환합니다.</span><button class="button primary" id="lunar-copy">결과 복사</button></div>`;
  let direction = 'solar', result, output = '';
  function update() {
    try {
      result = convertLunar({ direction, year: $('#lunar-year').value, month: $('#lunar-month').value, day: $('#lunar-day').value, leap: $('#lunar-leap').checked });
      const target = direction === 'solar' ? result.lunar : result.solar;
      $('#lunar-result').textContent = dateText(target);
      $('#lunar-leap-result').textContent = result.lunar.intercalation ? '음력 윤달' : '음력 평달';
      $('#lunar-gapja').textContent = `${result.gapja.year} ${result.gapja.month} ${result.gapja.day}`;
      $('#lunar-source-date').textContent = `${direction === 'solar' ? '양력' : '음력'} ${dateText(direction === 'solar' ? result.solar : result.lunar)}`;
      output = `양력 ${dateText(result.solar)} ↔ 음력 ${dateText(result.lunar)} (${result.lunar.intercalation ? '윤달' : '평달'})`;
      $('#lunar-feedback').textContent = '변환이 완료됐어요. 윤달과 평달을 확인해 주세요.'; $('#lunar-feedback').classList.remove('error'); $('#lunar-copy').disabled = false;
    } catch (error) {
      result = undefined; output = ''; $('#lunar-result').textContent = '—'; $('#lunar-leap-result').textContent = ''; $('#lunar-gapja').textContent = ''; $('#lunar-source-date').textContent = '';
      $('#lunar-feedback').textContent = error.message; $('#lunar-feedback').classList.add('error'); $('#lunar-copy').disabled = true;
    }
  }
  function setDirection(next) {
    const currentResult = result;
    direction = next;
    $('#solar-to-lunar').classList.toggle('active', direction === 'solar'); $('#solar-to-lunar').setAttribute('aria-pressed', String(direction === 'solar'));
    $('#lunar-to-solar').classList.toggle('active', direction === 'lunar'); $('#lunar-to-solar').setAttribute('aria-pressed', String(direction === 'lunar'));
    $('#lunar-input-title').textContent = direction === 'solar' ? '양력 날짜 입력' : '음력 날짜 입력';
    $('#lunar-result-title').textContent = direction === 'solar' ? '변환된 음력 날짜' : '변환된 양력 날짜';
    $('#leap-label').hidden = direction !== 'lunar'; $('#lunar-day').max = direction === 'solar' ? '31' : '30';
    if (currentResult) {
      const date = direction === 'solar' ? currentResult.solar : currentResult.lunar;
      $('#lunar-year').value = date.year; $('#lunar-month').value = date.month; $('#lunar-day').value = date.day; $('#lunar-leap').checked = Boolean(date.intercalation);
    }
    update();
  }
  listen($('#solar-to-lunar'), 'click', () => setDirection('solar')); listen($('#lunar-to-solar'), 'click', () => setDirection('lunar'));
  document.querySelectorAll('.lunar-inputs input').forEach((input) => { listen(input, 'input', update); listen(input, 'keydown', (event) => { if (event.key === 'Enter') update(); }); });
  listen($('#lunar-convert'), 'click', update);
  listen($('#lunar-copy'), 'click', () => copy(output));
  listen($('#lunar-today'), 'click', () => { result = undefined; setDirection('solar'); const now = new Date(); $('#lunar-year').value = now.getFullYear(); $('#lunar-month').value = now.getMonth() + 1; $('#lunar-day').value = now.getDate(); update(); });
  update(); return () => abort.abort();
}
