// BROWSER side of the real engine: calls /api/run and turns the stream back into events.
// Holds the finished result until the user answers the "May I?" screen.
import type { Recipe, RunEvent, RunOptions } from "@/events";

export async function* run(recipe: Recipe, o: RunOptions): AsyncGenerator<RunEvent> {
  const res = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipe, input: o.input, memory: o.memory }) });
  if (!res.ok || !res.body) { yield { type: "error", message: "I could not reach my brain. Try again." }; return; }
  const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ""; let asking = false;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    const chunks = buf.split("\n\n"); buf = chunks.pop() ?? "";
    for (const c of chunks) {
      if (!c.startsWith("data: ")) continue;
      let ev: RunEvent; try { ev = JSON.parse(c.slice(6)); } catch { continue; }
      if (ev.type === "state_changed" && ev.state === "needs_permission") { asking = true; yield ev; continue; }
      if (ev.type === "result_ready" && asking) {
        const ok = await o.confirm("My hands want to send or save this result.");
        if (!ok) { yield { type: "guard_checked", verdict: "blocked", reason: "you said not now" }; yield { type: "state_changed", state: "idle" }; return; }
        yield { type: "guard_checked", verdict: "allowed", reason: "you said yes" };
        yield { type: "state_changed", state: "done" }; yield ev; return;
      }
      yield ev;
    }
  }
}
