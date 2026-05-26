/**
 * Demo mode — works without Ollama.
 * Handles math, greetings, and basic conversation.
 * NOT document-based: all responses are code-driven logic.
 */

// ── Math evaluator ────────────────────────────────────────────────────────────

function safeMathEval(expr: string): number | null {
  // Normalise the expression
  const normalised = expr
    .replace(/\^/g, '**')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\bsqrt\b/gi, 'Math.sqrt')
    .replace(/\babs\b/gi, 'Math.abs')
    .replace(/\bfloor\b/gi, 'Math.floor')
    .replace(/\bceil\b/gi, 'Math.ceil')
    .replace(/\bround\b/gi, 'Math.round')
    .replace(/\bpi\b/gi, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
    .replace(/\bsin\b/gi, 'Math.sin')
    .replace(/\bcos\b/gi, 'Math.cos')
    .replace(/\btan\b/gi, 'Math.tan');

  // Whitelist check: after substituting known safe tokens, only digits and operators remain
  const stripped = normalised.replace(
    /Math\.(sqrt|abs|floor|ceil|round|PI|E|sin|cos|tan)\b/g,
    '1',
  );
  if (!/^[\d\s+\-*/.(),%]+$/.test(stripped)) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const result = new Function(
      `"use strict"; return (${normalised})`,
    )() as unknown;
    if (typeof result === 'number' && isFinite(result)) {
      // Round to avoid floating-point noise
      const rounded = Math.round(result * 1e9) / 1e9;
      return rounded;
    }
  } catch {
    // Invalid expression
  }

  return null;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  // Up to 6 significant decimals, strip trailing zeros
  return parseFloat(n.toPrecision(8)).toString();
}

export function tryMath(input: string): string | null {
  const text = input.trim();

  // Pattern: "X% of Y" or "what is X% of Y?"
  const pctOfMatch =
    /(?:what(?:'s| is)\s+)?(\d+(?:\.\d+)?)\s*%\s*of\s+(\d+(?:\.\d+)?)\??$/i.exec(
      text,
    );
  if (pctOfMatch) {
    const pct = parseFloat(pctOfMatch[1]);
    const base = parseFloat(pctOfMatch[2]);
    const res = (pct / 100) * base;
    return `${pct}% of ${base} = ${formatNumber(res)}`;
  }

  // Direct expression: "2 + 2", "sqrt(16)", "3^3"
  const result = safeMathEval(text);
  if (result !== null) return `${text} = ${formatNumber(result)}`;

  // Natural question: "what is 2 + 2?", "what's 10 * 5"
  const match =
    /what(?:'s| is)\s+([\d\s+\-*/^().,%sqrtpicosintanfloorceila]+)\??$/i.exec(
      text,
    );
  if (match) {
    const candidate = match[1].trim();
    const res = safeMathEval(candidate);
    if (res !== null) return `${candidate} = ${formatNumber(res)}`;
  }

  return null;
}

// ── Conversational responses ──────────────────────────────────────────────────

interface ConvoEntry {
  patterns: RegExp[];
  responses: string[];
}

const CONVO: ConvoEntry[] = [
  {
    patterns: [/^(hi+|hello|hey|howdy|yo|sup|hiya|bonjour|salut|ciao)\b/i],
    responses: [
      "Hello! I'm PowerfulTiger, running in demo mode. Ask me math or basic questions!",
      "Hey! Good to see you. I'm limited in demo mode — but install Ollama and I'll answer anything.",
      'Hi there! What can I do for you today?',
    ],
  },
  {
    patterns: [
      /how are you/i,
      /how('s| is) it going/i,
      /how do you feel/i,
      /what'?s up/i,
      /you (doing|good|ok)\??/i,
    ],
    responses: [
      "I'm doing great, thanks for asking! Running demo mode right now, but fully local — no data leaves your machine.",
      "Good! I'm PowerfulTiger running on your hardware. No internet, no cloud. Add Ollama to unlock my full potential!",
      "Running smoothly! I'm in demo mode — I handle math and basic chat. How are YOU doing?",
    ],
  },
  {
    patterns: [
      /what('s| is) your name/i,
      /who are you/i,
      /introduce yourself/i,
      /what are you/i,
      /tell me about yourself/i,
    ],
    responses: [
      "I'm PowerfulTiger — a local AI assistant that runs 100% on your machine. No data sent to the cloud, full privacy.",
      "My name is PowerfulTiger. I'm designed to run local AI models via Ollama. Right now I'm in demo mode while you set things up!",
    ],
  },
  {
    patterns: [
      /tell me a joke/i,
      /joke/i,
      /say something funny/i,
      /make me laugh/i,
    ],
    responses: [
      "Why don't scientists trust atoms?\nBecause they make up everything! 😄",
      "Why did the programmer quit his job?\nBecause he didn't get arrays! 💻",
      'What do you call a fake noodle?\nAn impasta! 🍝',
      'I tried to write a joke about AI... but it kept predicting the punchline.',
      'Why is 6 afraid of 7?\nBecause 7 8 9! 😂',
    ],
  },
  {
    patterns: [
      /what can you do/i,
      /your capabilities/i,
      /what do you (know|handle)/i,
      /^help$/i,
    ],
    responses: [
      "In demo mode I can:\n  • Do math: try '2+2', 'sqrt(144)', '15% of 80'\n  • Chat: greetings, jokes, basic questions\n\nInstall Ollama + pull a model → I become a full AI assistant that answers ANYTHING.",
    ],
  },
  {
    patterns: [
      /install ollama/i,
      /how.*(get|setup|run).*full/i,
      /pull.*model/i,
      /ollama.*download/i,
    ],
    responses: [
      `Here's how to unlock the full PowerfulTiger:\n\n  1. Download Ollama from \x1b[96mhttps://ollama.com/download\x1b[0m\n  2. Open a terminal and run: \x1b[96mollama pull llama3.2:3b\x1b[0m\n  3. Start the app: \x1b[96mnpm start\x1b[0m\n\nThat's it — then I can answer anything!`,
    ],
  },
  {
    patterns: [/meaning of life/i, /\b42\b.*life/i],
    responses: [
      "42 — according to The Hitchhiker's Guide to the Galaxy. The harder question is: what's the question?",
      'Philosophers have debated this forever. My take: create meaning through what you do and who you help.',
    ],
  },
  {
    patterns: [/thank(s| you)/i, /\bthx\b/i, /\bty\b/i, /appreciate/i],
    responses: [
      "You're welcome! Happy to help.",
      "Anytime! That's what I'm here for.",
      'My pleasure! 🐯',
    ],
  },
  {
    patterns: [/^(bye|goodbye|see you|cya|goodnight|good night|take care)\b/i],
    responses: [
      'Goodbye! Come back anytime. 🐯',
      "See you! Don't forget — install Ollama to unlock the full experience.",
      'Take care!',
    ],
  },
  {
    patterns: [/are you (smart|intelligent|ai|real|sentient)/i],
    responses: [
      "I'm an AI assistant — in demo mode right now, which means limited capabilities. With Ollama I can hold full intelligent conversations on any topic.",
      "Smart enough to handle demo mode! For real intelligence, pull an Ollama model and I'll show you what I can do.",
    ],
  },
];

const FALLBACKS = [
  "I'm in demo mode — I handle math and basic conversation. For complex questions, set up Ollama:\n  \x1b[96mollama pull llama3.2:3b\x1b[0m → then ask me anything!",
  "Great question, but I need a real model for that! Run \x1b[96mollama pull llama3.2:3b\x1b[0m and I'll answer properly.",
  "Demo mode doesn't cover that. Install Ollama and I'll become a proper AI assistant that can handle any topic.",
];

let fallbackIdx = 0;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getBuiltinResponse(input: string): string {
  const text = input.trim();

  // 1. Math first
  const math = tryMath(text);
  if (math !== null) return math;

  // 2. Date/time — evaluated fresh each call (not at module load time)
  if (/what('s| is) (today|the date|the time)\b/i.test(text)) {
    return `Today is ${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}.`;
  }

  // 3. Conversational patterns
  for (const entry of CONVO) {
    if (entry.patterns.some((p) => p.test(text))) {
      return pickRandom(entry.responses);
    }
  }

  // 3. Rotate through fallback messages
  const msg = FALLBACKS[fallbackIdx % FALLBACKS.length];
  fallbackIdx++;
  return msg;
}
