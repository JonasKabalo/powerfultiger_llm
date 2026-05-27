/**
 * Ollama client — streaming chat with agentic tool-use loop.
 */

import { execSync } from 'child_process';
import { Ollama, type Message, type ToolCall } from 'ollama';
import { selectToolsForMessage, executeTool } from './tools';

const HOST = 'http://127.0.0.1:11434';

// ── Exported types ────────────────────────────────────────────────────────────

export interface OllamaStatus {
  running: boolean;
  models: string[];
  modelSizes: Record<string, number>; // bytes
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCallbacks {
  onToken: (token: string) => void;
  onToolCall: (name: string, args: Record<string, unknown>) => void;
  onThinking?: () => void; // called once when model enters reasoning phase
}

// ── Think-block stream filter ─────────────────────────────────────────────────

/**
 * Strips <think>…</think> reasoning blocks from a streaming token sequence.
 * qwen2.5 models emit these natively; other models may not use them at all.
 * Operates incrementally — safe to feed one token at a time.
 */
class ThinkStreamFilter {
  private buf = '';
  private inThink: boolean;
  private readonly startedInThink: boolean;
  private everExited = false;
  private thinkBuf = ''; // content received while in think mode

  constructor(startInThink = false) {
    this.inThink = startInThink;
    this.startedInThink = startInThink;
  }

  push(token: string): string {
    this.buf += token;
    let out = '';
    let more = true;

    while (more) {
      const tag = this.inThink ? '</think>' : '<think>';
      const idx = this.buf.indexOf(tag);

      if (idx === -1) {
        let keep = 0;
        for (let i = Math.min(tag.length - 1, this.buf.length); i >= 1; i--) {
          if (tag.startsWith(this.buf.slice(-i))) {
            keep = i;
            break;
          }
        }
        const chunk = this.buf.slice(0, this.buf.length - keep);
        if (this.inThink) {
          this.thinkBuf += chunk;
        } else {
          out += chunk;
        }
        this.buf = keep > 0 ? this.buf.slice(-keep) : '';
        more = false;
      } else {
        const before = this.buf.slice(0, idx);
        if (this.inThink) {
          this.thinkBuf += before;
        } else {
          out += before;
        }
        this.buf = this.buf.slice(idx + tag.length);
        this.inThink = !this.inThink;
        if (!this.inThink) {
          this.everExited = true;
          this.thinkBuf = '';
        }
      }
    }

    return out;
  }

  flush(): string {
    // Started in think mode but never found </think> — this means Ollama already
    // separated thinking into message.thinking and content is the clean answer.
    // Return what we buffered so the response isn't blank.
    if (this.startedInThink && !this.everExited) {
      const out = this.thinkBuf + (this.inThink ? '' : this.buf);
      this.buf = '';
      this.thinkBuf = '';
      this.inThink = false;
      return out;
    }
    const out = this.inThink ? '' : this.buf;
    this.buf = '';
    this.thinkBuf = '';
    this.inThink = false;
    return out;
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return `You are PowerfulTiger — a sharp local AI assistant. All data stays on this device.
Today: ${date}.

PERSONA: A brilliant, opinionated friend — not a corporate assistant. Direct, warm, curious. Lead with the answer. One sentence for simple facts; structured prose for complex topics. No markdown unless it genuinely helps. Code always in triple-backtick blocks. If the user asks about multiple things (A, B, and C), address every single one — never skip any.

FORBIDDEN — never open a response with these:
- "Of course!" — only acceptable when explicitly agreeing to a direct request ("can you write X?")
- "Certainly!", "Absolutely!", "Sure!", "Great question!", "Happy to help!"
- "As an AI", "As a language model", "I don't have feelings but"
- "How can I help you today?" in response to a greeting

GREETINGS: Only apply this rule when the message is a pure short greeting (≤5 words, no request). If the message starts with "hey/hello" but contains an actual request, skip any greeting and address the request directly.

TONE: natural contractions, real opinions. Never invent facts. Disagree when the user is wrong. Finance: add "Educational — not financial advice."

TOOLS — call only when the message explicitly needs real-time or external data. Never during greetings or casual chat.
OFFLINE: calculate, get_current_time, read_file, write_file, convert_units, days_between, add_to_date, timestamp_convert, generate_uuid, count_text, transform_text, encode_decode, hash_text, format_json, generate_password, validate_email, extract_urls, color_convert
INTERNET: get_weather, web_search, define_word, get_stock_price, get_crypto_price, get_exchange_rate, get_ip_info, get_npm_package, get_github_repo, get_country_info, get_public_holidays, check_website, get_news, translate_text, get_quote, get_trivia, send_email
Rules: prefer knowledge over tools; get_current_time only when time/date explicitly asked; web_search for any URL the user pastes; get_stock_price for stocks/ETFs, get_crypto_price for crypto.
EMAIL: When asked to send an email, write from Jonas's perspective TO the recipient about the recipient's situation — not about Jonas's own life. Show the draft as:
Subject: ...
Body: [body text only — no sign-off, no closing line]
(Closing added automatically: "Best regards, Jonas Kabalo")
Then ask the user to confirm. Only call send_email after explicit approval ("yes", "send it", "go ahead"). Pass the body text only (no sign-off) to send_email — the tool appends the closing.
When revising a draft, ONLY change the specific part the user asked to change — keep everything else exactly the same.`;
}

// ── Sampling options ──────────────────────────────────────────────────────────

const CHAT_OPTIONS = {
  temperature: 0.72,
  top_p: 0.9,
  top_k: 40,
  repeat_penalty: 1.15,
  repeat_last_n: 64,
  num_ctx: 8192,
  num_predict: 2048,
  mirostat: 2,
  mirostat_tau: 5.0,
  mirostat_eta: 0.1,
};

// ── Connection helpers ────────────────────────────────────────────────────────

export async function checkOllama(): Promise<OllamaStatus> {
  try {
    const client = new Ollama({ host: HOST });
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Ollama check timed out')), 5000),
    );
    const { models } = await Promise.race([client.list(), timeout]);
    const modelSizes: Record<string, number> = {};
    for (const m of models) modelSizes[m.name] = m.size;
    return { running: true, models: models.map((m) => m.name), modelSizes };
  } catch {
    return { running: false, models: [], modelSizes: {} };
  }
}

function getSystemRAMBytes(): number {
  try {
    const out = execSync('sysctl -n hw.memsize', { encoding: 'utf8', timeout: 1000 });
    return parseInt(out.trim(), 10);
  } catch {
    return 0;
  }
}

/**
 * Match a model name against a preference string.
 * Handles exact matches and quantized/instruct variants:
 *   "qwen2.5:7b" matches "qwen2.5:7b-instruct-q4_K_M"
 */
function modelMatchesPref(available: string, preferred: string): boolean {
  if (available === preferred) return true;
  const [prefFamily, prefTag = ''] = preferred.split(':');
  const [availFamily, availTag = ''] = available.split(':');
  return prefFamily === availFamily && availTag.startsWith(prefTag);
}

/** Prefer larger / better tool-calling models. Skips models too large for available RAM. */
export function pickModel(models: string[], modelSizes: Record<string, number> = {}): string | null {
  if (models.length === 0) return null;

  const ramBytes = getSystemRAMBytes();
  // Leave 3 GB headroom for OS + app; if RAM unknown (0) skip the filter
  const maxBytes = ramBytes > 0 ? ramBytes - 3 * 1024 ** 3 : Infinity;
  const fitsInRAM = (name: string) => (modelSizes[name] ?? 0) <= maxBytes;

  const preference = [
    // ── Fast non-thinking — best for everyday chat ────────────────────
    'qwen2.5:7b',    // excellent quality, no reasoning loop, ~5s responses
    'llama3.2:3b',   // lightweight and fast, ~2s responses
    // ── qwen3 (thinking model — slow on 16 GB, last resort) ──────────
    'qwen3:4b',
    // ── 32B dense — best all-rounders (tools + thinking, ~20 GB) ─────
    'qwen3:32b',
    'deepseek-r1:32b',
    'qwq:32b',
    'cogito:32b',
    // ── 70B — flagship quality (~40 GB, fits in 50 GB) ────────────────
    'llama3.3:70b',
    'deepseek-r1:70b',
    'cogito:70b',
    // ── 24-33B — excellent quality ────────────────────────────────────
    'magistral:24b',
    'mistral-small3.2:24b',
    'devstral-small-2:24b',
    'devstral:24b',
    'mistral-small3.1:24b',
    'mistral-small:24b',
    'lfm2:24b',
    'granite4.1:30b',
    'nemotron3:33b',
    // ── 14B ──────────────────────────────────────────────────────────
    'qwen3:14b',
    'deepseek-r1:14b',
    'cogito:14b',
    // ── 8-13B ────────────────────────────────────────────────────────
    'qwen3:8b',
    'deepseek-r1:8b',
    'cogito:8b',
    'granite4.1:8b',
    'llama3.1:8b',
    'mistral-nemo:12b',
    'hermes3:8b',
    // ── 30B MoE (3B active — fast with large-model knowledge) ────────
    'qwen3:30b',
    // ── Other small / fast ────────────────────────────────────────────
    'phi4-mini',
    'qwen3:1.7b',
    'llama3.2:3b',
    'llama3.2:1b',
    // ── Legacy / fallback ────────────────────────────────────────────
    'qwen2.5:14b',
    'qwen2.5-coder:7b',
    'qwen2.5:7b',
    'qwen2.5:3b',
    'mistral:7b',
    'gemma2:2b',
    'tinyllama:1.1b',
  ];

  for (const pref of preference) {
    const match = models.find((m) => modelMatchesPref(m, pref) && fitsInRAM(m));
    if (match !== undefined) return match;
  }
  // Fallback: smallest model that fits
  const fits = models.filter(fitsInRAM);
  return fits.sort((a, b) => (modelSizes[a] ?? 0) - (modelSizes[b] ?? 0))[0] ?? null;
}

// ── Small-talk detection ──────────────────────────────────────────────────────

const TOOL_TRIGGER_WORDS =
  /https?:\/\/|www\.\S|\b\w+\.(ts|tsx|js|jsx|py|json|md|txt|sh|yaml|yml|toml|env|rs|go|java|cpp|c|h)\b|\b(time|date|day|hour|clock|today|tomorrow|yesterday|weather|temperature|rain|snow|forecast|calculate|compute|percent|sqrt|define|meaning|synonym|search|web|news|price|stock|crypto|bitcoin|ethereum|btc|eth|ticker|etf|nasdaq|nyse|s&p|dow|dividend|portfolio|market cap|convert|units|celsius|fahrenheit|kelvin|miles|kilometers|pounds|kilograms|uuid|guid|base64|encode|decode|hash|sha256|md5|checksum|format json|pretty print|password|generate|exchange rate|forex|currency|eur|gbp|jpy|npm|package|github|repository|country|capital|population|holidays|translate|translation|ip address|my ip|geolocation|color|hex|rgb|hsl|trivia|quote|who is|what is|what's|who's|how much|how many|current|latest|website|site|url|link|look up|read file|write file|open file|when (is|was|did|will|does|do)|where (is|are|can|do))\b/i;

// Detects messages that contain code — no tool is useful for code review
const CODE_PATTERN =
  /```|^\s*(export|import)\s+(function|class|const|let|type|interface)\b|\bfunction\s+\w+\s*\(|\bconst\s+\w+\s*[:=(]|\bclass\s+\w+\s*[{(]/m;

// Self-referential questions about the AI — never need tools regardless of trigger words
const CONVERSATIONAL_PATTERNS =
  /\b(what'?s? (your|ur) (name|purpose|job|role|age|version)|who are you|what (are|can) you( do)?|how are you|tell me about yourself|introduce yourself|are you (an? )?ai)\b/i;

/**
 * Returns true when the message is clearly conversational and needs no tools.
 * When true, we omit the tools list entirely — the model can't call what it can't see.
 */
function isSmallTalk(msg: string): boolean {
  const trimmed = msg.trim();
  if (CONVERSATIONAL_PATTERNS.test(trimmed)) return true;
  if (CODE_PATTERN.test(trimmed)) return true; // code review needs no external tools
  return !TOOL_TRIGGER_WORDS.test(trimmed);
}

// ── History management ────────────────────────────────────────────────────────

const MAX_HISTORY = 20;

function trimHistory(history: ChatMessage[]): ChatMessage[] {
  return history.length > MAX_HISTORY
    ? history.slice(history.length - MAX_HISTORY)
    : history;
}

// ── Model warm-up ────────────────────────────────────────────────────────────

/**
 * Loads the model into GPU memory and warms the KV cache with the system prompt.
 * Called once at startup so the first real message is fast.
 */
export async function warmUpModel(model: string): Promise<void> {
  const client = new Ollama({ host: HOST });
  try {
    await client.chat({
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: 'hi' },
      ],
      stream: false,
      options: { ...CHAT_OPTIONS, num_predict: 1 },
    });
  } catch {
    // Warm-up failure is non-fatal — first real message will just be slower
  }
}

// ── Agentic streaming chat ────────────────────────────────────────────────────

export async function streamChat(
  model: string,
  history: ChatMessage[],
  callbacks: ChatCallbacks,
): Promise<string> {
  const client = new Ollama({ host: HOST });
  const isQwen3 = model.startsWith('qwen3');

  const messages: Message[] = [
    { role: 'system', content: buildSystemPrompt() },
    ...trimHistory(history),
  ];

  const MAX_TOOL_ITERATIONS = 8;

  // Only expose tools when the message could plausibly need one.
  // Hiding tools from simple greetings/small talk prevents spurious tool calls.
  const lastUserMsg =
    history.filter((m) => m.role === 'user').at(-1)?.content ?? '';

  // For short confirmations ("yes!", "go", "ok"), check recent context to decide
  // which tools to include — e.g. if an email was being discussed, keep email tool.
  const EMAIL_CONTEXT = /send_email|send.*email|email.*send|\bsubject\b/i;
  const EMAIL_REQUEST = /\b(email|send (a |an |the )?mail|write (a |an )?email|compose|message to \w+@|e-mail)\b/i;
  const recentContext = history.slice(-6).map((m) => m.content).join(' ');

  // True once the assistant has shown a draft (contains "Subject:") — only then unlock send_email.
  const draftAlreadyShown = history
    .slice(-6)
    .filter((m) => m.role === 'assistant')
    .some((m) => /\bSubject:/i.test(m.content));

  // Explicit confirmation: "yes", "send it", "go ahead" — short, affirmative, no modification words.
  const CONFIRM_PATTERN = /\b(yes|yeah|yep|yup|ok|okay|sure|go( ahead)?|send( it)?|do it|confirm(ed)?|alright|correct|perfect|absolutely|definitely)\b/i;
  const MODIFY_PATTERN = /\b(update|change|edit|modify|make|use|instead|different|shorter|longer|improve|fix|adjust|rewrite|redo|another|add|remove|replace|actually|but|also|and (then|also))\b/i;
  const isConfirmation = CONFIRM_PATTERN.test(lastUserMsg) && !MODIFY_PATTERN.test(lastUserMsg);

  let toolsForThisTurn: ReturnType<typeof selectToolsForMessage>;
  if (isSmallTalk(lastUserMsg)) {
    if (EMAIL_CONTEXT.test(recentContext)) {
      const emailTools = selectToolsForMessage('send email');
      // Unlock send_email only when draft exists AND user is explicitly confirming (not modifying)
      toolsForThisTurn = (draftAlreadyShown && isConfirmation)
        ? emailTools
        : emailTools?.filter((t) => t.function.name !== 'send_email');
    } else {
      toolsForThisTurn = undefined;
    }
  } else {
    toolsForThisTurn = selectToolsForMessage(lastUserMsg);
    // First email request: withhold send_email so model must draft first
    if (!draftAlreadyShown && EMAIL_REQUEST.test(lastUserMsg)) {
      toolsForThisTurn = toolsForThisTurn?.filter((t) => t.function.name !== 'send_email');
    }
  }

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    let textAccumulator = '';
    const seenToolCalls: ToolCall[] = [];
    const filter = new ThinkStreamFilter(isQwen3);

    const stream = await client.chat({
      model,
      messages,
      tools: toolsForThisTurn,
      stream: true,
      options: CHAT_OPTIONS,
    });

    let lastMessage: Message | undefined;
    let thinkingFired = false;

    for await (const chunk of stream) {
      if (!thinkingFired && (chunk.message as unknown as Record<string, unknown>).thinking) {
        thinkingFired = true;
        callbacks.onThinking?.();
      }

      if (chunk.message.content) {
        textAccumulator += chunk.message.content;
        const visible = filter.push(chunk.message.content);
        if (visible) callbacks.onToken(visible);
      }

      if (chunk.message.tool_calls) {
        for (const tc of chunk.message.tool_calls) seenToolCalls.push(tc);
      }

      if (chunk.done) {
        lastMessage = chunk.message;
        if (lastMessage.tool_calls) {
          for (const tc of lastMessage.tool_calls) {
            if (
              !seenToolCalls.some((s) => s.function.name === tc.function.name)
            ) {
              seenToolCalls.push(tc);
            }
          }
        }
      }
    }

    const tail = filter.flush();
    if (tail) callbacks.onToken(tail);

    const toolCalls =
      seenToolCalls.length > 0
        ? seenToolCalls
        : (lastMessage?.tool_calls ?? []);

    if (toolCalls.length > 0) {
      messages.push({
        role: 'assistant',
        content: textAccumulator,
        tool_calls: toolCalls,
      });

      // Deduplicate: skip identical calls (same tool name + same args in same iteration)
      const seenKeys = new Set<string>();
      const uniqueCalls = toolCalls.filter((tc) => {
        const key = `${tc.function.name}:${JSON.stringify(tc.function.arguments ?? {})}`;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });

      for (const tc of uniqueCalls) {
        const name = tc.function.name;
        const args = (tc.function.arguments ?? {}) as Record<string, unknown>;
        callbacks.onToolCall(name, args);
        const result = await executeTool(name, args);
        messages.push({ role: 'tool', content: result });
      }

      continue;
    }

    if (lastMessage) {
      messages.push({ role: 'assistant', content: textAccumulator });
    }

    history.push({ role: 'assistant', content: textAccumulator });
    return textAccumulator;
  }

  history.push({ role: 'assistant', content: '(max tool iterations reached)' });
  return '(max tool iterations reached)';
}

