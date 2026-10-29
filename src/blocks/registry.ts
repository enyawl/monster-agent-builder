import type { Recipe } from "@/events";

export type DataType = "text" | "url" | "image" | "sources";
export type Lane = "head" | "brain" | "mouth" | "hands";

// One manifest per block = DATA. The real code for each block lives in src/blocks/handlers.ts (server)
// and src/blocks/hands.ts (browser). Blocks made by the Generate Block monster will be added here later.
export interface BlockManifest {
  id: string; label: string; detail: string; lane: Lane;
  accepts: DataType[]; produces: DataType[];
  permissions: ("read" | "write" | "send")[]; color: string; heart?: string;
}
const Hd = "#fbe3e8", M = "#f5e8d5", B = "#e5e1f7", H = "#dcece5";
const head = (heart: string, label: string, detail: string): BlockManifest =>
  ({ id: `heart_${heart}`, label, detail, lane: "head", accepts: [], produces: [], permissions: [], color: Hd, heart });
export const BLOCKS: BlockManifest[] = [
  head("cooking", "Cooking", "Recipes and food"),
  head("trip_planner", "Trip Planner", "Places and routes"),
  head("circuit_builder", "Circuit Builder", "Low-voltage projects"),
  head("workout_coach", "Workout Coach", "Simple workouts"),
  head("study_buddy", "Study Buddy", "Study plans"),
  { id: "picture", label: "Picture", detail: "A photo to look at", lane: "mouth", accepts: [], produces: ["image"], permissions: ["read"], color: M },
  { id: "link", label: "Link", detail: "A web link to read", lane: "mouth", accepts: [], produces: ["url"], permissions: ["read"], color: M },
  { id: "chat", label: "Chat text", detail: "Words you type", lane: "mouth", accepts: [], produces: ["text"], permissions: ["read"], color: M },
  { id: "vision_read", label: "Read picture", detail: "Turns a photo into words", lane: "brain", accepts: ["image"], produces: ["text"], permissions: ["read"], color: B },
  { id: "web_search", label: "Web search", detail: "Finds pages and sources", lane: "brain", accepts: ["text", "url"], produces: ["sources"], permissions: ["read"], color: B },
  { id: "recipe_sites", label: "Recipe sites", detail: "Looks up recipes", lane: "brain", accepts: ["text", "url"], produces: ["sources"], permissions: ["read"], color: B },
  { id: "places_reviews", label: "Places and reviews", detail: "Looks up places", lane: "brain", accepts: ["text", "url"], produces: ["sources"], permissions: ["read"], color: B },
  { id: "datasheets", label: "Datasheets", detail: "Finds part information", lane: "brain", accepts: ["text", "image"], produces: ["sources"], permissions: ["read"], color: B },
  { id: "notes_share", label: "Notes (share)", detail: "Share to Notes or Reminders", lane: "hands", accepts: ["sources", "text"], produces: [], permissions: ["send"], color: H },
  { id: "maps_route", label: "Maps route link", detail: "Makes a Google Maps link", lane: "hands", accepts: ["sources"], produces: [], permissions: ["send"], color: H },
  { id: "calendar_ics", label: "Calendar file", detail: "Makes an .ics file", lane: "hands", accepts: ["sources"], produces: [], permissions: ["write"], color: H },
  { id: "parts_list", label: "Parts list", detail: "Parts and wiring steps", lane: "hands", accepts: ["sources"], produces: [], permissions: ["write"], color: H },
];
export const blockById = (id: string) => BLOCKS.find((b) => b.id === id);

// OFF MEANS OFF: everything downstream (prompt, tools, guard, hands) sees only this filtered recipe.
export function activeRecipe(r: Recipe): Recipe {
  const on = <T extends { on?: boolean }>(a: T[]) => a.filter((x) => x.on !== false);
  return { ...r, mouth: on(r.mouth), brain: on(r.brain), hands: on(r.hands) };
}

// The puzzle-fit rule: a piece fits only if it accepts a type that something already ON in the recipe produces.
export function canPlace(b: BlockManifest, r: Recipe): { ok: boolean; why?: string } {
  if (b.lane === "mouth" || b.lane === "head") return { ok: true };
  const a = activeRecipe(r);
  if (a.mouth.length === 0) return { ok: false, why: "Feed me first: add a Mouth piece." };
  const have = new Set<string>();
  [...a.mouth, ...a.brain].forEach((x) => blockById(x.block)?.produces.forEach((t) => have.add(t)));
  if (b.accepts.some((t) => have.has(t))) return { ok: true };
  return { ok: false, why: `${b.label} needs ${b.accepts.join(" or ")}, but I only have ${Array.from(have).join(", ") || "nothing"}.` };
}
