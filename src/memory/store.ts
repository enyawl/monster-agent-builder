// Browser-only memory for version 1 (localStorage). Later: swap these functions for Supabase calls, same names.
// Remembered text is saved notes, NOT model training, and it is always treated as untrusted data.
import type { MemoryProfile } from "@/events";
const key = (id: string) => `myta:memory:${id}`;
const empty = (): MemoryProfile => ({ preferences: [], expertise: [], history: [] });

export function loadMemory(id: string): MemoryProfile {
  try { const r = localStorage.getItem(key(id)); if (r) return { ...empty(), ...JSON.parse(r) }; } catch {}
  return empty();
}
export function saveMemory(id: string, m: MemoryProfile) { try { localStorage.setItem(key(id), JSON.stringify(m)); } catch {} }
export function addPreference(id: string, text: string) { const m = loadMemory(id); m.preferences = [...m.preferences, text.slice(0, 300)].slice(-30); saveMemory(id, m); }
export function removePreference(id: string, i: number) { const m = loadMemory(id); m.preferences = m.preferences.filter((_, k) => k !== i); saveMemory(id, m); }
export function addHistory(id: string, title: string) { const m = loadMemory(id); m.history = [...m.history, { ts: Date.now(), title: title.slice(0, 200) }].slice(-30); saveMemory(id, m); }
// Heart-switch rule: changing the heart clears expertise notes only. Preferences, history and uploads stay.
export function clearExpertise(id: string) { const m = loadMemory(id); m.expertise = []; saveMemory(id, m); }
export function wipeMonster(id: string) { try { localStorage.removeItem(key(id)); } catch {} }
export function wipeEverything() { try { Object.keys(localStorage).filter((k) => k.startsWith("myta:")).forEach((k) => localStorage.removeItem(k)); } catch {} }
