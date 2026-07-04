import type { VerdictStatus } from "./types";

export const VERDICT_STYLE: Record<
  VerdictStatus,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  met: { label: "MET", text: "text-met", bg: "bg-met/10", border: "border-met/40", dot: "bg-met" },
  not_met: { label: "NOT MET", text: "text-unmet", bg: "bg-unmet/10", border: "border-unmet/40", dot: "bg-unmet" },
  cannot_verify: {
    label: "CANNOT VERIFY",
    text: "text-verify",
    bg: "bg-verify/10",
    border: "border-verify/40",
    dot: "bg-verify",
  },
};

export const STRENGTH_STYLE: Record<string, { text: string; bg: string; ring: string }> = {
  STRONG: { text: "text-met", bg: "bg-met/10", ring: "ring-met/40" },
  MODERATE: { text: "text-verify", bg: "bg-verify/10", ring: "ring-verify/40" },
  WEAK: { text: "text-unmet", bg: "bg-unmet/10", ring: "ring-unmet/40" },
};
