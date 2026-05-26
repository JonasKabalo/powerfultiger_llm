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
  console.log(c.dim('  /help  /clear  /model  /memory  /exit') + '\n');
}

export function printHelp(modelName: string, isDemo: boolean): void {
  console.log(`
${c.bold('Commands:')}
  ${c.cyan('/clear')}    Clear conversation history
  ${c.cyan('/model')}    Show current model info
  ${c.cyan('/memory')}   Show what PowerfulTiger remembers about you
  ${c.cyan('/help')}     Show this help
  ${c.cyan('/exit')}     Quit (saves memory)
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
