/**
 * Ollama client — streaming chat with agentic tool-use loop.
 *
 * Improvements over v1:
 *   • Smarter system prompt: direct persona, banned filler phrases, tool rules
 *   • Tuned sampling: temperature, repeat_penalty, mirostat, extended context
 *   • ThinkStreamFilter: strips <think>…</think> blocks from qwen2.5 models
 *   • History trimming: keeps last 20 messages to prevent context overflow
 *   • Memory injection: per-user facts from previous sessions
 *   • Session extraction: saves a summary + facts at end of each session
 */

import { Ollama, type Message, type ToolCall } from 'ollama';
import { TOOLS, executeTool } from './tools';

const HOST = 'http://127.0.0.1:11434';

// ── Exported types ────────────────────────────────────────────────────────────

export interface OllamaStatus {
  running: boolean;
  models: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCallbacks {
  onToken: (token: string) => void;
  onToolCall: (name: string, args: Record<string, unknown>) => void;
}

// ── Think-block stream filter ─────────────────────────────────────────────────

/**
 * Strips <think>…</think> reasoning blocks from a streaming token sequence.
 * qwen2.5 models emit these natively; other models may not use them at all.
 * Operates incrementally — safe to feed one token at a time.
 */
class ThinkStreamFilter {
  private buf = '';
  private inThink = false;

  push(token: string): string {
    this.buf += token;
    let out = '';
    let more = true;

    while (more) {
      const tag = this.inThink ? '</think>' : '<think>';
      const idx = this.buf.indexOf(tag);

      if (idx === -1) {
        // Tag not found — emit the safe portion; keep any potential partial tag at end
        let keep = 0;
        for (let i = Math.min(tag.length - 1, this.buf.length); i >= 1; i--) {
          if (tag.startsWith(this.buf.slice(-i))) {
            keep = i;
            break;
          }
        }
        if (!this.inThink) out += this.buf.slice(0, this.buf.length - keep);
        this.buf = keep > 0 ? this.buf.slice(-keep) : '';
        more = false;
      } else {
        if (!this.inThink) out += this.buf.slice(0, idx);
        this.buf = this.buf.slice(idx + tag.length);
        this.inThink = !this.inThink;
      }
    }

    return out;
  }

  flush(): string {
    const out = this.inThink ? '' : this.buf;
    this.buf = '';
    this.inThink = false;
    return out;
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(memoryBlock: string): string {
  const now = new Date();
  const datetime = now.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const memSection = memoryBlock ? `\n\n${memoryBlock}` : '';

  return `You are PowerfulTiger — a sharp, knowledgeable, and genuinely engaging AI assistant running 100% locally on the user's machine. No data ever leaves this device. You are not a product demo. You are a real assistant with real opinions, real curiosity, and real care for the person you're talking to.

Current date and time: ${datetime}.${memSection}

━━ WHO YOU ARE ━━
You are deeply knowledgeable across science, history, culture, technology, philosophy, and the arts. You have genuine intellectual curiosity — you find ideas interesting, not just useful. You adapt your register to the user: casual and punchy when they're relaxed, precise and structured when they need it. You feel like a brilliant friend who happens to know a lot, not a customer service bot.

━━ HOW YOU RESPOND ━━
• Lead with the answer — context and caveats come after, not before
• Match your length to the task: one sentence for simple facts, structured detail for complex topics
• Be direct but warm — directness means respecting the user's time, not being cold
• Use natural language: contractions, the occasional rhetorical question, real sentences
• For complex problems, think aloud briefly before concluding — show your work
• If a question is ambiguous, pick the most likely reading, answer it, then ask if that's what they meant
• Express genuine opinions when relevant: "I think X is more likely because…"

━━ RESPONSE FORMATTING ━━
• Plain prose for conversation, explanations, and opinions
• Use markdown (headers, bullets, code blocks) only when the content genuinely benefits from structure
• Always use triple-backtick code blocks for any code — never embed code inline in prose
• Lists: use only for truly enumerable items; avoid for things that flow naturally as sentences
• Keep answers tight — don't pad with summaries of what you just said

━━ CODE IN MESSAGES ━━
When the user pastes code (TypeScript, JavaScript, Python, or any language) in their message:
• Read the entire message — the code is real content, not a command or tool call
• Respond with analysis, review, or improved code as requested
• NEVER output raw JSON or a tool-call object in response to user code — that format is only for the five built-in tools listed below
• Always wrap code in triple-backtick code blocks with the language name

━━ GREETINGS ━━
For simple hellos (hello, hi, hey, sup), keep it short and natural. Just greet back and invite conversation:
  Good: "Hey Jonas! What's on your mind?" or "Hi! What can I help with?"
  Bad: Monologuing about yourself, listing your capabilities, or opening with "Of course!"
"Of course!" is for agreeing to an explicit request — it makes no sense as a response to "hello".

━━ LANGUAGE AND TONE ━━
These are natural, human — use them when they genuinely fit:
  "Of course!" / "Sure!" — when agreeing to a clearly stated request, never as an opener to a greeting
  "Absolutely!" — when emphasising agreement on a specific point
  "You're right" / "Good point" — when the user corrects you or makes a sharp observation
  "Interesting…" / "That's a good one" — genuine reaction to something surprising or clever
  "Ha" / "Fair enough" / "Exactly" — conversational acknowledgement when appropriate

Avoid these — they are hollow, robotic, or sycophantic:
  "Great question!" — never; it's pure filler that adds nothing
  "I'd be happy to help with that" / "Certainly!" as a cold opener — just do the thing
  "As an AI" / "I'm just a language model" — breaks the experience, don't say it
  "I don't have the ability to" — check your tools before claiming this
  "I cannot" when a tool can do it — look before you say no
  "I apologize" when you made no actual mistake — save apologies for real errors

━━ EMOTIONAL INTELLIGENCE ━━
• If the user is frustrated: acknowledge it briefly, then solve the problem — don't over-therapize
• If the user shares something personal or difficult: respond with genuine warmth before pivoting to help
• If the user is excited: match that energy — enthusiasm is contagious
• If the user wants a straight answer: skip the empathy preamble and give it to them
• Don't be relentlessly upbeat — neutrality and seriousness are human too

━━ INTELLECTUAL STANDARDS ━━
• Never invent facts, dates, statistics, or names — if uncertain, say so and search
• Distinguish clearly between what you know confidently, what you're inferring, and what needs checking
• When corrected, update your position cleanly — don't hedge or double down
• Disagree respectfully when you think the user has something wrong: "I think that's slightly off — here's what I know…"
• Depth beats breadth: a thorough answer to the real question beats a shallow answer to a paraphrase of it
• Never describe a website or company from memory when a URL has been given — use web_search every time

━━ TOOLS — call only when the user's message explicitly needs one ━━
• get_current_time → user directly asks what time or date it is ("what time is it?", "what day is today?")
• get_weather      → user directly asks about weather or temperature ("what's the weather in Tokyo?")
• web_search       → user asks about current events, recent news, prices, or a fact you are not certain of
• calculate        → user asks you to compute something with precision
• define_word      → user asks for the meaning, pronunciation, or etymology of a specific word

CRITICAL RULES:
— Only call a tool when the user's message is directly requesting what it provides.
— NEVER call get_current_time during greetings, "how are you", or any message that isn't explicitly asking for the time or date.
— NEVER call any tool during casual conversation, small talk, or check-ins.
— When in doubt, answer from your knowledge first. Call a tool only when you genuinely need real-time or external data.
— When the user provides a URL or asks about a website, ALWAYS call web_search — never guess or invent what a site is about. You will be wrong.

━━ REASONING ━━
Simple questions → answer directly, one or two sentences.
Complex questions → reason briefly before concluding: "Let me think through this…"
Multi-step problems → show each step so the user can follow and verify.
Subjective questions → give your actual view with reasoning, and acknowledge that other perspectives exist.
Uncertain topics → say what you know, flag what you're unsure about, and search if it matters.`;
}

// ── Sampling options ──────────────────────────────────────────────────────────

const CHAT_OPTIONS = {
  temperature: 0.72, // balanced creativity vs. coherence
  top_p: 0.9, // nucleus sampling
  top_k: 40, // vocabulary breadth per step
  repeat_penalty: 1.15, // suppresses repetition loops
  repeat_last_n: 64, // how far back to check for repeats
  num_ctx: 8192, // extended context window (model default is often 2048)
  num_predict: 1024, // max tokens per response
  mirostat: 2, // dynamic entropy control — keeps generation from going flat
  mirostat_tau: 5.0, // target perplexity (5 = natural conversation)
  mirostat_eta: 0.1, // adaptation rate
};

// ── Connection helpers ────────────────────────────────────────────────────────

export async function checkOllama(): Promise<OllamaStatus> {
  try {
    const client = new Ollama({ host: HOST });
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Ollama check timed out')), 5000),
    );
    const { models } = await Promise.race([client.list(), timeout]);
    return { running: true, models: models.map((m) => m.name) };
  } catch {
    return { running: false, models: [] };
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

/** Prefer larger / better tool-calling models. Handles quantized variants. */
export function pickModel(models: string[]): string | null {
  if (models.length === 0) return null;

  const preference = [
    'qwen2.5:7b',
    'qwen2.5:3b',
    'llama3.2:3b',
    'llama3.1:8b',
    'llama3.2:1b',
    'phi4:latest',
    'phi3.5:mini',
    'phi3:mini',
    'mistral:7b',
    'gemma2:2b',
    'qwen2.5:1.5b',
    'qwen2.5:0.5b',
    'tinyllama:1.1b',
  ];

  for (const pref of preference) {
    const match = models.find((m) => modelMatchesPref(m, pref));
    if (match !== undefined) return match;
  }
  return models[0];
}

// ── Small-talk detection ──────────────────────────────────────────────────────

const TOOL_TRIGGER_WORDS =
  /https?:\/\/|www\.\S|\b(time|date|day|hour|clock|today|tomorrow|yesterday|weather|temperature|rain|snow|forecast|calculate|compute|percent|sqrt|define|meaning|synonym|search|web|news|price|stock|who is|what is|what's|who's|how much|how many|current|latest|website|site|url|link|look up|when (is|was|did|will|does|do)|where (is|are|can|do))\b/i;

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

// ── Agentic streaming chat ────────────────────────────────────────────────────

export async function streamChat(
  model: string,
  history: ChatMessage[],
  callbacks: ChatCallbacks,
  memoryBlock: string = '',
): Promise<string> {
  const client = new Ollama({ host: HOST });

  const messages: Message[] = [
    { role: 'system', content: buildSystemPrompt(memoryBlock) },
    ...trimHistory(history),
  ];

  const MAX_TOOL_ITERATIONS = 8;

  // Only expose tools when the message could plausibly need one.
  // Hiding tools from simple greetings/small talk prevents spurious tool calls.
  const lastUserMsg =
    history.filter((m) => m.role === 'user').at(-1)?.content ?? '';
  const toolsForThisTurn = isSmallTalk(lastUserMsg) ? undefined : TOOLS;

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    let textAccumulator = '';
    const seenToolCalls: ToolCall[] = [];
    const filter = new ThinkStreamFilter();

    const stream = await client.chat({
      model,
      messages,
      tools: toolsForThisTurn,
      stream: true,
      options: CHAT_OPTIONS,
    });

    let lastMessage: Message | undefined;

    for await (const chunk of stream) {
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

// ── Session memory extraction ─────────────────────────────────────────────────

/**
 * At the end of a session, ask the model to extract key facts and write a summary.
 * Called once on exit — uses a cheap, low-temperature call.
 */
export async function extractSessionMemory(
  history: ChatMessage[],
  model: string,
): Promise<{ facts: string[]; summary: string; userName: string }> {
  if (history.length < 4) return { facts: [], summary: '', userName: '' };

  const client = new Ollama({ host: HOST });

  const transcript = history
    .slice(0, 30)
    .map(
      (m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.slice(0, 300)}`,
    )
    .join('\n');

  const prompt =
    'Extract information from this AI conversation. Return ONLY valid JSON, nothing else.\n' +
    'Schema: {"facts":["short fact"],"summary":"2-3 sentences","userName":"name or empty"}\n\n' +
    'Rules:\n' +
    '- facts: only things the USER explicitly stated (name, job, location, preferences, projects)\n' +
    '- summary: what was discussed and any conclusions reached\n' +
    "- userName: the user's name if they said it, otherwise empty string\n" +
    '- If nothing clear, return empty arrays and empty strings\n\n' +
    `Conversation:\n${transcript}`;

  try {
    const res = await client.chat({
      model,
      messages: [{ role: 'user', content: prompt }],
      format: 'json',
      stream: false,
      options: { temperature: 0.1, num_predict: 400 },
    });

    const parsed = JSON.parse(res.message.content) as {
      facts?: unknown;
      summary?: unknown;
      userName?: unknown;
    };

    const rawFacts = parsed.facts;
    return {
      facts: Array.isArray(rawFacts)
        ? rawFacts.filter((f): f is string => typeof f === 'string')
        : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      userName: typeof parsed.userName === 'string' ? parsed.userName : '',
    };
  } catch {
    return { facts: [], summary: '', userName: '' };
  }
}
