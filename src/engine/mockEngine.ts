import { activeRecipe, blockById } from "@/blocks/registry";
import type { Recipe, RunEvent, RunOptions } from "@/events";

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));
const label = (id: string) => blockById(id)?.label ?? id;

// Fake engine: scripted events. The real engine keeps this same shape: run(recipe, options) -> stream of events.
export async function* run(full: Recipe, o: RunOptions): AsyncGenerator<RunEvent> {
  const recipe = activeRecipe(full); // switched-off blocks do not exist for the run
  yield { type: "run_started", runId: String(Date.now()) };
  yield { type: "guard_checked", verdict: "allowed", reason: "mock guard says your recipe looks fine" };
  yield { type: "state_changed", state: "studying" };
  await wait(900);
  yield { type: "state_changed", state: "working" };
  for (const m of recipe.mouth) { yield { type: "tool_called", block: label(m.block), purpose: "taking in what you gave me" }; await wait(450); }
  for (const b of recipe.brain) { yield { type: "tool_called", block: label(b.block), purpose: "looking things up (sample data)" }; await wait(750); }
  if (recipe.hands.length) {
    yield { type: "guard_checked", verdict: "needs_confirmation", reason: "asking before I use my hands" };
    yield { type: "state_changed", state: "needs_permission" };
    if (!(await o.confirm("My hands want to send or save this result."))) {
      yield { type: "guard_checked", verdict: "blocked", reason: "you said not now" };
      yield { type: "state_changed", state: "idle" }; return;
    }
    yield { type: "state_changed", state: "working" };
    for (const h of recipe.hands) { yield { type: "tool_called", block: label(h.block), purpose: "making your result" }; await wait(500); }
  }
  yield { type: "state_changed", state: "done" };
  yield { type: "result_ready", title: o.sample.title, lines: o.sample.lines };
}
