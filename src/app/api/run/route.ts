import { RunRequestSchema, runServer } from "@/engine/realEngine";

export const maxDuration = 60; // VERIFY: the maximum allowed on your Vercel plan. Keep runs short.

// Streams events to the browser as Server-Sent Events. The model key never leaves the server.
export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }
  const parsed = RunRequestSchema.safeParse(body);
  if (!parsed.success) return new Response("Bad request", { status: 400 });
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(c) {
      try { for await (const ev of runServer(parsed.data)) c.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`)); }
      catch { c.enqueue(enc.encode(`data: ${JSON.stringify({ type: "error", message: "Something went wrong." })}\n\n`)); }
      c.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform" } });
}
