/** Canonical phase keys aligned with TM-style naming and admin rules. */
export const PRICING_PHASE_OPTIONS: { value: string; label: string }[] = [
  { value: "phase1", label: "Phase 1" },
  { value: "phase2", label: "Phase 2" },
  { value: "phase3", label: "Phase 3" },
  { value: "phase4", label: "Phase 4" },
  { value: "ruby", label: "Ruby" },
  { value: "sapphire", label: "Sapphire" },
  { value: "blackpearl", label: "Black Pearl" },
  { value: "emerald", label: "Emerald" },
];

export function normalizePricingPhase(
  phase: string | null | undefined,
): string | null {
  if (phase == null) return null;
  const t = String(phase).trim().toLowerCase().replace(/\s+/g, "");
  if (!t) return null;
  return t;
}

export function skinMarketNameHasPhases(name: string): boolean {
  return /\bDoppler\b/i.test(name) || /\bGamma\s+Doppler\b/i.test(name);
}
