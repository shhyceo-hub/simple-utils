const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });
export const graphemeCount = (text) => [...segmenter.segment(text)].length;
export const normalizeLines = (text) => text.replace(/\r\n?/g, '\n');

export function countText(text) {
  text = normalizeLines(text);
  return {
    characters: graphemeCount(text),
    noSpaces: graphemeCount(text.replace(/\s/gu, '')),
    words: text.trim() ? text.trim().split(/\s+/u).length : 0,
    lines: text ? text.split('\n').length : 0,
    bytes: new TextEncoder().encode(text).length,
  };
}

export function cleanText(text, { trim = true, spaces = true, empty = false } = {}) {
  let lines = normalizeLines(text).split('\n');
  if (trim) lines = lines.map((line) => line.trim());
  if (spaces) lines = lines.map((line) => line.replace(/[^\S\n]+/gu, ' '));
  if (empty) lines = lines.filter((line) => line.trim());
  return lines.join('\n');
}

export function uniqueLines(text, { trim = true, ignoreCase = false, sort = false } = {}) {
  const seen = new Set();
  let lines = normalizeLines(text).split('\n').filter((line) => line.trim());
  lines = lines.filter((line) => {
    let key = trim ? line.trim() : line;
    if (ignoreCase) key = key.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((line) => trim ? line.trim() : line);
  if (sort) lines.sort((a, b) => a.localeCompare(b, 'ko'));
  return lines.join('\n');
}

export function convertList(text, mode = 'number') {
  const lines = normalizeLines(text).split('\n').map((line) => line.trim()).filter(Boolean);
  if (mode === 'comma') return lines.join(', ');
  return lines.map((line, index) => mode === 'number' ? `${index + 1}. ${line}` : mode === 'bullet' ? `• ${line}` : `- [ ] ${line}`).join('\n');
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('날짜를 정확히 선택해 주세요.');
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('유효한 날짜를 선택해 주세요.');
  return date;
}

export function dateDifference(start, end, inclusive = false) {
  const a = parseDate(start), b = parseDate(end);
  if (b < a) throw new Error('종료일은 시작일보다 빠를 수 없습니다.');
  const days = Math.round((b - a) / 86400000) + (inclusive ? 1 : 0);
  let weekdays = Math.floor(days / 7) * 5;
  for (let i = 0; i < days % 7; i++) {
    const day = (a.getUTCDay() + i) % 7;
    if (day !== 0 && day !== 6) weekdays++;
  }
  return { days, weekdays, weekends: days - weekdays };
}

export function percentage(a, b, mode = 'part') {
  if (String(a).trim() === '' || String(b).trim() === '') throw new Error('두 숫자를 모두 입력해 주세요.');
  const x = Number(a), y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('유효한 숫자를 입력해 주세요.');
  if (mode === 'ratio' && y === 0) throw new Error('전체 값은 0일 수 없습니다.');
  if (mode === 'change' && x === 0) throw new Error('기존 값이 0이면 증감률을 계산할 수 없습니다.');
  const result = mode === 'part' ? x * y / 100 : mode === 'ratio' ? x / y * 100 : (y - x) / Math.abs(x) * 100;
  if (!Number.isFinite(result)) throw new Error('계산 가능한 숫자 범위를 벗어났습니다.');
  return result;
}

export function formatJSON(text, compact = false) {
  if (!text.trim()) return '';
  return JSON.stringify(JSON.parse(text), null, compact ? 0 : 2);
}

// Excel clipboard text is TSV and may contain quoted multiline cells.
export function parseTSV(text) {
  text = normalizeLines(text);
  if (!text.trim()) return [];
  const rows = [];
  let row = [], field = '', quoted = false, atStart = true;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && atStart) { quoted = true; atStart = false; }
    else if (c === '\t') { row.push(field); field = ''; atStart = true; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; atStart = true; }
    else { field += c; atStart = false; }
  }
  if (quoted) throw new Error('닫히지 않은 따옴표가 있습니다. 표를 다시 복사해 주세요.');
  if (field !== '' || row.length || !text.endsWith('\n')) { row.push(field); rows.push(row); }
  return rows;
}

export function convertTable(text, mode = 'markdown') {
  const rows = parseTSV(text);
  if (!rows.length) return '';
  const width = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) => Array.from({ length: width }, (_, i) => row[i] ?? ''));
  if (mode === 'csv') return normalized.map((row) => row.map((cell) => /[",\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell).join(',')).join('\n');
  const escape = (cell) => cell.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\\', '\\\\').replaceAll('|', '\\|').replaceAll('\n', '<br>');
  const line = (row) => `| ${row.map(escape).join(' | ')} |`;
  return [line(normalized[0]), line(Array(width).fill('---')), ...normalized.slice(1).map(line)].join('\n');
}
