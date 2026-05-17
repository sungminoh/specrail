# Telemetry Configuration (Plausible)

Telemetry is **opt-in**. The plugin runs without telemetry if env vars are unset.

> Note: with domain + endpoint set, the adapter sends events. Without them, telemetry is fully disabled (no-op). Token is optional.

## Setup

1. Create a Plausible account: https://plausible.io
2. Choose **EU region** (data residency).
3. Add a site for this plugin (e.g., `specrail.example`).
4. (Optional) Generate an API token (Account → API Keys). Plausible /api/event is unauthenticated by default; you only need this for self-hosted setups that require Bearer.
5. Copy `.env.example` to `.env` and fill in:
   ```
   PLAUSIBLE_DOMAIN=<your-site-domain>
   PLAUSIBLE_ENDPOINT=https://plausible.io/api/event
   # PLAUSIBLE_API_TOKEN=<your-token>   # optional
   ```

## Opt-out

Leave the env vars unset (or comment them out in `.env`). The adapter returns `null` from `loadConfigFromEnv` and telemetry is fully disabled.

## What's tracked

See `src/telemetry/` for the full list of events emitted via `TelemetryClient.emit`. Events include lifecycle hooks such as `PhaseApproved`, `PhaseStarted`, `HookBlock`, `ChangeProposed`, and `ImplementationStarted`.

## Privacy

- No PII (personally identifiable information) is sent.
- No event content/payload is sent — only metric names + counts.
- EU region keeps data within GDPR jurisdiction.
