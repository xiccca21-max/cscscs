import { getDopplerPhase } from "cs-doppler-phase";
const LIB_TO_CANONICAL: Record<string, string> = {
  "Phase 1": "phase1",
  "Phase 2": "phase2",
  "Phase 3": "phase3",
  "Phase 4": "phase4",
  Ruby: "ruby",
  Sapphire: "sapphire",
  "Black Pearl": "blackpearl",
  Emerald: "emerald",
};

export function detectCs2PhaseFromIconUrl(iconUrl: string | null): string | null {
  if (!iconUrl) return null;
  try {
    const p = getDopplerPhase(iconUrl);
    if (!p) return null;
    return LIB_TO_CANONICAL[p] ?? null;
  } catch {
    return null;
  }
}
