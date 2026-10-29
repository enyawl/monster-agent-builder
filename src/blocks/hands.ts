// BROWSER only. What the HANDS blocks do, run AFTER the user taps Allow.
// (The Web Share API needs HTTPS and a user tap, which is why hands run in the browser.)
import type { Source } from "@/events";
export interface Result { title: string; lines: string[]; sources?: Source[] }
const text = (r: Result) => `${r.title}\n${r.lines.map((l) => `- ${l}`).join("\n")}`;

export async function doHands(blockId: string, r: Result): Promise<string> {
  if (blockId === "notes_share" || blockId === "parts_list") {
    if (navigator.share) { await navigator.share({ title: r.title, text: text(r) }); return "Shared."; }
    await navigator.clipboard.writeText(text(r)); return "Copied.";
  }
  if (blockId === "calendar_ics") {
    const d = new Date(Date.now() + 86400000).toISOString().replace(/[-:]/g, "").slice(0, 8);
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `UID:${Date.now()}@myta`, `DTSTAMP:${d}T090000Z`, `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${r.title.replace(/[\r\n,;]/g, " ")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "myta.ics"; a.click(); return "Calendar file ready.";
  }
  if (blockId === "maps_route") { // Maps URLs need no key. Only places that came from a tool result should go here.
    const stops = (r.sources ?? []).map((s) => encodeURIComponent(s.title)); if (!stops.length) return "No places to route yet.";
    const u = `https://www.google.com/maps/dir/?api=1&destination=${stops[stops.length - 1]}${stops.length > 1 ? `&waypoints=${stops.slice(0, -1).join("%7C")}` : ""}`;
    window.open(u, "_blank", "noopener"); return "Route opened.";
  }
  return "";
}
