import type { Flag, Level, Mode, Skill } from "@/services/tracking.service";

/** Rating levels. Colours are the validated ordinal teal ramp in index.css. */
export const LEVELS: { level: Level; label: string; short: string; color: string }[] = [
  { level: 1, label: "Not yet", short: "N", color: "var(--chart-level-1)" },
  { level: 2, label: "With help", short: "H", color: "var(--chart-level-2)" },
  { level: 3, label: "On their own", short: "O", color: "var(--chart-level-3)" },
];

export const levelLabel = (level: number) => LEVELS.find((l) => l.level === level)?.label ?? "";

export const MODE_LABELS: Record<Mode, string> = {
  practical: "Practical",
  book: "In the book",
};

export const MODE_COLORS: Record<Mode, string> = {
  practical: "var(--chart-practical)",
  book: "var(--chart-book)",
};

export const SKILL_LABELS: Record<Skill, string> = {
  vocabulary: "Coding vocabulary",
  directions: "Direction commands",
  sequencing: "Sequencing & algorithms",
  navigation: "Grid navigation",
  debugging: "Debugging",
  collaboration: "Pair coding",
};

export const FLAG_LABELS: Record<Flag, string> = {
  repeated_not_yet: "Several “Not yet” in recent lessons",
  low_attendance: "Missed many recent lessons",
  book_gap: "Can do it hands-on, struggles in the book",
  not_yet_assessed: "No ratings yet",
};

export const UNIT_TYPE_LABELS: Record<string, string> = {
  song: "Song",
  story_mission: "Story missions",
  unplugged: "Coding mats",
  robot: "Robot mouse",
  platform: "2D commands",
};

/** 0-100 score as a short phrase for screen readers and tables. */
export const scoreText = (score: number | null) => (score === null ? "Not rated yet" : `${score}%`);

export const formatDate = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
