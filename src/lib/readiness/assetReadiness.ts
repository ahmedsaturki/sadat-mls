export const ASSET_READINESS_STATES = [
  "UNVERIFIED",
  "SCREENING",
  "MARKET_READY",
  "NEGOTIATION_READY",
  "DD_READY",
  "BLOCKED",
  "STALE",
  "REJECTED",
] as const;

export type AssetReadinessState = (typeof ASSET_READINESS_STATES)[number];

export type EvidenceClass =
  | "VERIFIED"
  | "PUBLIC_REPORTED"
  | "OWNER_PROVIDED"
  | "DERIVED"
  | "UNVERIFIED"
  | "UNKNOWN";

export type EvidenceItem = {
  field: string;
  evidenceClass: EvidenceClass;
  source?: string;
  sourceDate?: string;
  lastCheckedAt?: string;
  confidence?: number;
  contradiction?: boolean;
};

export type AssetReadinessInput = {
  identityKnown: boolean;
  authorityEvidence: boolean;
  statusEvidence: boolean;
  economicsEvidence: boolean;
  comparableEvidence: boolean;
  freshnessEvidence: boolean;
  promotionIntegrity: boolean;
  ddHandoffReady: boolean;
  unresolvedCriticalContradictions: boolean;
  staleCriticalEvidence: boolean;
  evidence: readonly EvidenceItem[];
};

export type AssetReadinessResult = {
  state: AssetReadinessState;
  score: number;
  hardBlockers: string[];
  missingCritical: string[];
  reasons: string[];
};

/**
 * Deterministic internal Lara gate.
 *
 * This function is deliberately conservative. It does not certify legality,
 * title, engineering condition, tax status, or governmental compliance.
 */
export function evaluateAssetReadiness(input: AssetReadinessInput): AssetReadinessResult {
  const hardBlockers: string[] = [];
  const missingCritical: string[] = [];
  const reasons: string[] = [];

  if (input.staleCriticalEvidence) {
    hardBlockers.push("Critical evidence is stale or availability is uncertain.");
  }

  if (input.unresolvedCriticalContradictions) {
    hardBlockers.push("Unresolved critical source contradiction exists.");
  }

  const criticalChecks: Array<[string, boolean]> = [
    ["Exact asset identity", input.identityKnown],
    ["Seller / assignor authority evidence", input.authorityEvidence],
    ["Applicable status / allocation / licensing evidence", input.statusEvidence],
    ["Current economics (price, terms, material dues)", input.economicsEvidence],
  ];

  for (const [label, passed] of criticalChecks) {
    if (!passed) missingCritical.push(label);
  }

  const weightedPasses = [
    input.identityKnown,
    input.authorityEvidence,
    input.statusEvidence,
    input.economicsEvidence,
    input.comparableEvidence,
    input.freshnessEvidence,
    input.promotionIntegrity,
    input.ddHandoffReady,
  ].filter(Boolean).length;

  const score = Math.round((weightedPasses / 8) * 100) / 100;

  if (!input.identityKnown) {
    reasons.push("Asset identity is not sufficiently established.");
    return { state: "UNVERIFIED", score, hardBlockers, missingCritical, reasons };
  }

  if (hardBlockers.length > 0) {
    reasons.push(...hardBlockers);
    return {
      state: input.staleCriticalEvidence ? "STALE" : "BLOCKED",
      score,
      hardBlockers,
      missingCritical,
      reasons,
    };
  }

  if (missingCritical.length > 0) {
    reasons.push("Critical evidence remains incomplete.");
    return { state: "SCREENING", score, hardBlockers, missingCritical, reasons };
  }

  if (!input.freshnessEvidence) {
    reasons.push("Key evidence lacks sufficient freshness metadata.");
    return { state: "SCREENING", score, hardBlockers, missingCritical, reasons };
  }

  if (!input.promotionIntegrity) {
    reasons.push("Published claims are not yet separated cleanly from verified evidence.");
    return { state: "SCREENING", score, hardBlockers, missingCritical, reasons };
  }

  if (!input.comparableEvidence) {
    reasons.push("Comparable-market evidence is insufficient or unavailable.");
    return { state: "MARKET_READY", score, hardBlockers, missingCritical, reasons };
  }

  if (input.ddHandoffReady) {
    reasons.push("Internal evidence package is complete enough for professional DD handoff.");
    return { state: "DD_READY", score, hardBlockers, missingCritical, reasons };
  }

  reasons.push("Critical readiness conditions are evidenced and no hard blocker remains.");
  return { state: "NEGOTIATION_READY", score, hardBlockers, missingCritical, reasons };
}

export function isMarketPublishable(state: AssetReadinessState): boolean {
  return ["MARKET_READY", "NEGOTIATION_READY", "DD_READY"].includes(state);
}

export function isPromotionAllowed(state: AssetReadinessState): boolean {
  return ["MARKET_READY", "NEGOTIATION_READY", "DD_READY"].includes(state);
}

export function isHigherRiskState(state: AssetReadinessState): boolean {
  return ["UNVERIFIED", "BLOCKED", "STALE", "REJECTED"].includes(state);
}
