# Telemetry Configuration (Plausible)

Telemetry is **opt-in**. The plugin runs without telemetry if env vars are unset.

## Setup

1. Create a Plausible account: https://plausible.io
2. Choose **EU region** (data residency).
3. Add a site for this plugin (e.g., `plan-pipeline-v4.example`).
4. Generate an API token (Account → API Keys).
5. Copy `.env.example` to `.env` and fill in:
   ```
   PLAUSIBLE_DOMAIN=<your-site-domain>
   PLAUSIBLE_ENDPOINT=https://plausible.io/api/event
   PLAUSIBLE_API_TOKEN=<your-token>
   ```

## Opt-out

Leave the env vars unset (or comment them out in `.env`). The adapter returns `null` from `loadConfigFromEnv` and telemetry is fully disabled.

## What's tracked

See `src/telemetry/` for the full list of events emitted via `TelemetryClient.emit`. Events include lifecycle hooks such as `PhaseApproved`, `PhaseStarted`, `HookBlock`, `ChangeProposed`, and `ImplementationStarted`.

## Privacy

- No PII (personally identifiable information) is sent.
- No event content/payload is sent — only metric names + counts.
- EU region keeps data within GDPR jurisdiction.
