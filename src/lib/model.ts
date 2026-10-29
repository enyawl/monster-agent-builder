// SERVER ONLY. The ONE function every model call goes through.
// Switch with MODEL_MODE in .env.local: "mock" (default) | "standin" | "muse".
// =====================  MUSE: FILL IN  =====================
// 1) Open dev.meta.ai and copy the base URL, the model name and the example request for chat.
// 2) Put them in .env.local as MUSE_BASE_URL, MUSE_MODEL, MUSE_API_KEY (see .env.example). Never paste the key in chat.
// 3) This file assumes an OpenAI-style "POST {base}/chat/completions". UNVERIFIED for Muse: if Meta's format differs,
//    change ONLY the marked block below. Image input uses the OpenAI-style "image_url" part: also UNVERIFIED.
// ===========================================================
export class UserError extends Error {}
export type ModelPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export interface ModelMessage { role: "system" | "user" | "assistant"; content: string | ModelPart[] }
export interface ModelRequest { messages: ModelMessage[]; json?: boolean }

const MOCK_FINAL = { action: "final", title: "Mock answer", lines: ["The mock model answered. Set MODEL_MODE in .env.local to use a real model."], sources: [] };

export async function callModel(req: ModelRequest): Promise<{ text: string }> {
  const mode = process.env.MODEL_MODE ?? "mock";
  if (mode === "mock") return { text: JSON.stringify(MOCK_FINAL) };
  const cfg = mode === "muse"
    ? { base: process.env.MUSE_BASE_URL, model: process.env.MUSE_MODEL, key: process.env.MUSE_API_KEY }
    : { base: process.env.STANDIN_BASE_URL, model: process.env.STANDIN_MODEL, key: process.env.STANDIN_API_KEY };
  if (!cfg.base || !cfg.model || !cfg.key) throw new UserError(`The "${mode}" model is not set up yet. Fill in .env.local (see .env.example).`);
  // ----- MUSE: FILL IN (request format) ------------------------------------------------------
  const res = await fetch(`${cfg.base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({ model: cfg.model, messages: req.messages, ...(req.json ? { response_format: { type: "json_object" } } : {}) }),
  });
  if (!res.ok) throw new UserError(`The model call failed (status ${res.status}).`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  // ----- end of MUSE block --------------------------------------------------------------------
  if (typeof text !== "string") throw new UserError("The model reply had an unexpected shape.");
  return { text };
}
