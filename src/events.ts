// Shared by the engine and the screen. The screen reacts ONLY to these events.
export type MonsterState = "idle" | "studying" | "working" | "needs_permission" | "done" | "error";
export interface Source { title: string; url?: string }

export type RunEvent =
  | { type: "run_started"; runId: string }
  | { type: "state_changed"; state: MonsterState }
  | { type: "tool_called"; block: string; purpose: string }
  | { type: "guard_checked"; verdict: "allowed" | "blocked" | "needs_confirmation"; reason: string }
  | { type: "result_ready"; title: string; lines: string[]; sources?: Source[] }
  | { type: "error"; message: string };

// The recipe format. The mock engine and the real engine both accept this exact shape.
// "on: false" means the block is switched off: the model never sees it and the guard refuses it.
export interface RecipeItem { block: string; on?: boolean }
export interface Recipe {
  id: string; name: string; heart: string;
  mouth: RecipeItem[]; brain: RecipeItem[]; hands: RecipeItem[]; memory: boolean;
}
// What the user fed the mouth. "image" is a small JPEG data URL.
export interface RunInputData { text?: string; url?: string; image?: string }
// One monster's saved memory (kept in this browser for now). Remembered text is untrusted data.
export interface MemoryProfile {
  preferences: string[]; expertise: string[]; history: { ts: number; title: string }[];
}
export interface RunOptions {
  input: RunInputData; memory: MemoryProfile;
  sample: { title: string; lines: string[] };           // only used by the mock engine
  confirm: (what: string) => Promise<boolean>;           // the "May I?" screen
}
