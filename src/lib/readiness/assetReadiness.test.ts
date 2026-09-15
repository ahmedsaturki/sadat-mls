import { describe, expect, it } from "vitest";
import {
  evaluateAssetReadiness,
  isHigherRiskState,
  isMarketPublishable,
  isPromotionAllowed,
} from "./assetReadiness";

describe("evaluateAssetReadiness", () => {
  const base = {
    identityKnown: true,
    authorityEvidence: true,
    statusEvidence: true,
    economicsEvidence: true,
    comparableEvidence: true,
    freshnessEvidence: true,
    promotionIntegrity: true,
    unresolvedCriticalContradictions: false,
    staleCriticalEvidence: false,
    evidence: [],
  } as const;

  it("returns negotiation-ready for a complete, non-conflicted asset", () => {
    const result = evaluateAssetReadiness(base);
    expect(result.state).toBe("NEGOTIATION_READY");
    expect(result.score).toBe(1);
    expect(result.hardBlockers).toHaveLength(0);
  });

  it("keeps an asset in screening when critical evidence is missing", () => {
    const result = evaluateAssetReadiness({ ...base, authorityEvidence: false });
    expect(result.state).toBe("SCREENING");
    expect(result.missingCritical).toContain("Seller / assignor authority evidence");
  });

  it("blocks on unresolved critical contradictions", () => {
    const result = evaluateAssetReadiness({
      ...base,
      unresolvedCriticalContradictions: true,
    });
    expect(result.state).toBe("BLOCKED");
    expect(result.hardBlockers).toContain("Unresolved critical source contradiction exists.");
  });

  it("marks stale when critical evidence is stale", () => {
    const result = evaluateAssetReadiness({ ...base, staleCriticalEvidence: true });
    expect(result.state).toBe("STALE");
  });

  it("never treats missing identity as publishable", () => {
    const result = evaluateAssetReadiness({ ...base, identityKnown: false });
    expect(result.state).toBe("UNVERIFIED");
    expect(isMarketPublishable(result.state)).toBe(false);
    expect(isPromotionAllowed(result.state)).toBe(false);
    expect(isHigherRiskState(result.state)).toBe(true);
  });

  it("allows market-ready state when only comparables are missing", () => {
    const result = evaluateAssetReadiness({ ...base, comparableEvidence: false });
    expect(result.state).toBe("MARKET_READY");
    expect(isMarketPublishable(result.state)).toBe(true);
    expect(isPromotionAllowed(result.state)).toBe(true);
  });
});
