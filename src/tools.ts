/**
 * Tool implementations and definitions for PowerfulTiger.
 *
 * Tools available to the AI:
 *   get_current_time  — real clock via Intl API (no network)
 *   web_search        — DuckDuckGo instant answers + Wikipedia fallback
 *   calculate         — safe math evaluator
 */

import type { Tool } from 'ollama';

// ── Timezone helpers ──────────────────────────────────────────────────────────

const TZ_ALIASES: Record<string, string> = {
  london: 'Europe/London',
  paris: 'Europe/Paris',
  berlin: 'Europe/Berlin',
  rome: 'Europe/Rome',
  madrid: 'Europe/Madrid',
  amsterdam: 'Europe/Amsterdam',
  brussels: 'Europe/Brussels',
  zurich: 'Europe/Zurich',
  stockholm: 'Europe/Stockholm',
  oslo: 'Europe/Oslo',
  helsinki: 'Europe/Helsinki',
  moscow: 'Europe/Moscow',
  'new york': 'America/New_York',
  newyork: 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  losangeles: 'America/Los_Angeles',
  chicago: 'America/Chicago',
  toronto: 'America/Toronto',
  montreal: 'America/Montreal',
  vancouver: 'America/Vancouver',
  mexico: 'America/Mexico_City',
  'mexico city': 'America/Mexico_City',
  'sao paulo': 'America/Sao_Paulo',
  buenos_aires: 'America/Argentina/Buenos_Aires',
  dubai: 'Asia/Dubai',
  mumbai: 'Asia/Kolkata',
  delhi: 'Asia/Kolkata',
  kolkata: 'Asia/Kolkata',
  bangkok: 'Asia/Bangkok',
  singapore: 'Asia/Singapore',
  hong_kong: 'Asia/Hong_Kong',
  'hong kong': 'Asia/Hong_Kong',
  beijing: 'Asia/Shanghai',
  shanghai: 'Asia/Shanghai',
  seoul: 'Asia/Seoul',
  tokyo: 'Asia/Tokyo',
  sydney: 'Australia/Sydney',
  melbourne: 'Australia/Melbourne',
  auckland: 'Pacific/Auckland',
  utc: 'UTC',
  gmt: 'GMT',
  est: 'America/New_York',
  pst: 'America/Los_Angeles',
  cst: 'America/Chicago',
  mst: 'America/Denver',
  cet: 'Europe/Paris',
  bst: 'Europe/London',
  ist: 'Asia/Kolkata',
  jst: 'Asia/Tokyo',
  aest: 'Australia/Sydney',
};

function resolveTimezone(raw?: string): string {
  if (!raw) return Intl.DateTimeFormat().resolvedOptions().timeZone;
  const key = raw.toLowerCase().replace(/_/g, ' ').trim();
  return TZ_ALIASES[key] ?? raw;
}

// ── Tool: get_current_time ────────────────────────────────────────────────────

interface TimeArgs {
  timezone?: string;
}

export function toolGetTime(args: TimeArgs): string {
  const tz = resolveTimezone(args.timezone);
  const now = new Date();

  try {
    const dtFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });

    return JSON.stringify({
      timezone: tz,
      current_time: dtFmt.format(now),
      utc_iso: now.toISOString(),
    });
  } catch {
    return JSON.stringify({
      error: `Unknown timezone: "${args.timezone}". Use IANA format (e.g. "Europe/London") or a city name.`,
    });
  }
}

// ── Tool: web_search ──────────────────────────────────────────────────────────

interface DdgTopic {
  Text?: string;
  FirstURL?: string;
  Topics?: DdgTopic[];
}

interface DdgResponse {
  Answer?: string;
  AbstractText?: string;
  AbstractURL?: string;
  Heading?: string;
  Definition?: string;
  RelatedTopics?: DdgTopic[];
}

interface WikiSummary {
  title?: string;
  extract?: string;
}

interface SearchArgs {
  query: string;
}

/**
 * Strip question words and trailing descriptor words to extract a Wikipedia-friendly topic.
 * "What is the Eiffel Tower height?" → "Eiffel Tower"
 * "bitcoin price today" → "bitcoin"
 */
function extractWikiTopic(query: string): string {
  const topic = query
    .replace(
      /^(?:what(?:'s| is| are| was| were)?|who(?:'s| is| was| are| were)?|when(?:'s| was| did)?|where(?:'s| is| are)?|how(?:'s| does| do| did)?|why (?:does|do|did|is|are)?|tell me (?:about )?|give me (?:info (?:on|about) )?|explain |describe )\s*/i,
      '',
    )
    .replace(
      /\s+\b(?:today|now|currently|latest|recent|height|weight|price|value|cost|age|population|capital|currency|language|area|size|meaning|definition|history|facts|info)\b/gi,
      '',
    )
    .replace(/[?!.,]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Cap at 4 words to stay close to article titles
  const words = topic.split(' ');
  return words.length > 4 ? words.slice(0, 3).join(' ') : topic;
}

function urlToSearchQuery(url: string): string {
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`)
      .hostname.replace(/^www\./, '');
    const name = hostname.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    return `${name} ${hostname}`;
  } catch {
    return url;
  }
}

async function fetchDDG(query: string, ua: string): Promise<string[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const res = await fetch(url, { headers: { 'User-Agent': ua }, signal: AbortSignal.timeout(6000) });
  if (!res.ok) return [];
  const ddg = await res.json() as DdgResponse;
  const out: string[] = [];
  if (ddg.Answer)       out.push(`Direct answer: ${ddg.Answer}`);
  if (ddg.AbstractText) out.push(`${ddg.Heading ?? ''}: ${ddg.AbstractText}${ddg.AbstractURL ? ` (${ddg.AbstractURL})` : ''}`);
  if (ddg.Definition)   out.push(`Definition: ${ddg.Definition}`);
  const topics = (ddg.RelatedTopics ?? []).flatMap<DdgTopic>((t) => t.Topics ?? [t]);
  for (const t of topics.slice(0, 3)) if (t.Text) out.push(`• ${t.Text}`);
  return out;
}

async function fetchWiki(topic: string, ua: string): Promise<string | null> {
  if (!topic) return null;
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
  const res = await fetch(url, { headers: { 'User-Agent': ua }, signal: AbortSignal.timeout(6000) });
  if (!res.ok) return null;
  const wiki = await res.json() as WikiSummary;
  return wiki.extract ? `From Wikipedia — ${wiki.title ?? topic}:\n${wiki.extract.slice(0, 600)}` : null;
}

async function fetchPageMeta(url: string, ua: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': ua, Accept: 'text/html' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 30000);

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch  =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,})/i) ??
      html.match(/<meta[^>]+content=["']([^"']{10,})["'][^>]+name=["']description["']/i) ??
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{10,})/i) ??
      html.match(/<meta[^>]+content=["']([^"']{10,})["'][^>]+property=["']og:description["']/i);

    const decode = (s: string) =>
      s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

    const title = titleMatch ? decode(titleMatch[1].trim()).slice(0, 120) : '';
    const desc  = descMatch  ? decode(descMatch[1].trim()).slice(0, 400) : '';

    if (!title && !desc) return null;
    return `From the website — ${title}${desc ? `\nDescription: ${desc}` : ''}`;
  } catch {
    return null;
  }
}

export async function toolWebSearch(args: SearchArgs): Promise<string> {
  const raw = args.query;
  const UA  = 'PowerfulTiger/2.0 local AI';
  const snippets: string[] = [];

  const urlMatch = raw.match(/https?:\/\/\S+|www\.\S+/i);

  if (urlMatch) {
    // ── URL mode: fetch the page directly + search by domain name ────────────
    const pageUrl     = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
    const domainQuery = urlToSearchQuery(pageUrl);

    const [metaResult, ddgResult, wikiResult] = await Promise.allSettled([
      fetchPageMeta(pageUrl, UA),
      fetchDDG(domainQuery, UA),
      fetchWiki(extractWikiTopic(domainQuery), UA),
    ]);

    if (metaResult.status === 'fulfilled' && metaResult.value) snippets.push(metaResult.value);
    if (ddgResult.status  === 'fulfilled') snippets.push(...ddgResult.value);
    if (wikiResult.status === 'fulfilled' && wikiResult.value) snippets.push(wikiResult.value);

    if (snippets.length === 0) {
      return JSON.stringify({ url: raw, result: 'Could not retrieve information about this website.' });
    }
    return JSON.stringify({ url: raw, results: snippets.join('\n\n') });
  }

  // ── Text mode: DuckDuckGo + Wikipedia in parallel ─────────────────────────
  const [ddgResult, wikiResult] = await Promise.allSettled([
    fetchDDG(raw, UA),
    fetchWiki(extractWikiTopic(raw), UA),
  ]);

  if (ddgResult.status  === 'fulfilled') snippets.push(...ddgResult.value);
  if (wikiResult.status === 'fulfilled' && wikiResult.value) snippets.push(wikiResult.value);

  if (snippets.length === 0) {
    return JSON.stringify({ query: raw, result: 'No information found. The query may be too specific or require a real-time data source.' });
  }
  return JSON.stringify({ query: raw, results: snippets.join('\n\n') });
}

// ── Tool: calculate ───────────────────────────────────────────────────────────

interface CalcArgs {
  expression: string;
}

export function toolCalculate(args: CalcArgs): string {
  const { expression } = args;

  const normalised = expression
    .replace(/\^/g, '**')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/sqrt\(/gi, 'Math.sqrt(')
    .replace(/cbrt\(/gi, 'Math.cbrt(')
    .replace(/abs\(/gi, 'Math.abs(')
    .replace(/floor\(/gi, 'Math.floor(')
    .replace(/ceil\(/gi, 'Math.ceil(')
    .replace(/round\(/gi, 'Math.round(')
    .replace(/log10\(/gi, 'Math.log10(')
    .replace(/log2\(/gi, 'Math.log2(')
    .replace(/\blog\(/gi, 'Math.log10(')
    .replace(/\bln\(/gi, 'Math.log(')
    .replace(/sin\(/gi, 'Math.sin(')
    .replace(/cos\(/gi, 'Math.cos(')
    .replace(/tan\(/gi, 'Math.tan(')
    .replace(/\bpi\b/gi, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
    .replace(/pow\(/gi, 'Math.pow(')
    .replace(/exp\(/gi, 'Math.exp(')
    .replace(/min\(/gi, 'Math.min(')
    .replace(/max\(/gi, 'Math.max(');

  // Whitelist: only safe tokens allowed after substitution
  const stripped = normalised.replace(
    /Math\.(sqrt|cbrt|abs|floor|ceil|round|log10?|log2|log|sin|cos|tan|PI|E|pow|exp|min|max)\b/g,
    '1',
  );
  if (!/^[\d\s+\-*/.(),%]+$/.test(stripped)) {
    return JSON.stringify({
      error: `Unsafe or invalid expression: "${expression}"`,
    });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const result = new Function(
      `"use strict"; return (${normalised})`,
    )() as unknown;
    if (typeof result !== 'number' || !isFinite(result)) {
      return JSON.stringify({
        error: 'Expression returned a non-finite value.',
      });
    }
    const rounded = parseFloat(result.toPrecision(12));
    return JSON.stringify({ expression, result: rounded });
  } catch (err) {
    return JSON.stringify({
      error: `Could not evaluate: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

// ── Tool: get_weather ─────────────────────────────────────────────────────────

interface WttrCondition {
  temp_C: string;
  temp_F: string;
  FeelsLikeC: string;
  humidity: string;
  windspeedKmph: string;
  winddir16Point: string;
  visibility: string;
  uvIndex: string;
  weatherDesc: Array<{ value: string }>;
}

interface WttrArea {
  areaName: Array<{ value: string }>;
  country: Array<{ value: string }>;
}

interface WttrResponse {
  current_condition: WttrCondition[];
  nearest_area?: WttrArea[];
}

interface WeatherArgs {
  location: string;
}

export async function toolGetWeather(args: WeatherArgs): Promise<string> {
  const { location } = args;
  try {
    const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PowerfulTiger/2.0 local AI' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as WttrResponse;
    if (!data.current_condition || data.current_condition.length === 0) {
      throw new Error('No weather data returned for this location');
    }
    const cur = data.current_condition[0];
    const area = data.nearest_area?.[0];
    const name = area
      ? `${area.areaName[0]?.value ?? location}, ${area.country[0]?.value ?? ''}`.replace(
          /,\s*$/,
          '',
        )
      : location;

    return JSON.stringify({
      location: name,
      condition: cur.weatherDesc[0]?.value ?? 'Unknown',
      temp_c: cur.temp_C,
      temp_f: cur.temp_F,
      feels_like_c: cur.FeelsLikeC,
      humidity_pct: cur.humidity,
      wind_kmph: cur.windspeedKmph,
      wind_dir: cur.winddir16Point,
      visibility_km: cur.visibility,
      uv_index: cur.uvIndex,
    });
  } catch (err) {
    return JSON.stringify({
      error: `Could not fetch weather for "${location}": ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

// ── Tool: define_word ─────────────────────────────────────────────────────────

interface DictMeaning {
  partOfSpeech: string;
  definitions: Array<{ definition: string; example?: string }>;
  synonyms: string[];
}

interface DictEntry {
  word: string;
  phonetic?: string;
  meanings: DictMeaning[];
}

interface DefineArgs {
  word: string;
}

export async function toolDefineWord(args: DefineArgs): Promise<string> {
  const { word } = args;
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PowerfulTiger/2.0 local AI' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok)
      return JSON.stringify({ error: `No definition found for "${word}".` });

    const entries = (await res.json()) as DictEntry[];
    if (!Array.isArray(entries) || entries.length === 0) {
      return JSON.stringify({ error: `No definition found for "${word}".` });
    }
    const entry = entries[0];
    const meanings = entry.meanings.slice(0, 3).map((m) => ({
      partOfSpeech: m.partOfSpeech,
      definition: m.definitions[0]?.definition ?? '',
      example: m.definitions[0]?.example ?? null,
      synonyms: m.synonyms.slice(0, 5),
    }));

    return JSON.stringify({
      word: entry.word,
      phonetic: entry.phonetic ?? null,
      meanings,
    });
  } catch (err) {
    return JSON.stringify({
      error: `Dictionary lookup failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

// ── Ollama tool schema definitions ────────────────────────────────────────────

export const TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description:
        'Get the current time and date in any city or timezone. ' +
        'Call this ONLY when the user explicitly asks what time it is or what the date is. ' +
        'Do not call this during greetings or general conversation.',
      parameters: {
        type: 'object',
        required: [],
        properties: {
          timezone: {
            type: 'string',
            description:
              'City name or IANA timezone. Examples: "London", "Paris", "New York", ' +
              '"Europe/London", "America/New_York", "Asia/Tokyo", "UTC".',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description:
        'Get real-time weather conditions for any city or location. ' +
        'Call this ONLY when the user explicitly asks about the weather or temperature somewhere. ' +
        'Do not call this unless weather is directly asked for.',
      parameters: {
        type: 'object',
        required: ['location'],
        properties: {
          location: {
            type: 'string',
            description:
              'City name or location. Examples: "London", "New York", "Tokyo", "Paris, France".',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description:
        'Search the web for current information: news, recent events, prices, ' +
        'sports, facts you are not certain about, or anything time-sensitive. ' +
        'Use this whenever the answer might have changed recently or you are not 100% sure. ' +
        'Do NOT use this for weather (use get_weather) or word definitions (use define_word).',
      parameters: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            description:
              'Specific search query. Be concrete. Good: "bitcoin price today". ' +
              'Bad: "tell me about bitcoin".',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate',
      description:
        'Evaluate a mathematical expression precisely. Use for: arithmetic, ' +
        'algebra, trigonometry, percentages, unit conversions, any computation ' +
        'where exact precision matters.',
      parameters: {
        type: 'object',
        required: ['expression'],
        properties: {
          expression: {
            type: 'string',
            description:
              'Math expression. Supports: +, -, *, /, ^, sqrt(), sin(), cos(), ' +
              'tan(), log(), ln(), abs(), floor(), ceil(), round(), pi, e, min(), max(). ' +
              'Examples: "2+2", "sqrt(144)", "sin(pi/2)", "15% of 80" → "80*0.15".',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'define_word',
      description:
        'Look up the definition, meanings, pronunciation, and examples for any English word. ' +
        'Use this for vocabulary questions, word meanings, etymology, or spelling clarification. ' +
        'Do NOT use this for programming terms or technical concepts — use web_search for those.',
      parameters: {
        type: 'object',
        required: ['word'],
        properties: {
          word: {
            type: 'string',
            description:
              'The English word to define. Examples: "serendipity", "ephemeral", "ubiquitous".',
          },
        },
      },
    },
  },
];

// ── Dispatcher ────────────────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case 'get_current_time':
      return toolGetTime(args as TimeArgs);
    case 'get_weather':
      return toolGetWeather(args as unknown as WeatherArgs);
    case 'web_search':
      return toolWebSearch(args as unknown as SearchArgs);
    case 'calculate':
      return toolCalculate(args as unknown as CalcArgs);
    case 'define_word':
      return toolDefineWord(args as unknown as DefineArgs);
    default:
      return JSON.stringify({ error: `Unknown tool: "${name}"` });
  }
}
