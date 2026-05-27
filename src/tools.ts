/**
 * Tool implementations and definitions for PowerfulTiger.
 * 230+ tools across offline and internet categories with smart routing.
 */

import type { Tool } from 'ollama';
import { promises as fsp } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID, createHash, randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import {
  OFFLINE_TOOLS_EXTENDED,
  toolStatistics, toolPrimeCheck, toolPrimeFactorize, toolNumberBaseConvert, toolFibonacci, toolFactorial, toolGCDLCM, toolPercentageCalc, toolRomanNumerals, toolCombinations, toolAreaCalc, toolVolumeCalc, toolQuadraticSolver, toolNumberInfo,
  toolFindReplace, toolIsPalindrome, toolLoremIpsum, toolStripHtml, toolCharFrequency, toolWordFrequency, toolLevenshtein, toolRegexTest, toolSlugGenerate, toolIsAnagram, toolRot13, toolNatoPhonetic, toolExtractEmails, toolExtractPhones, toolWrapText, toolTemplateFill, toolDiffText, toolPigLatin, toolSplitText, toolJoinText, toolCountSubstring, toolPadString, toolTruncateText, toolRepeatText,
  toolWeekNumber, toolIsLeapYear, toolDaysInMonth, toolWorkingDays, toolQuarterOfYear, toolAgeCalc, toolIsWeekend, toolZodiacSign,
  toolParseURL, toolBuildURL, toolHTTPStatusInfo, toolJWTDecode, toolCSVToJSON, toolJSONToCSV, toolMimeType, toolSubnetCalc, toolValidateURL, toolSemverCompare, toolParseQueryString, toolBuildQueryString, toolGenerateMarkdownTable, toolIPToInteger, toolIntegerToIP,
  toolCompoundInterest, toolSimpleInterest, toolLoanPayment, toolROICalc, toolCAGR, toolBreakEven, toolNPV, toolTipCalc, toolInflationCalc, toolPositionSize, toolPERatio, toolMarketCap, toolDollarCostAvg,
  toolBMICalc, toolBMRCalc, toolTargetHeartRate, toolOhmLaw, toolPythagorean, toolSpeedDistanceTime, toolPeriodicTable,
  toolFlipCoin, toolRollDice, toolMagic8Ball, toolRandomColor, toolChineseZodiac, toolLuhnCheck, toolPasswordStrength, toolPlayingCard,
} from './tools_offline';
import {
  INTERNET_TOOLS_EXTENDED,
  toolGetJoke, toolGetDadJoke, toolGetRandomFact, toolGetCatFact, toolGetDogImage, toolGetPokemon, toolGetRecipe, toolGetCocktail, toolGetBookByISBN, toolSearchBooks, toolGetAnime, toolGetWordRhymes, toolGetSynonyms, toolGetAntonyms, toolGetRandomWord,
  toolGetISSLocation, toolGetSpaceNews, toolGetEarthquakes, toolGetSunriseSunset, toolSearchArxiv, toolGetFoodNutrition, toolGeocodeAddress, toolReverseGeocode,
  toolGetGitHubUser, toolGetGitHubReleases, toolGetNPMDownloads, toolGetPyPIPackage, toolGetCrateInfo, toolGetDNSRecords, toolCheckSSL, toolGetHTTPHeaders, toolGetRobotsTxt, toolSearchGitHubRepos, toolGetGitHubIssues, toolGetNPMVersions,
  toolGetFearGreedIndex, toolGetHistoricalExchangeRate, toolGetCurrencyList, toolGetCryptoGlobalStats, toolGetTrendingCrypto, toolGetETHGasPrice,
  toolGetCountriesByRegion, toolGetTimezoneInfo, toolGetIPCountry, toolGetBorderCountries, toolGetWeatherForecast, toolGetAirQuality, toolGetUVIndex,
} from './tools_internet';

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

// ── Tool: read_file ───────────────────────────────────────────────────────────

interface ReadFileArgs {
  path: string;
}

export async function toolReadFile(args: ReadFileArgs): Promise<string> {
  const raw      = (args.path ?? '').replace(/^~/, os.homedir());
  const resolved = path.resolve(raw);
  const home     = os.homedir();
  const cwd      = process.cwd();

  if (!resolved.startsWith(home) && !resolved.startsWith(cwd)) {
    return JSON.stringify({ error: `Access denied: "${resolved}" is outside your home and project directories.` });
  }

  try {
    const stat = await fsp.stat(resolved);

    if (stat.isDirectory()) {
      const entries = await fsp.readdir(resolved);
      return JSON.stringify({ path: resolved, type: 'directory', entries: entries.slice(0, 60) });
    }

    const MAX = 80_000;
    const raw2    = await fsp.readFile(resolved, 'utf-8');
    const lines   = raw2.split('\n').length;
    const content = raw2.length > MAX ? raw2.slice(0, MAX) + '\n\n…[truncated at 80 KB]' : raw2;

    return JSON.stringify({ path: resolved, type: 'file', lines, truncated: raw2.length > MAX, content });
  } catch (err) {
    return JSON.stringify({ error: `Cannot read "${resolved}": ${err instanceof Error ? err.message : String(err)}` });
  }
}

// ── Tool: get_stock_price ─────────────────────────────────────────────────────

interface StockArgs {
  symbol: string;
}

interface YahooChartMeta {
  currency: string;
  symbol: string;
  regularMarketPrice: number;
  chartPreviousClose: number;
  regularMarketVolume?: number;
  regularMarketTime?: number;
  exchangeName?: string;
  shortName?: string;
}

interface YahooChartResponse {
  chart: {
    result: Array<{ meta: YahooChartMeta }> | null;
    error: { code: string; description: string } | null;
  };
}

export async function toolGetStockPrice(args: StockArgs): Promise<string> {
  const symbol = (args.symbol ?? '').toUpperCase().trim();
  if (!symbol) return JSON.stringify({ error: 'No ticker symbol provided.' });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 PowerfulTiger/2.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json() as YahooChartResponse;

    if (data.chart.error) {
      return JSON.stringify({ error: `Yahoo Finance: ${data.chart.error.description}` });
    }

    const result = data.chart.result?.[0];
    if (!result) return JSON.stringify({ error: `No data found for symbol "${symbol}". Check the ticker is correct (e.g. BTC-USD, ETH-USD for crypto).` });

    const meta = result.meta;
    const change = meta.regularMarketPrice - meta.chartPreviousClose;
    const changePct = (change / meta.chartPreviousClose) * 100;

    return JSON.stringify({
      symbol:         meta.symbol,
      name:           meta.shortName ?? symbol,
      exchange:       meta.exchangeName ?? '',
      currency:       meta.currency,
      price:          meta.regularMarketPrice,
      previous_close: meta.chartPreviousClose,
      change:         parseFloat(change.toFixed(4)),
      change_pct:     parseFloat(changePct.toFixed(2)),
      volume:         meta.regularMarketVolume ?? null,
      as_of:          meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : null,
    });
  } catch (err) {
    return JSON.stringify({
      error: `Could not fetch price for "${symbol}": ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

// ── Tool: convert_units ───────────────────────────────────────────────────────

interface ConvertUnitsArgs { value: number; from: string; to: string }

export function toolConvertUnits(args: ConvertUnitsArgs): string {
  const { value } = args;
  const f = args.from.toLowerCase().trim();
  const t = args.to.toLowerCase().trim();

  // Temperature — offset-based, handled separately
  const tempFns: Record<string, Record<string, (v: number) => number>> = {
    c:          { c: v=>v, f: v=>v*9/5+32,           k: v=>v+273.15,            r: v=>(v+273.15)*9/5 },
    f:          { c: v=>(v-32)*5/9,                   f: v=>v, k: v=>(v-32)*5/9+273.15, r: v=>v+459.67 },
    k:          { c: v=>v-273.15,                     f: v=>(v-273.15)*9/5+32,  k: v=>v, r: v=>v*9/5 },
    r:          { c: v=>(v-491.67)*5/9,               f: v=>v-459.67,           k: v=>v*5/9, r: v=>v },
    celsius:    { c: v=>v, f: v=>v*9/5+32, k: v=>v+273.15 },
    fahrenheit: { f: v=>v, c: v=>(v-32)*5/9, k: v=>(v-32)*5/9+273.15 },
    kelvin:     { k: v=>v, c: v=>v-273.15,  f: v=>(v-273.15)*9/5+32 },
  };
  if (tempFns[f]) {
    const fn = tempFns[f][t];
    if (!fn) return JSON.stringify({ error: `Cannot convert temperature from "${args.from}" to "${args.to}"` });
    return JSON.stringify({ value, from: f, to: t, result: parseFloat(fn(value).toFixed(6)) });
  }

  // Everything else: multiplier to a common SI base per dimension
  const toSI: Record<string, number> = {
    // Length (metre)
    m:1,km:1e3,cm:1e-2,mm:1e-3,um:1e-6,nm:1e-9,mi:1609.344,ft:0.3048,in:0.0254,yd:0.9144,nmi:1852,
    // Weight (kg)
    kg:1,g:1e-3,mg:1e-6,ug:1e-9,lb:0.45359237,oz:0.028349523,t:1e3,st:6.35029,
    // Volume (litre)
    l:1,ml:1e-3,cl:1e-2,dl:1e-1,gal:3.785411784,qt:0.946352946,pt:0.473176473,
    cup:0.2365882365,floz:0.0295735295,tbsp:0.0147867647,tsp:0.00492892158,
    // Speed (m/s)
    mps:1,kph:1/3.6,mph:0.44704,knot:0.514444,fps:0.3048,
    // Data (byte)
    b:1,byte:1,kb:1e3,kib:1024,mb:1e6,mib:1048576,gb:1e9,gib:1073741824,
    tb:1e12,tib:1099511627776,pb:1e15,pib:1125899906842624,
    // Area (m²)
    m2:1,km2:1e6,cm2:1e-4,mm2:1e-6,ha:1e4,acre:4046.8564224,
    ft2:0.09290304,in2:6.4516e-4,yd2:0.83612736,mi2:2589988.110336,
    // Energy (joule)
    j:1,kj:1e3,mj:1e6,cal:4.184,kcal:4184,wh:3600,kwh:3600000,btu:1055.05585,
    // Pressure (pascal)
    pa:1,kpa:1e3,mpa:1e6,bar:1e5,mbar:100,atm:101325,psi:6894.757,torr:133.322,
    // Time (second)
    s:1,ms:1e-3,us:1e-6,ns:1e-9,min:60,h:3600,hr:3600,d:86400,day:86400,wk:604800,week:604800,
  };

  if (!toSI[f]) return JSON.stringify({ error: `Unknown unit "${args.from}". Supported dimensions: length (m/km/ft/mi), weight (kg/lb/oz), volume (l/ml/gal/cup), temp (c/f/k), speed (kph/mph), data (gb/mb/kb), area (m2/ha/acre), energy (j/kcal/kwh), pressure (pa/bar/psi), time (s/min/h/d).` });
  if (!toSI[t]) return JSON.stringify({ error: `Unknown unit "${args.to}"` });
  return JSON.stringify({ value, from: args.from, to: args.to, result: parseFloat(((value * toSI[f]) / toSI[t]).toPrecision(8)) });
}

// ── Tool: days_between ────────────────────────────────────────────────────────

interface DaysBetweenArgs { from: string; to: string }

export function toolDaysBetween(args: DaysBetweenArgs): string {
  const a = new Date(args.from), b = new Date(args.to);
  if (isNaN(a.getTime())) return JSON.stringify({ error: `Invalid date: "${args.from}"` });
  if (isNaN(b.getTime())) return JSON.stringify({ error: `Invalid date: "${args.to}"` });
  const days = Math.round((b.getTime() - a.getTime()) / 86400000);
  return JSON.stringify({ from: a.toISOString().slice(0,10), to: b.toISOString().slice(0,10), days, weeks: parseFloat((days/7).toFixed(2)), months: parseFloat((days/30.4375).toFixed(2)) });
}

// ── Tool: add_to_date ─────────────────────────────────────────────────────────

interface AddToDateArgs { date: string; amount: number; unit: string }

export function toolAddToDate(args: AddToDateArgs): string {
  const d = new Date(args.date);
  if (isNaN(d.getTime())) return JSON.stringify({ error: `Invalid date: "${args.date}"` });
  const amt = args.amount;
  switch ((args.unit ?? 'days').toLowerCase()) {
    case 'days':    d.setDate(d.getDate() + amt); break;
    case 'weeks':   d.setDate(d.getDate() + amt * 7); break;
    case 'months':  d.setMonth(d.getMonth() + amt); break;
    case 'years':   d.setFullYear(d.getFullYear() + amt); break;
    case 'hours':   d.setHours(d.getHours() + amt); break;
    case 'minutes': d.setMinutes(d.getMinutes() + amt); break;
    default: return JSON.stringify({ error: `Unknown unit "${args.unit}". Use: days, weeks, months, years, hours, minutes` });
  }
  return JSON.stringify({ original: args.date, added: `${amt} ${args.unit}`, result: d.toISOString(), human: d.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) });
}

// ── Tool: timestamp_convert ───────────────────────────────────────────────────

interface TimestampArgs { input: string }

export function toolTimestampConvert(args: TimestampArgs): string {
  const raw = args.input.trim();
  const d = /^\d+$/.test(raw)
    ? new Date(Number(raw) > 1e12 ? Number(raw) : Number(raw) * 1000)
    : new Date(raw);
  if (isNaN(d.getTime())) return JSON.stringify({ error: `Cannot parse "${raw}" as a date or unix timestamp` });
  return JSON.stringify({ unix_seconds: Math.floor(d.getTime()/1000), unix_ms: d.getTime(), iso: d.toISOString(), human: d.toLocaleString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', timeZoneName:'short' }) });
}

// ── Tool: generate_uuid ───────────────────────────────────────────────────────

interface GenerateUUIDArgs { count?: number }

export function toolGenerateUUID(args: GenerateUUIDArgs): string {
  const count = Math.min(Math.max(1, args.count ?? 1), 20);
  const uuids = Array.from({ length: count }, () => randomUUID());
  return JSON.stringify({ count, uuids: count === 1 ? uuids[0] : uuids });
}

// ── Tool: count_text ──────────────────────────────────────────────────────────

interface CountTextArgs { text: string }

export function toolCountText(args: CountTextArgs): string {
  const { text } = args;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = (text.match(/[.!?]+[\s$]/g) ?? []).length + (text.match(/[.!?]+$/) ? 1 : 0);
  return JSON.stringify({
    characters: text.length,
    characters_no_spaces: text.replace(/\s/g, '').length,
    words,
    lines: text.split('\n').length,
    sentences,
    paragraphs: text.split(/\n\s*\n/).filter(p => p.trim()).length,
    reading_time_min: parseFloat((words / 200).toFixed(1)),
  });
}

// ── Tool: transform_text ──────────────────────────────────────────────────────

interface TransformTextArgs { text: string; transform: string }

export function toolTransformText(args: TransformTextArgs): string {
  const { text } = args;
  const op = (args.transform ?? '').toLowerCase().trim();
  const ops: Record<string, () => string> = {
    uppercase:        () => text.toUpperCase(),
    lowercase:        () => text.toLowerCase(),
    titlecase:        () => text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
    camelcase:        () => text.toLowerCase().replace(/[\s_-]+(.)/g, (_, c: string) => c.toUpperCase()),
    snakecase:        () => text.toLowerCase().replace(/[\s-]+/g, '_').replace(/[^\w_]/g, ''),
    kebabcase:        () => text.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, ''),
    pascalcase:       () => text.toLowerCase().replace(/(?:^|[\s_-])(.)/g, (_, c: string) => c.toUpperCase()),
    reverse:          () => [...text].reverse().join(''),
    trim:             () => text.trim(),
    'sort-lines':     () => text.split('\n').filter(Boolean).sort().join('\n'),
    'reverse-lines':  () => text.split('\n').reverse().join('\n'),
    'remove-duplicates': () => [...new Set(text.split('\n'))].join('\n'),
  };
  if (!ops[op]) return JSON.stringify({ error: `Unknown transform "${args.transform}"`, available: Object.keys(ops) });
  return JSON.stringify({ transform: op, result: ops[op]() });
}

// ── Tool: encode_decode ───────────────────────────────────────────────────────

interface EncodeDecodeArgs { text: string; mode: string }

export function toolEncodeDecode(args: EncodeDecodeArgs): string {
  const { text } = args;
  const mode = (args.mode ?? '').toLowerCase().trim();
  try {
    switch (mode) {
      case 'base64-encode': return JSON.stringify({ mode, result: Buffer.from(text, 'utf-8').toString('base64') });
      case 'base64-decode': return JSON.stringify({ mode, result: Buffer.from(text, 'base64').toString('utf-8') });
      case 'url-encode':    return JSON.stringify({ mode, result: encodeURIComponent(text) });
      case 'url-decode':    return JSON.stringify({ mode, result: decodeURIComponent(text) });
      case 'html-encode':   return JSON.stringify({ mode, result: text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;') });
      case 'html-decode':   return JSON.stringify({ mode, result: text.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'") });
      default: return JSON.stringify({ error: `Unknown mode "${args.mode}"`, available: ['base64-encode','base64-decode','url-encode','url-decode','html-encode','html-decode'] });
    }
  } catch (e) { return JSON.stringify({ error: String(e) }); }
}

// ── Tool: hash_text ───────────────────────────────────────────────────────────

interface HashTextArgs { text: string; algorithm?: string }

export function toolHashText(args: HashTextArgs): string {
  const algo = (args.algorithm ?? 'sha256').toLowerCase();
  const supported = ['md5', 'sha1', 'sha256', 'sha512'];
  if (!supported.includes(algo)) return JSON.stringify({ error: `Unsupported algorithm "${algo}"`, supported });
  return JSON.stringify({ algorithm: algo, input_length: args.text.length, hash: createHash(algo).update(args.text, 'utf-8').digest('hex') });
}

// ── Tool: write_file ──────────────────────────────────────────────────────────

interface WriteFileArgs { path: string; content: string; append?: boolean }

export async function toolWriteFile(args: WriteFileArgs): Promise<string> {
  const raw = (args.path ?? '').replace(/^~/, os.homedir());
  const resolved = path.resolve(raw);
  const home = os.homedir(), cwd = process.cwd();
  if (!resolved.startsWith(home) && !resolved.startsWith(cwd)) {
    return JSON.stringify({ error: `Access denied: "${resolved}" is outside your home and project directories.` });
  }
  try {
    await fsp.mkdir(path.dirname(resolved), { recursive: true });
    if (args.append) { await fsp.appendFile(resolved, args.content, 'utf-8'); }
    else { await fsp.writeFile(resolved, args.content, 'utf-8'); }
    return JSON.stringify({ path: resolved, bytes: Buffer.byteLength(args.content, 'utf-8'), action: args.append ? 'appended' : 'written' });
  } catch (e) { return JSON.stringify({ error: `Cannot write "${resolved}": ${e instanceof Error ? e.message : String(e)}` }); }
}

// ── Tool: format_json ─────────────────────────────────────────────────────────

interface FormatJSONArgs { json: string; indent?: number; minify?: boolean }

export function toolFormatJSON(args: FormatJSONArgs): string {
  try {
    const parsed = JSON.parse(args.json);
    if (args.minify) return JSON.stringify({ valid: true, result: JSON.stringify(parsed) });
    return JSON.stringify({ valid: true, result: JSON.stringify(parsed, null, Math.min(Math.max(1, args.indent ?? 2), 8)) });
  } catch (e) { return JSON.stringify({ valid: false, error: e instanceof Error ? e.message : String(e) }); }
}

// ── Tool: generate_password ───────────────────────────────────────────────────

interface GeneratePasswordArgs { length?: number; include_symbols?: boolean; include_numbers?: boolean; include_uppercase?: boolean }

export function toolGeneratePassword(args: GeneratePasswordArgs): string {
  const len = Math.min(Math.max(8, args.length ?? 20), 128);
  let charset = 'abcdefghijklmnopqrstuvwxyz';
  if (args.include_uppercase !== false) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (args.include_numbers   !== false) charset += '0123456789';
  if (args.include_symbols   !== false) charset += '!@#$%^&*()-_=+[]{}|;:,.<>?';
  const bytes = randomBytes(len * 2);
  let pw = '';
  for (let i = 0; i < len; i++) pw += charset[bytes[i] % charset.length];
  return JSON.stringify({ password: pw, length: len, strength: len >= 16 && charset.length > 60 ? 'strong' : len >= 12 ? 'moderate' : 'weak' });
}

// ── Tool: validate_email ──────────────────────────────────────────────────────

interface ValidateEmailArgs { email: string }

export function toolValidateEmail(args: ValidateEmailArgs): string {
  const { email } = args;
  const valid = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(email);
  const [local = '', domain = ''] = email.split('@');
  return JSON.stringify({ email, valid, local_part: local, domain, issues: valid ? [] : ['Invalid email format'] });
}

// ── Tool: extract_urls ────────────────────────────────────────────────────────

interface ExtractURLsArgs { text: string }

export function toolExtractURLs(args: ExtractURLsArgs): string {
  const matches = [...(args.text.matchAll(/https?:\/\/[^\s"'<>)\]]+/g))].map(m => m[0]);
  const unique = [...new Set(matches)];
  return JSON.stringify({ found: unique.length, urls: unique });
}

// ── Tool: color_convert ───────────────────────────────────────────────────────

interface ColorConvertArgs { color: string }

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

export function toolColorConvert(args: ColorConvertArgs): string {
  const raw = args.color.trim();
  const hex6 = raw.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex6) {
    let h = hex6[1];
    if (h.length === 3) h = h.split('').map(c => c+c).join('');
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    const [hl, sl, ll] = rgbToHsl(r, g, b);
    return JSON.stringify({ hex:`#${h}`, rgb:`rgb(${r},${g},${b})`, hsl:`hsl(${Math.round(hl)},${Math.round(sl)}%,${Math.round(ll)}%)`, r, g, b });
  }
  const rgbM = raw.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbM) {
    const r = +rgbM[1], g = +rgbM[2], b = +rgbM[3];
    const hex = '#'+[r,g,b].map(n=>n.toString(16).padStart(2,'0')).join('');
    const [hl, sl, ll] = rgbToHsl(r, g, b);
    return JSON.stringify({ hex, rgb:raw, hsl:`hsl(${Math.round(hl)},${Math.round(sl)}%,${Math.round(ll)}%)`, r, g, b });
  }
  return JSON.stringify({ error: `Cannot parse "${raw}". Use: #fff, #rrggbb, or rgb(r,g,b)` });
}

// ── Tool: get_exchange_rate ───────────────────────────────────────────────────

interface ExchangeRateArgs { from: string; to: string; amount?: number }

export async function toolGetExchangeRate(args: ExchangeRateArgs): Promise<string> {
  const from = args.from.toUpperCase().trim(), to = args.to.toUpperCase().trim();
  const amount = args.amount ?? 1;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, { headers: { 'User-Agent': 'PowerfulTiger/2.0' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { result: string; rates: Record<string, number>; time_last_update_utc: string };
    if (data.result !== 'success') throw new Error('API error');
    const rate = data.rates[to];
    if (rate === undefined) return JSON.stringify({ error: `Unknown currency "${to}". Use ISO codes: USD, EUR, GBP, JPY, etc.` });
    return JSON.stringify({ from, to, rate: parseFloat(rate.toFixed(6)), amount, converted: parseFloat((amount * rate).toFixed(6)), as_of: data.time_last_update_utc });
  } catch (e) { return JSON.stringify({ error: `Exchange rate lookup failed: ${e instanceof Error ? e.message : String(e)}` }); }
}

// ── Tool: get_crypto_price ────────────────────────────────────────────────────

interface CryptoPriceArgs { coin: string; vs_currency?: string }

export async function toolGetCryptoPrice(args: CryptoPriceArgs): Promise<string> {
  const coin = args.coin.toLowerCase().trim();
  const vs = (args.vs_currency ?? 'usd').toLowerCase();
  const idMap: Record<string, string> = {
    btc:'bitcoin',eth:'ethereum',sol:'solana',bnb:'binancecoin',xrp:'ripple',
    usdt:'tether',usdc:'usd-coin',ada:'cardano',doge:'dogecoin',avax:'avalanche-2',
    dot:'polkadot',link:'chainlink',matic:'matic-network',shib:'shiba-inu',
    ltc:'litecoin',uni:'uniswap',atom:'cosmos',near:'near',algo:'algorand',
    xlm:'stellar',trx:'tron',fil:'filecoin',ftm:'fantom',arb:'arbitrum',
    op:'optimism',sui:'sui',apt:'aptos',inj:'injective-protocol',
  };
  const id = idMap[coin] ?? coin;
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=${vs}&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
    const res = await fetch(url, { headers: { 'User-Agent': 'PowerfulTiger/2.0' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as Record<string, Record<string, number>>;
    const d = data[id];
    if (!d) return JSON.stringify({ error: `Unknown coin "${args.coin}". Try full names: bitcoin, ethereum, solana.` });
    return JSON.stringify({ coin: id, symbol: args.coin.toUpperCase(), currency: vs.toUpperCase(), price: d[vs], change_24h_pct: parseFloat((d[`${vs}_24h_change`] ?? 0).toFixed(2)), volume_24h: d[`${vs}_24h_vol`] ?? null, market_cap: d[`${vs}_market_cap`] ?? null });
  } catch (e) { return JSON.stringify({ error: `Crypto price failed: ${e instanceof Error ? e.message : String(e)}` }); }
}

// ── Tool: get_ip_info ─────────────────────────────────────────────────────────

interface IPInfoArgs { ip?: string }

export async function toolGetIPInfo(args: IPInfoArgs): Promise<string> {
  const url = args.ip ? `https://ipapi.co/${encodeURIComponent(args.ip.trim())}/json/` : 'https://ipapi.co/json/';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'PowerfulTiger/2.0' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json() as Record<string, unknown>;
    if (d['error']) return JSON.stringify({ error: String(d['reason'] ?? d['error']) });
    return JSON.stringify({ ip: d['ip'], city: d['city'], region: d['region'], country: d['country_name'], country_code: d['country_code'], timezone: d['timezone'], utc_offset: d['utc_offset'], currency: d['currency'], isp: d['org'], latitude: d['latitude'], longitude: d['longitude'] });
  } catch (e) { return JSON.stringify({ error: `IP info failed: ${e instanceof Error ? e.message : String(e)}` }); }
}

// ── Tool: get_npm_package ─────────────────────────────────────────────────────

interface NPMPackageArgs { package: string }

export async function toolGetNPMPackage(args: NPMPackageArgs): Promise<string> {
  const pkg = (args.package ?? '').trim().toLowerCase();
  if (!pkg) return JSON.stringify({ error: 'No package name provided' });
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, { headers: { 'User-Agent': 'PowerfulTiger/2.0' }, signal: AbortSignal.timeout(8000) });
    if (res.status === 404) return JSON.stringify({ error: `Package "${pkg}" not found on npm` });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json() as { name: string; description?: string; license?: string; 'dist-tags'?: Record<string,string>; versions?: Record<string,{ dependencies?: Record<string,string> }>; time?: Record<string,string>; homepage?: string; repository?: { url?: string }; keywords?: string[] };
    const latest = d['dist-tags']?.latest ?? '';
    const deps = latest && d.versions?.[latest]?.dependencies ? Object.keys(d.versions[latest].dependencies!).length : null;
    return JSON.stringify({ name: d.name, latest_version: latest, description: d.description ?? null, license: d.license ?? null, homepage: d.homepage ?? null, keywords: (d.keywords ?? []).slice(0,8), dependencies: deps, versions_count: d.versions ? Object.keys(d.versions).length : null, created: d.time?.created?.slice(0,10) ?? null, last_modified: d.time?.modified?.slice(0,10) ?? null, install: `npm install ${d.name}` });
  } catch (e) { return JSON.stringify({ error: `NPM lookup failed: ${e instanceof Error ? e.message : String(e)}` }); }
}

// ── Tool: get_github_repo ─────────────────────────────────────────────────────

interface GitHubRepoArgs { repo: string }

export async function toolGetGitHubRepo(args: GitHubRepoArgs): Promise<string> {
  const raw = args.repo.trim().replace(/^https?:\/\/github\.com\//, '');
  if (!raw.includes('/')) return JSON.stringify({ error: `Expected "owner/repo" format, got "${args.repo}"` });
  try {
    const res = await fetch(`https://api.github.com/repos/${raw}`, { headers: { 'User-Agent': 'PowerfulTiger/2.0', Accept: 'application/vnd.github.v3+json' }, signal: AbortSignal.timeout(8000) });
    if (res.status === 404) return JSON.stringify({ error: `Repository "${raw}" not found` });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json() as { full_name:string; description?:string; stargazers_count:number; forks_count:number; open_issues_count:number; language?:string; license?:{spdx_id?:string}; topics?:string[]; created_at:string; pushed_at:string; html_url:string; default_branch:string; size:number; archived:boolean; fork:boolean; watchers_count:number };
    return JSON.stringify({ repo: d.full_name, url: d.html_url, description: d.description ?? null, language: d.language ?? null, stars: d.stargazers_count, forks: d.forks_count, open_issues: d.open_issues_count, license: d.license?.spdx_id ?? null, topics: (d.topics ?? []).slice(0,8), default_branch: d.default_branch, size_kb: d.size, archived: d.archived, created: d.created_at.slice(0,10), last_push: d.pushed_at.slice(0,10) });
  } catch (e) { return JSON.stringify({ error: `GitHub lookup failed: ${e instanceof Error ? e.message : String(e)}` }); }
}

// ── Tool: get_country_info ────────────────────────────────────────────────────

interface CountryInfoArgs { country: string }

export async function toolGetCountryInfo(args: CountryInfoArgs): Promise<string> {
  try {
    const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(args.country.trim())}?fields=name,capital,population,area,currencies,languages,region,subregion,timezones,tld`, { headers: { 'User-Agent': 'PowerfulTiger/2.0' }, signal: AbortSignal.timeout(8000) });
    if (res.status === 404) return JSON.stringify({ error: `Country "${args.country}" not found` });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as Array<{ name:{common:string;official:string}; capital?:string[]; population?:number; area?:number; currencies?:Record<string,{name:string;symbol:string}>; languages?:Record<string,string>; region?:string; subregion?:string; timezones?:string[]; tld?:string[] }>;
    const c = data[0];
    if (!c) return JSON.stringify({ error: `No data for "${args.country}"` });
    return JSON.stringify({ name: c.name.common, official_name: c.name.official, capital: c.capital?.[0] ?? null, region: c.region, subregion: c.subregion, population: c.population, area_km2: c.area, currencies: Object.entries(c.currencies ?? {}).map(([code, cur]) => `${cur.name} (${cur.symbol ?? code})`), languages: Object.values(c.languages ?? {}), timezones: c.timezones, domain: c.tld?.[0] ?? null });
  } catch (e) { return JSON.stringify({ error: `Country info failed: ${e instanceof Error ? e.message : String(e)}` }); }
}

// ── Tool: get_public_holidays ─────────────────────────────────────────────────

interface PublicHolidaysArgs { country_code: string; year?: number }

export async function toolGetPublicHolidays(args: PublicHolidaysArgs): Promise<string> {
  const code = args.country_code.toUpperCase().trim();
  const year = args.year ?? new Date().getFullYear();
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${code}`, { headers: { 'User-Agent': 'PowerfulTiger/2.0' }, signal: AbortSignal.timeout(8000) });
    if (res.status === 404) return JSON.stringify({ error: `Unknown country code "${code}". Use ISO 2-letter codes: US, FR, GB, DE, JP, CA, etc.` });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const holidays = await res.json() as Array<{ date:string; name:string; localName:string; global:boolean }>;
    if (!Array.isArray(holidays) || !holidays.length) return JSON.stringify({ country: code, year, message: 'No public holidays found' });
    return JSON.stringify({ country: code, year, count: holidays.length, holidays: holidays.map(h => ({ date: h.date, name: h.name, local_name: h.localName, national: h.global })) });
  } catch (e) { return JSON.stringify({ error: `Holidays lookup failed: ${e instanceof Error ? e.message : String(e)}` }); }
}

// ── Tool: check_website ───────────────────────────────────────────────────────

interface CheckWebsiteArgs { url: string }

export async function toolCheckWebsite(args: CheckWebsiteArgs): Promise<string> {
  let url = args.url.trim();
  if (!url.startsWith('http')) url = `https://${url}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'PowerfulTiger/2.0' }, signal: AbortSignal.timeout(10000), redirect: 'follow' });
    return JSON.stringify({ url, online: true, status: res.status, status_text: res.statusText, response_ms: Date.now() - t0, redirected_to: res.url !== url ? res.url : null });
  } catch (e) { return JSON.stringify({ url, online: false, response_ms: Date.now() - t0, error: e instanceof Error ? e.message : String(e) }); }
}

// ── Tool: get_news ────────────────────────────────────────────────────────────

interface GetNewsArgs { topic?: string; count?: number }

export async function toolGetNews(args: GetNewsArgs): Promise<string> {
  try {
    const count = Math.min(Math.max(1, args.count ?? 5), 10);
    const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { headers: { 'User-Agent': 'PowerfulTiger/2.0' }, signal: AbortSignal.timeout(6000) });
    if (!idsRes.ok) throw new Error(`HTTP ${idsRes.status}`);
    const ids = await idsRes.json() as number[];
    type HNItem = { title:string; url?:string; score:number; by:string; time:number; descendants?:number };
    const fetched = await Promise.allSettled(ids.slice(0, 25).map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { headers: { 'User-Agent': 'PowerfulTiger/2.0' }, signal: AbortSignal.timeout(4000) }).then(r => r.json() as Promise<HNItem>)));
    const stories = fetched.filter((s): s is PromiseFulfilledResult<HNItem> => s.status === 'fulfilled' && !!s.value?.title).map(s => s.value).filter(s => !args.topic || s.title.toLowerCase().includes(args.topic.toLowerCase())).slice(0, count);
    return JSON.stringify({ source: 'Hacker News', topic: args.topic ?? 'top', stories: stories.map(s => ({ title: s.title, url: s.url ?? null, score: s.score, comments: s.descendants ?? 0, posted: new Date(s.time*1000).toISOString().slice(0,10) })) });
  } catch (e) { return JSON.stringify({ error: `News fetch failed: ${e instanceof Error ? e.message : String(e)}` }); }
}

// ── Tool: translate_text ──────────────────────────────────────────────────────

interface TranslateTextArgs { text: string; to: string; from?: string }

export async function toolTranslateText(args: TranslateTextArgs): Promise<string> {
  const langpair = `${args.from?.toLowerCase().trim() ?? 'auto'}|${args.to.toLowerCase().trim()}`;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(args.text)}&langpair=${encodeURIComponent(langpair)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'PowerfulTiger/2.0' }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { responseStatus:number; responseMessage:string; responseData:{ translatedText:string; match?:number } };
    if (data.responseStatus !== 200) return JSON.stringify({ error: `Translation failed: ${data.responseMessage}` });
    return JSON.stringify({ original: args.text, translated: data.responseData.translatedText, from: args.from ?? 'auto', to: args.to, confidence: data.responseData.match ?? null });
  } catch (e) { return JSON.stringify({ error: `Translation failed: ${e instanceof Error ? e.message : String(e)}` }); }
}

// ── Tool: get_quote ───────────────────────────────────────────────────────────

interface GetQuoteArgs { topic?: string }

export async function toolGetQuote(args: GetQuoteArgs): Promise<string> {
  try {
    const url = args.topic ? `https://api.quotable.io/random?tags=${encodeURIComponent(args.topic)}` : 'https://api.quotable.io/random';
    const res = await fetch(url, { headers: { 'User-Agent': 'PowerfulTiger/2.0' }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json() as { content:string; author:string; tags?:string[] };
    return JSON.stringify({ quote: d.content, author: d.author, tags: d.tags ?? [] });
  } catch (e) { return JSON.stringify({ error: `Quote fetch failed: ${e instanceof Error ? e.message : String(e)}` }); }
}

// ── Tool: get_trivia ──────────────────────────────────────────────────────────

interface TriviaArgs { category?: string; difficulty?: string }

export async function toolGetTrivia(args: TriviaArgs): Promise<string> {
  const cats: Record<string, string> = { general:'9', books:'10', film:'11', music:'12', science:'17', computers:'18', math:'19', sports:'21', geography:'22', history:'23', politics:'24', art:'25', animals:'27', vehicles:'28', coding:'18', programming:'18' };
  let url = 'https://opentdb.com/api.php?amount=1&type=multiple&encode=url3986';
  const cat = args.category ? cats[args.category.toLowerCase()] : undefined;
  if (cat) url += `&category=${cat}`;
  if (args.difficulty && ['easy','medium','hard'].includes(args.difficulty.toLowerCase())) url += `&difficulty=${args.difficulty.toLowerCase()}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'PowerfulTiger/2.0' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { response_code:number; results:Array<{ category:string; difficulty:string; question:string; correct_answer:string; incorrect_answers:string[] }> };
    if (data.response_code !== 0 || !data.results.length) return JSON.stringify({ error: 'No trivia found for those criteria' });
    const q = data.results[0];
    const dec = (s: string) => decodeURIComponent(s);
    const all = [q.correct_answer, ...q.incorrect_answers].map(dec).sort(() => Math.random() - 0.5);
    return JSON.stringify({ category: dec(q.category), difficulty: dec(q.difficulty), question: dec(q.question), correct_answer: dec(q.correct_answer), all_answers: all });
  } catch (e) { return JSON.stringify({ error: `Trivia fetch failed: ${e instanceof Error ? e.message : String(e)}` }); }
}

// ── Tool: send_email ─────────────────────────────────────────────────────────

function stripSignoff(body: string): string {
  // Remove placeholder names like [Your Name], [Votre Nom], [Name]
  let text = body.replace(/\[(?:your |votre |su )?(?:name|nom|nombre|name here)\]/gi, '').trimEnd();

  // Remove the last paragraph if it looks like a sign-off:
  // ≤3 lines, all short (≤80 chars), and the first line ends with a comma
  // This is language-agnostic — works for "Best,", "Bien à vous,", "Cordialement,", etc.
  const lastParaRe = /^([\s\S]*?)\n{2,}((?:.+\n?){1,3})$/;
  const m = text.match(lastParaRe);
  if (m) {
    const lastPara = m[2].trim();
    const lines = lastPara.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] ?? '';
    if (
      lines.length <= 3 &&
      lines.every(l => l.length <= 80) &&
      firstLine.endsWith(',')
    ) {
      text = m[1].trimEnd();
    }
  }

  return text;
}

export async function toolSendEmail(args: Record<string, unknown>): Promise<string> {
  const user = process.env.PT_EMAIL_USER;
  const pass = process.env.PT_EMAIL_PASS;

  if (!user || !pass) {
    return JSON.stringify({
      error: 'Email not configured. Add PT_EMAIL_USER and PT_EMAIL_PASS to your .env file. See README for Gmail App Password setup.',
    });
  }

  const to      = String(args.to ?? '');
  const subject = String(args.subject ?? '(no subject)');
  const body    = String(args.body ?? '');

  if (!to) return JSON.stringify({ error: 'Missing recipient email address (to).' });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  const sender = `"Jonas Kabalo" <${user}>`;
  const signed = `${stripSignoff(body)}\n\nBest regards,\nJonas Kabalo`;

  try {
    await transporter.sendMail({ from: sender, to, subject, text: signed });
    return JSON.stringify({ success: true, to, subject, sent_body: signed });
  } catch (e) {
    return JSON.stringify({ error: `Failed to send: ${e instanceof Error ? e.message : String(e)}` });
  }
}

// ── Ollama tool schema definitions ────────────────────────────────────────────

export const TOOLS: Tool[] = [
  // ── Offline tools ──────────────────────────────────────────────────────────
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
  {
    type: 'function',
    function: {
      name: 'read_file',
      description:
        'Read the contents of a local file or list a directory on the user\'s machine. ' +
        'Use this when the user mentions a file path, asks you to review or look at a file, ' +
        'or pastes a path instead of code. Works for any text file: .ts, .js, .py, .json, .md, etc. ' +
        'Do NOT use for URLs — use web_search for those.',
      parameters: {
        type: 'object',
        required: ['path'],
        properties: {
          path: {
            type: 'string',
            description:
              'File or directory path. Absolute or relative. ~ expands to home. ' +
              'Examples: "src/memory.ts", "./package.json", "~/notes.txt", "src/".',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stock_price',
      description: 'Get real-time price for a stock or ETF via Yahoo Finance. Use for: AAPL, TSLA, NVDA, MSFT, SPY, QQQ, etc.',
      parameters: { type: 'object', required: ['symbol'], properties: { symbol: { type: 'string', description: 'Yahoo Finance ticker, e.g. "AAPL", "SPY", "TSLA".' } } },
    },
  },
  // ── Offline utility tools ──────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'convert_units',
      description: 'Convert between units of measurement. Supports: length (m/km/ft/mi/in/yd), weight (kg/lb/oz/g), volume (l/ml/gal/cup/floz), temperature (c/f/k), speed (kph/mph/knot), data (gb/mb/kb/gib/mib), area (m2/ha/acre/ft2), energy (j/kcal/kwh/btu), pressure (pa/bar/psi/atm), time (s/min/h/d). Call whenever user asks to convert units.',
      parameters: { type: 'object', required: ['value','from','to'], properties: { value: { type: 'number', description: 'Number to convert' }, from: { type: 'string', description: 'Source unit, e.g. "km", "kg", "c", "gb"' }, to: { type: 'string', description: 'Target unit, e.g. "mi", "lb", "f", "mb"' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'days_between',
      description: 'Calculate the number of days, weeks, and months between two dates.',
      parameters: { type: 'object', required: ['from','to'], properties: { from: { type: 'string', description: 'Start date, ISO format or natural: "2025-01-01", "January 1 2025"' }, to: { type: 'string', description: 'End date, same format' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_to_date',
      description: 'Add or subtract time from a date. Useful for "what date is 90 days from now?" or "30 days before 2025-12-31".',
      parameters: { type: 'object', required: ['date','amount','unit'], properties: { date: { type: 'string', description: 'Base date: "today", "2025-03-01", etc.' }, amount: { type: 'number', description: 'Amount to add (negative to subtract)' }, unit: { type: 'string', description: 'One of: days, weeks, months, years, hours, minutes' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'timestamp_convert',
      description: 'Convert between unix timestamps and human-readable dates. Input can be a unix timestamp (seconds or ms) or a date string.',
      parameters: { type: 'object', required: ['input'], properties: { input: { type: 'string', description: 'Unix timestamp like "1704067200" or date like "2025-01-01T00:00:00Z"' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_uuid',
      description: 'Generate one or more UUID v4 identifiers.',
      parameters: { type: 'object', required: [], properties: { count: { type: 'number', description: 'How many UUIDs to generate (1-20). Default 1.' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'count_text',
      description: 'Count words, characters, lines, sentences, paragraphs, and estimated reading time in a text.',
      parameters: { type: 'object', required: ['text'], properties: { text: { type: 'string', description: 'The text to analyse' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'transform_text',
      description: 'Transform text case or structure. Transforms: uppercase, lowercase, titlecase, camelcase, snakecase, kebabcase, pascalcase, reverse, trim, sort-lines, reverse-lines, remove-duplicates.',
      parameters: { type: 'object', required: ['text','transform'], properties: { text: { type: 'string', description: 'Text to transform' }, transform: { type: 'string', description: 'Transform to apply, e.g. "camelcase", "snakecase", "uppercase"' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'encode_decode',
      description: 'Encode or decode text. Modes: base64-encode, base64-decode, url-encode, url-decode, html-encode, html-decode.',
      parameters: { type: 'object', required: ['text','mode'], properties: { text: { type: 'string', description: 'Text to encode or decode' }, mode: { type: 'string', description: 'One of: base64-encode, base64-decode, url-encode, url-decode, html-encode, html-decode' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'hash_text',
      description: 'Hash a string using a cryptographic algorithm. Algorithms: sha256 (default), sha512, sha1, md5.',
      parameters: { type: 'object', required: ['text'], properties: { text: { type: 'string', description: 'Text to hash' }, algorithm: { type: 'string', description: 'Algorithm: sha256, sha512, sha1, md5. Default: sha256.' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write or append content to a local file on the user\'s machine. Use when the user asks to save, create, or append to a file.',
      parameters: { type: 'object', required: ['path','content'], properties: { path: { type: 'string', description: 'File path. ~ expands to home.' }, content: { type: 'string', description: 'Content to write' }, append: { type: 'boolean', description: 'If true, append instead of overwrite. Default false.' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'format_json',
      description: 'Pretty-print, minify, or validate a JSON string.',
      parameters: { type: 'object', required: ['json'], properties: { json: { type: 'string', description: 'JSON string to format' }, indent: { type: 'number', description: 'Indent spaces (1-8). Default 2.' }, minify: { type: 'boolean', description: 'If true, output minified JSON.' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_password',
      description: 'Generate a secure random password.',
      parameters: { type: 'object', required: [], properties: { length: { type: 'number', description: 'Password length (8-128). Default 20.' }, include_symbols: { type: 'boolean', description: 'Include symbols. Default true.' }, include_numbers: { type: 'boolean', description: 'Include numbers. Default true.' }, include_uppercase: { type: 'boolean', description: 'Include uppercase. Default true.' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'validate_email',
      description: 'Check if an email address is valid format.',
      parameters: { type: 'object', required: ['email'], properties: { email: { type: 'string', description: 'Email address to validate' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'extract_urls',
      description: 'Extract all URLs from a block of text.',
      parameters: { type: 'object', required: ['text'], properties: { text: { type: 'string', description: 'Text to extract URLs from' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'color_convert',
      description: 'Convert a color between hex, RGB, and HSL formats.',
      parameters: { type: 'object', required: ['color'], properties: { color: { type: 'string', description: 'Color in any format: "#ff6600", "#f60", "rgb(255,102,0)"' } } },
    },
  },
  // ── Internet tools ─────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'get_exchange_rate',
      description: 'Get real-time currency exchange rates and convert amounts. Use for: EUR to USD, GBP to JPY, etc.',
      parameters: { type: 'object', required: ['from','to'], properties: { from: { type: 'string', description: 'Source currency code: EUR, USD, GBP, JPY, CAD, etc.' }, to: { type: 'string', description: 'Target currency code' }, amount: { type: 'number', description: 'Amount to convert. Default 1.' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_crypto_price',
      description: 'Get current cryptocurrency price from CoinGecko. Use for: BTC, ETH, SOL, DOGE, etc. Complements get_stock_price for coins not on Yahoo Finance.',
      parameters: { type: 'object', required: ['coin'], properties: { coin: { type: 'string', description: 'Coin symbol or name: "btc", "eth", "sol", "bitcoin", "ethereum"' }, vs_currency: { type: 'string', description: 'Currency to price in: usd (default), eur, gbp, jpy' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_ip_info',
      description: 'Look up geolocation and ISP info for an IP address. If no IP given, returns info for the user\'s current IP.',
      parameters: { type: 'object', required: [], properties: { ip: { type: 'string', description: 'IPv4 or IPv6 address. Omit to look up your own IP.' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_npm_package',
      description: 'Look up an npm package: version, description, license, weekly downloads, dependencies.',
      parameters: { type: 'object', required: ['package'], properties: { package: { type: 'string', description: 'Package name, e.g. "react", "lodash", "express"' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_github_repo',
      description: 'Get GitHub repository info: stars, forks, issues, language, license, last push.',
      parameters: { type: 'object', required: ['repo'], properties: { repo: { type: 'string', description: 'Repo in "owner/name" format or full GitHub URL. E.g. "facebook/react", "vercel/next.js"' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_country_info',
      description: 'Get facts about a country: capital, population, area, currency, languages, timezone.',
      parameters: { type: 'object', required: ['country'], properties: { country: { type: 'string', description: 'Country name: "France", "Japan", "Brazil"' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_public_holidays',
      description: 'List public holidays for a country and year. Useful for knowing market closures.',
      parameters: { type: 'object', required: ['country_code'], properties: { country_code: { type: 'string', description: 'ISO 2-letter country code: US, FR, GB, DE, JP, CA, AU' }, year: { type: 'number', description: 'Year. Default: current year.' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_website',
      description: 'Check if a website is online and measure response time.',
      parameters: { type: 'object', required: ['url'], properties: { url: { type: 'string', description: 'URL or domain to check, e.g. "https://github.com" or "github.com"' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_news',
      description: 'Fetch the latest top stories from Hacker News. Optionally filter by a keyword topic.',
      parameters: { type: 'object', required: [], properties: { topic: { type: 'string', description: 'Optional keyword to filter stories, e.g. "AI", "TypeScript", "crypto"' }, count: { type: 'number', description: 'Number of stories (1-10). Default 5.' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'translate_text',
      description: 'Translate text into another language using MyMemory.',
      parameters: { type: 'object', required: ['text','to'], properties: { text: { type: 'string', description: 'Text to translate' }, to: { type: 'string', description: 'Target language code: fr, es, de, ja, zh, ar, pt, it, ru, ko, etc.' }, from: { type: 'string', description: 'Source language code. Omit to auto-detect.' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_quote',
      description: 'Get a random inspirational or philosophical quote.',
      parameters: { type: 'object', required: [], properties: { topic: { type: 'string', description: 'Optional topic: "technology", "success", "wisdom", "science"' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_trivia',
      description: 'Get a random trivia question with multiple choice answers.',
      parameters: { type: 'object', required: [], properties: { category: { type: 'string', description: 'Category: general, science, history, geography, sports, film, music, coding, math, art' }, difficulty: { type: 'string', description: 'Difficulty: easy, medium, hard' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description:
        'Send an email from the configured Gmail account. ' +
        'Only call this after the user has seen the draft and confirmed they want it sent. ' +
        'Use the exact subject and body from the draft you showed them.',
      parameters: {
        type: 'object',
        required: ['to', 'subject', 'body'],
        properties: {
          to:      { type: 'string', description: 'Recipient email address.' },
          subject: { type: 'string', description: 'Email subject line.' },
          body:    { type: 'string', description: 'Plain-text email body.' },
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
    // ── Existing tools ──────────────────────────────────────────────────────
    case 'get_current_time':    return toolGetTime(args as TimeArgs);
    case 'get_weather':         return toolGetWeather(args as unknown as WeatherArgs);
    case 'web_search':          return toolWebSearch(args as unknown as SearchArgs);
    case 'calculate':           return toolCalculate(args as unknown as CalcArgs);
    case 'define_word':         return toolDefineWord(args as unknown as DefineArgs);
    case 'read_file':           return toolReadFile(args as unknown as ReadFileArgs);
    case 'get_stock_price':     return toolGetStockPrice(args as unknown as StockArgs);
    // ── Offline tools ────────────────────────────────────────────────────────
    case 'convert_units':       return toolConvertUnits(args as unknown as ConvertUnitsArgs);
    case 'days_between':        return toolDaysBetween(args as unknown as DaysBetweenArgs);
    case 'add_to_date':         return toolAddToDate(args as unknown as AddToDateArgs);
    case 'timestamp_convert':   return toolTimestampConvert(args as unknown as TimestampArgs);
    case 'generate_uuid':       return toolGenerateUUID(args as unknown as GenerateUUIDArgs);
    case 'count_text':          return toolCountText(args as unknown as CountTextArgs);
    case 'transform_text':      return toolTransformText(args as unknown as TransformTextArgs);
    case 'encode_decode':       return toolEncodeDecode(args as unknown as EncodeDecodeArgs);
    case 'hash_text':           return toolHashText(args as unknown as HashTextArgs);
    case 'write_file':          return toolWriteFile(args as unknown as WriteFileArgs);
    case 'format_json':         return toolFormatJSON(args as unknown as FormatJSONArgs);
    case 'generate_password':   return toolGeneratePassword(args as unknown as GeneratePasswordArgs);
    case 'validate_email':      return toolValidateEmail(args as unknown as ValidateEmailArgs);
    case 'extract_urls':        return toolExtractURLs(args as unknown as ExtractURLsArgs);
    case 'color_convert':       return toolColorConvert(args as unknown as ColorConvertArgs);
    // ── Internet tools ───────────────────────────────────────────────────────
    case 'get_exchange_rate':   return toolGetExchangeRate(args as unknown as ExchangeRateArgs);
    case 'get_crypto_price':    return toolGetCryptoPrice(args as unknown as CryptoPriceArgs);
    case 'get_ip_info':         return toolGetIPInfo(args as unknown as IPInfoArgs);
    case 'get_npm_package':     return toolGetNPMPackage(args as unknown as NPMPackageArgs);
    case 'get_github_repo':     return toolGetGitHubRepo(args as unknown as GitHubRepoArgs);
    case 'get_country_info':    return toolGetCountryInfo(args as unknown as CountryInfoArgs);
    case 'get_public_holidays': return toolGetPublicHolidays(args as unknown as PublicHolidaysArgs);
    case 'check_website':       return toolCheckWebsite(args as unknown as CheckWebsiteArgs);
    case 'get_news':            return toolGetNews(args as unknown as GetNewsArgs);
    case 'translate_text':      return toolTranslateText(args as unknown as TranslateTextArgs);
    case 'get_quote':           return toolGetQuote(args as unknown as GetQuoteArgs);
    case 'get_trivia':          return toolGetTrivia(args as unknown as TriviaArgs);
    case 'send_email':          return toolSendEmail(args);
    // ── Extended offline tools ───────────────────────────────────────────────
    case 'statistics':          return toolStatistics(args);
    case 'prime_check':         return toolPrimeCheck(args);
    case 'prime_factorize':     return toolPrimeFactorize(args);
    case 'number_base_convert': return toolNumberBaseConvert(args);
    case 'fibonacci':           return toolFibonacci(args);
    case 'factorial':           return toolFactorial(args);
    case 'gcd_lcm':             return toolGCDLCM(args);
    case 'percentage_calc':     return toolPercentageCalc(args);
    case 'roman_numerals':      return toolRomanNumerals(args);
    case 'combinations':        return toolCombinations(args);
    case 'area_calc':           return toolAreaCalc(args);
    case 'volume_calc':         return toolVolumeCalc(args);
    case 'quadratic_solver':    return toolQuadraticSolver(args);
    case 'number_info':         return toolNumberInfo(args);
    case 'find_replace':        return toolFindReplace(args);
    case 'is_palindrome':       return toolIsPalindrome(args);
    case 'lorem_ipsum':         return toolLoremIpsum(args);
    case 'strip_html':          return toolStripHtml(args);
    case 'char_frequency':      return toolCharFrequency(args);
    case 'word_frequency':      return toolWordFrequency(args);
    case 'levenshtein':         return toolLevenshtein(args);
    case 'regex_test':          return toolRegexTest(args);
    case 'slug_generate':       return toolSlugGenerate(args);
    case 'is_anagram':          return toolIsAnagram(args);
    case 'rot13':               return toolRot13(args);
    case 'nato_phonetic':       return toolNatoPhonetic(args);
    case 'extract_emails':      return toolExtractEmails(args);
    case 'extract_phones':      return toolExtractPhones(args);
    case 'wrap_text':           return toolWrapText(args);
    case 'template_fill':       return toolTemplateFill(args);
    case 'diff_text':           return toolDiffText(args);
    case 'pig_latin':           return toolPigLatin(args);
    case 'split_text':          return toolSplitText(args);
    case 'join_text':           return toolJoinText(args);
    case 'count_substring':     return toolCountSubstring(args);
    case 'pad_string':          return toolPadString(args);
    case 'truncate_text':       return toolTruncateText(args);
    case 'repeat_text':         return toolRepeatText(args);
    case 'week_number':         return toolWeekNumber(args);
    case 'is_leap_year':        return toolIsLeapYear(args);
    case 'days_in_month':       return toolDaysInMonth(args);
    case 'working_days':        return toolWorkingDays(args);
    case 'quarter_of_year':     return toolQuarterOfYear(args);
    case 'age_calc':            return toolAgeCalc(args);
    case 'is_weekend':          return toolIsWeekend(args);
    case 'zodiac_sign':         return toolZodiacSign(args);
    case 'parse_url':           return toolParseURL(args);
    case 'build_url':           return toolBuildURL(args);
    case 'http_status_info':    return toolHTTPStatusInfo(args);
    case 'jwt_decode':          return toolJWTDecode(args);
    case 'csv_to_json':         return toolCSVToJSON(args);
    case 'json_to_csv':         return toolJSONToCSV(args);
    case 'mime_type':           return toolMimeType(args);
    case 'subnet_calc':         return toolSubnetCalc(args);
    case 'validate_url':        return toolValidateURL(args);
    case 'semver_compare':      return toolSemverCompare(args);
    case 'parse_query_string':  return toolParseQueryString(args);
    case 'build_query_string':  return toolBuildQueryString(args);
    case 'generate_markdown_table': return toolGenerateMarkdownTable(args);
    case 'ip_to_integer':       return toolIPToInteger(args);
    case 'integer_to_ip':       return toolIntegerToIP(args);
    case 'compound_interest':   return toolCompoundInterest(args);
    case 'simple_interest':     return toolSimpleInterest(args);
    case 'loan_payment':        return toolLoanPayment(args);
    case 'roi_calc':            return toolROICalc(args);
    case 'cagr_calc':           return toolCAGR(args);
    case 'break_even':          return toolBreakEven(args);
    case 'npv_calc':            return toolNPV(args);
    case 'tip_calc':            return toolTipCalc(args);
    case 'inflation_calc':      return toolInflationCalc(args);
    case 'position_size':       return toolPositionSize(args);
    case 'pe_ratio_calc':       return toolPERatio(args);
    case 'market_cap_calc':     return toolMarketCap(args);
    case 'dollar_cost_avg':     return toolDollarCostAvg(args);
    case 'bmi_calc':            return toolBMICalc(args);
    case 'bmr_calc':            return toolBMRCalc(args);
    case 'target_heart_rate':   return toolTargetHeartRate(args);
    case 'ohm_law':             return toolOhmLaw(args);
    case 'pythagorean':         return toolPythagorean(args);
    case 'speed_distance_time': return toolSpeedDistanceTime(args);
    case 'periodic_table':      return toolPeriodicTable(args);
    case 'flip_coin':           return toolFlipCoin(args);
    case 'roll_dice':           return toolRollDice(args);
    case 'magic_8ball':         return toolMagic8Ball(args);
    case 'random_color':        return toolRandomColor(args);
    case 'chinese_zodiac':      return toolChineseZodiac(args);
    case 'luhn_check':          return toolLuhnCheck(args);
    case 'password_strength':   return toolPasswordStrength(args);
    case 'playing_card':        return toolPlayingCard(args);
    // ── Extended internet tools ──────────────────────────────────────────────
    case 'get_joke':                    return toolGetJoke(args);
    case 'get_dad_joke':                return toolGetDadJoke(args);
    case 'get_random_fact':             return toolGetRandomFact(args);
    case 'get_cat_fact':                return toolGetCatFact(args);
    case 'get_dog_image':               return toolGetDogImage(args);
    case 'get_pokemon':                 return toolGetPokemon(args);
    case 'get_recipe':                  return toolGetRecipe(args);
    case 'get_cocktail':                return toolGetCocktail(args);
    case 'get_book_by_isbn':            return toolGetBookByISBN(args);
    case 'search_books':                return toolSearchBooks(args);
    case 'get_anime':                   return toolGetAnime(args);
    case 'word_rhymes':                 return toolGetWordRhymes(args);
    case 'word_synonyms':               return toolGetSynonyms(args);
    case 'word_antonyms':               return toolGetAntonyms(args);
    case 'get_random_word':             return toolGetRandomWord(args);
    case 'get_iss_location':            return toolGetISSLocation(args);
    case 'get_space_news':              return toolGetSpaceNews(args);
    case 'get_earthquakes':             return toolGetEarthquakes(args);
    case 'get_sunrise_sunset':          return toolGetSunriseSunset(args);
    case 'search_arxiv':                return toolSearchArxiv(args);
    case 'get_food_nutrition':          return toolGetFoodNutrition(args);
    case 'geocode_address':             return toolGeocodeAddress(args);
    case 'reverse_geocode':             return toolReverseGeocode(args);
    case 'get_github_user':             return toolGetGitHubUser(args);
    case 'get_github_releases':         return toolGetGitHubReleases(args);
    case 'get_npm_downloads':           return toolGetNPMDownloads(args);
    case 'get_pypi_package':            return toolGetPyPIPackage(args);
    case 'get_crate_info':              return toolGetCrateInfo(args);
    case 'get_dns_records':             return toolGetDNSRecords(args);
    case 'check_ssl':                   return toolCheckSSL(args);
    case 'get_http_headers':            return toolGetHTTPHeaders(args);
    case 'get_robots_txt':              return toolGetRobotsTxt(args);
    case 'search_github_repos':         return toolSearchGitHubRepos(args);
    case 'get_github_issues':           return toolGetGitHubIssues(args);
    case 'get_npm_versions':            return toolGetNPMVersions(args);
    case 'get_fear_greed_index':        return toolGetFearGreedIndex(args);
    case 'get_historical_exchange_rate':return toolGetHistoricalExchangeRate(args);
    case 'get_currency_list':           return toolGetCurrencyList(args);
    case 'get_crypto_global_stats':     return toolGetCryptoGlobalStats(args);
    case 'get_trending_crypto':         return toolGetTrendingCrypto(args);
    case 'get_eth_gas_price':           return toolGetETHGasPrice(args);
    case 'get_countries_by_region':     return toolGetCountriesByRegion(args);
    case 'get_timezone_info':           return toolGetTimezoneInfo(args);
    case 'get_ip_country':              return toolGetIPCountry(args);
    case 'get_border_countries':        return toolGetBorderCountries(args);
    case 'get_weather_forecast':        return toolGetWeatherForecast(args);
    case 'get_air_quality':             return toolGetAirQuality(args);
    case 'get_uv_index':                return toolGetUVIndex(args);
    default:
      return JSON.stringify({ error: `Unknown tool: "${name}"` });
  }
}

// ── Smart tool routing ────────────────────────────────────────────────────────

const ALL_TOOLS: Tool[] = [...TOOLS, ...OFFLINE_TOOLS_EXTENDED, ...INTERNET_TOOLS_EXTENDED];

const tn = (t: Tool) => t.function.name ?? '';
const pick = (pool: Tool[], names: string[]) => pool.filter(t => names.includes(tn(t)));

// Core tools always included (time, weather, search, calculate, define, read/write)
const CORE_TOOL_NAMES = new Set(['get_current_time','get_weather','web_search','calculate','define_word','read_file','write_file']);
const CORE_TOOLS = ALL_TOOLS.filter(t => CORE_TOOL_NAMES.has(tn(t)));

// Group definitions
const TOOL_GROUPS: Record<string, Tool[]> = {
  email:     pick(ALL_TOOLS,['send_email']),
  stock:     pick(ALL_TOOLS,['get_stock_price','get_crypto_price','get_exchange_rate','get_news']),
  utility:   pick(ALL_TOOLS,['convert_units','days_between','add_to_date','timestamp_convert','generate_uuid','count_text','transform_text','encode_decode','hash_text','format_json','generate_password','validate_email','extract_urls','color_convert']),
  internet_basic: pick(ALL_TOOLS,['get_ip_info','get_npm_package','get_github_repo','get_country_info','get_public_holidays','check_website','translate_text','get_quote','get_trivia']),
  math:      pick(OFFLINE_TOOLS_EXTENDED,['statistics','prime_check','prime_factorize','number_base_convert','fibonacci','factorial','gcd_lcm','percentage_calc','roman_numerals','combinations','area_calc','volume_calc','quadratic_solver','number_info']),
  text:      pick(OFFLINE_TOOLS_EXTENDED,['find_replace','is_palindrome','lorem_ipsum','strip_html','char_frequency','word_frequency','levenshtein','regex_test','slug_generate','is_anagram','rot13','nato_phonetic','extract_emails','extract_phones','wrap_text','template_fill','diff_text','pig_latin','split_text','join_text','count_substring','pad_string','truncate_text','repeat_text']),
  date:      pick(OFFLINE_TOOLS_EXTENDED,['week_number','is_leap_year','days_in_month','working_days','quarter_of_year','age_calc','is_weekend','zodiac_sign']),
  code:      pick(OFFLINE_TOOLS_EXTENDED,['parse_url','build_url','http_status_info','jwt_decode','csv_to_json','json_to_csv','mime_type','subnet_calc','validate_url','semver_compare','parse_query_string','build_query_string','generate_markdown_table','ip_to_integer','integer_to_ip']),
  finance:   pick(OFFLINE_TOOLS_EXTENDED,['compound_interest','simple_interest','loan_payment','roi_calc','cagr_calc','break_even','npv_calc','tip_calc','inflation_calc','position_size','pe_ratio_calc','market_cap_calc','dollar_cost_avg']),
  science:   pick(OFFLINE_TOOLS_EXTENDED,['bmi_calc','bmr_calc','target_heart_rate','ohm_law','pythagorean','speed_distance_time','periodic_table']),
  fun:       pick(OFFLINE_TOOLS_EXTENDED,['flip_coin','roll_dice','magic_8ball','random_color','chinese_zodiac','luhn_check','password_strength','playing_card']),
  entertain: pick(INTERNET_TOOLS_EXTENDED,['get_joke','get_dad_joke','get_random_fact','get_cat_fact','get_dog_image','get_pokemon','get_recipe','get_cocktail','get_book_by_isbn','search_books','get_anime','word_rhymes','word_synonyms','word_antonyms','get_random_word']),
  geo:       pick(INTERNET_TOOLS_EXTENDED,['get_countries_by_region','get_timezone_info','get_ip_country','get_border_countries','get_weather_forecast','get_air_quality','get_uv_index','geocode_address','reverse_geocode','get_sunrise_sunset']),
  devcod:    pick(INTERNET_TOOLS_EXTENDED,['get_github_user','get_github_releases','get_npm_downloads','get_pypi_package','get_crate_info','get_dns_records','check_ssl','get_http_headers','get_robots_txt','search_github_repos','get_github_issues','get_npm_versions']),
  finmkt:    pick(INTERNET_TOOLS_EXTENDED,['get_fear_greed_index','get_historical_exchange_rate','get_currency_list','get_crypto_global_stats','get_trending_crypto','get_eth_gas_price']),
  space:     pick(INTERNET_TOOLS_EXTENDED,['get_iss_location','get_space_news','get_earthquakes','search_arxiv','get_food_nutrition']),
};

const GROUP_TRIGGERS: Record<string, RegExp> = {
  email:     /\b(email|send (a |an |the )?mail|write (a |an )?email|compose|message to \w+@|e-mail)\b/i,
  stock:     /\b(stock|share|price|ticker|etf|nasdaq|nyse|s&p|dow|crypto|bitcoin|btc|eth|ethereum|solana|forex|exchange rate|currency|news|headline)\b/i,
  utility:   /\b(convert|uuid|guid|base64|encode|decode|hash|sha|md5|json|password|email|url|color|hex|rgb|hsl|units|celsius|fahrenheit|kelvin|miles|km|pounds|kg|bytes|mb|gb)\b/i,
  internet_basic: /\b(ip address|my ip|geolocation|npm package|github repo|country|capital|population|holiday|translate|translation|quote|trivia|website|http status)\b/i,
  math:      /\b(statistic|prime|fibonacci|factorial|gcd|lcm|base convert|binary|hex|octal|roman|area|volume|quadratic|roots?|circle|sphere|cylinder|triangle|rectangle|combination|permutation|number info)\b/i,
  text:      /\b(replace|find and|palindrome|lorem|html strip|char freq|word freq|levenshtein|edit distance|regex|slug|anagram|rot13|nato|phonetic|extract email|extract phone|wrap text|template|diff|pig latin|split|join text|pad|truncate|repeat)\b/i,
  date:      /\b(week number|leap year|days in month|working days|business days|quarter|zodiac|weekend|age calc|how old|born on)\b/i,
  code:      /\b(parse url|build url|http status|jwt|mime type|subnet|cidr|semver|version compare|query string|markdown table|ip to int|int to ip|csv|json to csv|robots.txt|dns|ssl)\b/i,
  finance:   /\b(compound interest|simple interest|loan|mortgage|amortize|roi|return on invest|cagr|break.?even|npv|net present|tip calc|inflation|position size|pe ratio|market cap|dollar.?cost)\b/i,
  science:   /\b(bmi|body mass|bmr|basal metabolic|tdee|heart rate|ohm|pythagorean|speed distance|periodic table|element|hydrogen|oxygen|carbon|iron|gold)\b/i,
  fun:       /\b(flip coin|roll dice|magic 8|random color|chinese zodiac|luhn|credit card valid|password strength|playing card|draw card|deal card)\b/i,
  entertain: /\b(joke|dad joke|fact|cat fact|dog image|pokemon|pok[eé]mon|recipe|cocktail|drink|isbn|book|anime|rhyme|synonym|antonym|random word)\b/i,
  geo:       /\b(country by region|timezone|uv index|air quality|sunrise|sunset|geocode|address to coord|coord to address|border countries|weather forecast|3.day|region countries)\b/i,
  devcod:    /\b(github user|github release|npm download|pypi|python package|cargo|rust crate|dns record|ssl cert|http header|robots|search repo|github issue|npm version)\b/i,
  finmkt:    /\b(fear.?greed|historical (rate|exchange)|currency list|crypto global|trending crypto|eth gas|ethereum gas|gas price)\b/i,
  space:     /\b(iss|space station|space news|earthquake|seismic|arxiv|research paper|nutrition|food fact|calorie)\b/i,
};

export function selectToolsForMessage(msg: string): Tool[] | undefined {
  // Already small-talk-gated in ollama.ts — but also skip if clearly conversational
  const selected = new Map<string, Tool>();
  for (const t of CORE_TOOLS) selected.set(tn(t), t);
  for (const [group, pattern] of Object.entries(GROUP_TRIGGERS)) {
    if (pattern.test(msg)) for (const t of (TOOL_GROUPS[group] ?? [])) selected.set(tn(t), t);
  }
  return [...selected.values()];
}

export { ALL_TOOLS };
