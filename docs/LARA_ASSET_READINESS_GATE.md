# Lara Asset Readiness Gate

## Purpose

An internal operating gate for Lara, not a standalone product.

The gate answers one operational question:

> Is this asset sufficiently evidenced to move to the next Lara workflow stage?

It must never present itself as legal, engineering, title, tax, or governmental certification.

## States

- `UNVERIFIED` — identity/evidence is insufficient.
- `SCREENING` — enough information exists to research the asset, but material gaps remain.
- `MARKET_READY` — market-facing facts have provenance and material conflicts are surfaced.
- `NEGOTIATION_READY` — commercial facts and major blockers are sufficiently documented for negotiation.
- `DD_READY` — the internal file is sufficiently organized for handoff to qualified legal/technical professionals.
- `BLOCKED` — a known material blocker exists.
- `STALE` — key evidence is too old or availability is uncertain.
- `REJECTED` — evidence indicates the asset should not advance.

## Evidence contract

Every material claim should carry:

- source
- source date / last checked date
- evidence class
- confidence
- contradiction status

Evidence classes:

- `VERIFIED` — supported by a source appropriate to the claim.
- `PUBLIC_REPORTED` — published by a third party but not independently verified.
- `OWNER_PROVIDED` — supplied by seller/owner/agent.
- `DERIVED` — calculated from other evidence.
- `UNVERIFIED` — claim exists but cannot yet be established.
- `UNKNOWN` — no evidence currently available.

## Hard rules

1. `UNKNOWN` is not `FALSE`.
2. Advertiser claims must not silently become verified facts.
3. Asking price is not transaction price.
4. Historical listing price is not current market truth.
5. Public source availability is not legal title verification.
6. Conflicting critical evidence blocks higher readiness states until resolved or explicitly accepted by an authorized human.
7. The system should generate a reason for every state transition.
8. Final legal/technical diligence remains external to Lara's internal readiness gate.
9. Stale critical evidence or unresolved critical contradictions take precedence over rejection evidence; stale/conflicted evidence must not itself produce a final `REJECTED` state.

## Workflow

`INTAKE → IDENTITY → EVIDENCE → CONTRADICTIONS → COMPARABLES → READINESS → PUBLISH → PROMOTE → NEGOTIATE → PROFESSIONAL_DD → OUTCOME`

## Initial gates

| Gate | Pass condition | Blocking level |
|---|---|---|
| Identity | Exact asset can be uniquely identified | Critical |
| Authority | Seller/assignor authority is evidenced or explicitly unresolved | Critical |
| Status | Allocation/ownership/licensing state is documented as applicable | Critical |
| Economics | Current price, terms and material dues are documented | Critical |
| Market | Comparable set is sufficient or absence is documented | High |
| Contradictions | Material source conflicts are surfaced | Critical |
| Freshness | Key sources have dates / last-checked timestamps | High |
| Promotion integrity | Published claims distinguish evidence from seller claims | Critical |

## Outcome ledger

When an opportunity closes, record:

`asset → evidence state → publication decision → promotion → negotiation → outcome → reason`

The outcome ledger is the long-term learning asset. It should be stored independently from the current readiness score so historical decisions remain auditable.
