# ADR-0001: 21st.dev as Source Layer, Not Runtime Dependency

## Status

**Accepted** - Implemented in `scripts/adapt-component.js` and `scripts/adapt-all.js`

## Context

The Sadat-MLS-Cloud project needs to incorporate UI components from 21st.dev while maintaining:
1. **Zero runtime dependency** on the 21st.dev platform
2. **Full vendor lock-in avoidance** - components must be self-contained
3. **Transform to project conventions** - Tailwind v4 styling
4. **Reproducible builds** - same input → same output

## Decision

We adopt an **adapter pattern** where 21st.dev serves as a **component source/inspiration layer**, not a runtime dependency.

### Implementation Details

#### 1. Component Fetching
- Components are fetched via 21st.dev CLI (`21st get <id>`)
- CLI is a **development-time** tool, not a runtime dependency
- API key stored in `.env` file (never committed)

#### 2. Transformation Pipeline
```
21st.dev → Raw Component → Transformation → Local File
   ID            ↓              ↓             ↓
      Code Block   →  Class Mapping  →  src/components/ui/
```

**Class Transformations Applied:**
| Original Pattern | Custom Replacement |
|-----------------|-------------------|
| `bg-primary` | `bg-blue-600` |
| `text-primary-foreground` | `text-white` |
| `rounded-md` | `rounded-lg` |
| `focus-visible:ring-2` | `focus-visible:ring-2 focus-visible:ring-blue-500` |

#### 3. Idempotency & Safety
- `--dry-run` mode validates before actual transformation
- `--force` flag bypasses idempotency checks
- `--retry <count>` handles transient API failures with backoff

#### 4. Registry Schema
```json
{
  "components": [
    {
      "id": "1323",
      "name": "Button",
      "description": "Shadcn button baseline",
      "version": "1.0.0"
    }
  ]
}
```

## Consequences

### Positive
- ✅ **No vendor lock-in** - components are local files
- ✅ **Full control** - can modify any component independently
- ✅ **Type safety** - TypeScript interfaces preserved
- ✅ **CI/CD friendly** - no external API calls in production

### Negative
- ⚠️ **Manual sync required** - need to re-run scripts for updates
- ⚠️ **Rate limiting** - 21st.dev free tier: 2 requests/day
- ⚠️ **Storage overhead** - multiple component copies

## Alternatives Considered

1. **npm package dependency** - Rejected: creates vendor lock-in
2. **Monorepo linking** - Rejected: complex dependency management
3. **Runtime fetching** - Rejected: performance + reliability concerns

## Related Decisions

- **ADR-0002**: Tailwind v4 class naming conventions
- **ADR-0003**: Component registry schema design
- **ADR-0004**: CI/CD pipeline for component updates

## Implementation

**Files Changed:**
- `scripts/adapt-component.js` - Single component adapter
- `scripts/adapt-all.js` - Batch processor
- `scripts/component-manifest.json` - Component registry

**Usage:**
```bash
# Dry run to validate
node scripts/adapt-all.js --dry-run

# Actual transformation
node scripts/adapt-all.js

# Force update specific component
node scripts/adapt-component.js 1323 Button --force
```