# Business Station implementation and verification

## Repository and scope

This workspace is the original `boldsoftware/shelley` Git checkout. Its Go agent core, SQLite history, Vue application, tools, and history are retained. An additive Next.js App Router Business Station lives in `src/`, using the platform's existing Next.js/PostgreSQL scaffold. It is an additional client for Shelley's documented API, **not a rewrite of the Go harness or an overhaul of the existing Vue frontend**. This distinction matters: the entire original mission is not complete.

The running preview serves the Station. To operate models, run a separately configured Shelley server from this repository or connect an existing trusted Shelley instance. No model runtime, provider credentials, Go toolchain, or Shelley server endpoint was available in this sandbox. The application's disconnected state is deliberate, not a simulated AI response.

## Implemented

- Responsive green workspace: overview, session composer/history, projects, discovery, saved agents, prompts, analytics, settings, command search, native dialogs, light/dark themes, reduced-motion support, locally served Inter fonts.
- 108 named business agents and 108 companion prompts across 12 disciplines. Every workflow has task-specific context and deliverables, factuality constraints, privacy boundaries, and human approval requirements. They are structurally tested, **not live-model validated**.
- Drizzle/PostgreSQL workspace persistence for assets, immutable instruction versions, projects, preferences, sessions, and model-reported token usage.
- Atomic version changes with row locking and optimistic version checks. Read-only, unguessable public share links can be rotated or revoked. A share link reflects the latest saved version, not an immutable snapshot.
- Model catalog is obtained from `GET /api/models` and respects each model's `ready` field. No provider/model IDs are hardcoded.
- Session creation, snapshot polling, follow-up chat, cancellation, output saving, and CSV usage export. All model interactions proxy through server routes; secrets are never sent to the browser.
- Business Mode disables **all Shelley tools**, making the initial release a supplied-evidence analysis/drafting workspace. It cannot browse, send campaigns, mutate a CRM, or automate external systems. Coding Mode retains Shelley's configured tools.
- Only the selected workflow and opted-in skill text are added to a brief. This prevents whole-catalog prompt injection; it is not proof of a token reduction against the upstream harness.
- Ponytail and Caveman source instructions and licenses are vendored under `skills/business-station/`. No third-party executable hooks are run. Toggles persist per workspace. Ponytail is coding-only, as required by its upstream instructions. Caveman preserves normal prose for third-party/customer-facing deliverables.

## Environment

- `DATABASE_URL`: existing PostgreSQL connection, read by `src/db/index.ts`.
- `SHELLEY_API_URL`: trusted base URL of the Shelley server, without `/api`.
- `SHELLEY_API_TOKEN`: optional bearer credential for an authentication gateway in front of Shelley. Shelley itself determines its authentication requirements; a gateway token is not assumed to be a native Shelley API key.
- `COOKIE_SECURE=true`: set behind HTTPS in deployment.
- `LIVE_EVAL_APPROVE=true`: explicit spending authorization for the opt-in evaluation runner.
- `EVAL_MODEL`: optional exact ready model ID for evaluation; otherwise available models are rotated between matched pairs.

The browser cookie is a high-entropy, HttpOnly workspace identifier with SameSite=Lax. This personal sandbox is **not enterprise authentication**. Production multi-tenant deployment still needs an authenticated upstream gateway, workspace membership/authorization, quotas/rate limiting, retention controls, and a secure-cookie HTTPS configuration. Do not expose the Coding Mode adapter to untrusted users: the upstream coding tools are capable of modifying the host environment.

## Architectural decisions

1. **Retain the original harness.** The Station speaks the contracts in `API.md`, `server/handlers.go`, `server/server.go`, and `llm/llm.go`; it does not pretend to be a new provider SDK.
2. **Honest execution state.** Without a model endpoint, briefs are not sent and no completed sessions or token savings are fabricated. Templates are not counted as activity.
3. **Mode safety enforced beyond prompts.** Business sessions send `conversation_options.disable_all_tools=true`. No-code/no-send policy is also present in the brief, but prompt wording is not treated as a security boundary.
4. **Actual accounting.** Serialized content uses Go's `Content`/`Type`/`Text` fields. Usage uses lowercase fields. Direct usage and the `other_usage_data` array are counted; cached inputs are included in total input and identified separately. Duplicate IDs and forked usage are not charged twice. Malformed usage fails explicitly instead of silently reporting zero.
5. **Poll safely.** Cancellation cannot be overwritten by a concurrent snapshot save. Follow-up requests claim session state optimistically to avoid concurrent submissions. Polling errors remain visible and can be retried. Polling is currently client-driven, so sessions closed mid-run are refreshed when reopened rather than by a background worker.
6. **Version instructions transactionally.** Saving creates a new version in the same transaction as the current asset change. Conflicts return HTTP 409. Version history currently captures instructions; it does not snapshot every metadata field.
7. **Share deliberately.** Only saved instructions and public metadata are exposed. Sessions, workspace identifiers, model configuration, and private history are excluded.
8. **No unsupported optimization claims.** Selected-workflow context is smaller than including 216 entries, but upstream Shelley does not necessarily include such a catalog. That fact is not used as a fake baseline. No percentage savings or quality improvement is reported without matched real runs.

## Verification and reproduction

Local tests:

- `npx tsx --test test/business-station/harness.test.ts test/business-station/adapter.test.ts test/business-station/snapshot.test.ts`
- `npx playwright test --config test/business-station/playwright.config.ts`
- `node test/business-station/accessibility.mjs`

The adapter test is an explicitly labeled HTTP protocol fixture, **not an LLM run**. The 50 varied compositions inside the harness suite are local context-isolation checks, **not 50 real agent sessions**.

The browser suite exercises discovery/filtering, pagination, keyboard search, workflow creation/editing/versioning, public sharing, persistence, project creation, settings, dark mode, disconnected execution, mobile navigation, API validation, cross-workspace denial, version conflicts, and share revocation. Accessibility checks inspect desktop, mobile, library, editor, and light/dark states using axe WCAG A/AA rules. Automated checks do not replace assistive-technology user testing.

Final build sequence:

1. `npx next typegen`
2. `npm exec tsc -- --noEmit --pretty false`
3. `npm run build`
4. Platform `build_and_start`, including `/api/health`.

## Live evaluation: blocked, not completed

`npx tsx test/business-station/live-evaluation.ts` was invoked and correctly returned:

> BLOCKED: set SHELLEY_API_URL and LIVE_EVAL_APPROVE=true to authorize 54 real sessions. No live evaluation was performed.

Once explicitly configured, the runner executes 27 matched business scenarios in baseline and Business arms (54 real sessions), records raw snapshots and latency, and retains provider usage for review. Both arms disable tools to prevent the benchmark from taking external actions. It is **not a coding benchmark**. It rotates available models or uses `EVAL_MODEL`. The runner stores results under ignored `station-test-results/live/` and cancels timed-out sessions.

Before reporting a gain, inspect factual correctness, usefulness, evidence grounding, consent, missing-input handling, and token/cost figures for every matched pair. Quality review is marked pending, never auto-passed. A dedicated coding benchmark, multi-turn tests, long-context stress runs, tool-error injection, and independent human scoring are still required.

## Remaining mission work

- 50+ real agent sessions and validation of all 216 catalog entries.
- Measured reductions in token cost against the original harness with equal or better independently scored quality.
- Native Business Mode in the Go system prompt/tool registry and a corresponding overhaul of the existing Vue app.
- Authenticated team collaboration, organizations, audit trails, operational quotas, background completion sync, robust streaming/reconnection, and production observability.
- Approved research/browser and CRM integrations with granular human-approval workflows.
- Broader codebase test execution: no Go toolchain was available; upstream Go/Vue suites were not run, and this change does not claim their coverage.

See `test/business-station/RESULTS.md` for the final observed checks and remaining limitations.
