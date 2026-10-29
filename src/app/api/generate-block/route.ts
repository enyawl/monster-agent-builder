import { generateBlock } from "@/agents/blockGenerator";
export async function POST(req: Request) {
  let q = ""; try { q = String((await req.json()).request ?? "").slice(0, 300); } catch {}
  return Response.json(await generateBlock(q));
}
