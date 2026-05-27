# ⚡ PowerfulTiger

A local AI assistant that runs 100% on your machine. No cloud, no API keys, no data leaving your device. Powered by [Ollama](https://ollama.com) with **171 built-in tools** for real-time data, code utilities, finance, science, entertainment, and everyday tasks.

---

## Features

- **Streaming responses** — output appears word by word, just like a real conversation
- **Agentic tool use** — the model autonomously calls tools, reasons over results, and continues
- **171 built-in tools** — 123 offline + 48 internet — routed smartly per message
- **Deep expertise** — software engineering, TypeScript/JavaScript, finance, and markets
- **Persistent memory** — remembers your name, preferences, and session summaries across conversations
- **Thinking mode** — strips `<think>…</think>` reasoning blocks for clean output
- **Smart model selection** — auto-picks the best installed Ollama model
- **Paste support** — multi-line code pastes are buffered and sent as one message
- **Session commands** — `/retry`, `/export`, `/model <name>`, `/memory`, `/clear`
- **Demo mode** — works without Ollama for basic math and conversation

---

## Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- [Ollama](https://ollama.com/download) (for full AI mode)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Pull a model (run once) — qwen3:14b is the minimum recommended
ollama pull qwen3:14b

# 3. Start chatting
npm start
```

Demo mode (no Ollama needed):

```bash
npm start -- --demo
```

---

## Recommended Models

PowerfulTiger picks the best installed model automatically. With 50 GB of storage you can run:

| Model | Size | Why it's great |
|---|---|---|
| `qwen3:32b` | ~20 GB | **Best overall** — native thinking, excellent tools + coding |
| `deepseek-r1:32b` | ~20 GB | Strongest reasoning and math |
| `magistral:24b` | ~15 GB | Mistral's reasoning model, fast and smart |
| `qwen3:14b` | ~9 GB | Best starting point — thinking + tools at 14B |
| `deepseek-r1:14b` | ~9 GB | Great reasoning specialist |
| `qwen3:8b` | ~5 GB | Fast daily driver |

```bash
# Recommended starting combo (29 GB total):
ollama pull qwen3:32b
ollama pull qwen3:14b
```

PowerfulTiger selects the largest installed model on startup. Switch live with `/model <name>`.

---

## Commands

| Command | What it does |
|---|---|
| `/help` | Show all commands and tools |
| `/model` | Show the current model |
| `/model <name>` | Switch to a different installed model |
| `/memory` | Show what PowerfulTiger remembers about you |
| `/retry` | Regenerate the last response |
| `/export` | Save the conversation to a markdown file |
| `/clear` | Wipe conversation history for this session |
| `/exit` | Quit and save session memory |

`exit`, `quit`, and Ctrl+C also work.

---

## Tools — 171 built-in

All tools are called automatically — no manual invocation needed. The model decides when to use them. Smart routing selects only relevant tools per message so context isn't wasted.

### Offline — Core (always available)

| Tool | What it does |
|---|---|
| `calculate` | Math: arithmetic, algebra, trig, percentages, sqrt, log… |
| `get_current_time` | Current time in any city or timezone |
| `read_file` | Read any local file or list a directory |
| `write_file` | Write or append content to a local file |
| `convert_units` | Length, weight, temperature, speed, volume, data, area, energy, pressure, time |
| `days_between` | Days/weeks/months between two dates |
| `add_to_date` | Add or subtract time from a date |
| `timestamp_convert` | Unix timestamp ↔ human date |
| `generate_uuid` | Generate UUID v4 (up to 20 at once) |
| `count_text` | Words, characters, lines, sentences, reading time |
| `transform_text` | uppercase, camelCase, snake_case, kebab-case, reverse, sort-lines… |
| `encode_decode` | base64, URL, HTML — encode or decode |
| `hash_text` | SHA-256, SHA-512, SHA-1, MD5 |
| `format_json` | Pretty-print or validate JSON |
| `generate_password` | Secure random password (configurable length + symbols) |
| `validate_email` | Email format validation |
| `extract_urls` | Find all URLs in a block of text |
| `color_convert` | Hex ↔ RGB ↔ HSL |

### Offline — Math & Numbers (14 tools)

`statistics` · `prime_check` · `prime_factorize` · `number_base_convert` (bin/oct/dec/hex) · `fibonacci` · `factorial` · `gcd_lcm` · `percentage_calc` · `roman_numerals` · `combinations` · `area_calc` · `volume_calc` · `quadratic_solver` · `number_info`

### Offline — Text Processing (24 tools)

`find_replace` · `is_palindrome` · `lorem_ipsum` · `strip_html` · `char_frequency` · `word_frequency` · `levenshtein` · `regex_test` · `slug_generate` · `is_anagram` · `rot13` · `nato_phonetic` · `extract_emails` · `extract_phones` · `wrap_text` · `template_fill` · `diff_text` · `pig_latin` · `split_text` · `join_text` · `count_substring` · `pad_string` · `truncate_text` · `repeat_text`

### Offline — Dates (8 tools)

`week_number` · `is_leap_year` · `days_in_month` · `working_days` · `quarter_of_year` · `age_calc` · `is_weekend` · `zodiac_sign`

### Offline — Dev / Code (15 tools)

`parse_url` · `build_url` · `http_status_info` · `jwt_decode` · `csv_to_json` · `json_to_csv` · `mime_type` · `subnet_calc` · `validate_url` · `semver_compare` · `parse_query_string` · `build_query_string` · `generate_markdown_table` · `ip_to_integer` · `integer_to_ip`

### Offline — Finance (13 tools)

`compound_interest` · `simple_interest` · `loan_payment` · `roi_calc` · `cagr_calc` · `break_even` · `npv_calc` · `tip_calc` · `inflation_calc` · `position_size` · `pe_ratio_calc` · `market_cap_calc` · `dollar_cost_avg`

### Offline — Science & Health (7 tools)

`bmi_calc` · `bmr_calc` (+ TDEE by activity) · `target_heart_rate` · `ohm_law` · `pythagorean` · `speed_distance_time` · `periodic_table`

### Offline — Fun (8 tools)

`flip_coin` · `roll_dice` · `magic_8ball` · `random_color` · `chinese_zodiac` · `luhn_check` · `password_strength` · `playing_card`

---

### Internet — Core

| Tool | What it does | Source |
|---|---|---|
| `get_weather` | Live weather for any city | wttr.in |
| `web_search` | Web search + Wikipedia + page fetch | DuckDuckGo + Wikipedia |
| `define_word` | English definitions, phonetics, synonyms | dictionaryapi.dev |
| `get_stock_price` | Real-time stock/ETF price | Yahoo Finance |
| `get_crypto_price` | Crypto price (BTC, ETH, SOL…) | CoinGecko |
| `get_exchange_rate` | Forex conversion | Open Exchange Rates |
| `get_ip_info` | IP geolocation | ipapi.co |
| `get_npm_package` | npm package details | npm registry |
| `get_github_repo` | GitHub repo stats | GitHub API |
| `get_country_info` | Capital, population, currency | REST Countries |
| `get_public_holidays` | National holidays | Nager.Date |
| `check_website` | HTTP status + response time | Direct HTTP |
| `get_news` | Hacker News top stories | HN API |
| `translate_text` | Translate to any language | MyMemory |
| `get_quote` | Random inspirational quote | Quotable |
| `get_trivia` | Random trivia Q&A | Open Trivia DB |

### Internet — Entertainment (15 tools)

`get_joke` · `get_dad_joke` · `get_random_fact` · `get_cat_fact` · `get_dog_image` · `get_pokemon` · `get_recipe` · `get_cocktail` · `get_book_by_isbn` · `search_books` · `get_anime` · `word_rhymes` · `word_synonyms` · `word_antonyms` · `get_random_word`

### Internet — Science & Nature (8 tools)

`get_iss_location` · `get_space_news` · `get_earthquakes` · `get_sunrise_sunset` · `search_arxiv` · `get_food_nutrition` · `geocode_address` · `reverse_geocode`

### Internet — Dev & Code (12 tools)

`get_github_user` · `get_github_releases` · `get_npm_downloads` · `get_pypi_package` · `get_crate_info` · `get_dns_records` · `check_ssl` · `get_http_headers` · `get_robots_txt` · `search_github_repos` · `get_github_issues` · `get_npm_versions`

### Internet — Finance & Markets (6 tools)

`get_fear_greed_index` · `get_historical_exchange_rate` · `get_currency_list` · `get_crypto_global_stats` · `get_trending_crypto` · `get_eth_gas_price`

### Internet — World & Geography (7 tools)

`get_countries_by_region` · `get_timezone_info` · `get_ip_country` · `get_border_countries` · `get_weather_forecast` · `get_air_quality` · `get_uv_index`

All tools are free and require no API keys.

---

## Expertise Areas

PowerfulTiger's system prompt is tuned for depth in:

**Software Engineering** — TypeScript/JavaScript, React, Next.js, Node.js, REST APIs, SQL, architecture (SOLID, clean architecture, DDD), performance profiling, security (OWASP Top 10), testing strategies, CI/CD, Docker, git workflows.

**Finance & Markets** — stocks, ETFs, bonds, options (Greeks, spreads), crypto (DeFi, staking, wallets), forex, DCF valuation, P/E and EV/EBITDA, personal finance (budgeting, compound interest, index funds), macro (Fed policy, CPI, yield curves).

---

## Persistent Memory

On `/exit`, PowerfulTiger extracts facts from the session (name, preferences, projects) and saves them to `~/.powerfultiger/memory.json`. These are injected into the next session's system prompt automatically.

Use `/memory` to see what it currently knows about you.

---

## Project Structure

```
src/
  chat.ts      — REPL loop, commands, tool display
  ollama.ts    — Ollama client, streaming, agentic tool loop, system prompt
  tools.ts     — 34 tool implementations + Ollama schema definitions
  memory.ts    — Load/save/format persistent user memory
  fallback.ts  — Demo mode (math + basic conversation, no Ollama needed)
  ui.ts        — ANSI colors, banner, help text
```

---

## Development

```bash
npm run lint        # ESLint
npm run type-check  # TypeScript (no emit)
npm run build       # Compile to dist/
npm start           # Run (auto-detects Ollama + best model)
npm start -- --demo # Demo mode
```

---

## How It Works

1. User sends a message
2. `streamChat` builds context: system prompt (date + memory) + last 20 messages
3. Ollama streams a response; if small talk is detected, tools are hidden entirely
4. If the model calls a tool, the result is fed back and the model continues — up to 8 iterations
5. Final text is streamed token by token with a braille spinner while generating
6. On `/exit`, a separate Ollama call extracts facts + summary and writes them to disk
