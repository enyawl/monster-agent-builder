// SERVER ONLY. The real code for each BRAIN block. Each has a mock (sample data) and an optional real function.
// Add a block's real code by filling in "real". See _template/handler.ts for the shape.
import { callModel } from "@/lib/model";

export interface HandlerCtx { query: string; image?: string }
interface Handler { mock: (c: HandlerCtx) => Promise<string>; real?: (c: HandlerCtx) => Promise<string> }
const sample = (what: string) => async () => `(sample ${what} data. The real lookup is not connected yet.)`;

export const HANDLERS: Record<string, Handler> = {
  vision_read: {
    mock: sample("picture reading"),
    // Sends the picture to the model. MUSE: FILL IN if image input needs a different format (see src/lib/model.ts).
    real: async ({ image }) => {
      if (!image) return "(no picture was given)";
      const r = await callModel({ messages: [{ role: "user", content: [
        { type: "text", text: "List the items you can see in this picture as a short plain list. Do not guess brands." },
        { type: "image_url", image_url: { url: image } } ] }] });
      return r.text;
    },
  },
  // MUSE: FILL IN. Use the search grounding recipe from Meta's cookbook for web_search, recipe_sites and places_reviews.
  web_search: { mock: sample("web search") },
  recipe_sites: { mock: sample("recipe") },
  places_reviews: { mock: sample("places") },
  datasheets: { mock: sample("datasheet") }, // always show "verify against the datasheet" with this one
};
export async function runHandler(id: string, ctx: HandlerCtx, live: boolean): Promise<string> {
  const h = HANDLERS[id];
  if (!h) return "(this block has no code yet)";
  return (live && h.real ? h.real : h.mock)(ctx);
}
