/**
 * Deterministic builder-title engine.
 *
 * The same name + stack always yields the same title and serial — no network
 * call, no model, no per-generation latency. Curated sets keyed on stack
 * keywords, with a general pool when nothing matches.
 */

interface TitleSet {
  /** Lowercase substrings matched against the stack/role field. */
  keys: readonly string[];
  titles: readonly string[];
}

const TITLE_SETS: readonly TitleSet[] = [
  {
    keys: ["ai", "ml", "llm", "agent", "prompt", "rag", "model", "gpt"],
    titles: [
      "Agent Whisperer",
      "Prompt Alchemist",
      "Token Bender",
      "Context Wrangler",
      "Eval Sommelier",
    ],
  },
  {
    keys: ["react", "front", "ui", "ux", "next", "css", "design", "svelte", "vue"],
    titles: [
      "Pixel Bender",
      "DOM Surgeon",
      "Interface Architect",
      "Vibe Architect",
      "Layout Wizard",
    ],
  },
  {
    keys: ["python", "data", "backend", "go", "rust", "api", "sql", "node", "java"],
    titles: [
      "Latency Slayer",
      "Pipeline Pirate",
      "Null Terminator",
      "Query Charmer",
      "Systems Builder",
    ],
  },
  {
    keys: ["mobile", "ios", "android", "flutter", "swift", "kotlin", "expo"],
    titles: ["Pocket Shipper", "Gesture Guru", "Thumb-Zone Tactician"],
  },
  {
    keys: ["devops", "infra", "cloud", "kube", "platform", "sre", "docker"],
    titles: ["Uptime Custodian", "Cluster Tamer", "Code Cartographer"],
  },
  {
    keys: ["found", "pm", "product", "growth", "market", "bd", "design lead"],
    titles: ["Scope Slayer", "Demo Day Menace", "Roadmap Rebel", "Ship-It Architect"],
  },
  {
    keys: ["security", "crypto", "web3", "solidity", "blockchain", "chain"],
    titles: ["Threat Modeller", "Key Keeper", "Ledger Wrangler"],
  },
];

const GENERAL_POOL: readonly string[] = [
  "Midnight Shipper",
  "Serial Deployer",
  "Chai-Fuelled Committer",
  "Merge Conflict Survivor",
  "Beach Mode Builder",
  "Systems Builder",
  "Ship-It Architect",
];

/** FNV-style 32-bit hash. Stable across platforms and runs. */
export function stableHash(input: string): number {
  let hash = 7;
  const source = input || "goa";
  for (let i = 0; i < source.length; i += 1) {
    hash = (Math.imul(hash, 31) + source.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick<T>(list: readonly T[], seed: number, fallback: T): T {
  if (list.length === 0) return fallback;
  return list[seed % list.length] ?? fallback;
}

export function generateBuilderTitle(name: string, stack: string): string {
  const haystack = stack.toLowerCase();
  const set = TITLE_SETS.find((group) =>
    group.keys.some((key) => haystack.includes(key)),
  );
  const pool = set ? set.titles : GENERAL_POOL;
  return pick(pool, stableHash(`${name}${haystack}`), "Beach Mode Builder");
}

/** Four-digit badge number shown as `BUILDER ID · #0451`. */
export function generateSerial(name: string, stack: string): string {
  return String(1 + (stableHash(`${name}${stack}`) % 9998)).padStart(4, "0");
}
