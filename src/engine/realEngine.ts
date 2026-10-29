// SERVER ONLY. One generic engine for every monster: guard, model, tool loop, events. No per-monster code.
import { z } from "zod";
import { activeRecipe, blockById, type BlockManifest } from "@/blocks/registry";
import { runHandler } from "@/blocks/handlers";
import { checkInput, checkStep, needsConfirmation, wrapUntrusted, LIMITS } from "@/guard/rules";
import { callModel, UserError, type ModelMessage } from "@/lib/model";
import { buildSystemPrompt } from "@/engine/promptBuilder";
import type { Recipe, RunEvent } from "@/events";

const Item = z.object({ block: z.string().max(40), on: z.boolean().optional() });
export const RunRequestSchema = z.object({
  recipe: z.object({ id: z.string().max(40), name: z.string().max(60), heart: z.string().max(40), mouth: z.array(Item).max(12), brain: z.array(Item).max(12), hands: z.array(Item).max(12), memory: z.boolean() }),
  input: z.object({ text: z.string().max(4000).optional(), url: z.string().max(1000).optional(), image: z.string().max(3_500_000).optional() }),
  memory: z.object({ preferences: z.array(z.string().max(300)).max(30), expertise: z.array(z.string().max(300)).max(30), history: z.array(z.object({ ts: z.number(), title: z.string().max(200) })).max(30) }),
});
export type RunRequest = z.infer<typeof RunRequestSchema>;

// Every model answer that drives behavior is validated before use.
const Step = z.discriminatedUnion("action", [
  z.object({ action: z.literal("use_block"), block: z.string().max(40), input: z.string().max(500) }),
  z.object({ action: z.literal("final"), title: z.string().max(120), lines: z.array(z.string().max(400)).max(12),
    sources: z.array(z.object({ title: z.string().max(200), url: z.string().max(500).optional() })).max(8).default([]) }),
]);
function parseStep(text: string) {
  try { const r = Step.safeParse(JSON.parse(text.replace(/```json|```/g, "").trim())); return r.success ? r.data : null; } catch { return null; }
}

export async function* runServer(req: RunRequest): AsyncGenerator<RunEvent> {
  const started = Date.now();
  yield { type: "run_started", runId: String(started) };
  const active = activeRecipe(req.recipe as Recipe);
  const live = (process.env.MODEL_MODE ?? "mock") !== "mock";
  const g0 = checkInput([req.input.text, req.input.url].filter(Boolean).join("\n"));
  yield { type: "guard_checked", verdict: g0.verdict, reason: g0.reason };
  if (g0.verdict === "blocked") { yield { type: "state_changed", state: "error" }; yield { type: "error", message: g0.reason }; return; }
  yield { type: "state_changed", state: "studying" };
  yield { type: "state_changed", state: "working" };
  try {
    const tools = active.brain.map((b) => blockById(b.block)).filter((b): b is BlockManifest => !!b && b.id !== "vision_read");
    let seen = "";
    if (req.input.image && active.brain.some((b) => b.block === "vision_read")) {
      yield { type: "tool_called", block: "vision_read", purpose: "reading your picture" };
      seen = await runHandler("vision_read", { query: "", image: req.input.image }, live);
    }
    const parts = [req.input.text && wrapUntrusted("user text", req.input.text), req.input.url && wrapUntrusted("user link (not opened yet)", req.input.url), seen && wrapUntrusted("what the picture shows", seen)].filter(Boolean);
    const messages: ModelMessage[] = [
      { role: "system", content: buildSystemPrompt({ name: active.name, heart: active.heart, tools, memory: req.memory }) },
      { role: "user", content: parts.join("\n\n") || "(the user gave no input)" },
    ];
    for (let step = 0; step < LIMITS.maxSteps; step++) {
      if (Date.now() - started > LIMITS.maxMillis) { yield { type: "state_changed", state: "error" }; yield { type: "error", message: "That took too long, so I stopped." }; return; }
      const reply = await callModel({ messages, json: true });
      const s = parseStep(reply.text);
      if (!s) { yield { type: "state_changed", state: "error" }; yield { type: "error", message: "I got confused by my own answer. Try again." }; return; }
      messages.push({ role: "assistant", content: reply.text });
      if (s.action === "use_block") {
        const g = checkStep(active, s.block);
        yield { type: "guard_checked", verdict: g.verdict, reason: g.reason };
        if (g.verdict === "blocked") { yield { type: "state_changed", state: "error" }; yield { type: "error", message: g.reason }; return; }
        yield { type: "tool_called", block: s.block, purpose: "looking things up" };
        const out = await runHandler(s.block, { query: s.input }, live);
        messages.push({ role: "user", content: wrapUntrusted(`result of ${s.block}`, out) });
        continue;
      }
      if (needsConfirmation(active)) {
        yield { type: "guard_checked", verdict: "needs_confirmation", reason: "I want to use my hands" };
        yield { type: "state_changed", state: "needs_permission" };
      } else yield { type: "state_changed", state: "done" };
      yield { type: "result_ready", title: s.title, lines: s.lines, sources: s.sources };
      return;
    }
    yield { type: "state_changed", state: "error" };
    yield { type: "error", message: "I went around in circles, so I stopped." };
  } catch (e) {
    yield { type: "state_changed", state: "error" };
    yield { type: "error", message: e instanceof UserError ? e.message : "Something went wrong." };
  }
}
