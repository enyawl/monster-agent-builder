import type { Recipe } from "@/events";

export interface Rect { x: number; y: number; w: number; h: number } // percent of the picture
export interface Monster {
  id: string; name: string; blurb: string; image: string; size: { w: number; h: number }; accent: string;
  extra?: boolean; // extras are added from the + menu
  parts: { head: Rect; mouth: Rect; handL: Rect; handR: Rect }; // tap areas = DATA, edit when art changes
  recipe: Recipe; sample: { title: string; lines: string[] };
}
const r = (id: string, name: string, heart: string, mouth: string[], brain: string[], hands: string[]): Recipe => ({
  id, name, heart, memory: true,
  mouth: mouth.map((block) => ({ block, on: true })), brain: brain.map((block) => ({ block, on: true })), hands: hands.map((block) => ({ block, on: true })),
});

// Monsters are DATA. Add one here and it can appear on screen. Swap "image" and "parts" to restyle.
export const MONSTERS: Monster[] = [
  { id: "chef", name: "Chef", blurb: "Fridge photo to dinner ideas", image: "/monsters/chef.png", size: { w: 471, h: 723 }, accent: "#d8b889",
    parts: { head: { x: 8.9, y: 2.9, w: 80.7, h: 45.6 }, mouth: { x: 41.2, y: 49.2, w: 27.2, h: 11.1 }, handL: { x: 4.7, y: 63.8, w: 29.7, h: 16.6 }, handR: { x: 76.9, y: 63.8, w: 21.2, h: 15.9 } },
    recipe: r("chef", "Chef", "cooking", ["picture", "link"], ["vision_read", "recipe_sites"], ["notes_share"]),
    sample: { title: "Dinner idea (sample)", lines: ["Spotted: eggs, spinach, feta (sample data)", "Idea: spinach and feta omelette", "Checklist ready to share to Notes"] } },
  { id: "trip", name: "Trip Planner", blurb: "Saved links to a route", image: "/monsters/trip.png", size: { w: 471, h: 581 }, accent: "#7acde0",
    parts: { head: { x: 5.9, y: 3.8, w: 91.3, h: 37.0 }, mouth: { x: 32.5, y: 41.3, w: 24.4, h: 13.4 }, handL: { x: 3.8, y: 57.1, w: 23.4, h: 18.1 }, handR: { x: 64.3, y: 62.3, w: 27.6, h: 18.1 } },
    recipe: r("trip", "Trip Planner", "trip_planner", ["link", "chat"], ["places_reviews", "web_search"], ["maps_route", "calendar_ics"]),
    sample: { title: "Day trip (sample)", lines: ["Stop 1: sample cafe", "Stop 2: sample museum", "Route link and calendar file ready"] } },
  { id: "circuit", name: "Circuit Builder", blurb: "Parts and wiring steps", image: "/monsters/circuit.png", size: { w: 465, h: 542 }, accent: "#83c9c7",
    parts: { head: { x: 16.1, y: 8.9, w: 71.0, h: 33.2 }, mouth: { x: 35.5, y: 41.5, w: 26.9, h: 13.8 }, handL: { x: 3.2, y: 48.5, w: 24.7, h: 21.2 }, handR: { x: 75.3, y: 51.3, w: 22.6, h: 18.5 } },
    recipe: r("circuit", "Circuit Builder", "circuit_builder", ["picture"], ["vision_read", "datasheets"], ["parts_list"]),
    sample: { title: "Parts list (sample)", lines: ["1x microcontroller board (sample)", "1x LED and resistor (sample)", "Low-voltage USB power only. Verify against the datasheet."] } },
  { id: "fitness", name: "Workout Coach", blurb: "Plans workouts", image: "/monsters/fitness.png", size: { w: 485, h: 489 }, accent: "#9bb8f0", extra: true,
    parts: { head: { x: 14, y: 2, w: 72, h: 44 }, mouth: { x: 36, y: 40, w: 28, h: 12 }, handL: { x: 2, y: 58, w: 30, h: 26 }, handR: { x: 68, y: 58, w: 30, h: 26 } },
    recipe: r("fitness", "Workout Coach", "workout_coach", ["chat"], ["web_search"], ["notes_share"]),
    sample: { title: "Workout (sample)", lines: ["Warm-up 5 min (sample)", "3 simple exercises (sample)"] } },
  { id: "student", name: "Study Buddy", blurb: "Makes study plans", image: "/monsters/student.png", size: { w: 478, h: 480 }, accent: "#a9b9e4", extra: true,
    parts: { head: { x: 14, y: 2, w: 72, h: 44 }, mouth: { x: 36, y: 40, w: 28, h: 12 }, handL: { x: 2, y: 58, w: 30, h: 26 }, handR: { x: 68, y: 58, w: 30, h: 26 } },
    recipe: r("student", "Study Buddy", "study_buddy", ["chat", "link"], ["web_search"], ["notes_share"]),
    sample: { title: "Study plan (sample)", lines: ["Topic summary (sample)", "5 practice questions (sample)"] } },
];
