# PowerfulTiger

A local AI assistant that runs 100% on your machine. No cloud, no API keys, no data leaving your device. Powered by [Ollama](https://ollama.com) with real-time tools for time, weather, web search, math, and word definitions.

---

## Features

- **Streaming responses** — output appears word by word, just like a real conversation
- **Agentic tool use** — the model autonomously calls tools and reasons over results
- **5 built-in tools** — current time, live weather, web search, calculator, dictionary
- **Persistent memory** — remembers your name, facts, and session summaries across conversations
- **Smart model selection** — auto-picks the best available Ollama model, handles quantized variants
- **Think-block filtering** — strips internal reasoning from qwen2.5 models so only clean answers are shown
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

# 2. Pull a model (run once)
ollama pull llama3.2:3b

# 3. Start chatting
npm start
```

To run without Ollama (demo mode only):

```bash
npm start -- --demo
```

---

## Recommended Models

PowerfulTiger picks the best installed model automatically, in this priority order:

| Model | Size | Notes |
|---|---|---|
| `qwen2.5:7b` | ~4 GB | Best tool-calling accuracy |
| `qwen2.5:3b` | ~2 GB | Great balance of speed and quality |
| `llama3.2:3b` | ~2 GB | Solid default, good tool use |
| `llama3.1:8b` | ~5 GB | Strong reasoning |
| `llama3.2:1b` | ~1 GB | Fastest, limited capability |

Quantized variants (e.g. `qwen2.5:7b-instruct-q4_K_M`) are automatically matched to their base preference.

---

## Commands

| Command | What it does |
|---|---|
| `/help` | Show available commands |
| `/model` | Show the current model |
| `/memory` | Show what PowerfulTiger remembers about you |
| `/clear` | Wipe the conversation history for this session |
| `/exit` | Quit and save session memory |

`exit`, `quit`, and Ctrl+C also work.

---

## Tools

The model calls these automatically — no manual invocation needed.

| Tool | Trigger | Source |
|---|---|---|
| `get_current_time` | Any time or date question | System clock via `Intl` |
| `get_weather` | Any weather or temperature question | [wttr.in](https://wttr.in) |
| `web_search` | Current events, facts, news | DuckDuckGo + Wikipedia |
| `calculate` | Any math expression | Safe `Function` evaluator |
| `define_word` | Word definitions or meanings | [Free Dictionary API](https://dictionaryapi.dev) |

All tools are free and require no API keys.

---

## Persistent Memory

PowerfulTiger learns about you over time. On `/exit`, it extracts facts from the session (name, preferences, projects) and saves them to `~/.powerfultiger/memory.json`. These are silently injected into the next session's system prompt.

Use `/memory` to see what it currently knows about you.

---

## Project Structure

```
src/
  chat.ts      — REPL loop, commands, tool display
  ollama.ts    — Ollama client, streaming, agentic tool loop
  tools.ts     — Tool implementations and Ollama schema definitions
  memory.ts    — Load/save/format persistent user memory
  fallback.ts  — Demo mode (math + basic conversation, no Ollama needed)
  ui.ts        — ANSI colors, banner, help text
```

---

## Development

```bash
npm run lint          # ESLint
npm run type-check    # TypeScript (no emit)
npm run build         # Compile to dist/
```

---

## How It Works

1. User sends a message
2. `streamChat` builds a context: system prompt (with today's date + memory) + last 20 messages
3. Ollama streams a response with tool definitions available
4. If the model calls a tool, the result is fed back and the model continues — up to 8 iterations
5. Final text is streamed to the terminal token by token
6. On `/exit`, a separate Ollama call extracts facts and a summary from the session and writes them to disk
