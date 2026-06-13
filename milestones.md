# Milestones

## Milestone 1: Bundle Shaping + Public Interface
**Status:** not started
**Goal:** Module structure, subpath exports, registry pattern, and `VegaTracker` public API stub are locked — no functional implementation yet, but architecture contracts are established.

### Scope
- `package.json` subpath exports: `/browser`, `/vega`, default for both `video-core` and `video-html5`
- Webpack `resolve.alias` config for subpath builds
- Registry pattern in `recordEvent.js` (`registerHarvester`, dispatcher, `Log.warn` on missing registration)
- `"sideEffects": false` in `package.json`
- `VegaTracker` class stub: frozen constructor signature (`info`, `config`), `forceHarvest()`, `dispose()`, `setHarvestInterval()` — no functional implementation
- `src: 'Vega'` injected via `super()` constructor
- `getHarvester()` override stub

### Out of scope
- Functional harvester implementation
- Event routing
- QoE logic
- Tests beyond import/export smoke tests

---

## Milestone 2: Mobile Harvester (Isolated, Fully Resilient)
**Status:** not started
**Goal:** `ConnectedDeviceHarvester` + `ConnectedDeviceAnalyticsAgent` in `video-core` are fully implemented and tested in isolation against staging mobile-collector — including all resilience behaviors.

### Scope
- `ConnectedDeviceHarvester` and `ConnectedDeviceAnalyticsAgent` implementations
- `/v5/connect` wire format (2-tuple: appInfo, deviceInfo), headers, `"Android"` / `"AndroidAgent"` in `osName`/`agentName`
- `/v3/data` wire format (10-tuple), `dataToken` lifecycle
- Connect retry policy: 3 attempts, 1s/2s/4s backoff, 5-min indefinite post-exhaustion retry
- `/v3/data` 401 streak (K=3) → exhausted path; streak resets on 200
- `dataToken` auto-refresh on `/v3/data` 401
- Buffer eviction: 100-event FIFO drop-oldest via `makeRoom`
- `Log.warn` on connect failures and 401-streak exhaustion
- Placeholder device identity (`deviceUuid = 00000000-...`, static `CD_METADATA`)
- `connectedDeviceConstants.js`
- Integration tests against staging mobile-collector covering all behaviors above

### Out of scope
- Player tracker wiring
- QoE aggregates
- `dispose()` / `forceHarvest()` lifecycle (live in tracker layer)

---

## Milestone 3: VegaTracker Wiring
**Status:** not started
**Goal:** `VegaTracker` imported from `@newrelic/video-html5/vega` routes player events to the mobile harvester — end-to-end events land in staging NR with `att.src='Vega'`.

### Scope
- `VegaTracker extends Html5Tracker` — `getHarvester()` wired to `ConnectedDeviceHarvester`
- Browser-only attribute stripping
- `att.src='Vega'` on all Vega events
- Default entry (`@newrelic/video-html5`) runtime dispatch via `att.src`
- `Html5ImaAdsTracker` ships in `/vega` bundle (accepted v1 cost)
- Integration test: `VegaTracker` against staging mobile-collector; events land, `att.src='Vega'` confirmed
- Regression test: `Html5Tracker` against staging browser collector; Browser pipeline unchanged after registry refactor

### Out of scope
- QoE aggregates
- `dispose()` / `forceHarvest()` implementation
- Bundle output inspection

---

## Milestone 4: QoE Aggregates + Lifecycle API
**Status:** not started
**Goal:** `QOE_AGGREGATE` events emit per view with current KPIs, and `dispose()`/`forceHarvest()` flush buffered events reliably.

### Scope
- `QOE_AGGREGATE` events per video view
- QoE aggregate updated at each harvest cycle; unchanged aggregates skipped
- `dispose()`: final `/v3/data` drain, wired to `VegaTracker`
- `forceHarvest()`: `Promise<void>`, best-effort, re-buffers on send failure
- `setHarvestInterval()`: adjustable harvest cadence

### Out of scope
- Real device identity (OQ-1, OQ-2)
- CI gates
- Beta docs and release artifacts

---

## Milestone 5: Release Readiness + Testing
**Status:** not started
**Goal:** Bundle isolation verified, all integration tests pass, and beta release artifacts are complete.

### Scope
- Bundle output inspection: grep `/vega` for forbidden symbols (`videoAnalyticsHarvester`, `HarvestScheduler`); grep `/browser` for forbidden symbols (`ConnectedDeviceHarvester`, `connectedDeviceAnalyticsHarvester`)
- Bundle size baseline recorded for v1 (CJS + ESM, `/vega` + `/browser`)
- Html5Tracker full regression suite passes with registry refactor in place
- CDD edits: §3, §4, §6, §8, new beta-scope section
- TREE_SHAKING_SPEC_V2.md edits: §3.5.1–§3.5.4, §3.5.9, §5.5.5, new appendix, new API stability-tiers section
- Beta release notes: device identity placeholder, static `CD_METADATA`, polyfill BYO contract, `dispose()` wiring requirement, endpoint param semantics, beta-volatile thresholds
- Customer onboarding doc: polyfill list, integration guide

### Out of scope
- CI gates for symbol grep / bundle-size assertion (v1.x follow-up)
- Real device identity (OQ-1, OQ-2)
- `@newrelic/video-shaka` Vega support
- Public observability API (`getHarvestState`, emitter events for connect/harvest state)
- Multi-`VegaTracker` per app
