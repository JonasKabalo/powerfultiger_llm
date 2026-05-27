/**
 * Terminal UI helpers — ANSI colors and formatting.
 */

const R = '\x1b[0m'; // reset

export const c = {
  brightYellow: (s: string) => `\x1b[93m${s}${R}`,
  green: (s: string) => `\x1b[92m${s}${R}`,
  cyan: (s: string) => `\x1b[96m${s}${R}`,
  red: (s: string) => `\x1b[91m${s}${R}`,
  dim: (s: string) => `\x1b[2m${s}${R}`,
  bold: (s: string) => `\x1b[1m${s}${R}`,
};

export function printBanner(modelName: string, isDemo: boolean): void {
  const line = '─'.repeat(54);
  console.log('');
  console.log(line);
  console.log(
    c.brightYellow('  ⚡ PowerfulTiger') + c.dim('  v2.0 — Local AI'),
  );
  if (isDemo) {
    console.log(
      c.dim('  Mode: Demo  ') + c.cyan('(install Ollama for full AI)'),
    );
  } else {
    console.log(c.dim(`  Model: ${modelName}`));
  }
  console.log(line);
  console.log(c.dim('  /help  /clear  /model  /retry  /export  /exit  — 230+ tools built-in') + '\n');
}

export function printHelp(modelName: string, isDemo: boolean): void {
  console.log(`
${c.bold('Commands:')}
  ${c.cyan('/clear')}              Clear conversation history
  ${c.cyan('/retry')}              Regenerate the last response
  ${c.cyan('/export')}             Save conversation to a markdown file
  ${c.cyan('/model')}              Show current model info
  ${c.cyan('/model')} ${c.dim('<name>')}      Switch to a different Ollama model
  ${c.cyan('/help')}               Show this help
  ${c.cyan('/exit')}               Quit

${c.bold('Tools — 230+ built-in, called automatically:')}
  ${c.dim('── offline (no internet) ─────────────────────────────')}
  ${c.dim('🔢')} calculate          — math expressions
  ${c.dim('🕐')} get_current_time   — clock & timezone
  ${c.dim('📄')} read_file          — read local files
  ${c.dim('💾')} write_file         — write/append local files
  ${c.dim('📐')} convert_units      — length/weight/temp/speed/data/energy…
  ${c.dim('📅')} days_between       — days between two dates
  ${c.dim('📅')} add_to_date        — add/subtract time from a date
  ${c.dim('🕰️')}  timestamp_convert  — unix ↔ human date
  ${c.dim('🔑')} generate_uuid      — UUID v4
  ${c.dim('📊')} count_text         — words/chars/lines/reading time
  ${c.dim('✏️')}  transform_text     — camelCase/snake_case/uppercase…
  ${c.dim('🔄')} encode_decode      — base64/URL/HTML encode-decode
  ${c.dim('🔐')} hash_text          — SHA-256/MD5/SHA-1/SHA-512
  ${c.dim('📋')} format_json        — pretty-print / validate JSON
  ${c.dim('🔑')} generate_password  — secure random password
  ${c.dim('✉️')}  validate_email     — email format check
  ${c.dim('🔗')} extract_urls       — find all URLs in text
  ${c.dim('🎨')} color_convert      — hex ↔ RGB ↔ HSL
  ${c.dim('── internet ──────────────────────────────────────────')}
  ${c.dim('🌤️')}  get_weather        — live weather anywhere
  ${c.dim('🌐')} web_search         — DuckDuckGo + Wikipedia + page fetch
  ${c.dim('📖')} define_word        — English dictionary
  ${c.dim('📈')} get_stock_price    — stocks & ETFs (Yahoo Finance)
  ${c.dim('🪙')} get_crypto_price   — Bitcoin/ETH/SOL… (CoinGecko)
  ${c.dim('💱')} get_exchange_rate  — forex currency conversion
  ${c.dim('🌍')} get_ip_info        — IP address geolocation
  ${c.dim('📦')} get_npm_package    — npm package details
  ${c.dim('🐙')} get_github_repo    — GitHub repo stats
  ${c.dim('🗺️')}  get_country_info   — country facts
  ${c.dim('🎉')} get_public_holidays — national holidays
  ${c.dim('🔍')} check_website      — is a site online?
  ${c.dim('📰')} get_news           — Hacker News top stories
  ${c.dim('🌐')} translate_text     — translate to any language
  ${c.dim('💬')} get_quote          — random inspirational quote
  ${c.dim('🎲')} get_trivia         — random trivia question
${
  isDemo
    ? `\n${c.bold('To unlock full AI:')}
  ${c.cyan('1.')} Download Ollama: ${c.cyan('https://ollama.com/download')}
  ${c.cyan('2.')} Pull a model:    ${c.cyan('ollama pull llama3.2:3b')}
  ${c.cyan('3.')} Run again:       ${c.cyan('npm start')}`
    : `\n${c.bold('Current model:')} ${modelName}`
}
`);
}

export function printModelInfo(modelName: string, isDemo: boolean): void {
  if (isDemo) {
    console.log(
      `\n${c.dim('Running in demo mode — basic math and conversation only.')}\n` +
        `${c.dim('Run')} ${c.cyan('ollama pull llama3.2:3b')} ${c.dim('for real AI.\n')}`,
    );
  } else {
    console.log(`\n${c.dim(`Model: ${modelName} (local via Ollama)`)}\n`);
  }
}
