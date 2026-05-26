import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

const MEMORY_DIR = path.join(os.homedir(), '.powerfultiger');
const MEMORY_FILE = path.join(MEMORY_DIR, 'memory.json');

export interface MemoryStore {
  userName: string;
  facts: string[];
  summary: string;
  sessionCount: number;
  lastUpdated: string;
}

const EMPTY: MemoryStore = {
  userName: '',
  facts: [],
  summary: '',
  sessionCount: 0,
  lastUpdated: '',
};

export async function loadMemory(): Promise<MemoryStore> {
  try {
    const raw = await fs.readFile(MEMORY_FILE, 'utf-8');
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<MemoryStore>) };
  } catch {
    return { ...EMPTY };
  }
}

export async function saveMemory(mem: MemoryStore): Promise<void> {
  await fs.mkdir(MEMORY_DIR, { recursive: true });
  await fs.writeFile(MEMORY_FILE, JSON.stringify(mem, null, 2), 'utf-8');
}

/** Format memory for injection into the system prompt. Returns '' if nothing stored. */
export function buildMemoryBlock(mem: MemoryStore): string {
  const lines: string[] = [];
  if (mem.userName) lines.push(`The user's name is ${mem.userName}.`);

  // Filter facts that are just the user's name — redundant when userName is already shown
  const nameLower = mem.userName.toLowerCase().trim();
  const filteredFacts = nameLower
    ? mem.facts.filter((f) => f.toLowerCase().trim() !== nameLower)
    : mem.facts;

  if (filteredFacts.length > 0) {
    lines.push('What you know about the user:');
    for (const f of filteredFacts) lines.push(`  • ${f}`);
  }
  if (mem.summary) lines.push(`Previous sessions: ${mem.summary}`);
  if (lines.length === 0) return '';
  return '━━ MEMORY ━━\n' + lines.join('\n');
}
