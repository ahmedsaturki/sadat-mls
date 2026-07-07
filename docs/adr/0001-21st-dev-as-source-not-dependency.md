# ADR-0001: 21st.dev as Component Source, Not Dependency

**Status:** Accepted  
**Date:** 2026-07-07  
**Decision Makers:** Project Lead  
**Technical Story:** [Setup 21st.dev CLI integration with adapter layer]

## Context

Sadat-MLS-Cloud is a self-hosted, multi-tenant real estate platform built on Next.js 16, Tailwind v4, and Supabase. The project requires a rich component library for its admin dashboard, agent portal, and public-facing marketing pages.

The 21st.dev platform provides a curated registry of high-quality React/Tailwind components from multiple sources (shadcn/ui, originui, kokonutd, shugar, etc.). However, integrating 21st.dev as a runtime dependency or build-time requirement would introduce vendor lock-in and external platform risk.

## Decision

**We will use 21st.dev exclusively as a component *source* and *inspiration layer*, never as a runtime or build-time dependency.**

Implementation strategy:
1. **Discovery & Acceleration**: Use `21st search` and `21st get <id>` to explore components during design/implementation
2. **Controlled Adaptation**: Fetch component code, transform to our internal conventions (Tailwind v4, custom variants, `cn()` utility, TypeScript patterns), and commit as project-owned files in `src/components/ui/`
3. **Zero Runtime Dependency**: The 21st.dev CLI is only used in developer workflows (`scripts/adapt-all.js`), never in CI/CD pipelines or production builds
4. **Portable Artifacts**: Adapted components are standard React/TypeScript files with no external imports or platform-specific code

## Consequences

### Positive
- **Full ownership**: All UI code lives in our repo, versioned with the project
- **Vendor independence**: Can switch component sources or build components from scratch without migration
- **Consistent design system**: All components conform to our internal Tailwind v4 conventions (custom color palette, spacing, variant system)
- **Security**: No external code execution at build/deploy time; full audit trail
- **Flexibility**: Same adapter pattern works for any future component registry (open-source libraries, internal design systems, Figma exports)

### Negative
- **Manual step**: Developers must run `node scripts/adapt-all.js` (or `--dry-run` for testing) instead of `npm install`
- **Maintenance burden**: Component updates from 21st.dev require re-adaptation rather than `npm update`
- **Initial friction**: New team members must understand the adapter workflow

## Implementation Details

### Adapter Scripts
| Script | Purpose |
|--------|---------|
| `scripts/adapt-component.js` | Fetch single component by ID, transform classes, write to `src/components/ui/` |
| `scripts/adapt-all.js` | Batch process manifest with `--dry-run` support for safe testing |
| `scripts/component-manifest.json` | Declarative registry of components to adapt (ID, name, description) |

### Transformation Rules (non-exhaustive)
| 21st.dev Pattern | Project Convention |
|------------------|-------------------|
| `bg-primary` → `text-primary-foreground` | `bg-blue-600` → `text-white` |
| `bg-secondary` | `bg-gray-100` |
| `bg-destructive` | `bg-red-600` |
| `rounded-md` | `rounded-lg` |
| `cva` / `class-variance-authority` | Native TypeScript variant objects + `cn()` |
| `@/lib/utils` | `@/lib/utils/cn` (our existing utility) |

### Developer Workflow
```bash
# 1. Discover components
21st search "pricing table"
21st search "data table"

# 2. Add to manifest
cat >> scripts/component-manifest.json << 'EOF'
{ "id": "1234", "name": "PricingTable", "description": "Marketing pricing table" }
EOF

# 3. Test adaptation (zero risk, no API calls)
node scripts/adapt-all.js --dry-run

# 4. Execute with valid API key (when ready)
node scripts/adapt-all.js

# 5. Review generated components in src/components/ui/
# 6. Commit as project-owned code
```

## Alternatives Considered

| Option | Rejected Because |
|--------|------------------|
| Direct `21st add` / shadcn CLI integration | Creates shadcn config coupling; Tailwind v3 assumptions |
| Fork 21st.dev components as npm packages | Still vendor-dependent; version drift risk |
| Copy-paste without automation | Error-prone; no audit trail; inconsistent conventions |
| Build all components from scratch | Slow initial velocity; reinventing solved patterns |

## Related
- `scripts/adapt-component.js` — Core transformation logic
- `scripts/adapt-all.js` — Batch orchestration with dry-run
- `scripts/component-manifest.json` — Component registry
- `TROUBLESHOOTING.md` — Rate limit handling, common errors
- `.env.example` — `API_KEY_21ST` configuration template