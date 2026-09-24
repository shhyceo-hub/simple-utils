// A bounded arithmetic grammar: no JavaScript evaluation, assignments or property access.
const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'cbrt', 'log', 'ln', 'abs', 'exp', 'floor', 'ceil', 'round']);
const checked = (value) => {
  if (!Number.isFinite(value)) throw new Error('실수 범위에서 계산할 수 없어요. 0으로 나누기와 함수의 입력 범위를 확인하세요.');
  return value;
};
function factorial(value) {
  if (!Number.isInteger(value) || value < 0 || value > 170) throw new Error('팩토리얼은 0~170 사이 정수만 계산할 수 있어요.');
  let result = 1;
  for (let i = 2; i <= value; i++) result *= i;
  return result;
}

export function compileExpression(expression, { angle = 'RAD', ans = 0, allowX = false } = {}) {
  const source = expression.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-').replaceAll('π', 'pi').replaceAll('√', 'sqrt');
  if (!source.trim()) throw new Error('계산할 식을 입력해 주세요.');
  if (source.length > 300) throw new Error('수식은 300자 이내로 입력해 주세요.');
  const tokens = [];
  for (let i = 0; i < source.length;) {
    if (/\s/.test(source[i])) { i++; continue; }
    const number = /^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i.exec(source.slice(i));
    if (number) { tokens.push({ type: 'number', value: checked(Number(number[0])) }); i += number[0].length; continue; }
    const name = /^[a-z]+/i.exec(source.slice(i));
    if (name) { tokens.push({ type: 'name', value: name[0].toLowerCase() }); i += name[0].length; continue; }
    if ('+-*/^()!%'.includes(source[i])) { tokens.push({ type: source[i], value: source[i] }); i++; continue; }
    throw new Error(`사용할 수 없는 문자예요: ${source[i]}`);
  }
  let position = 0;
  const peek = () => tokens[position]?.type;
  const take = (type) => { if (peek() === type) { position++; return true; } return false; };
  const binary = (left, right, operation) => (x) => checked(operation(left(x), right(x)));
  function sum() {
    let node = product();
    while (peek() === '+' || peek() === '-') {
      const op = tokens[position++].type, right = product();
      node = binary(node, right, op === '+' ? (a, b) => a + b : (a, b) => a - b);
    }
    return node;
  }
  function product() {
    let node = unary();
    while (peek() === '*' || peek() === '/' || peek() === '(' || peek() === 'name') {
      const op = peek() === '*' || peek() === '/' ? tokens[position++].type : '*';
      const right = unary();
      node = binary(node, right, op === '*' ? (a, b) => a * b : (a, b) => a / b);
    }
    return node;
  }
  function unary() {
    if (take('+')) return unary();
    if (take('-')) { const node = unary(); return (x) => -node(x); }
    return power();
  }
  function power() {
    let node = postfix();
    if (take('^')) node = binary(node, unary(), (a, b) => a ** b);
    return node;
  }
  function postfix() {
    let node = primary();
    while (peek() === '!' || peek() === '%') {
      const op = tokens[position++].type, previous = node;
      node = op === '!' ? (x) => factorial(previous(x)) : (x) => previous(x) / 100;
    }
    return node;
  }
  function primary() {
    if (take('(')) { const node = sum(); if (!take(')')) throw new Error('닫는 괄호 )를 확인해 주세요.'); return node; }
    const token = tokens[position++];
    if (!token) throw new Error('수식이 끝나지 않았어요. 숫자나 함수를 추가해 주세요.');
    if (token.type === 'number') return () => token.value;
    if (token.type !== 'name') throw new Error('숫자·함수·괄호의 순서를 확인해 주세요.');
    if (token.value === 'pi') return () => Math.PI;
    if (token.value === 'e') return () => Math.E;
    if (token.value === 'ans') return () => checked(ans);
    if (token.value === 'x' && allowX) return (x) => checked(x);
    if (!FUNCTIONS.has(token.value)) throw new Error(`지원하지 않는 이름이에요: ${token.value}`);
    if (!take('(')) throw new Error('함수는 sin(30)처럼 괄호와 함께 입력해 주세요.');
    const input = sum();
    if (!take(')')) throw new Error('함수의 닫는 괄호 )가 필요해요.');
    return (x) => {
      const a = input(x), radians = angle === 'DEG' ? a * Math.PI / 180 : a;
      if (token.value === 'tan' && Math.abs(Math.cos(radians)) < 1e-14) throw new Error('이 각도에서는 tan 값을 정의할 수 없어요.');
      let result;
      if (['sin', 'cos', 'tan'].includes(token.value)) result = Math[token.value](radians);
      else if (['asin', 'acos', 'atan'].includes(token.value)) result = Math[token.value](a) * (angle === 'DEG' ? 180 / Math.PI : 1);
      else if (token.value === 'log') result = Math.log10(a);
      else if (token.value === 'ln') result = Math.log(a);
      else result = Math[token.value](a);
      return checked(result);
    };
  }
  const evaluate = sum();
  if (position !== tokens.length) throw new Error('수식의 괄호나 연산 기호를 확인해 주세요.');
  return (x = 0) => checked(evaluate(x));
}

export const calculate = (expression, options) => compileExpression(expression, options)();
export const formatNumber = (value) => Object.is(value, -0) ? '0' : String(Number(value.toPrecision(12)));

export function graphSegments(evaluate, { xMin, xMax, yMin, yMax }, count = 1000) {
  if (![xMin, xMax, yMin, yMax].every(Number.isFinite) || xMin >= xMax || yMin >= yMax) throw new Error('각 축의 최솟값은 최댓값보다 작아야 해요.');
  if ([xMin, xMax, yMin, yMax].some((v) => Math.abs(v) > 1e6) || xMax - xMin < 1e-6 || yMax - yMin < 1e-6) throw new Error('축 범위는 ±1,000,000 이내, 간격은 0.000001 이상으로 설정해 주세요.');
  const segments = []; let segment = [], previous;
  const safe = (x) => { try { return evaluate(x); } catch { return NaN; } };
  for (let i = 0; i <= count; i++) {
    const x = xMin + (xMax - xMin) * i / count, y = safe(x);
    // Break at undefined points and sharp midpoint deviations around asymptotes.
    const middle = previous ? safe((x + previous.x) / 2) : y;
    const discontinuous = previous && (!Number.isFinite(middle) || Math.abs(middle - (y + previous.y) / 2) > (yMax - yMin) / 2 || Math.abs(y - previous.y) > (yMax - yMin) * 2);
    if (!Number.isFinite(y) || discontinuous) {
      if (segment.length) segments.push(segment);
      segment = []; previous = undefined;
    }
    if (Number.isFinite(y)) { segment.push({ x, y }); previous = { x, y }; }
  }
  if (segment.length) segments.push(segment);
  return segments;
}
