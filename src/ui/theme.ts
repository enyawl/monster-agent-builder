import type { MonsterState } from "@/events";
// State look = DATA. Color + icon + animation, so color is never the only signal.
export const STATE_STYLE: Record<MonsterState, { label: string; color: string; icon: string; anim: string }> = {
  idle: { label: "Resting", color: "#8EC5FF", icon: "M5 12h14", anim: "float" },
  studying: { label: "Studying", color: "#B9A2FF", icon: "M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z", anim: "tilt" },
  working: { label: "Working", color: "#FFB066", icon: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3", anim: "bob" },
  needs_permission: { label: "Needs permission", color: "#FFD84D", icon: "M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 18h.01", anim: "pause" },
  done: { label: "Done", color: "#7FD99A", icon: "M5 13l5 5 9-11", anim: "jump" },
  error: { label: "Problem", color: "#FF7A7A", icon: "M12 4l9 16H3zM12 10v4M12 17h.01", anim: "shake" },
};

// Part icons and names = DATA (24x24 stroke paths).
export const PART_INFO: Record<"head" | "brain" | "mouth" | "hands", { title: string; icon: string }> = {
  head: { title: "Head", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 10h.01M15 10h.01M8.5 14.5q3.500 3 7 0" },
  brain: { title: "Brain", icon: "M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1.500 5.500A3 3 0 0 0 7 17a3 3 0 0 0 5 1.500V5.500A3 3 0 0 0 9 4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 1.500 5.500A3 3 0 0 1 17 17a3 3 0 0 1-5 1.500" },
  mouth: { title: "Mouth", icon: "M3 10q9 11 18 0z" },
  hands: { title: "Hand", icon: "M8 12V5.500a1.500 1.500 0 0 1 3 0V11V4.500a1.500 1.500 0 0 1 3 0V11V6.500a1.500 1.500 0 0 1 3 0V14a6 6 0 0 1-6 6 5 5 0 0 1-4-2l-3-4a1.500 1.500 0 0 1 2.200-2z" },
};
