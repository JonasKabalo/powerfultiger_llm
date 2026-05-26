/**
 * PowerfulTiger — main chat REPL.
 *
 * Usage:
 *   npm start               → auto-detect Ollama model
 *   npm start -- --demo     → force demo mode (no Ollama needed)
 */

import * as readline from 'readline';
import {
  checkOllama,
  pickModel,
  streamChat,
  extractSessionMemory,
  type ChatMessage,
} from './ollama';
import { loadMemory, saveMemory, buildMemoryBlock } from './memory';
import { getBuiltinResponse } from './fallback';
import { c, printBanner, printHelp, printModelInfo } from './ui';

// ── CLI flags ─────────────────────────────────────────────────────────────────

const forceDemo = process.argv.includes('--demo');

// ── Tool display labels ───────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  get_current_time: '🕐 Checking the time',
  get_weather: '🌤️  Checking the weather',
  web_search: '🌐 Searching the web',
  calculate: '🔢 Calculating',
  define_word: '📖 Looking up definition',
};

function toolLabel(name: string, args: Record<string, unknown>): string {
  const base = TOOL_LABELS[name] ?? `🔧 Running ${name}`;

  if (name === 'get_current_time' && args.timezone)
    return `${base} for ${String(args.timezone)}`;
  if (name === 'get_weather' && args.location)
    return `${base} for ${String(args.location)}`;
  if (name === 'web_search' && args.query)
    return `${base}: "${String(args.query)}"`;
  if (name === 'calculate' && args.expression)
    return `${base}: ${String(args.expression)}`;
  if (name === 'define_word' && args.word)
    return `${base}: "${String(args.word)}"`;
  return base;
}

// ── Readline helper ───────────────────────────────────────────────────────────

function createRL(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY === true,
  });
}

function ask(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const onClose = () => reject(new Error('stdin closed'));
    rl.once('close', onClose);
    rl.question(prompt, (answer) => {
      rl.removeListener('close', onClose);
      resolve(answer);
    });
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
      const chosen = pickModel(status.models);
      if (chosen === null) {
        console.log(
          `\n${c.brightYellow('⚡ PowerfulTiger')} — ${c.red('No models installed.')}\n\n` +
            `Run: ${c.cyan('ollama pull llama3.2:3b')}\n`,
        );
        console.log(c.dim('Starting in demo mode…\n'));
      } else {
        model = chosen;
        isDemo = false;
      }
    } else {
      console.log(
        c.dim('Ollama not running — demo mode.\n') +
          c.dim(`Enable full AI: ${c.cyan('https://ollama.com/download')}\n`),
      );
    }
  }

  // Load persistent memory
  const mem = isDemo ? null : await loadMemory();
  const memoryBlock = mem ? buildMemoryBlock(mem) : '';

  printBanner(model, isDemo);

  if (mem?.userName) {
    console.log(c.dim(`  Welcome back, ${mem.userName}!\n`));
  }

  const rl = createRL();
  const history: ChatMessage[] = [];

  // ── Clean exit handler ──────────────────────────────────────────────────────

  async function doExit(): Promise<void> {
    console.log(`\n${c.dim('Goodbye! 🐯')}\n`);

    if (!isDemo && history.length >= 4) {
      process.stdout.write(c.dim('  Saving session memory…'));
      try {
        const extracted = await extractSessionMemory(history, model);
        const current = await loadMemory();

        const merged = [
          ...new Set([...current.facts, ...extracted.facts]),
        ].slice(-30);

        await saveMemory({
          ...current,
          userName: extracted.userName || current.userName,
          facts: merged,
          summary: extracted.summary || current.summary,
          sessionCount: current.sessionCount + 1,
          lastUpdated: new Date().toISOString(),
        });
        process.stdout.write(c.dim(' done.\n'));
      } catch {
        process.stdout.write(c.dim(' skipped.\n'));
      }
    }

    rl.close();
    process.exit(0);
  }

  rl.on('SIGINT', () => {
    void doExit();
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

    // ── Commands ──────────────────────────────────────────────────────────────
    const cmd = text.toLowerCase();

    if (cmd === '/exit' || cmd === 'exit' || cmd === 'quit') {
      await doExit();
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
    if (cmd === '/model') {
      printModelInfo(model, isDemo);
      continue;
    }
    if (cmd === '/memory') {
      if (isDemo || !mem) {
        console.log(c.dim('Memory is not available in demo mode.\n'));
      } else {
        const block = buildMemoryBlock(mem);
        console.log(
          block
            ? `\n${block}\n`
            : c.dim(
                '\nNo memory stored yet. Chat for a while and use /exit — it learns after each session.\n',
              ),
        );
      }
      continue;
    }

    // ── Add user message to history ───────────────────────────────────────────
    history.push({ role: 'user', content: text });

    // ── Generate response ─────────────────────────────────────────────────────
    if (isDemo) {
      const response = getBuiltinResponse(text);
      console.log(`\n${c.brightYellow('⚡ PowerfulTiger')} > ${response}\n`);
    } else {
      let headerPrinted = false;
      let toolLinesPrinted = 0;

      try {
        await streamChat(
          model,
          history,
          {
            onToken: (token) => {
              if (!headerPrinted) {
                process.stdout.write(
                  `\n${c.brightYellow('⚡ PowerfulTiger')} > `,
                );
                headerPrinted = true;
              }
              process.stdout.write(token);
            },

            onToolCall: (name, args) => {
              if (!headerPrinted) {
                process.stdout.write(
                  `\n${c.brightYellow('⚡ PowerfulTiger')}\n`,
                );
                headerPrinted = true;
              }
              process.stdout.write(
                `  ${c.dim(c.cyan(toolLabel(name, args) + '…'))}\n`,
              );
              toolLinesPrinted++;
            },
          },
          memoryBlock,
        );

        process.stdout.write('\n');
      } catch (err) {
        if (!headerPrinted) {
          process.stdout.write(`\n${c.brightYellow('⚡ PowerfulTiger')} > `);
        }
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`\n${c.red('Error: ' + msg)}\n`);
        history.pop();
      }

      if (toolLinesPrinted > 0) process.stdout.write('\n');
    }
  }

  rl.close();
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(c.red(`Fatal: ${msg}`));
  process.exit(1);
});
