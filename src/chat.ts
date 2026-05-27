/**
 * PowerfulTiger — main chat REPL.
 *
 * Usage:
 *   npm start               → auto-detect Ollama model
 *   npm start -- --demo     → force demo mode (no Ollama needed)
 */

import 'dotenv/config';
import * as readline from 'readline';
import * as path from 'path';
import { promises as fsp } from 'fs';
import {
  checkOllama,
  pickModel,
  streamChat,
  warmUpModel,
  type ChatMessage,
} from './ollama';
import { getBuiltinResponse } from './fallback';
import { c, printBanner, printHelp, printModelInfo } from './ui';

// ── CLI flags ─────────────────────────────────────────────────────────────────

const forceDemo = process.argv.includes('--demo');

// ── Tool display labels ───────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  // core
  get_current_time:    '🕐 Checking the time',
  get_weather:         '🌤️  Checking weather',
  web_search:          '🌐 Searching the web',
  calculate:           '🔢 Calculating',
  define_word:         '📖 Looking up definition',
  read_file:           '📄 Reading file',
  write_file:          '💾 Writing file',
  get_stock_price:     '📈 Checking stock price',
  // original offline
  convert_units:       '📐 Converting units',
  days_between:        '📅 Calculating date difference',
  add_to_date:         '📅 Adding time to date',
  timestamp_convert:   '🕰️  Converting timestamp',
  generate_uuid:       '🔑 Generating UUID',
  count_text:          '📊 Counting text',
  transform_text:      '✏️  Transforming text',
  encode_decode:       '🔄 Encoding/decoding',
  hash_text:           '🔐 Hashing text',
  format_json:         '📋 Formatting JSON',
  generate_password:   '🔑 Generating password',
  validate_email:      '✉️  Validating email',
  extract_urls:        '🔗 Extracting URLs',
  color_convert:       '🎨 Converting color',
  // original internet
  get_exchange_rate:   '💱 Checking exchange rate',
  get_crypto_price:    '🪙 Checking crypto price',
  get_ip_info:         '🌍 Looking up IP',
  get_npm_package:     '📦 Checking npm package',
  get_github_repo:     '🐙 Checking GitHub repo',
  get_country_info:    '🗺️  Looking up country',
  get_public_holidays: '🎉 Checking holidays',
  check_website:       '🔍 Checking website status',
  get_news:            '📰 Fetching news',
  translate_text:      '🌐 Translating',
  get_quote:           '💬 Fetching quote',
  get_trivia:          '🎲 Getting trivia',
  // extended math
  statistics:          '📊 Computing statistics',
  prime_check:         '🔢 Checking prime',
  prime_factorize:     '🔢 Factorizing',
  number_base_convert: '🔢 Converting base',
  fibonacci:           '🔢 Fibonacci sequence',
  factorial:           '🔢 Factorial',
  gcd_lcm:             '🔢 GCD & LCM',
  percentage_calc:     '📊 Percentage calc',
  roman_numerals:      '🔢 Roman numerals',
  combinations:        '🔢 Combinations/permutations',
  area_calc:           '📐 Area calculation',
  volume_calc:         '📐 Volume calculation',
  quadratic_solver:    '🔢 Quadratic solver',
  number_info:         '🔢 Number info',
  // extended text
  find_replace:        '✏️  Find & replace',
  is_palindrome:       '✏️  Palindrome check',
  lorem_ipsum:         '✏️  Lorem ipsum',
  strip_html:          '✏️  Stripping HTML',
  char_frequency:      '📊 Char frequency',
  word_frequency:      '📊 Word frequency',
  levenshtein:         '✏️  Edit distance',
  regex_test:          '✏️  Regex test',
  slug_generate:       '✏️  Slug generator',
  is_anagram:          '✏️  Anagram check',
  rot13:               '🔄 ROT-13',
  nato_phonetic:       '✏️  NATO phonetic',
  extract_emails:      '✉️  Extracting emails',
  extract_phones:      '📱 Extracting phones',
  wrap_text:           '✏️  Wrapping text',
  template_fill:       '✏️  Filling template',
  diff_text:           '✏️  Diff text',
  pig_latin:           '✏️  Pig Latin',
  split_text:          '✏️  Splitting text',
  join_text:           '✏️  Joining text',
  count_substring:     '📊 Counting substring',
  pad_string:          '✏️  Padding string',
  truncate_text:       '✏️  Truncating text',
  repeat_text:         '✏️  Repeating text',
  // extended date
  week_number:         '📅 Week number',
  is_leap_year:        '📅 Leap year check',
  days_in_month:       '📅 Days in month',
  working_days:        '📅 Working days',
  quarter_of_year:     '📅 Quarter of year',
  age_calc:            '📅 Age calculation',
  is_weekend:          '📅 Weekend check',
  zodiac_sign:         '⭐ Zodiac sign',
  // extended code/dev
  parse_url:           '🔗 Parsing URL',
  build_url:           '🔗 Building URL',
  http_status_info:    '🌐 HTTP status info',
  jwt_decode:          '🔐 Decoding JWT',
  csv_to_json:         '📋 CSV to JSON',
  json_to_csv:         '📋 JSON to CSV',
  mime_type:           '📄 MIME type lookup',
  subnet_calc:         '🌐 Subnet calculator',
  validate_url:        '🔗 Validating URL',
  semver_compare:      '📦 Semver compare',
  parse_query_string:  '🔗 Parsing query string',
  build_query_string:  '🔗 Building query string',
  generate_markdown_table: '📋 Markdown table',
  ip_to_integer:       '🌐 IP to integer',
  integer_to_ip:       '🌐 Integer to IP',
  // extended finance (offline)
  compound_interest:   '💰 Compound interest',
  simple_interest:     '💰 Simple interest',
  loan_payment:        '💰 Loan calculator',
  roi_calc:            '💰 ROI calculation',
  cagr_calc:           '💰 CAGR calculation',
  break_even:          '💰 Break-even analysis',
  npv_calc:            '💰 NPV calculation',
  tip_calc:            '💰 Tip calculator',
  inflation_calc:      '💰 Inflation calculator',
  position_size:       '📈 Position sizing',
  pe_ratio_calc:       '📈 P/E ratio',
  market_cap_calc:     '📈 Market cap',
  dollar_cost_avg:     '📈 Dollar-cost averaging',
  // extended science/health
  bmi_calc:            '🏃 BMI calculator',
  bmr_calc:            '🏃 BMR/TDEE calculator',
  target_heart_rate:   '❤️  Target heart rate',
  ohm_law:             '⚡ Ohm\'s law',
  pythagorean:         '📐 Pythagorean theorem',
  speed_distance_time: '🚀 Speed/distance/time',
  periodic_table:      '⚗️  Periodic table',
  // extended fun
  flip_coin:           '🪙 Flipping coin',
  roll_dice:           '🎲 Rolling dice',
  magic_8ball:         '🎱 Magic 8-Ball',
  random_color:        '🎨 Random color',
  chinese_zodiac:      '🐉 Chinese zodiac',
  luhn_check:          '💳 Luhn check',
  password_strength:   '🔐 Password strength',
  playing_card:        '🃏 Drawing card',
  // extended internet — entertainment
  get_joke:            '😂 Fetching joke',
  get_dad_joke:        '😄 Dad joke',
  get_random_fact:     '💡 Random fact',
  get_cat_fact:        '🐱 Cat fact',
  get_dog_image:       '🐶 Dog image',
  get_pokemon:         '🎮 Looking up Pokémon',
  get_recipe:          '🍳 Looking up recipe',
  get_cocktail:        '🍹 Looking up cocktail',
  get_book_by_isbn:    '📚 Looking up book',
  search_books:        '📚 Searching books',
  get_anime:           '🎌 Looking up anime',
  word_rhymes:         '✏️  Finding rhymes',
  word_synonyms:       '✏️  Finding synonyms',
  word_antonyms:       '✏️  Finding antonyms',
  get_random_word:     '✏️  Random word',
  // extended internet — science/nature
  get_iss_location:    '🛸 ISS location',
  get_space_news:      '🚀 Space news',
  get_earthquakes:     '🌍 Earthquake data',
  get_sunrise_sunset:  '🌅 Sunrise/sunset',
  search_arxiv:        '📄 arXiv search',
  get_food_nutrition:  '🥗 Nutrition lookup',
  geocode_address:     '📍 Geocoding address',
  reverse_geocode:     '📍 Reverse geocode',
  // extended internet — dev/code
  get_github_user:     '🐙 GitHub user lookup',
  get_github_releases: '🐙 GitHub releases',
  get_npm_downloads:   '📦 npm download stats',
  get_pypi_package:    '🐍 PyPI package',
  get_crate_info:      '🦀 Rust crate info',
  get_dns_records:     '🌐 DNS lookup',
  check_ssl:           '🔒 SSL check',
  get_http_headers:    '🌐 HTTP headers',
  get_robots_txt:      '🤖 robots.txt',
  search_github_repos: '🐙 Searching GitHub',
  get_github_issues:   '🐙 GitHub issues',
  get_npm_versions:    '📦 npm versions',
  // extended internet — finance/markets
  get_fear_greed_index:        '😱 Fear & Greed index',
  get_historical_exchange_rate:'💱 Historical rate',
  get_currency_list:           '💱 Currency list',
  get_crypto_global_stats:     '🪙 Crypto market stats',
  get_trending_crypto:         '🪙 Trending crypto',
  get_eth_gas_price:           '⛽ ETH gas price',
  // extended internet — geography/world
  get_countries_by_region:     '🗺️  Countries by region',
  get_timezone_info:           '🕐 Timezone info',
  get_ip_country:              '🌍 IP country lookup',
  get_border_countries:        '🗺️  Border countries',
  get_weather_forecast:        '🌤️  Weather forecast',
  get_air_quality:             '💨 Air quality',
  get_uv_index:                '☀️  UV index',
};

function toolLabel(name: string, args: Record<string, unknown>): string {
  const base = TOOL_LABELS[name] ?? `🔧 Running ${name}`;
  if (name === 'get_current_time' && args.timezone)  return `${base} for ${String(args.timezone)}`;
  if (name === 'get_weather'      && args.location)  return `${base} for ${String(args.location)}`;
  if (name === 'web_search'       && args.query)     return `${base}: "${String(args.query)}"`;
  if (name === 'calculate'        && args.expression) return `${base}: ${String(args.expression)}`;
  if (name === 'define_word'      && args.word)      return `${base}: "${String(args.word)}"`;
  if (name === 'read_file'         && args.path)       return `${base}: ${String(args.path)}`;
  if (name === 'get_stock_price'   && args.symbol)     return `${base}: ${String(args.symbol)}`;
  if (name === 'get_crypto_price'  && args.coin)       return `${base}: ${String(args.coin).toUpperCase()}`;
  if (name === 'get_exchange_rate' && args.from)       return `${base}: ${String(args.from)}→${String(args.to ?? '')}`;
  if (name === 'convert_units'     && args.from)       return `${base}: ${String(args.value ?? '')} ${String(args.from)}→${String(args.to ?? '')}`;
  if (name === 'get_npm_package'   && args.package)    return `${base}: ${String(args.package)}`;
  if (name === 'get_github_repo'   && args.repo)       return `${base}: ${String(args.repo)}`;
  if (name === 'get_country_info'  && args.country)    return `${base}: ${String(args.country)}`;
  if (name === 'translate_text'    && args.to)         return `${base} → ${String(args.to)}`;
  if (name === 'check_website'     && args.url)        return `${base}: ${String(args.url)}`;
  if (name === 'hash_text'         && args.algorithm)  return `${base}: ${String(args.algorithm)}`;
  if (name === 'write_file'        && args.path)       return `${base}: ${String(args.path)}`;
  if (name === 'get_news'          && args.topic)      return `${base}: "${String(args.topic)}"`;
  if (name === 'get_public_holidays' && args.country_code) return `${base}: ${String(args.country_code)}`;
  if (name === 'transform_text'    && args.transform)  return `${base}: ${String(args.transform)}`;
  if (name === 'encode_decode'     && args.mode)       return `${base}: ${String(args.mode)}`;
  return base;
}

// ── Response generation (non-demo) with spinner + timing ─────────────────────

const SPIN_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

async function generateResponse(
  model:   string,
  history: ChatMessage[],
): Promise<void> {
  let headerPrinted    = false;
  let toolLinesPrinted = 0;
  let spinIdx          = 0;
  let spinnerActive    = true;
  let spinLabel        = 'working…';

  process.stdout.write('\n');
  const spinTimer = setInterval(() => {
    process.stdout.write(`\r  ${c.dim(SPIN_FRAMES[spinIdx++ % SPIN_FRAMES.length])} ${c.dim(spinLabel)}`);
  }, 80);

  // Guard: only clears once — subsequent calls are no-ops so we don't clobber response text
  const clearSpin = () => {
    if (!spinnerActive) return;
    spinnerActive = false;
    clearInterval(spinTimer);
    process.stdout.write('\r' + ' '.repeat(24) + '\r');
  };

  const startMs = Date.now();

  try {
    await streamChat(model, history, {
      onThinking: () => { spinLabel = 'thinking…'; },
      onToken: (token) => {
        if (!headerPrinted) {
          clearSpin();
          process.stdout.write(`${c.brightYellow('⚡ PowerfulTiger')} > `);
          headerPrinted = true;
        }
        process.stdout.write(token);
      },
      onToolCall: (name, args) => {
        if (!headerPrinted) {
          clearSpin();
          process.stdout.write(`${c.brightYellow('⚡ PowerfulTiger')}\n`);
          headerPrinted = true;
        }
        process.stdout.write(`  ${c.dim(c.cyan(toolLabel(name, args) + '…'))}\n`);
        toolLinesPrinted++;
      },
    });

    clearSpin();
    const secs = ((Date.now() - startMs) / 1000).toFixed(1);
    process.stdout.write(`\n${c.dim(`[${secs}s]`)}\n`);

  } catch (err) {
    clearSpin();
    if (!headerPrinted) process.stdout.write(`${c.brightYellow('⚡ PowerfulTiger')} > `);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n${c.red('Error: ' + msg)}\n`);
    history.pop();
  }

  if (toolLinesPrinted > 0) process.stdout.write('\n');
}

// ── Readline helper ───────────────────────────────────────────────────────────

function createRL(): readline.Interface {
  return readline.createInterface({
    input:     process.stdin,
    output:    process.stdout,
    terminal:  process.stdin.isTTY === true,
    crlfDelay: Infinity, // treat \r\n as one newline instantly — no per-line 100ms delay on pastes
  });
}

/**
 * Read one user turn from stdin, collecting multi-line pastes as a single message.
 * Lines that arrive within 150 ms of the previous one are buffered together.
 * crlfDelay: Infinity on the rl interface ensures \r\n pastes don't stagger events.
 */
function ask(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const lines: string[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;

    const done = (err?: Error) => {
      if (timer) clearTimeout(timer);
      rl.removeListener('line',  onLine);
      rl.removeListener('close', onClose);
      if (err) { reject(err); return; }
      resolve(lines.join('\n'));
    };

    const onLine = (line: string) => {
      lines.push(line);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => done(), 150);
    };

    const onClose = () => done(new Error('stdin closed'));

    rl.on('line',  onLine);
    rl.on('close', onClose);
    process.stdout.write(prompt);
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  let model = 'demo';
  let isDemo = true;

  if (!forceDemo) {
    process.stdout.write(c.dim('Connecting to local model server…\r'));
    const status = await checkOllama();
    process.stdout.write(' '.repeat(50) + '\r');

    if (status.running) {
      const chosen = pickModel(status.models, status.modelSizes);
      if (chosen === null) {
        console.log(
          `\n${c.brightYellow('⚡ PowerfulTiger')} — ${c.red('No models installed.')}\n\n` +
            `Run: ${c.cyan('ollama pull llama3.2:3b')}\n`,
        );
        console.log(c.dim('Starting in demo mode…\n'));
      } else {
        model = chosen;
        isDemo = false;
        process.stdout.write(c.dim(`Loading ${model}…\r`));
        await warmUpModel(model);
        process.stdout.write(' '.repeat(50) + '\r');
      }
    } else {
      console.log(
        c.dim('Ollama not running — demo mode.\n') +
          c.dim(`Enable full AI: ${c.cyan('https://ollama.com/download')}\n`),
      );
    }
  }

  printBanner(model, isDemo);

  const rl = createRL();
  const history: ChatMessage[] = [];

  // ── Clean exit handler ──────────────────────────────────────────────────────

  function doExit(): void {
    console.log(`\n${c.dim('Goodbye! 🐯')}\n`);
    rl.close();
    process.exit(0);
  }

  rl.on('SIGINT', () => {
    doExit();
  });

  // ── Chat loop ───────────────────────────────────────────────────────────────
  let running = true;

  while (running) {
    let input: string;

    try {
      input = await ask(rl, `\n${c.green('You')} > `);
    } catch {
      running = false;
      break;
    }

    const text = input.trim();
    if (text === '') continue;

    // Show a line-count badge when a multi-line paste is detected
    const lineCount = text.split('\n').length;
    if (lineCount > 1) {
      process.stdout.write(c.dim(`  [${lineCount} lines]\n`));
    }

    // ── Commands ──────────────────────────────────────────────────────────────
    const cmd = text.toLowerCase();

    if (cmd === '/exit' || cmd === 'exit' || cmd === 'quit') {
      doExit();
      return;
    }

    if (cmd === '/clear') {
      history.length = 0;
      console.log(c.dim('Conversation cleared.\n'));
      continue;
    }

    if (cmd === '/help') {
      printHelp(model, isDemo);
      continue;
    }

    // /model <name> — switch model; plain /model shows info
    if (cmd.startsWith('/model ') && text.length > 7) {
      if (isDemo) {
        console.log(c.dim('Cannot switch models — Ollama is not running.\n'));
      } else {
        const want   = text.slice(7).trim();
        const status = await checkOllama();
        const match  = status.models.find((m) => m === want || m.startsWith(want));
        if (match) {
          model = match;
          console.log(c.dim(`Switched to: ${c.cyan(model)}\n`));
        } else {
          console.log(
            c.red(`Model "${want}" not found.`) +
            c.dim(` Installed:\n${status.models.map((m) => `  ${m}`).join('\n')}\n`),
          );
        }
      }
      continue;
    }

    if (cmd === '/model') {
      printModelInfo(model, isDemo);
      continue;
    }

    if (cmd === '/retry') {
      if (isDemo) { console.log(c.dim('Retry is not available in demo mode.\n')); continue; }
      let retryIdx = -1;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'assistant') { retryIdx = i; break; }
      }
      if (retryIdx === -1) { console.log(c.dim('Nothing to retry.\n')); continue; }
      history.splice(retryIdx, 1);
      console.log(c.dim('Retrying last response…'));
      await generateResponse(model, history);
      continue;
    }

    if (cmd === '/export') {
      if (history.length === 0) { console.log(c.dim('Nothing to export yet.\n')); continue; }
      const stamp    = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `powerfultiger-${stamp}.md`;
      const filepath = path.join(process.cwd(), filename);
      const lines    = [`# PowerfulTiger — ${new Date().toLocaleString()}\n`];
      for (const m of history) {
        lines.push(m.role === 'user'
          ? `\n## You\n\n${m.content}\n`
          : `\n## PowerfulTiger\n\n${m.content}\n`);
      }
      await fsp.writeFile(filepath, lines.join('\n'), 'utf-8');
      console.log(c.dim(`Saved: ${filename}\n`));
      continue;
    }

    // ── Add user message to history ───────────────────────────────────────────
    history.push({ role: 'user', content: text });

    // ── Generate response ─────────────────────────────────────────────────────
    if (isDemo) {
      const response = getBuiltinResponse(text);
      console.log(`\n${c.brightYellow('⚡ PowerfulTiger')} > ${response}\n`);
    } else {
      await generateResponse(model, history);
    }
  }

  rl.close();
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(c.red(`Fatal: ${msg}`));
  process.exit(1);
});
