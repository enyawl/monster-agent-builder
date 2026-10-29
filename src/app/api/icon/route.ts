import { generateIcon } from "@/agents/iconAgent";
export async function POST(req: Request) {
  let job = ""; try { job = String((await req.json()).job ?? "").slice(0, 100); } catch {}
  return Response.json(await generateIcon(job));
}
