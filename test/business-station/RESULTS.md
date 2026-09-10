# Observed Business Station verification results

## Final local verification

| Check | Observed result |
| --- | --- |
| Catalog/harness/protocol/snapshot suite | **237 passed**, 0 failed, 0 skipped; final run about 634 ms |
| Business catalog | 108 distinct agents + 108 distinct companion prompts across 12 categories |
| Browser acceptance | **5 passed**, final run about 7.1 s |
| Concurrent workspace reads | **50/50 HTTP 200**, 249 ms for the batch in this sandbox |
| Competing version saves | **1 HTTP 201 + 19 HTTP 409**; exactly two versions stored, no silent overwrites |
| Desktop overview WCAG scan | 0 axe WCAG A/AA violations |
| Station library WCAG scan | 0 violations |
| Agent editor dialog WCAG scan | 0 violations |
| Light settings WCAG scan | 0 violations |
| Dark settings WCAG scan | 0 violations |
| Dark overview WCAG scan | 0 violations |
| Mobile dark overview WCAG scan | 0 violations |
| Mobile light overview WCAG scan | 0 violations |
| Next.js route type generation | Passed |
| TypeScript `--noEmit` | Passed |
| Production build | Passed, Next.js 16.3.4 |
| Managed production start and `/api/health` | Passed |
| Runtime dependency audit (`npm audit --omit=dev`) | 0 reported vulnerabilities after updating the scaffold's dependencies |
| Live-model evaluations | **0 performed — blocked** |
| Proven token/cost improvement against upstream | **Not measured** |
| Upstream Go/Vue suite | **Not run**; Go toolchain absent, original frontend/core unchanged |

Timings are observations from this sandbox, not production performance guarantees. A zero-violation automated accessibility scan does not establish full accessibility conformance or replace screen-reader and user testing.

## What the browser tests exercised

1. Desktop overview, agent discovery, category filtering, query filtering, empty results, pagination, prompt library, keyboard command search, details and instructions.
2. Agent creation, edit/version save, version history, public read-only sharing, browser reload persistence, project creation and project-to-session brief handoff.
3. Persisted skill choice and workspace name, light/dark changes and reload persistence, truthful disconnected-model error without recording a fake completed session.
4. Mobile navigation at 390×844, no horizontal overflow, prompt browsing, scrollable sidebar, help dialog, Escape dismissal.
5. Server-side validation, foreign-origin write denial, cross-workspace isolation, version conflicts, share revocation, invalid session IDs, and explicit HTTP 503 for unconfigured execution.

## Failures found and corrected during iteration

- Chromium could not launch because system libraries were absent; installed the Playwright Chromium prerequisites, then reran.
- The original scaffold's Next.js release had runtime security advisories; updated to 16.3.4 and refreshed affected runtime dependencies.
- Overlapping source edits left duplicate trailing text; removed it and formatted source to make further edits reviewable.
- Prefilled textarea labels and a decorative shortcut caused ambiguous/incorrect accessibility matching; provided stable labels and hid the decorative shortcut from assistive technology.
- Save feedback was displayed before persistence completed; success feedback now follows the successful request.
- Shelley serializes agent text as `Content`/`Type`/`Text`, not provider-style lowercase fields; corrected the parser and added regression cases.
- Indirect usage is an array, not a single usage object; fixed aggregation, fork/dedup accounting, and malformed-data handling.
- Snapshot writes could race cancellation; constrained snapshot updates to sessions still marked running.
- A prior model error could incorrectly mark a recovered conversation failed; status now follows the last relevant response/error.
- Muted text was too low contrast; corrected light and dark colors and increased desktop reading sizes. Final eight-state scans have zero violations.
- Hidden mobile navigation remained keyboard-reachable and the sidebar overflowed short viewports; made the closed mobile sidebar inert and the sidebar scrollable.
- Two test assertions were too strict: a decorative period disappears on mobile and Next.js adds its own live-region alert; assertions now target meaningful content and the application alert.

## Real-model testing is explicitly incomplete

The evaluation runner was invoked without a configured server and returned a blocking message with exit code 2. It made **no model calls** and incurred **no measured model usage**. Its 54-session opt-in plan is implemented, not executed.

The 50 context-composition scenarios and the HTTP adapter fixture are **not real agents or LLM sessions**. Catalog specifications were structurally reviewed and checked; their outputs were not validated by a provider model. No percentage savings, model-quality score, or successful live execution is invented.

## Security and production limits

The runtime dependency audit is clean. The full development dependency audit still reports advisories in lint/build tooling, including the older esbuild chain inside Drizzle Kit. Those tools must not be exposed as production services; development-tool updates require a separate compatibility pass rather than an unreviewed major/downgrade fix.

This is a personal-workspace sandbox, not an authenticated multi-tenant service. Production auth, rate limits, operational monitoring, background completion synchronization, retention policy, native Go/Vue Business Mode, and permitted business tool integrations remain open. See `BUSINESS_STATION.md` for architectural boundaries and setup.

## Reproduction

- `npx tsx --test test/business-station/harness.test.ts test/business-station/adapter.test.ts test/business-station/snapshot.test.ts`
- `npx playwright test --config test/business-station/playwright.config.ts`
- `node test/business-station/stress.mjs`
- `node test/business-station/accessibility.mjs`
- `npx tsx test/business-station/live-evaluation.ts` (explicit configuration/spending approval required)

Screenshots, runtime reports, and live-evaluation output are intentionally ignored under `station-test-results/`; tests regenerate them.
