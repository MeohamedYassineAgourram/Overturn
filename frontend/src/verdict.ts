import type { VerdictStatus } from "./types";

// Light-theme status pills. Semantics preserved: met = green, cannot_verify =
// amber, not_met = red (mirrors the reference dashboards' status chips).
export const VERDICT_STYLE: Record<
  VerdictStatus,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  met: {
    label: "MET",
    text: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  not_met: {
    label: "NOT MET",
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  cannot_verify: {
    label: "CANNOT VERIFY",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
};

export const STRENGTH_STYLE: Record<string, { text: string; bg: string; ring: string }> = {
  STRONG: { text: "text-green-700", bg: "bg-green-50", ring: "ring-green-200" },
  MODERATE: { text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200" },
  WEAK: { text: "text-red-700", bg: "bg-red-50", ring: "ring-red-200" },
};
