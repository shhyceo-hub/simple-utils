import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, compileExpression, formatNumber, graphSegments } from '../src/scientific.js';
import { convertLunar } from '../src/lunar.js';

test('calculator precedence, unary minus, right-associative powers and implicit multiplication', () => {
  assert.equal(calculate('2+3*4'), 14);
  assert.equal(calculate('(2+3)*4'), 20);
  assert.equal(calculate('-2^2'), -4);
  assert.equal(calculate('(-2)^2'), 4);
  assert.equal(calculate('2^-2'), .25);
  assert.equal(calculate('2^3^2'), 512);
  assert.equal(calculate('2(3+4)'), 14);
  assert.equal(calculate('3! + 50%'), 6.5);
  assert.equal(calculate('2×3−4÷2'), 4);
  assert.equal(calculate('1e-3 + 1E3'), 1000.001);
  assert.equal(calculate('2pi'), 2 * Math.PI);
});
test('scientific functions respect angle mode and real number domain', () => {
  assert.ok(Math.abs(calculate('sin(30)', { angle: 'DEG' }) - .5) < 1e-12);
  assert.equal(calculate('sin(pi/2)'), 1);
  assert.ok(Math.abs(calculate('asin(0.5)', { angle: 'DEG' }) - 30) < 1e-12);
  assert.equal(calculate('log(1000)+ln(e)+sqrt(9)+abs(-2)'), 9);
  assert.equal(calculate('ans*3', { ans: 7 }), 21);
  assert.equal(formatNumber(calculate('0.1+0.2')), '0.3');
  for (const expression of ['1/0','sqrt(-1)','ln(0)','(-1)!','171!','1e999','2^1024']) assert.throws(() => calculate(expression));
  assert.throws(() => calculate('tan(90)', { angle: 'DEG' }));
});
test('only bounded arithmetic expressions are accepted', () => {
  for (const expression of ['window.alert(1)', 'constructor(1)', 'x=2', '[1,2]', '1;2', '2 3', 'sin()', '(2+3', '', 'x+1', '1+'.repeat(160)]) assert.throws(() => calculate(expression));
  assert.equal(compileExpression('2x^2+1', { allowX: true })(3), 19);
});
test('graph separates undefined regions and poles and validates viewport', () => {
  const range = { xMin: -10, xMax: 10, yMin: -5, yMax: 5 };
  const reciprocal = graphSegments(compileExpression('1/x', { allowX: true }), range);
  assert.ok(reciprocal.length >= 2);
  assert.ok(reciprocal.every((segment) => !segment.some((p) => p.x < 0) || !segment.some((p) => p.x > 0)));
  const root = graphSegments(compileExpression('sqrt(x)', { allowX: true }), range);
  assert.ok(root.flat().every((p) => p.x >= 0));
  assert.throws(() => graphSegments((x) => x, { ...range, xMin: 20 }));
  assert.throws(() => graphSegments((x) => x, { ...range, yMax: Infinity }));
});
test('Korean calendar converts known new year and Chuseok dates in both directions', () => {
  const newYear = convertLunar({ year: 2026, month: 2, day: 17 });
  assert.deepEqual(newYear.lunar, { year: 2026, month: 1, day: 1, intercalation: false });
  const chuseok = convertLunar({ direction: 'lunar', year: 2026, month: 8, day: 15 });
  assert.equal(chuseok.solar.year, 2026); assert.equal(chuseok.solar.month, 9); assert.equal(chuseok.solar.day, 25);
  // KASI 2026 calendar: March 19 is lunar February 1.
  assert.equal(convertLunar({ year: 2026, month: 3, day: 19 }).lunar.day, 1);
  assert.equal(convertLunar({ year: 2026, month: 3, day: 19 }).lunar.month, 2);
});
test('leap months are distinguished and invalid dates never reuse old conversion', () => {
  const leap = convertLunar({ year: 2017, month: 6, day: 24 });
  assert.deepEqual(leap.lunar, { year: 2017, month: 5, day: 1, intercalation: true });
  const back = convertLunar({ direction: 'lunar', year: 2017, month: 5, day: 1, leap: true });
  assert.equal(back.solar.month, 6); assert.equal(back.solar.day, 24);
  assert.throws(() => convertLunar({ direction: 'lunar', year: 2026, month: 1, day: 1, leap: true }));
  assert.throws(() => convertLunar({ year: 2026, month: 2, day: 30 }));
  assert.throws(() => convertLunar({ year: 2051, month: 1, day: 1 }));
  assert.throws(() => convertLunar({ year: '', month: 1, day: 1 }));
  assert.throws(() => convertLunar({ year: 2026, month: 1.5, day: 1 }));
  assert.equal(convertLunar({ year: 2050, month: 12, day: 31 }).lunar.day, 18);
});
