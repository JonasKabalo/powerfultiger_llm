/**
 * Extended offline tool implementations for PowerfulTiger.
 * ~120 tools across math, text, date, code/dev, finance, science, and fun.
 */

import type { Tool } from 'ollama';

// ═══════════════════════════════════════════════════════════════════════════════
// MATH TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

export function toolStatistics(args: Record<string, unknown>): string {
  const nums = args.numbers as number[];
  if (!nums?.length) return JSON.stringify({ error: 'numbers array required' });
  const sorted = [...nums].sort((a, b) => a - b);
  const n = nums.length;
  const mean = nums.reduce((s, x) => s + x, 0) / n;
  const variance = nums.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const mode = (() => {
    const freq: Record<number, number> = {};
    for (const x of nums) freq[x] = (freq[x] ?? 0) + 1;
    const max = Math.max(...Object.values(freq));
    return Object.keys(freq).filter(k => freq[+k] === max).map(Number);
  })();
  return JSON.stringify({ count: n, sum: nums.reduce((s, x) => s + x, 0), mean: +mean.toFixed(6), median, mode, min: sorted[0], max: sorted[n - 1], range: sorted[n - 1] - sorted[0], std_dev: +Math.sqrt(variance).toFixed(6), variance: +variance.toFixed(6) });
}

export function toolPrimeCheck(args: Record<string, unknown>): string {
  const n = Number(args.number);
  if (!Number.isInteger(n) || n < 2) return JSON.stringify({ number: n, is_prime: false });
  if (n === 2) return JSON.stringify({ number: n, is_prime: true });
  if (n % 2 === 0) return JSON.stringify({ number: n, is_prime: false });
  for (let i = 3; i <= Math.sqrt(n); i += 2) if (n % i === 0) return JSON.stringify({ number: n, is_prime: false });
  return JSON.stringify({ number: n, is_prime: true });
}

export function toolPrimeFactorize(args: Record<string, unknown>): string {
  let n = Math.abs(Number(args.number));
  if (!Number.isInteger(n) || n < 2) return JSON.stringify({ error: 'Enter an integer ≥ 2' });
  const factors: number[] = [];
  for (let d = 2; d * d <= n; d++) while (n % d === 0) { factors.push(d); n /= d; }
  if (n > 1) factors.push(n);
  return JSON.stringify({ number: args.number, factors, factorization: factors.join(' × ') });
}

export function toolNumberBaseConvert(args: Record<string, unknown>): string {
  const value = String(args.value);
  const from = Number(args.from_base ?? 10);
  const to = Number(args.to_base ?? 2);
  try {
    const decimal = parseInt(value, from);
    if (isNaN(decimal)) return JSON.stringify({ error: `Cannot parse "${value}" in base ${from}` });
    return JSON.stringify({ input: value, from_base: from, to_base: to, result: decimal.toString(to).toUpperCase(), decimal });
  } catch { return JSON.stringify({ error: 'Conversion failed' }); }
}

export function toolFibonacci(args: Record<string, unknown>): string {
  const n = Number(args.n);
  if (!Number.isInteger(n) || n < 0 || n > 80) return JSON.stringify({ error: 'n must be 0–80' });
  const seq: number[] = [0, 1];
  for (let i = 2; i <= n; i++) seq.push(seq[i - 1] + seq[i - 2]);
  return JSON.stringify({ n, value: seq[n], sequence: seq.slice(0, Math.min(n + 1, 20)) });
}

export function toolFactorial(args: Record<string, unknown>): string {
  const n = Number(args.n);
  if (!Number.isInteger(n) || n < 0 || n > 20) return JSON.stringify({ error: 'n must be 0–20' });
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return JSON.stringify({ n, factorial: result });
}

export function toolGCDLCM(args: Record<string, unknown>): string {
  const a = Math.abs(Number(args.a)), b = Math.abs(Number(args.b));
  if (!Number.isInteger(a) || !Number.isInteger(b)) return JSON.stringify({ error: 'Both a and b must be integers' });
  const gcd = (x: number, y: number): number => y === 0 ? x : gcd(y, x % y);
  const g = gcd(a, b);
  return JSON.stringify({ a, b, gcd: g, lcm: (a * b) / g });
}

export function toolPercentageCalc(args: Record<string, unknown>): string {
  const mode = String(args.mode ?? 'of');
  const a = Number(args.a), b = Number(args.b);
  if (mode === 'of') return JSON.stringify({ result: (a / 100) * b, expression: `${a}% of ${b}` });
  if (mode === 'what_percent') return JSON.stringify({ result: +(a / b * 100).toFixed(4), expression: `${a} is what % of ${b}` });
  if (mode === 'change') return JSON.stringify({ result: +((b - a) / a * 100).toFixed(4), expression: `% change from ${a} to ${b}`, direction: b >= a ? 'increase' : 'decrease' });
  return JSON.stringify({ error: 'mode must be: of, what_percent, change' });
}

export function toolRomanNumerals(args: Record<string, unknown>): string {
  const mode = String(args.mode ?? 'to_roman');
  if (mode === 'to_roman') {
    let n = Number(args.value);
    if (n < 1 || n > 3999) return JSON.stringify({ error: 'Value must be 1–3999' });
    const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
    const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
    let roman = '';
    for (let i = 0; i < vals.length; i++) while (n >= vals[i]) { roman += syms[i]; n -= vals[i]; }
    return JSON.stringify({ input: args.value, roman });
  }
  const roman = String(args.value).toUpperCase();
  const map: Record<string,number> = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
  let result = 0;
  for (let i = 0; i < roman.length; i++) {
    const cur = map[roman[i]], next = map[roman[i+1]];
    result += cur < next ? -cur : cur;
  }
  return JSON.stringify({ input: roman, value: result });
}

export function toolCombinations(args: Record<string, unknown>): string {
  const n = Number(args.n), r = Number(args.r);
  if (!Number.isInteger(n) || !Number.isInteger(r) || r > n || r < 0) return JSON.stringify({ error: 'Invalid n or r' });
  const factorial = (x: number) => { let f = 1; for (let i = 2; i <= x; i++) f *= i; return f; };
  const c = factorial(n) / (factorial(r) * factorial(n - r));
  const p = factorial(n) / factorial(n - r);
  return JSON.stringify({ n, r, combinations_C: c, permutations_P: p });
}

export function toolAreaCalc(args: Record<string, unknown>): string {
  const shape = String(args.shape).toLowerCase();
  const d = args as Record<string, number>;
  if (shape === 'circle') return JSON.stringify({ shape, radius: d.radius, area: +(Math.PI * d.radius ** 2).toFixed(6), circumference: +(2 * Math.PI * d.radius).toFixed(6) });
  if (shape === 'rectangle') return JSON.stringify({ shape, width: d.width, height: d.height, area: +(d.width * d.height).toFixed(6), perimeter: +(2 * (d.width + d.height)).toFixed(6) });
  if (shape === 'triangle') return JSON.stringify({ shape, base: d.base, height: d.height, area: +(0.5 * d.base * d.height).toFixed(6) });
  if (shape === 'square') return JSON.stringify({ shape, side: d.side, area: +(d.side ** 2).toFixed(6), perimeter: +(4 * d.side).toFixed(6) });
  if (shape === 'ellipse') return JSON.stringify({ shape, a: d.a, b: d.b, area: +(Math.PI * d.a * d.b).toFixed(6) });
  if (shape === 'trapezoid') return JSON.stringify({ shape, area: +(0.5 * (d.a + d.b) * d.height).toFixed(6) });
  return JSON.stringify({ error: 'shape must be: circle, rectangle, triangle, square, ellipse, trapezoid' });
}

export function toolVolumeCalc(args: Record<string, unknown>): string {
  const shape = String(args.shape).toLowerCase();
  const d = args as Record<string, number>;
  if (shape === 'sphere') return JSON.stringify({ shape, radius: d.radius, volume: +((4/3) * Math.PI * d.radius ** 3).toFixed(6), surface_area: +(4 * Math.PI * d.radius ** 2).toFixed(6) });
  if (shape === 'cube') return JSON.stringify({ shape, side: d.side, volume: +(d.side ** 3).toFixed(6), surface_area: +(6 * d.side ** 2).toFixed(6) });
  if (shape === 'cylinder') return JSON.stringify({ shape, volume: +(Math.PI * d.radius ** 2 * d.height).toFixed(6), surface_area: +(2 * Math.PI * d.radius * (d.radius + d.height)).toFixed(6) });
  if (shape === 'cone') return JSON.stringify({ shape, volume: +((1/3) * Math.PI * d.radius ** 2 * d.height).toFixed(6) });
  if (shape === 'box') return JSON.stringify({ shape, volume: +(d.width * d.height * d.depth).toFixed(6) });
  if (shape === 'pyramid') return JSON.stringify({ shape, volume: +((1/3) * d.base_area * d.height).toFixed(6) });
  return JSON.stringify({ error: 'shape must be: sphere, cube, cylinder, cone, box, pyramid' });
}

export function toolQuadraticSolver(args: Record<string, unknown>): string {
  const a = Number(args.a), b = Number(args.b), c = Number(args.c);
  const disc = b * b - 4 * a * c;
  if (disc > 0) return JSON.stringify({ a, b, c, discriminant: disc, roots: [(-b + Math.sqrt(disc)) / (2*a), (-b - Math.sqrt(disc)) / (2*a)], type: 'two real roots' });
  if (disc === 0) return JSON.stringify({ a, b, c, discriminant: 0, roots: [-b / (2*a)], type: 'one repeated root' });
  return JSON.stringify({ a, b, c, discriminant: disc, roots: [`${(-b / (2*a)).toFixed(4)} + ${(Math.sqrt(-disc) / (2*a)).toFixed(4)}i`, `${(-b / (2*a)).toFixed(4)} - ${(Math.sqrt(-disc) / (2*a)).toFixed(4)}i`], type: 'complex roots' });
}

export function toolNumberInfo(args: Record<string, unknown>): string {
  const n = Number(args.number);
  const isPrime = (x: number) => { if (x < 2) return false; for (let i = 2; i <= Math.sqrt(x); i++) if (x % i === 0) return false; return true; };
  return JSON.stringify({
    number: n, is_integer: Number.isInteger(n), is_prime: Number.isInteger(n) && isPrime(n),
    is_even: Number.isInteger(n) && n % 2 === 0, is_negative: n < 0, is_zero: n === 0,
    absolute_value: Math.abs(n), square: n ** 2, square_root: n >= 0 ? +Math.sqrt(n).toFixed(8) : 'undefined',
    cube: n ** 3, log2: n > 0 ? +Math.log2(n).toFixed(8) : 'undefined', log10: n > 0 ? +Math.log10(n).toFixed(8) : 'undefined',
    binary: Number.isInteger(n) && n >= 0 ? n.toString(2) : 'N/A', hex: Number.isInteger(n) && n >= 0 ? n.toString(16).toUpperCase() : 'N/A',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

export function toolFindReplace(args: Record<string, unknown>): string {
  const text = String(args.text), find = String(args.find), replace = String(args.replace ?? '');
  const useRegex = Boolean(args.use_regex);
  const caseSensitive = args.case_sensitive !== false;
  let result: string, count = 0;
  if (useRegex) {
    const flags = caseSensitive ? 'g' : 'gi';
    const re = new RegExp(find, flags);
    result = text.replace(re, () => { count++; return replace; });
  } else {
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = caseSensitive ? 'g' : 'gi';
    result = text.replace(new RegExp(escaped, flags), () => { count++; return replace; });
  }
  return JSON.stringify({ original_length: text.length, result_length: result.length, replacements: count, result });
}

export function toolIsPalindrome(args: Record<string, unknown>): string {
  const text = String(args.text);
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  const reversed = clean.split('').reverse().join('');
  return JSON.stringify({ text, is_palindrome: clean === reversed, cleaned: clean });
}

export function toolLoremIpsum(args: Record<string, unknown>): string {
  const count = Math.min(Number(args.count ?? 1), 10);
  const type = String(args.type ?? 'paragraphs');
  const words = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');
  const sentence = () => { const len = 8 + Math.floor(Math.random() * 10); return words.slice(0, len).join(' ') + '.'; };
  const paragraph = () => Array.from({ length: 4 + Math.floor(Math.random() * 4) }, sentence).join(' ');
  if (type === 'words') return JSON.stringify({ result: words.slice(0, count).join(' ') });
  if (type === 'sentences') return JSON.stringify({ result: Array.from({ length: count }, sentence).join(' ') });
  return JSON.stringify({ result: Array.from({ length: count }, paragraph).join('\n\n') });
}

export function toolStripHtml(args: Record<string, unknown>): string {
  const html = String(args.html);
  const text = html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return JSON.stringify({ original_length: html.length, result_length: text.length, text });
}

export function toolCharFrequency(args: Record<string, unknown>): string {
  const text = String(args.text);
  const freq: Record<string, number> = {};
  for (const ch of text) freq[ch] = (freq[ch] ?? 0) + 1;
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);
  return JSON.stringify({ length: text.length, unique_chars: Object.keys(freq).length, top: Object.fromEntries(sorted) });
}

export function toolWordFrequency(args: Record<string, unknown>): string {
  const text = String(args.text);
  const stopwords = new Set(['the','a','an','is','it','in','on','at','to','of','and','or','but','not','with','this','that','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','can','for','from','by','as','its','their','there','they']);
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 1 && !stopwords.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] ?? 0) + 1;
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);
  return JSON.stringify({ total_words: words.length, unique_words: Object.keys(freq).length, top: Object.fromEntries(sorted) });
}

export function toolLevenshtein(args: Record<string, unknown>): string {
  const a = String(args.a), b = String(args.b);
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  const dist = dp[m][n];
  const similarity = +((1 - dist / Math.max(m, n)) * 100).toFixed(2);
  return JSON.stringify({ a, b, distance: dist, similarity_percent: similarity });
}

export function toolRegexTest(args: Record<string, unknown>): string {
  const pattern = String(args.pattern), text = String(args.text), flags = String(args.flags ?? 'g');
  try {
    const re = new RegExp(pattern, flags);
    const matches = [...text.matchAll(new RegExp(pattern, flags.includes('g') ? flags : flags + 'g'))];
    return JSON.stringify({ pattern, flags, matches_found: matches.length, matches: matches.map(m => ({ match: m[0], index: m.index, groups: m.groups ?? {} })).slice(0, 20), test: re.test(text) });
  } catch (e) { return JSON.stringify({ error: String(e) }); }
}

export function toolSlugGenerate(args: Record<string, unknown>): string {
  const text = String(args.text);
  const slug = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
  return JSON.stringify({ input: text, slug });
}

export function toolIsAnagram(args: Record<string, unknown>): string {
  const a = String(args.a).toLowerCase().replace(/\s/g, '');
  const b = String(args.b).toLowerCase().replace(/\s/g, '');
  const sort = (s: string) => s.split('').sort().join('');
  return JSON.stringify({ a: args.a, b: args.b, is_anagram: sort(a) === sort(b) });
}

export function toolRot13(args: Record<string, unknown>): string {
  const text = String(args.text);
  const result = text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
  return JSON.stringify({ input: text, result, note: 'ROT-13 is its own inverse' });
}

export function toolNatoPhonetic(args: Record<string, unknown>): string {
  const nato: Record<string, string> = { A:'Alpha',B:'Bravo',C:'Charlie',D:'Delta',E:'Echo',F:'Foxtrot',G:'Golf',H:'Hotel',I:'India',J:'Juliet',K:'Kilo',L:'Lima',M:'Mike',N:'November',O:'Oscar',P:'Papa',Q:'Quebec',R:'Romeo',S:'Sierra',T:'Tango',U:'Uniform',V:'Victor',W:'Whiskey',X:'X-ray',Y:'Yankee',Z:'Zulu' };
  const text = String(args.text).toUpperCase();
  const words = [...text].map(c => nato[c] ?? (c === ' ' ? '(space)' : c));
  return JSON.stringify({ input: args.text, phonetic: words.join(' ') });
}

export function toolExtractEmails(args: Record<string, unknown>): string {
  const text = String(args.text);
  const emails = [...text.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)].map(m => m[0]);
  return JSON.stringify({ count: emails.length, emails: [...new Set(emails)] });
}

export function toolExtractPhones(args: Record<string, unknown>): string {
  const text = String(args.text);
  const phones = [...text.matchAll(/(\+?\d[\d\s\-().]{7,}\d)/g)].map(m => m[0].trim());
  return JSON.stringify({ count: phones.length, phones: [...new Set(phones)] });
}

export function toolWrapText(args: Record<string, unknown>): string {
  const text = String(args.text), width = Number(args.width ?? 80);
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    if (para.length <= width) { lines.push(para); continue; }
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > width) { if (line) lines.push(line); line = w; }
      else { line = (line + ' ' + w).trim(); }
    }
    if (line) lines.push(line);
  }
  return JSON.stringify({ result: lines.join('\n'), lines: lines.length });
}

export function toolTemplateFill(args: Record<string, unknown>): string {
  const template = String(args.template);
  const vars = args.variables as Record<string, string> ?? {};
  const result = template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
  const missing = [...template.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]).filter(k => !(k in vars));
  return JSON.stringify({ result, missing_vars: missing });
}

export function toolDiffText(args: Record<string, unknown>): string {
  const a = String(args.a).split('\n'), b = String(args.b).split('\n');
  const added = b.filter(l => !a.includes(l)).map(l => `+ ${l}`);
  const removed = a.filter(l => !b.includes(l)).map(l => `- ${l}`);
  return JSON.stringify({ added_lines: added.length, removed_lines: removed.length, changes: [...removed, ...added].slice(0, 50) });
}

export function toolPigLatin(args: Record<string, unknown>): string {
  const text = String(args.text);
  const vowels = 'aeiouAEIOU';
  const word = (w: string) => {
    if (!w.match(/[a-zA-Z]/)) return w;
    if (vowels.includes(w[0])) return w + 'ay';
    let i = 0; while (i < w.length && !vowels.includes(w[i])) i++;
    return w.slice(i) + w.slice(0, i) + 'ay';
  };
  return JSON.stringify({ input: text, result: text.split(' ').map(word).join(' ') });
}

export function toolSplitText(args: Record<string, unknown>): string {
  const text = String(args.text), delimiter = String(args.delimiter ?? '\n');
  const parts = text.split(delimiter).filter(s => args.remove_empty ? s.trim() !== '' : true);
  return JSON.stringify({ parts, count: parts.length });
}

export function toolJoinText(args: Record<string, unknown>): string {
  const parts = args.parts as string[];
  const delimiter = String(args.delimiter ?? ', ');
  if (!Array.isArray(parts)) return JSON.stringify({ error: 'parts must be an array of strings' });
  return JSON.stringify({ result: parts.join(delimiter), count: parts.length });
}

export function toolCountSubstring(args: Record<string, unknown>): string {
  const text = String(args.text), sub = String(args.substring);
  const caseSensitive = args.case_sensitive !== false;
  const haystack = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? sub : sub.toLowerCase();
  let count = 0, pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) { count++; pos++; }
  return JSON.stringify({ text_length: text.length, substring: sub, count });
}

export function toolPadString(args: Record<string, unknown>): string {
  const text = String(args.text), length = Number(args.length), char = String(args.char ?? ' '), side = String(args.side ?? 'right');
  const result = side === 'left' ? text.padStart(length, char) : side === 'both' ? text.padStart(Math.ceil((length + text.length) / 2), char).padEnd(length, char) : text.padEnd(length, char);
  return JSON.stringify({ input: text, result, length: result.length });
}

export function toolTruncateText(args: Record<string, unknown>): string {
  const text = String(args.text), max = Number(args.max_length ?? 100), ellipsis = String(args.ellipsis ?? '…');
  if (text.length <= max) return JSON.stringify({ result: text, truncated: false });
  return JSON.stringify({ result: text.slice(0, max - ellipsis.length) + ellipsis, truncated: true, original_length: text.length });
}

export function toolRepeatText(args: Record<string, unknown>): string {
  const text = String(args.text), times = Math.min(Number(args.times ?? 2), 100), separator = String(args.separator ?? '');
  return JSON.stringify({ result: Array(times).fill(text).join(separator) });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATE TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

export function toolWeekNumber(args: Record<string, unknown>): string {
  const d = new Date(String(args.date ?? new Date().toISOString()));
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return JSON.stringify({ date: d.toISOString().slice(0,10), week_number: week, day_of_week: dayNames[d.getDay()], day_of_year: Math.ceil((d.getTime() - start.getTime()) / 86400000) + 1 });
}

export function toolIsLeapYear(args: Record<string, unknown>): string {
  const year = Number(args.year ?? new Date().getFullYear());
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return JSON.stringify({ year, is_leap_year: isLeap, days_in_year: isLeap ? 366 : 365 });
}

export function toolDaysInMonth(args: Record<string, unknown>): string {
  const year = Number(args.year ?? new Date().getFullYear()), month = Number(args.month ?? new Date().getMonth() + 1);
  const days = new Date(year, month, 0).getDate();
  const monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  return JSON.stringify({ year, month, month_name: monthNames[month], days_in_month: days });
}

export function toolWorkingDays(args: Record<string, unknown>): string {
  const start = new Date(String(args.start)), end = new Date(String(args.end));
  let days = 0, cur = new Date(start);
  while (cur <= end) { const d = cur.getDay(); if (d !== 0 && d !== 6) days++; cur.setDate(cur.getDate() + 1); }
  const total = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return JSON.stringify({ start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10), total_days: total, working_days: days, weekend_days: total - days });
}

export function toolQuarterOfYear(args: Record<string, unknown>): string {
  const d = new Date(String(args.date ?? new Date().toISOString()));
  const month = d.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  const quarterStart = new Date(d.getFullYear(), (quarter - 1) * 3, 1);
  const quarterEnd = new Date(d.getFullYear(), quarter * 3, 0);
  return JSON.stringify({ date: d.toISOString().slice(0,10), quarter: `Q${quarter}`, quarter_start: quarterStart.toISOString().slice(0,10), quarter_end: quarterEnd.toISOString().slice(0,10) });
}

export function toolAgeCalc(args: Record<string, unknown>): string {
  const birth = new Date(String(args.birthdate));
  const ref = args.as_of ? new Date(String(args.as_of)) : new Date();
  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && ref.getDate() < birth.getDate())) { years--; months += 12; }
  const days = Math.floor((ref.getTime() - birth.getTime()) / 86400000);
  return JSON.stringify({ birthdate: birth.toISOString().slice(0,10), as_of: ref.toISOString().slice(0,10), age_years: years, age_months: months, total_days: days });
}

export function toolIsWeekend(args: Record<string, unknown>): string {
  const d = new Date(String(args.date ?? new Date().toISOString()));
  const day = d.getDay();
  return JSON.stringify({ date: d.toISOString().slice(0,10), day_name: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][day], is_weekend: day === 0 || day === 6 });
}

export function toolZodiacSign(args: Record<string, unknown>): string {
  const d = new Date(String(args.date ?? new Date().toISOString()));
  const m = d.getMonth() + 1, day = d.getDate();
  const signs = [[1,20,'Aquarius'],[2,19,'Pisces'],[3,21,'Aries'],[4,20,'Taurus'],[5,21,'Gemini'],[6,21,'Cancer'],[7,23,'Leo'],[8,23,'Virgo'],[9,23,'Libra'],[10,23,'Scorpio'],[11,22,'Sagittarius'],[12,22,'Capricorn']];
  const sign = signs.find(([sm, sd]) => m === sm && day < (sd as number)) ? signs[(signs.findIndex(([sm]) => m === sm) + 11) % 12][2] : signs[signs.findIndex(([sm]) => m === sm)][2];
  return JSON.stringify({ date: d.toISOString().slice(0,10), zodiac_sign: sign });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CODE / DEV TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

export function toolParseURL(args: Record<string, unknown>): string {
  try {
    const u = new URL(String(args.url));
    const params: Record<string, string> = {};
    u.searchParams.forEach((v, k) => { params[k] = v; });
    return JSON.stringify({ protocol: u.protocol, host: u.host, hostname: u.hostname, port: u.port || null, pathname: u.pathname, search: u.search || null, hash: u.hash || null, params, origin: u.origin });
  } catch { return JSON.stringify({ error: 'Invalid URL' }); }
}

export function toolBuildURL(args: Record<string, unknown>): string {
  try {
    const base = String(args.base), params = (args.params as Record<string, string>) ?? {};
    const u = new URL(base);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    if (args.path) u.pathname = String(args.path);
    if (args.hash) u.hash = String(args.hash);
    return JSON.stringify({ url: u.toString() });
  } catch { return JSON.stringify({ error: 'Invalid base URL' }); }
}

export function toolHTTPStatusInfo(args: Record<string, unknown>): string {
  const code = Number(args.code);
  const statuses: Record<number, [string, string]> = {
    100:['Continue','Request received, continue process'], 200:['OK','Success'], 201:['Created','Resource created'], 204:['No Content','Success with no body'],
    301:['Moved Permanently','Redirect permanently'], 302:['Found','Redirect temporarily'], 304:['Not Modified','Cached resource valid'],
    400:['Bad Request','Invalid request syntax'], 401:['Unauthorized','Authentication required'], 403:['Forbidden','No permission'], 404:['Not Found','Resource not found'], 405:['Method Not Allowed','HTTP method not allowed'], 408:['Request Timeout','Server timed out waiting'], 409:['Conflict','Request conflict with current state'], 422:['Unprocessable Entity','Validation error'], 429:['Too Many Requests','Rate limit exceeded'],
    500:['Internal Server Error','Generic server error'], 502:['Bad Gateway','Invalid upstream response'], 503:['Service Unavailable','Server down or overloaded'], 504:['Gateway Timeout','Upstream timeout'],
  };
  const [name, description] = statuses[code] ?? ['Unknown', 'Unknown status code'];
  const category = code < 200 ? 'Informational' : code < 300 ? 'Success' : code < 400 ? 'Redirection' : code < 500 ? 'Client Error' : 'Server Error';
  return JSON.stringify({ code, name, description, category });
}

export function toolJWTDecode(args: Record<string, unknown>): string {
  try {
    const token = String(args.token).split('.');
    if (token.length !== 3) return JSON.stringify({ error: 'Not a valid JWT (needs 3 parts)' });
    const decode = (s: string) => JSON.parse(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'));
    const header = decode(token[0]), payload = decode(token[1]);
    const now = Math.floor(Date.now() / 1000);
    const expired = payload.exp ? payload.exp < now : null;
    return JSON.stringify({ header, payload, signature_present: true, expired, expires_at: payload.exp ? new Date(payload.exp * 1000).toISOString() : null, issued_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : null, warning: 'Signature NOT verified — decode only' });
  } catch { return JSON.stringify({ error: 'Failed to decode JWT' }); }
}

export function toolCSVToJSON(args: Record<string, unknown>): string {
  const csv = String(args.csv);
  const delimiter = String(args.delimiter ?? ',');
  const lines = csv.trim().split('\n').map(l => l.split(delimiter).map(c => c.trim().replace(/^"|"$/g, '')));
  if (lines.length === 0) return JSON.stringify({ error: 'Empty CSV' });
  const headers = lines[0];
  const rows = lines.slice(1).map(row => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])));
  return JSON.stringify({ headers, rows, count: rows.length });
}

export function toolJSONToCSV(args: Record<string, unknown>): string {
  const rows = args.rows as Record<string, unknown>[];
  if (!Array.isArray(rows) || rows.length === 0) return JSON.stringify({ error: 'rows must be a non-empty array of objects' });
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  return JSON.stringify({ csv, rows: rows.length, columns: headers.length });
}

export function toolMimeType(args: Record<string, unknown>): string {
  const ext = String(args.extension).toLowerCase().replace(/^\./, '');
  const types: Record<string, string> = {
    html:'text/html', htm:'text/html', css:'text/css', js:'text/javascript', ts:'text/typescript', jsx:'text/javascript', tsx:'text/typescript',
    json:'application/json', xml:'application/xml', yaml:'text/yaml', yml:'text/yaml', toml:'text/toml', csv:'text/csv', txt:'text/plain',
    png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', svg:'image/svg+xml', webp:'image/webp', ico:'image/x-icon', avif:'image/avif',
    mp4:'video/mp4', webm:'video/webm', mov:'video/quicktime', avi:'video/x-msvideo',
    mp3:'audio/mpeg', wav:'audio/wav', ogg:'audio/ogg', flac:'audio/flac', m4a:'audio/mp4',
    pdf:'application/pdf', zip:'application/zip', gz:'application/gzip', tar:'application/x-tar', '7z':'application/x-7z-compressed',
    wasm:'application/wasm', md:'text/markdown', sh:'text/x-shellscript', py:'text/x-python', rs:'text/x-rust', go:'text/x-go', java:'text/x-java',
  };
  const mime = types[ext] ?? 'application/octet-stream';
  return JSON.stringify({ extension: ext, mime_type: mime, category: mime.split('/')[0] });
}

export function toolSubnetCalc(args: Record<string, unknown>): string {
  try {
    const [ip, prefix] = String(args.cidr).split('/');
    const bits = Number(prefix);
    if (isNaN(bits) || bits < 0 || bits > 32) return JSON.stringify({ error: 'Invalid CIDR prefix' });
    const ipNum = ip.split('.').reduce((n, o) => (n << 8) + Number(o), 0) >>> 0;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    const network = (ipNum & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const toIP = (n: number) => [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
    return JSON.stringify({ cidr: args.cidr, network_address: toIP(network), broadcast_address: toIP(broadcast), subnet_mask: toIP(mask), first_host: toIP(network+1), last_host: toIP(broadcast-1), total_hosts: Math.pow(2, 32 - bits) - 2, prefix_bits: bits });
  } catch { return JSON.stringify({ error: 'Invalid CIDR notation (e.g. 192.168.1.0/24)' }); }
}

export function toolValidateURL(args: Record<string, unknown>): string {
  const url = String(args.url);
  try {
    const u = new URL(url);
    return JSON.stringify({ url, is_valid: true, protocol: u.protocol, domain: u.hostname, has_path: u.pathname !== '/', has_query: u.search !== '', has_fragment: u.hash !== '' });
  } catch { return JSON.stringify({ url, is_valid: false, reason: 'Could not parse as URL' }); }
}

export function toolSemverCompare(args: Record<string, unknown>): string {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number);
  const a = parse(String(args.a)), b = parse(String(args.b));
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return JSON.stringify({ a: args.a, b: args.b, result: 'a > b', comparison: 1 });
    if ((a[i] ?? 0) < (b[i] ?? 0)) return JSON.stringify({ a: args.a, b: args.b, result: 'a < b', comparison: -1 });
  }
  return JSON.stringify({ a: args.a, b: args.b, result: 'equal', comparison: 0 });
}

export function toolParseQueryString(args: Record<string, unknown>): string {
  const qs = String(args.query_string).replace(/^\?/, '');
  const params: Record<string, string> = {};
  for (const part of qs.split('&')) {
    const [k, v] = part.split('=');
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
  }
  return JSON.stringify({ params, count: Object.keys(params).length });
}

export function toolBuildQueryString(args: Record<string, unknown>): string {
  const params = args.params as Record<string, string>;
  if (!params || typeof params !== 'object') return JSON.stringify({ error: 'params must be an object' });
  const qs = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  return JSON.stringify({ query_string: '?' + qs, raw: qs });
}

export function toolGenerateMarkdownTable(args: Record<string, unknown>): string {
  const headers = args.headers as string[];
  const rows = args.rows as string[][];
  if (!headers || !rows) return JSON.stringify({ error: 'headers (string[]) and rows (string[][]) required' });
  const header = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
  return JSON.stringify({ markdown: [header, sep, body].join('\n') });
}

export function toolIPToInteger(args: Record<string, unknown>): string {
  const ip = String(args.ip);
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => p < 0 || p > 255)) return JSON.stringify({ error: 'Invalid IPv4 address' });
  const integer = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
  return JSON.stringify({ ip, integer, hex: '0x' + integer.toString(16).toUpperCase().padStart(8, '0') });
}

export function toolIntegerToIP(args: Record<string, unknown>): string {
  const n = Number(args.integer) >>> 0;
  const ip = [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
  return JSON.stringify({ integer: n, ip });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCE (OFFLINE) TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

export function toolCompoundInterest(args: Record<string, unknown>): string {
  const P = Number(args.principal), r = Number(args.annual_rate) / 100, n = Number(args.compounds_per_year ?? 12), t = Number(args.years);
  const A = P * Math.pow(1 + r / n, n * t);
  const interest = A - P;
  return JSON.stringify({ principal: P, annual_rate_percent: args.annual_rate, compounds_per_year: n, years: t, final_amount: +A.toFixed(2), total_interest: +interest.toFixed(2), rate_of_return_percent: +((interest / P) * 100).toFixed(2) });
}

export function toolSimpleInterest(args: Record<string, unknown>): string {
  const P = Number(args.principal), r = Number(args.annual_rate) / 100, t = Number(args.years);
  const interest = P * r * t;
  return JSON.stringify({ principal: P, annual_rate_percent: args.annual_rate, years: t, interest: +interest.toFixed(2), total: +(P + interest).toFixed(2) });
}

export function toolLoanPayment(args: Record<string, unknown>): string {
  const P = Number(args.principal), annualRate = Number(args.annual_rate), months = Number(args.months);
  if (annualRate === 0) return JSON.stringify({ monthly_payment: +(P / months).toFixed(2), total_paid: +P.toFixed(2), total_interest: 0 });
  const r = annualRate / 100 / 12;
  const payment = P * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  const total = payment * months;
  return JSON.stringify({ principal: P, annual_rate_percent: annualRate, months, monthly_payment: +payment.toFixed(2), total_paid: +total.toFixed(2), total_interest: +(total - P).toFixed(2) });
}

export function toolROICalc(args: Record<string, unknown>): string {
  const gain = Number(args.gain), cost = Number(args.cost);
  const roi = ((gain - cost) / cost) * 100;
  const netProfit = gain - cost;
  return JSON.stringify({ gain, cost, net_profit: +netProfit.toFixed(2), roi_percent: +roi.toFixed(2) });
}

export function toolCAGR(args: Record<string, unknown>): string {
  const start = Number(args.start_value), end = Number(args.end_value), years = Number(args.years);
  const cagr = (Math.pow(end / start, 1 / years) - 1) * 100;
  return JSON.stringify({ start_value: start, end_value: end, years, cagr_percent: +cagr.toFixed(4), multiplier: +(end / start).toFixed(4) });
}

export function toolBreakEven(args: Record<string, unknown>): string {
  const fixed = Number(args.fixed_costs), price = Number(args.price_per_unit), variable = Number(args.variable_cost_per_unit);
  const contribution = price - variable;
  if (contribution <= 0) return JSON.stringify({ error: 'Price must exceed variable cost' });
  const units = fixed / contribution;
  const revenue = units * price;
  return JSON.stringify({ fixed_costs: fixed, price_per_unit: price, variable_cost_per_unit: variable, contribution_margin: +contribution.toFixed(2), break_even_units: +units.toFixed(2), break_even_revenue: +revenue.toFixed(2) });
}

export function toolNPV(args: Record<string, unknown>): string {
  const rate = Number(args.discount_rate) / 100;
  const cashflows = args.cashflows as number[];
  const initial = Number(args.initial_investment);
  if (!Array.isArray(cashflows)) return JSON.stringify({ error: 'cashflows must be an array' });
  let npv = -initial;
  const pvs = cashflows.map((cf, t) => { const pv = cf / Math.pow(1 + rate, t + 1); npv += pv; return +pv.toFixed(2); });
  return JSON.stringify({ initial_investment: initial, discount_rate_percent: args.discount_rate, cashflows, present_values: pvs, npv: +npv.toFixed(2), profitable: npv > 0 });
}

export function toolTipCalc(args: Record<string, unknown>): string {
  const bill = Number(args.bill_amount), tipPct = Number(args.tip_percent ?? 18), people = Number(args.people ?? 1);
  const tip = bill * tipPct / 100;
  const total = bill + tip;
  return JSON.stringify({ bill: +bill.toFixed(2), tip_percent: tipPct, tip_amount: +tip.toFixed(2), total: +total.toFixed(2), per_person: +(total / people).toFixed(2), people });
}

export function toolInflationCalc(args: Record<string, unknown>): string {
  const amount = Number(args.amount), rate = Number(args.annual_inflation_rate), years = Number(args.years);
  const future = amount * Math.pow(1 + rate / 100, years);
  const purchasing_power = amount / Math.pow(1 + rate / 100, years);
  return JSON.stringify({ amount, annual_rate_percent: rate, years, future_value: +future.toFixed(2), purchasing_power_today: +purchasing_power.toFixed(2), real_loss_percent: +((future - amount) / amount * 100).toFixed(2) });
}

export function toolPositionSize(args: Record<string, unknown>): string {
  const capital = Number(args.portfolio_value), risk_pct = Number(args.risk_percent ?? 1), entry = Number(args.entry_price), stop = Number(args.stop_loss_price);
  const risk_amount = capital * risk_pct / 100;
  const risk_per_share = Math.abs(entry - stop);
  if (risk_per_share === 0) return JSON.stringify({ error: 'Entry and stop loss cannot be the same price' });
  const shares = risk_amount / risk_per_share;
  return JSON.stringify({ portfolio_value: capital, risk_percent: risk_pct, risk_amount: +risk_amount.toFixed(2), entry_price: entry, stop_loss: stop, risk_per_share: +risk_per_share.toFixed(4), shares: +shares.toFixed(4), position_value: +(shares * entry).toFixed(2) });
}

export function toolPERatio(args: Record<string, unknown>): string {
  const price = Number(args.price), eps = Number(args.eps);
  if (eps === 0) return JSON.stringify({ error: 'EPS cannot be zero' });
  const pe = price / eps;
  return JSON.stringify({ price, eps, pe_ratio: +pe.toFixed(2), implied_eps_growth: pe > 25 ? 'High growth expected' : pe > 15 ? 'Moderate growth' : 'Value / low growth' });
}

export function toolMarketCap(args: Record<string, unknown>): string {
  const price = Number(args.price), shares = Number(args.shares_outstanding);
  const mc = price * shares;
  const category = mc >= 200e9 ? 'Mega-cap' : mc >= 10e9 ? 'Large-cap' : mc >= 2e9 ? 'Mid-cap' : mc >= 300e6 ? 'Small-cap' : 'Micro-cap';
  return JSON.stringify({ price, shares_outstanding: shares, market_cap: +mc.toFixed(0), market_cap_formatted: mc >= 1e9 ? `$${(mc/1e9).toFixed(2)}B` : `$${(mc/1e6).toFixed(2)}M`, category });
}

export function toolDollarCostAvg(args: Record<string, unknown>): string {
  const prices = args.prices as number[];
  const amount = Number(args.amount_per_period ?? 100);
  if (!Array.isArray(prices) || prices.length === 0) return JSON.stringify({ error: 'prices array required' });
  let totalShares = 0, totalInvested = 0;
  const purchases = prices.map((p, i) => { const shares = amount / p; totalShares += shares; totalInvested += amount; return { period: i + 1, price: p, shares_bought: +shares.toFixed(4), cumulative_shares: +totalShares.toFixed(4) }; });
  const avgCost = totalInvested / totalShares;
  const currentPrice = prices[prices.length - 1];
  return JSON.stringify({ periods: prices.length, amount_per_period: amount, total_invested: +totalInvested.toFixed(2), total_shares: +totalShares.toFixed(4), average_cost_per_share: +avgCost.toFixed(4), current_price: currentPrice, current_value: +(totalShares * currentPrice).toFixed(2), gain_loss: +((totalShares * currentPrice) - totalInvested).toFixed(2), purchases });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCIENCE & HEALTH TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

export function toolBMICalc(args: Record<string, unknown>): string {
  const weight = Number(args.weight_kg), height = Number(args.height_cm) / 100;
  const bmi = weight / (height * height);
  const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obese';
  return JSON.stringify({ weight_kg: weight, height_cm: args.height_cm, bmi: +bmi.toFixed(2), category, healthy_range: '18.5 – 24.9' });
}

export function toolBMRCalc(args: Record<string, unknown>): string {
  const w = Number(args.weight_kg), h = Number(args.height_cm), age = Number(args.age);
  const sex = String(args.sex ?? 'male').toLowerCase();
  const bmr = sex === 'female' ? 655 + (9.563 * w) + (1.850 * h) - (4.676 * age) : 66 + (13.397 * w) + (5.003 * h) - (6.752 * age);
  const multipliers: Record<string, [number, string]> = { sedentary:[1.2,'Little/no exercise'], light:[1.375,'Light exercise 1-3d/wk'], moderate:[1.55,'Moderate 3-5d/wk'], active:[1.725,'Hard exercise 6-7d/wk'], very_active:[1.9,'Very hard/physical job'] };
  const tdee = Object.fromEntries(Object.entries(multipliers).map(([k,[m,l]]) => [k, { tdee: +(bmr * m).toFixed(0), description: l }]));
  return JSON.stringify({ weight_kg: w, height_cm: h, age, sex, bmr_calories: +bmr.toFixed(0), tdee_by_activity: tdee });
}

export function toolTargetHeartRate(args: Record<string, unknown>): string {
  const age = Number(args.age), resting = Number(args.resting_hr ?? 70);
  const maxHR = 220 - age;
  const hrr = maxHR - resting;
  const zones: Record<string, [number, number, string]> = {
    fat_burn: [0.5, 0.6, 'Fat burn zone'], aerobic: [0.6, 0.7, 'Aerobic zone'], cardio: [0.7, 0.85, 'Cardio zone'], peak: [0.85, 1.0, 'Peak / VO2 max'],
  };
  return JSON.stringify({ age, max_heart_rate: maxHR, resting_hr: resting, heart_rate_reserve: hrr, training_zones: Object.fromEntries(Object.entries(zones).map(([k,[lo,hi,label]]) => [k, { label, low: Math.round(resting + hrr * lo), high: Math.round(resting + hrr * hi) }])) });
}

export function toolOhmLaw(args: Record<string, unknown>): string {
  const V = args.voltage !== undefined ? Number(args.voltage) : undefined;
  const I = args.current !== undefined ? Number(args.current) : undefined;
  const R = args.resistance !== undefined ? Number(args.resistance) : undefined;
  if (V !== undefined && I !== undefined) return JSON.stringify({ voltage: V, current: I, resistance: +(V / I).toFixed(6), power_watts: +(V * I).toFixed(6) });
  if (V !== undefined && R !== undefined) return JSON.stringify({ voltage: V, resistance: R, current: +(V / R).toFixed(6), power_watts: +(V * V / R).toFixed(6) });
  if (I !== undefined && R !== undefined) return JSON.stringify({ current: I, resistance: R, voltage: +(I * R).toFixed(6), power_watts: +(I * I * R).toFixed(6) });
  return JSON.stringify({ error: 'Provide any two of: voltage, current, resistance' });
}

export function toolPythagorean(args: Record<string, unknown>): string {
  const a = args.a !== undefined ? Number(args.a) : undefined;
  const b = args.b !== undefined ? Number(args.b) : undefined;
  const c = args.c !== undefined ? Number(args.c) : undefined;
  if (a !== undefined && b !== undefined) return JSON.stringify({ a, b, c: +Math.sqrt(a*a + b*b).toFixed(8), verified: true });
  if (a !== undefined && c !== undefined) return JSON.stringify({ a, c, b: +Math.sqrt(c*c - a*a).toFixed(8) });
  if (b !== undefined && c !== undefined) return JSON.stringify({ b, c, a: +Math.sqrt(c*c - b*b).toFixed(8) });
  return JSON.stringify({ error: 'Provide any two of: a, b, c' });
}

export function toolSpeedDistanceTime(args: Record<string, unknown>): string {
  const s = args.speed !== undefined ? Number(args.speed) : undefined;
  const d = args.distance !== undefined ? Number(args.distance) : undefined;
  const t = args.time !== undefined ? Number(args.time) : undefined;
  const units = String(args.units ?? '');
  if (s !== undefined && t !== undefined) return JSON.stringify({ speed: s, time: t, distance: +(s * t).toFixed(6), units });
  if (d !== undefined && t !== undefined) return JSON.stringify({ distance: d, time: t, speed: +(d / t).toFixed(6), units });
  if (d !== undefined && s !== undefined) return JSON.stringify({ distance: d, speed: s, time: +(d / s).toFixed(6), units });
  return JSON.stringify({ error: 'Provide any two of: speed, distance, time' });
}

export function toolPeriodicTable(args: Record<string, unknown>): string {
  const elements: Record<string, { name: string; atomic_number: number; atomic_mass: number; category: string; period: number; group: number }> = {
    H:{name:'Hydrogen',atomic_number:1,atomic_mass:1.008,category:'nonmetal',period:1,group:1}, He:{name:'Helium',atomic_number:2,atomic_mass:4.003,category:'noble gas',period:1,group:18},
    Li:{name:'Lithium',atomic_number:3,atomic_mass:6.941,category:'alkali metal',period:2,group:1}, C:{name:'Carbon',atomic_number:6,atomic_mass:12.011,category:'nonmetal',period:2,group:14},
    N:{name:'Nitrogen',atomic_number:7,atomic_mass:14.007,category:'nonmetal',period:2,group:15}, O:{name:'Oxygen',atomic_number:8,atomic_mass:15.999,category:'nonmetal',period:2,group:16},
    Na:{name:'Sodium',atomic_number:11,atomic_mass:22.990,category:'alkali metal',period:3,group:1}, Mg:{name:'Magnesium',atomic_number:12,atomic_mass:24.305,category:'alkaline earth',period:3,group:2},
    Al:{name:'Aluminum',atomic_number:13,atomic_mass:26.982,category:'post-transition metal',period:3,group:13}, Si:{name:'Silicon',atomic_number:14,atomic_mass:28.086,category:'metalloid',period:3,group:14},
    Fe:{name:'Iron',atomic_number:26,atomic_mass:55.845,category:'transition metal',period:4,group:8}, Cu:{name:'Copper',atomic_number:29,atomic_mass:63.546,category:'transition metal',period:4,group:11},
    Zn:{name:'Zinc',atomic_number:30,atomic_mass:65.38,category:'transition metal',period:4,group:12}, Ag:{name:'Silver',atomic_number:47,atomic_mass:107.868,category:'transition metal',period:5,group:11},
    Au:{name:'Gold',atomic_number:79,atomic_mass:196.967,category:'transition metal',period:6,group:11}, Pt:{name:'Platinum',atomic_number:78,atomic_mass:195.084,category:'transition metal',period:6,group:10},
    Pb:{name:'Lead',atomic_number:82,atomic_mass:207.2,category:'post-transition metal',period:6,group:14}, U:{name:'Uranium',atomic_number:92,atomic_mass:238.029,category:'actinide',period:7,group:3},
  };
  const query = String(args.element).trim();
  const bySymbol = elements[query] ?? elements[query.charAt(0).toUpperCase() + query.slice(1)];
  const byName = Object.entries(elements).find(([,v]) => v.name.toLowerCase() === query.toLowerCase());
  const found = bySymbol ? { symbol: Object.keys(elements).find(k => elements[k] === bySymbol), ...bySymbol } : byName ? { symbol: byName[0], ...byName[1] } : null;
  if (!found) return JSON.stringify({ error: `Element "${query}" not found. Try symbol (H, Fe, Au) or name (Hydrogen, Iron, Gold)` });
  return JSON.stringify(found);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUN TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

export function toolFlipCoin(args: Record<string, unknown>): string {
  const times = Math.min(Number(args.times ?? 1), 100);
  const results = Array.from({ length: times }, () => Math.random() < 0.5 ? 'Heads' : 'Tails');
  const heads = results.filter(r => r === 'Heads').length;
  return JSON.stringify({ flips: times, results: times <= 20 ? results : results.slice(0, 20), heads, tails: times - heads });
}

export function toolRollDice(args: Record<string, unknown>): string {
  const sides = Number(args.sides ?? 6), count = Math.min(Number(args.count ?? 1), 20);
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  return JSON.stringify({ dice: `${count}d${sides}`, rolls, total: rolls.reduce((s, r) => s + r, 0), min: Math.min(...rolls), max: Math.max(...rolls) });
}

export function toolMagic8Ball(args: Record<string, unknown>): string {
  const responses = ['It is certain','It is decidedly so','Without a doubt','Yes definitely','You may rely on it','As I see it yes','Most likely','Outlook good','Yes','Signs point to yes','Reply hazy try again','Ask again later','Better not tell you now','Cannot predict now','Concentrate and ask again','Don\'t count on it','My reply is no','My sources say no','Outlook not so good','Very doubtful'];
  return JSON.stringify({ question: args.question ?? '?', answer: responses[Math.floor(Math.random() * responses.length)] });
}

export function toolRandomColor(_args: Record<string, unknown>): string {
  const r = Math.floor(Math.random() * 256), g = Math.floor(Math.random() * 256), b = Math.floor(Math.random() * 256);
  const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  const h = (r / 255 * 360 + g / 255 * 120 + b / 255 * 240) % 360;
  return JSON.stringify({ hex, rgb: `rgb(${r}, ${g}, ${b})`, r, g, b, hue: Math.round(h) });
}

export function toolChineseZodiac(args: Record<string, unknown>): string {
  const year = Number(args.year ?? new Date().getFullYear());
  const animals = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
  const elements = ['Wood','Fire','Earth','Metal','Water'];
  const animal = animals[(year - 4) % 12];
  const element = elements[Math.floor((year - 4) % 10 / 2)];
  return JSON.stringify({ year, animal, element, sign: `${element} ${animal}` });
}

export function toolLuhnCheck(args: Record<string, unknown>): string {
  const number = String(args.number).replace(/\D/g, '');
  let sum = 0;
  for (let i = 0; i < number.length; i++) {
    let d = Number(number[number.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  const valid = sum % 10 === 0;
  const type = number.startsWith('4') ? 'Visa' : number.startsWith('5') ? 'Mastercard' : number.startsWith('3') ? 'Amex' : number.startsWith('6') ? 'Discover' : 'Unknown';
  return JSON.stringify({ number: number.slice(0, 4) + '...' + number.slice(-4), valid, card_type: type });
}

export function toolPasswordStrength(args: Record<string, unknown>): string {
  const pwd = String(args.password);
  const checks = { length: pwd.length >= 12, uppercase: /[A-Z]/.test(pwd), lowercase: /[a-z]/.test(pwd), numbers: /\d/.test(pwd), symbols: /[^a-zA-Z0-9]/.test(pwd), no_common: !['password','123456','qwerty','letmein','admin','welcome'].some(w => pwd.toLowerCase().includes(w)) };
  const score = Object.values(checks).filter(Boolean).length;
  const strength = score <= 2 ? 'Weak' : score <= 4 ? 'Fair' : score <= 5 ? 'Strong' : 'Very Strong';
  return JSON.stringify({ length: pwd.length, strength, score: `${score}/6`, checks, entropy_bits: +(pwd.length * Math.log2(94)).toFixed(1) });
}

export function toolPlayingCard(_args: Record<string, unknown>): string {
  const suits = ['♠ Spades','♥ Hearts','♦ Diamonds','♣ Clubs'];
  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const suit = suits[Math.floor(Math.random() * 4)];
  const rank = ranks[Math.floor(Math.random() * 13)];
  return JSON.stringify({ card: `${rank} of ${suit}`, rank, suit, value: ['2','3','4','5','6','7','8','9','10'].includes(rank) ? Number(rank) : rank === 'A' ? 11 : 10 });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const OFFLINE_TOOLS_EXTENDED: Tool[] = [
  // MATH
  { type:'function', function:{ name:'statistics', description:'Compute statistics for a list of numbers: mean, median, mode, std dev, variance, min, max.', parameters:{ type:'object', required:['numbers'], properties:{ numbers:{ type:'array', items:{type:'number'}, description:'Array of numbers' } } } } },
  { type:'function', function:{ name:'prime_check', description:'Check whether an integer is prime.', parameters:{ type:'object', required:['number'], properties:{ number:{ type:'number', description:'Integer to check' } } } } },
  { type:'function', function:{ name:'prime_factorize', description:'Find the prime factorization of a positive integer.', parameters:{ type:'object', required:['number'], properties:{ number:{ type:'number', description:'Integer ≥ 2' } } } } },
  { type:'function', function:{ name:'number_base_convert', description:'Convert a number from one base to another (binary, octal, decimal, hex).', parameters:{ type:'object', required:['value'], properties:{ value:{ type:'string', description:'Number as string' }, from_base:{ type:'number', description:'Source base (2-36). Default 10.' }, to_base:{ type:'number', description:'Target base (2-36). Default 2.' } } } } },
  { type:'function', function:{ name:'fibonacci', description:'Get the nth Fibonacci number and the sequence up to n (max n=80).', parameters:{ type:'object', required:['n'], properties:{ n:{ type:'number', description:'Index (0–80)' } } } } },
  { type:'function', function:{ name:'factorial', description:'Compute n! (factorial). n must be 0–20.', parameters:{ type:'object', required:['n'], properties:{ n:{ type:'number', description:'Non-negative integer 0–20' } } } } },
  { type:'function', function:{ name:'gcd_lcm', description:'Compute greatest common divisor and least common multiple of two integers.', parameters:{ type:'object', required:['a','b'], properties:{ a:{ type:'number' }, b:{ type:'number' } } } } },
  { type:'function', function:{ name:'percentage_calc', description:'Percentage calculations: X% of Y, X is what % of Y, or % change from A to B.', parameters:{ type:'object', required:['a','b','mode'], properties:{ a:{ type:'number' }, b:{ type:'number' }, mode:{ type:'string', description:'of | what_percent | change' } } } } },
  { type:'function', function:{ name:'roman_numerals', description:'Convert between Arabic numbers and Roman numerals.', parameters:{ type:'object', required:['value','mode'], properties:{ value:{ type:'string' }, mode:{ type:'string', description:'to_roman | from_roman' } } } } },
  { type:'function', function:{ name:'combinations', description:'Calculate combinations C(n,r) and permutations P(n,r).', parameters:{ type:'object', required:['n','r'], properties:{ n:{ type:'number' }, r:{ type:'number' } } } } },
  { type:'function', function:{ name:'area_calc', description:'Calculate area of geometric shapes: circle, rectangle, triangle, square, ellipse, trapezoid.', parameters:{ type:'object', required:['shape'], properties:{ shape:{ type:'string' }, radius:{ type:'number' }, width:{ type:'number' }, height:{ type:'number' }, base:{ type:'number' }, side:{ type:'number' }, a:{ type:'number' }, b:{ type:'number' } } } } },
  { type:'function', function:{ name:'volume_calc', description:'Calculate volume of 3D shapes: sphere, cube, cylinder, cone, box, pyramid.', parameters:{ type:'object', required:['shape'], properties:{ shape:{ type:'string' }, radius:{ type:'number' }, side:{ type:'number' }, height:{ type:'number' }, width:{ type:'number' }, depth:{ type:'number' }, base_area:{ type:'number' } } } } },
  { type:'function', function:{ name:'quadratic_solver', description:'Solve quadratic equation ax² + bx + c = 0. Returns real or complex roots.', parameters:{ type:'object', required:['a','b','c'], properties:{ a:{ type:'number' }, b:{ type:'number' }, c:{ type:'number' } } } } },
  { type:'function', function:{ name:'number_info', description:'Get detailed info about a number: prime, even/odd, square, cube, log, binary, hex.', parameters:{ type:'object', required:['number'], properties:{ number:{ type:'number' } } } } },
  // TEXT
  { type:'function', function:{ name:'find_replace', description:'Find and replace text, optionally with regex.', parameters:{ type:'object', required:['text','find'], properties:{ text:{ type:'string' }, find:{ type:'string' }, replace:{ type:'string' }, use_regex:{ type:'boolean' }, case_sensitive:{ type:'boolean' } } } } },
  { type:'function', function:{ name:'is_palindrome', description:'Check if a word or phrase is a palindrome.', parameters:{ type:'object', required:['text'], properties:{ text:{ type:'string' } } } } },
  { type:'function', function:{ name:'lorem_ipsum', description:'Generate Lorem Ipsum placeholder text (words, sentences, or paragraphs).', parameters:{ type:'object', required:[], properties:{ count:{ type:'number', description:'How many (max 10)' }, type:{ type:'string', description:'words | sentences | paragraphs' } } } } },
  { type:'function', function:{ name:'strip_html', description:'Remove HTML tags and decode HTML entities from a string.', parameters:{ type:'object', required:['html'], properties:{ html:{ type:'string' } } } } },
  { type:'function', function:{ name:'char_frequency', description:'Count the frequency of each character in text.', parameters:{ type:'object', required:['text'], properties:{ text:{ type:'string' } } } } },
  { type:'function', function:{ name:'word_frequency', description:'Count the most frequent words in text (excluding common stopwords).', parameters:{ type:'object', required:['text'], properties:{ text:{ type:'string' } } } } },
  { type:'function', function:{ name:'levenshtein', description:'Calculate edit distance and similarity percentage between two strings.', parameters:{ type:'object', required:['a','b'], properties:{ a:{ type:'string' }, b:{ type:'string' } } } } },
  { type:'function', function:{ name:'regex_test', description:'Test a regex pattern against text and return all matches.', parameters:{ type:'object', required:['pattern','text'], properties:{ pattern:{ type:'string' }, text:{ type:'string' }, flags:{ type:'string', description:'Regex flags, e.g. gi. Default: g' } } } } },
  { type:'function', function:{ name:'slug_generate', description:'Convert a title or phrase into a URL-safe slug.', parameters:{ type:'object', required:['text'], properties:{ text:{ type:'string' } } } } },
  { type:'function', function:{ name:'is_anagram', description:'Check if two words or phrases are anagrams of each other.', parameters:{ type:'object', required:['a','b'], properties:{ a:{ type:'string' }, b:{ type:'string' } } } } },
  { type:'function', function:{ name:'rot13', description:'Encode or decode text using ROT-13 cipher.', parameters:{ type:'object', required:['text'], properties:{ text:{ type:'string' } } } } },
  { type:'function', function:{ name:'nato_phonetic', description:'Spell out text using the NATO phonetic alphabet (Alpha, Bravo, Charlie…).', parameters:{ type:'object', required:['text'], properties:{ text:{ type:'string' } } } } },
  { type:'function', function:{ name:'extract_emails', description:'Extract all email addresses from a block of text.', parameters:{ type:'object', required:['text'], properties:{ text:{ type:'string' } } } } },
  { type:'function', function:{ name:'extract_phones', description:'Extract all phone numbers from a block of text.', parameters:{ type:'object', required:['text'], properties:{ text:{ type:'string' } } } } },
  { type:'function', function:{ name:'wrap_text', description:'Word-wrap text to a specified line width.', parameters:{ type:'object', required:['text'], properties:{ text:{ type:'string' }, width:{ type:'number', description:'Max chars per line. Default 80.' } } } } },
  { type:'function', function:{ name:'template_fill', description:'Fill a Handlebars-style template {{variable}} with provided values.', parameters:{ type:'object', required:['template','variables'], properties:{ template:{ type:'string' }, variables:{ type:'object', description:'Key-value pairs to substitute' } } } } },
  { type:'function', function:{ name:'diff_text', description:'Show added and removed lines when comparing two texts.', parameters:{ type:'object', required:['a','b'], properties:{ a:{ type:'string', description:'Original text' }, b:{ type:'string', description:'New text' } } } } },
  { type:'function', function:{ name:'pig_latin', description:'Translate English text into Pig Latin.', parameters:{ type:'object', required:['text'], properties:{ text:{ type:'string' } } } } },
  { type:'function', function:{ name:'split_text', description:'Split text by a delimiter into an array of parts.', parameters:{ type:'object', required:['text'], properties:{ text:{ type:'string' }, delimiter:{ type:'string' }, remove_empty:{ type:'boolean' } } } } },
  { type:'function', function:{ name:'join_text', description:'Join an array of strings with a delimiter.', parameters:{ type:'object', required:['parts'], properties:{ parts:{ type:'array', items:{type:'string'} }, delimiter:{ type:'string' } } } } },
  { type:'function', function:{ name:'count_substring', description:'Count how many times a substring appears in text.', parameters:{ type:'object', required:['text','substring'], properties:{ text:{ type:'string' }, substring:{ type:'string' }, case_sensitive:{ type:'boolean' } } } } },
  { type:'function', function:{ name:'pad_string', description:'Pad a string to a given length on the left, right, or both sides.', parameters:{ type:'object', required:['text','length'], properties:{ text:{ type:'string' }, length:{ type:'number' }, char:{ type:'string', description:'Padding character. Default space.' }, side:{ type:'string', description:'left | right | both' } } } } },
  { type:'function', function:{ name:'truncate_text', description:'Truncate text to a maximum length with an ellipsis.', parameters:{ type:'object', required:['text'], properties:{ text:{ type:'string' }, max_length:{ type:'number', description:'Default 100' }, ellipsis:{ type:'string', description:'Default …' } } } } },
  { type:'function', function:{ name:'repeat_text', description:'Repeat a string N times with an optional separator.', parameters:{ type:'object', required:['text'], properties:{ text:{ type:'string' }, times:{ type:'number', description:'Max 100' }, separator:{ type:'string' } } } } },
  // DATE
  { type:'function', function:{ name:'week_number', description:'Get the ISO week number, day of week, and day of year for a date.', parameters:{ type:'object', required:[], properties:{ date:{ type:'string', description:'ISO date. Default: today.' } } } } },
  { type:'function', function:{ name:'is_leap_year', description:'Check if a year is a leap year.', parameters:{ type:'object', required:[], properties:{ year:{ type:'number', description:'Year. Default: current year.' } } } } },
  { type:'function', function:{ name:'days_in_month', description:'Get the number of days in a specific month and year.', parameters:{ type:'object', required:[], properties:{ month:{ type:'number', description:'1–12' }, year:{ type:'number' } } } } },
  { type:'function', function:{ name:'working_days', description:'Count working days (Mon–Fri) between two dates.', parameters:{ type:'object', required:['start','end'], properties:{ start:{ type:'string', description:'ISO date' }, end:{ type:'string', description:'ISO date' } } } } },
  { type:'function', function:{ name:'quarter_of_year', description:'Get the fiscal quarter (Q1–Q4) for a date with quarter start/end dates.', parameters:{ type:'object', required:[], properties:{ date:{ type:'string', description:'ISO date. Default: today.' } } } } },
  { type:'function', function:{ name:'age_calc', description:'Calculate age in years, months, and total days from a birthdate.', parameters:{ type:'object', required:['birthdate'], properties:{ birthdate:{ type:'string', description:'ISO date' }, as_of:{ type:'string', description:'Reference date. Default: today.' } } } } },
  { type:'function', function:{ name:'is_weekend', description:'Check if a date falls on a weekend (Saturday or Sunday).', parameters:{ type:'object', required:[], properties:{ date:{ type:'string', description:'ISO date. Default: today.' } } } } },
  { type:'function', function:{ name:'zodiac_sign', description:'Get the Western zodiac sign for a date.', parameters:{ type:'object', required:[], properties:{ date:{ type:'string', description:'ISO date or birthday. Default: today.' } } } } },
  // CODE/DEV
  { type:'function', function:{ name:'parse_url', description:'Parse a URL into its components: protocol, host, path, query params, fragment.', parameters:{ type:'object', required:['url'], properties:{ url:{ type:'string' } } } } },
  { type:'function', function:{ name:'build_url', description:'Build a URL from a base, path, query params, and fragment.', parameters:{ type:'object', required:['base'], properties:{ base:{ type:'string' }, path:{ type:'string' }, params:{ type:'object' }, hash:{ type:'string' } } } } },
  { type:'function', function:{ name:'http_status_info', description:'Get the meaning of an HTTP status code (200, 404, 500, etc.).', parameters:{ type:'object', required:['code'], properties:{ code:{ type:'number' } } } } },
  { type:'function', function:{ name:'jwt_decode', description:'Decode a JWT token and show header and payload (does NOT verify signature).', parameters:{ type:'object', required:['token'], properties:{ token:{ type:'string' } } } } },
  { type:'function', function:{ name:'csv_to_json', description:'Convert CSV text to a JSON array of objects.', parameters:{ type:'object', required:['csv'], properties:{ csv:{ type:'string' }, delimiter:{ type:'string', description:'Default comma' } } } } },
  { type:'function', function:{ name:'json_to_csv', description:'Convert a JSON array of objects to CSV text.', parameters:{ type:'object', required:['rows'], properties:{ rows:{ type:'array', items:{type:'object'} } } } } },
  { type:'function', function:{ name:'mime_type', description:'Get the MIME type for a file extension.', parameters:{ type:'object', required:['extension'], properties:{ extension:{ type:'string', description:'e.g. "png", "js", ".pdf"' } } } } },
  { type:'function', function:{ name:'subnet_calc', description:'Calculate subnet details from CIDR notation (e.g. 192.168.1.0/24).', parameters:{ type:'object', required:['cidr'], properties:{ cidr:{ type:'string' } } } } },
  { type:'function', function:{ name:'validate_url', description:'Check if a URL is valid and parse its components.', parameters:{ type:'object', required:['url'], properties:{ url:{ type:'string' } } } } },
  { type:'function', function:{ name:'semver_compare', description:'Compare two semantic version strings (e.g. 1.2.3 vs 2.0.0).', parameters:{ type:'object', required:['a','b'], properties:{ a:{ type:'string' }, b:{ type:'string' } } } } },
  { type:'function', function:{ name:'parse_query_string', description:'Parse a URL query string into a key-value object.', parameters:{ type:'object', required:['query_string'], properties:{ query_string:{ type:'string', description:'e.g. "?foo=1&bar=hello"' } } } } },
  { type:'function', function:{ name:'build_query_string', description:'Build a URL query string from a key-value object.', parameters:{ type:'object', required:['params'], properties:{ params:{ type:'object', description:'Key-value pairs' } } } } },
  { type:'function', function:{ name:'generate_markdown_table', description:'Generate a Markdown table from headers and rows.', parameters:{ type:'object', required:['headers','rows'], properties:{ headers:{ type:'array', items:{type:'string'} }, rows:{ type:'array', items:{type:'array', items:{type:'string'}} } } } } },
  { type:'function', function:{ name:'ip_to_integer', description:'Convert an IPv4 address to its integer representation.', parameters:{ type:'object', required:['ip'], properties:{ ip:{ type:'string' } } } } },
  { type:'function', function:{ name:'integer_to_ip', description:'Convert an integer to an IPv4 address.', parameters:{ type:'object', required:['integer'], properties:{ integer:{ type:'number' } } } } },
  // FINANCE
  { type:'function', function:{ name:'compound_interest', description:'Calculate compound interest and final balance.', parameters:{ type:'object', required:['principal','annual_rate','years'], properties:{ principal:{ type:'number' }, annual_rate:{ type:'number', description:'Annual rate in percent, e.g. 7 for 7%' }, years:{ type:'number' }, compounds_per_year:{ type:'number', description:'Default 12 (monthly)' } } } } },
  { type:'function', function:{ name:'simple_interest', description:'Calculate simple interest (I = P × r × t).', parameters:{ type:'object', required:['principal','annual_rate','years'], properties:{ principal:{ type:'number' }, annual_rate:{ type:'number' }, years:{ type:'number' } } } } },
  { type:'function', function:{ name:'loan_payment', description:'Calculate monthly loan/mortgage payment, total paid, and total interest.', parameters:{ type:'object', required:['principal','annual_rate','months'], properties:{ principal:{ type:'number' }, annual_rate:{ type:'number' }, months:{ type:'number' } } } } },
  { type:'function', function:{ name:'roi_calc', description:'Calculate return on investment (ROI) and net profit.', parameters:{ type:'object', required:['gain','cost'], properties:{ gain:{ type:'number', description:'Final value or revenue' }, cost:{ type:'number', description:'Initial cost or investment' } } } } },
  { type:'function', function:{ name:'cagr_calc', description:'Calculate Compound Annual Growth Rate (CAGR) between two values.', parameters:{ type:'object', required:['start_value','end_value','years'], properties:{ start_value:{ type:'number' }, end_value:{ type:'number' }, years:{ type:'number' } } } } },
  { type:'function', function:{ name:'break_even', description:'Calculate break-even point in units and revenue.', parameters:{ type:'object', required:['fixed_costs','price_per_unit','variable_cost_per_unit'], properties:{ fixed_costs:{ type:'number' }, price_per_unit:{ type:'number' }, variable_cost_per_unit:{ type:'number' } } } } },
  { type:'function', function:{ name:'npv_calc', description:'Calculate Net Present Value (NPV) of future cash flows.', parameters:{ type:'object', required:['initial_investment','cashflows','discount_rate'], properties:{ initial_investment:{ type:'number' }, cashflows:{ type:'array', items:{type:'number'}, description:'Cash flows per period' }, discount_rate:{ type:'number', description:'Annual rate in percent' } } } } },
  { type:'function', function:{ name:'tip_calc', description:'Calculate tip amount, total bill, and per-person split.', parameters:{ type:'object', required:['bill_amount'], properties:{ bill_amount:{ type:'number' }, tip_percent:{ type:'number', description:'Default 18' }, people:{ type:'number', description:'Number of people splitting. Default 1.' } } } } },
  { type:'function', function:{ name:'inflation_calc', description:'Calculate how inflation erodes purchasing power over time.', parameters:{ type:'object', required:['amount','annual_inflation_rate','years'], properties:{ amount:{ type:'number' }, annual_inflation_rate:{ type:'number', description:'Percent, e.g. 3 for 3%' }, years:{ type:'number' } } } } },
  { type:'function', function:{ name:'position_size', description:'Calculate position size for a trade based on portfolio risk %.', parameters:{ type:'object', required:['portfolio_value','entry_price','stop_loss_price'], properties:{ portfolio_value:{ type:'number' }, risk_percent:{ type:'number', description:'Max risk per trade, e.g. 1 for 1%. Default 1.' }, entry_price:{ type:'number' }, stop_loss_price:{ type:'number' } } } } },
  { type:'function', function:{ name:'pe_ratio_calc', description:'Calculate P/E ratio from stock price and earnings per share.', parameters:{ type:'object', required:['price','eps'], properties:{ price:{ type:'number' }, eps:{ type:'number', description:'Earnings per share (annual)' } } } } },
  { type:'function', function:{ name:'market_cap_calc', description:'Calculate market capitalization and category (mega/large/mid/small-cap).', parameters:{ type:'object', required:['price','shares_outstanding'], properties:{ price:{ type:'number' }, shares_outstanding:{ type:'number' } } } } },
  { type:'function', function:{ name:'dollar_cost_avg', description:'Simulate dollar-cost averaging over multiple price points.', parameters:{ type:'object', required:['prices'], properties:{ prices:{ type:'array', items:{type:'number'}, description:'Asset price each period' }, amount_per_period:{ type:'number', description:'Amount to invest each period. Default 100.' } } } } },
  // SCIENCE & HEALTH
  { type:'function', function:{ name:'bmi_calc', description:'Calculate Body Mass Index (BMI) and weight category.', parameters:{ type:'object', required:['weight_kg','height_cm'], properties:{ weight_kg:{ type:'number' }, height_cm:{ type:'number' } } } } },
  { type:'function', function:{ name:'bmr_calc', description:'Calculate Basal Metabolic Rate (BMR) and TDEE for all activity levels.', parameters:{ type:'object', required:['weight_kg','height_cm','age','sex'], properties:{ weight_kg:{ type:'number' }, height_cm:{ type:'number' }, age:{ type:'number' }, sex:{ type:'string', description:'male | female' } } } } },
  { type:'function', function:{ name:'target_heart_rate', description:'Calculate target heart rate training zones based on age and resting HR.', parameters:{ type:'object', required:['age'], properties:{ age:{ type:'number' }, resting_hr:{ type:'number', description:'Resting heart rate BPM. Default 70.' } } } } },
  { type:'function', function:{ name:'ohm_law', description:'Solve Ohm\'s law: voltage = current × resistance. Provide any two values.', parameters:{ type:'object', required:[], properties:{ voltage:{ type:'number' }, current:{ type:'number' }, resistance:{ type:'number' } } } } },
  { type:'function', function:{ name:'pythagorean', description:'Solve the Pythagorean theorem: a² + b² = c². Provide any two sides.', parameters:{ type:'object', required:[], properties:{ a:{ type:'number' }, b:{ type:'number' }, c:{ type:'number' } } } } },
  { type:'function', function:{ name:'speed_distance_time', description:'Solve speed = distance / time. Provide any two of: speed, distance, time.', parameters:{ type:'object', required:[], properties:{ speed:{ type:'number' }, distance:{ type:'number' }, time:{ type:'number' }, units:{ type:'string', description:'e.g. km/h, mph, m/s' } } } } },
  { type:'function', function:{ name:'periodic_table', description:'Look up an element in the periodic table by symbol or name.', parameters:{ type:'object', required:['element'], properties:{ element:{ type:'string', description:'Symbol (H, Fe, Au) or name (Hydrogen, Iron, Gold)' } } } } },
  // FUN
  { type:'function', function:{ name:'flip_coin', description:'Flip a coin one or more times. Returns heads/tails results.', parameters:{ type:'object', required:[], properties:{ times:{ type:'number', description:'Number of flips (max 100). Default 1.' } } } } },
  { type:'function', function:{ name:'roll_dice', description:'Roll dice. Specify number of sides and how many dice.', parameters:{ type:'object', required:[], properties:{ sides:{ type:'number', description:'Sides per die (default 6)' }, count:{ type:'number', description:'Number of dice (max 20, default 1)' } } } } },
  { type:'function', function:{ name:'magic_8ball', description:'Ask the Magic 8-Ball a yes/no question.', parameters:{ type:'object', required:[], properties:{ question:{ type:'string' } } } } },
  { type:'function', function:{ name:'random_color', description:'Generate a random color in hex and RGB.', parameters:{ type:'object', required:[], properties:{} } } },
  { type:'function', function:{ name:'chinese_zodiac', description:'Get the Chinese zodiac animal and element for a year.', parameters:{ type:'object', required:[], properties:{ year:{ type:'number', description:'Year (default: current year)' } } } } },
  { type:'function', function:{ name:'luhn_check', description:'Validate a credit card number using the Luhn algorithm.', parameters:{ type:'object', required:['number'], properties:{ number:{ type:'string' } } } } },
  { type:'function', function:{ name:'password_strength', description:'Analyze the strength of a password (length, uppercase, numbers, symbols, entropy).', parameters:{ type:'object', required:['password'], properties:{ password:{ type:'string' } } } } },
  { type:'function', function:{ name:'playing_card', description:'Draw a random playing card from a standard 52-card deck.', parameters:{ type:'object', required:[], properties:{} } } },
];
