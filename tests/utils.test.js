import test from 'node:test';
import assert from 'node:assert/strict';
import { countText, cleanText, uniqueLines, convertList, dateDifference, percentage, formatJSON, parseTSV, convertTable } from '../src/utils.js';

test('counts Korean, combined emoji and CRLF consistently', () => {
  assert.deepEqual(countText('안녕 👨‍👩‍👧‍👦\r\nA'), { characters: 6, noSpaces: 4, words: 3, lines: 2, bytes: 34 });
  assert.deepEqual(countText(''), { characters: 0, noSpaces: 0, words: 0, lines: 0, bytes: 0 });
});
test('cleanup preserves paragraphs unless blank removal selected', () => {
  assert.equal(cleanText('  가   나 \r\n\r\n 다 '), '가 나\n\n다');
  assert.equal(cleanText(' 가\n \n나 ', { trim: true, spaces: true, empty: true }), '가\n나');
});
test('deduplication uses comparison options and preserves first occurrence', () => {
  assert.equal(uniqueLines(' Apple \napple\nBanana\n Apple \n', { trim: true, ignoreCase: true }), 'Apple\nBanana');
  assert.equal(uniqueLines('a\nA'), 'a\nA');
  assert.equal(uniqueLines('   \n'), '');
});
test('list ignores blank lines and generates Markdown tasks', () => {
  assert.equal(convertList('회의\n\n 보고'), '1. 회의\n2. 보고');
  assert.equal(convertList('회의\n보고', 'check'), '- [ ] 회의\n- [ ] 보고');
});
test('dates support leap day, inclusive end and exclude weekends', () => {
  assert.deepEqual(dateDifference('2024-02-28', '2024-03-01'), { days: 2, weekdays: 2, weekends: 0 });
  assert.deepEqual(dateDifference('2026-09-18', '2026-09-21'), { days: 3, weekdays: 1, weekends: 2 });
  assert.deepEqual(dateDifference('2026-09-18', '2026-09-21', true), { days: 4, weekdays: 2, weekends: 2 });
  assert.deepEqual(dateDifference('2026-09-19', '2026-09-19'), { days: 0, weekdays: 0, weekends: 0 });
  assert.throws(() => dateDifference('2026-09-23', '2026-09-22'));
  assert.throws(() => dateDifference('2026-02-30', '2026-03-02'));
});
test('percentage modes handle zero, negatives and invalid input', () => {
  assert.equal(percentage(100000, 15), 15000);
  assert.equal(percentage(25, 100, 'ratio'), 25);
  assert.equal(percentage(100, 80, 'change'), -20);
  assert.equal(percentage(-100, -50, 'change'), 50);
  assert.throws(() => percentage(0, 1, 'change'));
  assert.throws(() => percentage('', 1));
  assert.throws(() => percentage(1, 0, 'ratio'));
});
test('JSON invalid syntax throws and valid primitive is supported', () => {
  assert.equal(formatJSON('{"a":1}'), '{\n  "a": 1\n}');
  assert.equal(formatJSON('null'), 'null');
  assert.throws(() => formatJSON('{bad}'));
});
test('table handles Excel quoted multiline cells, trailing rows and CSV quoting', () => {
  assert.deepEqual(parseTSV('제목\t설명\n문서\t"첫 줄\n둘째 줄"\n'), [['제목', '설명'], ['문서', '첫 줄\n둘째 줄']]);
  assert.equal(convertTable('이름\t메모\n김\t"a,b"', 'csv'), '이름,메모\n김,"a,b"');
  assert.equal(convertTable('A\tB\nx|y\t<script>'), '| A | B |\n| --- | --- |\n| x\\|y | &lt;script&gt; |');
  assert.throws(() => parseTSV('a\t"unclosed'));
});
