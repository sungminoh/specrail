# Verification report

_Generated: 2026-05-14T22:18:31.124Z_

## Summary

| Reality | Count |
|---|---|
| ⚪ NotBuilt | 208 |
| 🔵 ManualReview | 108 |
| 🟢 Built | 179 |
| 🟡 Partial | 19 |

## AC

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `AC-R1-1` | 🟢 Built | test-grep | `test-pass` `tests/cli-verify.test.ts` · `test-pass` `tests/frontmatter.test.ts` |
| `AC-R1-2` | 🟢 Built | test-grep | `test-pass` `tests/graph-builder-bold-defs.test.ts` · `test-pass` `tests/inv-enforce.test.ts` |
| `AC-R1-3` | 🟢 Built | test-grep | `test-pass` `tests/id-counter.test.ts` · `test-pass` `tests/lint-ac-traceability.test.ts` |
| `AC-R13-1` | 🟢 Built | test-grep | `test-pass` `tests/telemetry-consent.test.ts` |
| `AC-R13-2` | 🟢 Built | test-grep | `test-pass` `tests/telemetry-client.test.ts` |
| `AC-R13-3` | 🟢 Built | test-grep | `test-pass` `tests/telemetry-opt-out.test.ts` |
| `AC-R2-1` | 🟢 Built | test-grep | `test-pass` `tests/hook-install.test.ts` · `test-pass` `tests/lint-ac-traceability.test.ts` |
| `AC-R2-2` | 🟢 Built | test-grep | `test-pass` `tests/lint-ac-traceability.test.ts` · `test-pass` `tests/transition-gate.test.ts` |
| `AC-R2-3` | 🟢 Built | test-grep | `test-pass` `tests/schema-validate-hook.test.ts` |
| `AC-R3-1` | 🟢 Built | test-grep | `test-pass` `tests/inv-enforce.test.ts` · `test-pass` `tests/lint-ac-traceability.test.ts` |
| `AC-R4-1` | 🟢 Built | test-grep | `test-pass` `tests/change-skill.test.ts` · `test-pass` `tests/lint-ac-traceability.test.ts` |
| `AC-R4-2` | 🟢 Built | test-grep | `test-pass` `tests/downstream.test.ts` · `test-pass` `tests/lint-ac-traceability.test.ts` |
| `AC-R5-1` | 🟢 Built | test-grep | `test-pass` `tests/inv-enforce.test.ts` · `test-pass` `tests/m2-bootstrap-skills.test.ts` |
| `AC-R5-2` | 🟢 Built | test-grep | `test-pass` `tests/skill-utilities.test.ts` |
| `AC-R5-3` | 🟢 Built | test-grep | `test-pass` `tests/skill-utilities.test.ts` |
| `AC-R6-1` | 🟢 Built | test-grep | `test-pass` `tests/m2-bootstrap-skills.test.ts` |
| `AC-R6-2` | 🟢 Built | test-grep | `test-pass` `tests/m2-bootstrap-skills.test.ts` |
| `AC-R6-3` | 🟢 Built | test-grep | `test-pass` `tests/hook-install.test.ts` |
| `AC-R7-1` | 🟢 Built | test-grep | `test-pass` `tests/lint-ac-traceability.test.ts` · `test-pass` `tests/lint-r7-b2b.test.ts` |
| `AC-R7-2` | 🟢 Built | test-grep | `test-pass` `tests/lint-ac-traceability.test.ts` · `test-pass` `tests/lint-r7-domain.test.ts` |
| `AC-R7-3` | 🟢 Built | test-grep | `test-pass` `tests/lint-r7-history.test.ts` |
| `AC-R8-1` | 🟢 Built | test-grep | `test-pass` `tests/lint-ac-traceability.test.ts` · `test-pass` `tests/subagent-wrapper.test.ts` |
| `AC-R8-2` | 🟢 Built | test-grep | `test-pass` `tests/dispatch.test.ts` · `test-pass` `tests/subagent-review.test.ts` |
| `AC-R8-3` | 🟢 Built | test-grep | `test-pass` `tests/subagent-escalate.test.ts` |

## ADR

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `ADR-1` | 🔵 ManualReview | adr-signoff | `no-signoff` `12-adr-risks.md:20` |
| `ADR-10` | 🔵 ManualReview | adr-signoff | `no-signoff` `12-adr-risks.md:618` |
| `ADR-11` | 🔵 ManualReview | adr-signoff | `no-signoff` `12-adr-risks.md:696` |
| `ADR-2` | 🔵 ManualReview | adr-signoff | `no-signoff` `12-adr-risks.md:76` |
| `ADR-3` | 🔵 ManualReview | adr-signoff | `no-signoff` `12-adr-risks.md:136` |
| `ADR-4` | 🔵 ManualReview | adr-signoff | `no-signoff` `12-adr-risks.md:197` |
| `ADR-5` | 🔵 ManualReview | adr-signoff | `no-signoff` `12-adr-risks.md:257` |
| `ADR-6` | 🔵 ManualReview | adr-signoff | `no-signoff` `12-adr-risks.md:321` |
| `ADR-7` | 🔵 ManualReview | adr-signoff | `no-signoff` `12-adr-risks.md:405` |
| `ADR-8` | 🔵 ManualReview | adr-signoff | `no-signoff` `12-adr-risks.md:477` |
| `ADR-9` | 🔵 ManualReview | adr-signoff | `no-signoff` `12-adr-risks.md:547` |

## ARCH

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `ARCH-1` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:86` |
| `ARCH-10` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:305` |
| `ARCH-11` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:317` |
| `ARCH-12` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:330` |
| `ARCH-2` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:87` |
| `ARCH-3` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:88` |
| `ARCH-4` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:89` |
| `ARCH-5` | 🟢 Built | path-exists | `file-exists` `docs/spec/` |
| `ARCH-6` | 🟢 Built | path-exists | `file-exists` `docs/spec/` |
| `ARCH-7` | 🟢 Built | path-exists | `file-exists` `docs/spec/` |
| `ARCH-8` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:285` |
| `ARCH-9` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:295` |

## EDGE

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `EDGE-1` | 🟢 Built | test-grep | `test-pass` `tests/edge-timestamp.test.ts` · `test-pass` `tests/verify-rule-test-grep.test.ts` |
| `EDGE-10` | 🟢 Built | test-grep | `test-pass` `tests/edge-i18n.test.ts` |
| `EDGE-11` | 🟢 Built | test-grep | `test-pass` `tests/edge-hook-bypass.test.ts` |
| `EDGE-12` | 🟢 Built | test-grep | `test-pass` `tests/edge-hook-bypass.test.ts` |
| `EDGE-13` | 🟢 Built | test-grep | `test-pass` `tests/edge-hook-bypass.test.ts` |
| `EDGE-14` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `EDGE-15` | 🟢 Built | test-grep | `test-pass` `tests/edge-15-first-spec.test.ts` |
| `EDGE-16` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `EDGE-17` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `EDGE-18` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `EDGE-19` | 🟢 Built | test-grep | `test-pass` `tests/edge-external.test.ts` |
| `EDGE-2` | 🟢 Built | test-grep | `test-pass` `tests/edge-timestamp.test.ts` |
| `EDGE-20` | 🟢 Built | test-grep | `test-pass` `tests/edge-external.test.ts` |
| `EDGE-21` | 🟢 Built | test-grep | `test-pass` `tests/edge-external.test.ts` |
| `EDGE-22` | 🟢 Built | test-grep | `test-pass` `tests/edge-external.test.ts` |
| `EDGE-23` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `EDGE-24` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `EDGE-25` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `EDGE-3` | 🟢 Built | test-grep | `test-pass` `tests/edge-timestamp.test.ts` |
| `EDGE-4` | 🟢 Built | test-grep | `test-pass` `tests/edge-concurrency.test.ts` |
| `EDGE-5` | 🟢 Built | test-grep | `test-pass` `tests/edge-concurrency.test.ts` |
| `EDGE-6` | 🟢 Built | test-grep | `test-pass` `tests/edge-concurrency.test.ts` |
| `EDGE-7` | 🟢 Built | test-grep | `test-pass` `tests/edge-i18n.test.ts` · `test-pass` `tests/patterns.test.ts` |
| `EDGE-8` | 🟢 Built | test-grep | `test-pass` `tests/edge-i18n.test.ts` |
| `EDGE-9` | 🟢 Built | test-grep | `test-pass` `tests/edge-i18n.test.ts` |

## ENT

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `ENT-AcceptanceCriteria` | ⚪ NotBuilt | ent-symbol | `symbol-missing` |
| `ENT-Change` | ⚪ NotBuilt | ent-symbol | `symbol-missing` |
| `ENT-DependencyGraph` | 🟢 Built | ent-symbol | `symbol-found` `src/graph/builder.ts:67` |
| `ENT-Foo` | ⚪ NotBuilt | ent-symbol | `symbol-missing` |
| `ENT-Hook` | ⚪ NotBuilt | ent-symbol | `symbol-missing` |
| `ENT-Phase` | ⚪ NotBuilt | ent-symbol | `symbol-missing` |
| `ENT-Project` | ⚪ NotBuilt | ent-symbol | `symbol-missing` |
| `ENT-Skill` | ⚪ NotBuilt | ent-symbol | `symbol-missing` |
| `ENT-Spec` | ⚪ NotBuilt | ent-symbol | `symbol-missing` |
| `ENT-Subagent` | ⚪ NotBuilt | ent-symbol | `symbol-missing` |
| `ENT-TelemetryConsent` | ⚪ NotBuilt | ent-symbol | `symbol-missing` |
| `ENT-TelemetryEvent` | 🟢 Built | ent-symbol | `symbol-found` `src/telemetry/client.ts:18` |

## EXT

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `EXT-1` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:100` |
| `EXT-2` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:101` |
| `EXT-3` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:102` |
| `EXT-4` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:103` |
| `EXT-5` | 🔵 ManualReview | path-exists | `no-path-tokens` `08-system-architecture.md:104` |

## F

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `F1.1` | 🔵 ManualReview | rfs-aggregate | `aggregated-children` · `child:ManualReview` `S1.1.1` |
| `F1.2` | 🔵 ManualReview | rfs-aggregate | `aggregated-children` · `child:ManualReview` `S1.2.3` |
| `F1.3` | ⚪ NotBuilt | skeleton |  |
| `F1.4` | ⚪ NotBuilt | skeleton |  |
| `F13.1` | ⚪ NotBuilt | skeleton |  |
| `F13.2` | ⚪ NotBuilt | skeleton |  |
| `F13.3` | ⚪ NotBuilt | skeleton |  |
| `F2.1` | ⚪ NotBuilt | skeleton |  |
| `F2.2` | ⚪ NotBuilt | skeleton |  |
| `F2.3` | ⚪ NotBuilt | skeleton |  |
| `F2.4` | ⚪ NotBuilt | skeleton |  |
| `F3.1` | ⚪ NotBuilt | skeleton |  |
| `F3.5` | ⚪ NotBuilt | skeleton |  |
| `F4.1` | ⚪ NotBuilt | skeleton |  |
| `F4.2` | ⚪ NotBuilt | skeleton |  |
| `F4.3` | ⚪ NotBuilt | skeleton |  |
| `F5.1` | ⚪ NotBuilt | skeleton |  |
| `F5.2` | ⚪ NotBuilt | skeleton |  |
| `F5.3` | ⚪ NotBuilt | skeleton |  |
| `F5.4` | ⚪ NotBuilt | skeleton |  |
| `F6.1` | ⚪ NotBuilt | skeleton |  |
| `F6.2` | ⚪ NotBuilt | skeleton |  |
| `F6.3` | ⚪ NotBuilt | skeleton |  |
| `F6.4` | ⚪ NotBuilt | skeleton |  |
| `F7.1` | ⚪ NotBuilt | skeleton |  |
| `F7.2` | ⚪ NotBuilt | skeleton |  |
| `F8.1` | ⚪ NotBuilt | skeleton |  |
| `F8.2` | ⚪ NotBuilt | skeleton |  |
| `F8.3` | ⚪ NotBuilt | skeleton |  |
| `F8.4` | ⚪ NotBuilt | skeleton |  |

## INV

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `INV-1` | 🟢 Built | test-grep | `test-pass` `tests/edge-15-first-spec.test.ts` · `test-pass` `tests/graph-builder-table-defs.test.ts` |
| `INV-10` | 🟢 Built | test-grep | `test-pass` `tests/edge-hook-bypass.test.ts` · `test-pass` `tests/hook-install.test.ts` |
| `INV-2` | 🟢 Built | test-grep | `test-pass` `tests/approve.test.ts` · `test-pass` `tests/change-merge.test.ts` |
| `INV-3` | 🟢 Built | test-grep | `test-pass` `tests/approve.test.ts` · `test-pass` `tests/graph-builder-bold-defs.test.ts` |
| `INV-4` | 🟢 Built | test-grep | `test-pass` `tests/e2e-s1-s2.test.ts` · `test-pass` `tests/graph-builder-bold-defs.test.ts` |
| `INV-5` | 🟢 Built | test-grep | `test-pass` `tests/inv-enforce.test.ts` |
| `INV-6` | 🟢 Built | test-grep | `test-pass` `tests/change-skill.test.ts` · `test-pass` `tests/graph-builder-ast-citations.test.ts` |
| `INV-7` | 🟢 Built | test-grep | `test-pass` `tests/inv-enforce.test.ts` |
| `INV-8` | 🟢 Built | test-grep | `test-pass` `tests/telemetry-client.test.ts` |
| `INV-9` | 🟢 Built | test-grep | `test-pass` `tests/telemetry-client.test.ts` · `test-pass` `tests/telemetry-consent.test.ts` |

## KPI

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `KPI-1` | ⚪ NotBuilt | kpi-cross-ref | `aggregated-from` · `ref:ManualReview` `KPI-2` |
| `KPI-2` | ⚪ NotBuilt | kpi-cross-ref | `aggregated-from` · `ref:ManualReview` `KPI-3` |
| `KPI-3` | ⚪ NotBuilt | kpi-cross-ref | `aggregated-from` · `ref:ManualReview` `KPI-4` |
| `KPI-4` | ⚪ NotBuilt | kpi-cross-ref | `aggregated-from` · `ref:ManualReview` `KPI-6` |
| `KPI-5` | 🟢 Built | kpi-cross-ref | `aggregated-from` · `ref:Built` `AC-R3-1` |
| `KPI-6` | ⚪ NotBuilt | kpi-cross-ref | `aggregated-from` · `ref:ManualReview` `KPI-5` |

## NFR

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `NFR-A11Y-1` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-A11Y-2` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-A11Y-3` | 🟢 Built | test-grep | `test-pass` `tests/verify-rule-nfr.test.ts` |
| `NFR-A11Y-4` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-A11Y-5` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-A11Y-6` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-A11Y-7` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-AVAIL-1` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-AVAIL-2` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-AVAIL-3` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-AVAIL-4` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-AVAIL-5` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-AVAIL-6` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-AVAIL-7` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-AVAIL-8` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-I18N-1` | 🟢 Built | test-grep | `test-pass` `tests/change-skill.test.ts` · `test-pass` `tests/edge-i18n.test.ts` |
| `NFR-I18N-2` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-I18N-3` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-I18N-4` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-I18N-5` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-I18N-6` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-I18N-7` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-PERF-1` | 🟢 Built | test-grep | `test-pass` `tests/graph-builder.test.ts` · `test-pass` `tests/patterns.test.ts` |
| `NFR-PERF-2` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-PERF-3` | 🟢 Built | test-grep | `test-pass` `tests/perf-bench.test.ts` |
| `NFR-PERF-4` | 🟢 Built | test-grep | `test-pass` `tests/perf-bench.test.ts` |
| `NFR-PERF-5` | 🟢 Built | test-grep | `test-pass` `tests/perf-bench.test.ts` |
| `NFR-PERF-6` | 🟢 Built | test-grep | `test-pass` `tests/perf-bench.test.ts` |
| `NFR-PERF-7` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-PRIV-1` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-PRIV-2` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-PRIV-3` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-PRIV-4` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-PRIV-5` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-SCAL-1` | 🟢 Built | test-grep | `test-pass` `tests/edge-i18n.test.ts` |
| `NFR-SCAL-2` | 🟢 Built | test-grep | `test-pass` `tests/cli-status.test.ts` · `test-pass` `tests/perf-bench.test.ts` |
| `NFR-SCAL-3` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-SCAL-4` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-SCAL-5` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-SEC-1` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-SEC-10` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-SEC-11` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-SEC-12` | 🟢 Built | test-grep | `test-pass` `tests/graph-builder-table-defs.test.ts` |
| `NFR-SEC-13` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-SEC-2` | 🟢 Built | test-grep | `test-pass` `tests/verify-rule-nfr.test.ts` |
| `NFR-SEC-3` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-SEC-4` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-SEC-5` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-SEC-6` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-SEC-7` | 🟢 Built | test-grep | `test-pass` `tests/lint-secret-detect.test.ts` |
| `NFR-SEC-8` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `NFR-SEC-9` | ⚪ NotBuilt | test-grep | `no-test-ref` |

## OPS

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `OPS-1` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:31` |
| `OPS-10` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:154` |
| `OPS-11` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:155` |
| `OPS-12` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:156` |
| `OPS-13` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:157` |
| `OPS-14` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:158` |
| `OPS-15` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:159` |
| `OPS-16` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:160` |
| `OPS-17` | 🟢 Built | ops-path | `file-exists` `docs/spec` |
| `OPS-18` | 🟢 Built | ops-path | `file-exists` `docs/spec` |
| `OPS-19` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:171` |
| `OPS-2` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:64` |
| `OPS-20` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:172` |
| `OPS-21` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:173` |
| `OPS-3` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:72` |
| `OPS-4` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:84` |
| `OPS-5` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:94` |
| `OPS-6` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:107` |
| `OPS-7` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:111` |
| `OPS-8` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:152` |
| `OPS-9` | 🔵 ManualReview | ops-path | `no-path-tokens` `11-operations.md:153` |

## OQ

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `OQ-1-1` | 🔵 ManualReview | oq-resolution | `oq-status-unknown` `01-prd.md:126` |
| `OQ-1-2` | 🔵 ManualReview | oq-resolution | `oq-status-unknown` `01-prd.md:127` |
| `OQ-1-3` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:850` |
| `OQ-1-4` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:851` |
| `OQ-1-5` | 🔵 ManualReview | oq-resolution | `oq-status-unknown` `01-prd.md:130` |
| `OQ-10-1` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:828` |
| `OQ-10-2` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:829` |
| `OQ-10-3` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:867` |
| `OQ-10-4` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:868` |
| `OQ-11-1` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:884` |
| `OQ-11-2` | 🔵 ManualReview | oq-resolution | `oq-status-unknown` `11-operations.md:226` |
| `OQ-11-3` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:869` |
| `OQ-11-4` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:870` |
| `OQ-13-1` | 🔵 ManualReview | oq-resolution | `oq-status-unknown` `13-implementation-plan.md:911` |
| `OQ-13-2` | 🔵 ManualReview | oq-resolution | `oq-status-unknown` `13-implementation-plan.md:912` |
| `OQ-13-3` | 🔵 ManualReview | oq-resolution | `oq-status-unknown` `13-implementation-plan.md:913` |
| `OQ-13-4` | 🟢 Built | oq-resolution | `oq-resolved` `13-implementation-plan.md:914` |
| `OQ-13-5` | 🔵 ManualReview | oq-resolution | `oq-status-unknown` `13-implementation-plan.md:915` |
| `OQ-2-1` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:853` |
| `OQ-2-2` | 🔵 ManualReview | oq-resolution | `oq-status-unknown` `02-personas-journey.md:190` |
| `OQ-2-3` | 🔵 ManualReview | oq-resolution | `oq-status-unknown` `02-personas-journey.md:191` |
| `OQ-3-1` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:885` |
| `OQ-3-2` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:856` |
| `OQ-3-3` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:876` |
| `OQ-4-1` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:857` |
| `OQ-4-2` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:877` |
| `OQ-4-3` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:858` |
| `OQ-4-4` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:859` |
| `OQ-5-2` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:878` |
| `OQ-5-3` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:860` |
| `OQ-5-4` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:861` |
| `OQ-6-1` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:862` |
| `OQ-6-2` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:863` |
| `OQ-7-1` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:864` |
| `OQ-7-2` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:865` |
| `OQ-8-1` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:879` |
| `OQ-8-2` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:880` |
| `OQ-8-3` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:881` |
| `OQ-8-4` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:882` |
| `OQ-9-1` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:826` |
| `OQ-9-2` | ⚪ NotBuilt | oq-resolution | `oq-open` `12-adr-risks.md:827` |
| `OQ-9-3` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:866` |
| `OQ-9-4` | 🟢 Built | oq-resolution | `oq-resolved` `12-adr-risks.md:883` |

## PAIN

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `PAIN-1` | ⚪ NotBuilt | pain-cross-ref | `aggregated-from` · `ref:NotBuilt` `S1` |
| `PAIN-2` | ⚪ NotBuilt | pain-cross-ref | `aggregated-from` · `ref:NotBuilt` `S1` |
| `PAIN-3` | ⚪ NotBuilt | pain-cross-ref | `aggregated-from` · `ref:NotBuilt` `S1` |
| `PAIN-4` | ⚪ NotBuilt | pain-cross-ref | `aggregated-from` · `ref:NotBuilt` `S1` |
| `PAIN-5` | ⚪ NotBuilt | pain-cross-ref | `aggregated-from` · `ref:NotBuilt` `S1` |
| `PAIN-6` | ⚪ NotBuilt | pain-cross-ref | `aggregated-from` · `ref:ManualReview` `PAIN-7` |
| `PAIN-7` | ⚪ NotBuilt | pain-cross-ref | `aggregated-from` · `ref:NotBuilt` `S3` |

## R

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `R0` | ⚪ NotBuilt | skeleton |  |
| `R1` | 🟡 Partial | rfs-aggregate | `aggregated-children` · `child:ManualReview` `F1.1` |
| `R10` | ⚪ NotBuilt | skeleton |  |
| `R13` | 🟡 Partial | rfs-aggregate | `aggregated-children` · `child:NotBuilt` `F13.1` |
| `R2` | 🟡 Partial | rfs-aggregate | `aggregated-children` · `child:NotBuilt` `F2.1` |
| `R3` | 🟡 Partial | rfs-aggregate | `aggregated-children` · `child:NotBuilt` `F3.1` |
| `R4` | 🟡 Partial | rfs-aggregate | `aggregated-children` · `child:NotBuilt` `F4.1` |
| `R5` | 🟡 Partial | rfs-aggregate | `aggregated-children` · `child:NotBuilt` `F5.1` |
| `R6` | 🟡 Partial | rfs-aggregate | `aggregated-children` · `child:NotBuilt` `F6.1` |
| `R7` | 🟡 Partial | rfs-aggregate | `aggregated-children` · `child:NotBuilt` `F7.1` |
| `R8` | 🟡 Partial | rfs-aggregate | `aggregated-children` · `child:NotBuilt` `F8.1` |

## RB

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `RB-1` | 🟢 Built | rb-content | `inline-body` `11-operations.md:212` |
| `RB-2` | 🟢 Built | rb-content | `inline-body` `11-operations.md:213` |
| `RB-3` | 🟢 Built | rb-content | `inline-body` `11-operations.md:214` |
| `RB-4` | 🟢 Built | rb-content | `inline-body` `11-operations.md:215` |
| `RB-5` | 🟢 Built | rb-content | `inline-body` `11-operations.md:216` |
| `RB-6` | 🟢 Built | rb-content | `inline-body` `11-operations.md:217` |
| `RB-7` | 🟢 Built | rb-content | `inline-body` `11-operations.md:218` |
| `RB-8` | 🟢 Built | rb-content | `inline-body` `11-operations.md:219` |

## RISK

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `RISK-1` | 🟢 Built | risk-cross-ref | `aggregated-from` · `ref:ManualReview` `ADR-8` |
| `RISK-10` | 🟢 Built | risk-cross-ref | `aggregated-from` · `ref:Built` `NFR-SCAL-2` |
| `RISK-2` | 🟢 Built | risk-cross-ref | `aggregated-from` · `ref:Partial` `R8` |
| `RISK-3` | 🟢 Built | risk-cross-ref | `aggregated-from` · `ref:Built` `NFR-SEC-2` |
| `RISK-4` | 🟢 Built | risk-cross-ref | `aggregated-from` · `ref:NotBuilt` `NFR-SEC-3` |
| `RISK-5` | 🟢 Built | risk-cross-ref | `aggregated-from` · `ref:Built` `NFR-SEC-7` |
| `RISK-6` | 🟢 Built | risk-cross-ref | `aggregated-from` · `ref:Built` `NFR-SEC-12` |
| `RISK-7` | 🟢 Built | risk-cross-ref | `aggregated-from` · `ref:ManualReview` `EXT-5` |
| `RISK-8` | 🟢 Built | risk-cross-ref | `aggregated-from` · `ref:ManualReview` `RISK-9` |
| `RISK-9` | 🟢 Built | risk-cross-ref | `aggregated-from` · `ref:NotBuilt` `KPI-1` |

## S

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `S1.1.1` | 🔵 ManualReview | s-files | `no-path-tokens` `12-adr-risks.md:995` |
| `S1.2.3` | 🔵 ManualReview | s-files | `no-path-tokens` `12-adr-risks.md:994` |
| `S99.1.1` | 🔵 ManualReview | s-files | `no-path-tokens` `12-adr-risks.md:996` |
| `S99.99.99` | 🔵 ManualReview | s-files | `no-path-tokens` `12-adr-risks.md:997` |

## T

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `T0.1` | 🟢 Built | task-files-todo | `file-exists` `tests/smoke.test.ts` |
| `T0.2` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:204` |
| `T0.3` | 🟢 Built | task-files-todo | `file-exists` `src/state/machine.ts` · `file-exists` `tests/state-machine.test.ts` |
| `T0.4` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:290` |
| `T0.5` | 🟢 Built | task-files-todo | `file-exists` `.github/workflows/ci.yml` |
| `T0.6` | 🟢 Built | task-files-todo | `file-exists` `.github/workflows/ci.yml` · `file-exists` `src/schema/validator.ts` |
| `T0.7` | 🟢 Built | task-files-todo | `file-exists` `src/schema/validator.ts` · `file-exists` `schemas/common-frontmatter.json` |
| `T0.8` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:309` |
| `T0.9` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:317` |
| `T1.1` | 🟢 Built | task-files-todo | `file-exists` `src/spec/id.ts` · `file-exists` `tests/spec-id.test.ts` |
| `T1.10` | 🟡 Partial | task-files-todo | `file-missing` `tests/edge-15.test.ts` · `file-exists` `docs/spec` |
| `T1.2` | 🟢 Built | task-files-todo | `file-exists` `src/spec/counter.ts` · `file-exists` `tests/id-counter.test.ts` |
| `T1.3` | 🟢 Built | task-files-todo | `file-exists` `src/spec/resolver.ts` · `file-exists` `docs/spec/` |
| `T1.4` | 🟡 Partial | task-files-todo | `file-exists` `src/markdown/frontmatter.ts` · `file-missing` `schemas/phase-` |
| `T1.5` | 🟡 Partial | task-files-todo | `file-missing` `schemas/phase-` · `file-missing` `schemas/common.json` |
| `T1.6` | 🟢 Built | task-files-todo | `file-exists` `src/skill/gate.ts` · `file-exists` `tests/transition-gate.test.ts` |
| `T1.7` | 🟡 Partial | task-files-todo | `file-missing` `src/hook/install.ts` · `file-missing` `src/hook/pre-commit.js` |
| `T1.8` | 🟢 Built | task-files-todo | `file-exists` `src/hook/id-consistency.ts` · `file-exists` `docs/spec/` |
| `T1.9` | 🟡 Partial | task-files-todo | `file-exists` `src/hook/schema-validate.ts` · `file-missing` `tests/edge-15.test.ts` |
| `T10.1` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1106` |
| `T10.2` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1107` |
| `T10.3` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1108` |
| `T10.4` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1109` |
| `T10.5` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1110` |
| `T10.6` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1111` |
| `T10.7` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1112` |
| `T10.8` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1113` |
| `T11.1` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1130` |
| `T11.2` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1131` |
| `T11.3` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1132` |
| `T11.4` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1133` |
| `T11.5` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1134` |
| `T11.6` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1135` |
| `T11.7` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1136` |
| `T2.1` | 🟡 Partial | task-files-todo | `file-has-todo` `src/graph/builder.ts` · `file-has-todo` `tests/graph-builder.test.ts` |
| `T2.10` | 🟢 Built | task-files-todo | `file-exists` `src/skill/pushback.ts` · `file-exists` `src/cli/install.ts` |
| `T2.11` | 🟢 Built | task-files-todo | `file-exists` `src/cli/install.ts` · `file-exists` `docs/spec` |
| `T2.12` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:638` |
| `T2.13` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:642` |
| `T2.2` | ⚪ NotBuilt | task-files-todo | `file-missing` `src/graph/cache.ts` |
| `T2.3` | 🟡 Partial | task-files-todo | `file-exists` `src/graph/downstream.ts` · `file-missing` `src/skill/change.ts` |
| `T2.4` | 🟡 Partial | task-files-todo | `file-missing` `src/skill/change.ts` · `file-exists` `skills/manifest.json` |
| `T2.5` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `12-adr-risks.md:1006` |
| `T2.6` | 🟢 Built | task-files-todo | `file-exists` `src/skill/inheritance.ts` · `file-exists` `src/skill/ask.ts` |
| `T2.7` | 🟡 Partial | task-files-todo | `file-exists` `src/skill/ask.ts` · `file-missing` `skills/phase-1-prd/forcing-questions.md` |
| `T2.8` | 🟡 Partial | task-files-todo | `file-missing` `skills/phase-1-prd/forcing-questions.md` · `file-exists` `src/skill/smart-routing.ts` |
| `T2.9` | 🟢 Built | task-files-todo | `file-exists` `src/skill/smart-routing.ts` · `file-exists` `src/skill/pushback.ts` |
| `T3.1` | 🟢 Built | task-files-todo | `file-exists` `src/lint/r7-b2b.ts` · `file-exists` `tests/lint-r7-b2b.test.ts` |
| `T3.10` | 🟢 Built | task-files-todo | `file-exists` `src/lint/secret-detect.ts` |
| `T3.2` | 🟢 Built | task-files-todo | `file-exists` `src/lint/r7-domain.ts` · `file-exists` `src/lint/r7-history.ts` |
| `T3.3` | 🟢 Built | task-files-todo | `file-exists` `src/lint/r7-history.ts` · `file-exists` `src/subagent/invoke.ts` |
| `T3.4` | 🟢 Built | task-files-todo | `file-exists` `src/subagent/invoke.ts` · `file-exists` `tests/subagent-wrapper.test.ts` |
| `T3.5` | 🟢 Built | task-files-todo | `file-exists` `src/subagent/review.ts` · `file-exists` `src/subagent/escalate.ts` |
| `T3.6` | 🟢 Built | task-files-todo | `file-exists` `src/subagent/escalate.ts` · `file-exists` `src/telemetry/consent.ts` |
| `T3.7` | 🟢 Built | task-files-todo | `file-exists` `src/telemetry/consent.ts` · `file-exists` `src/telemetry/client.ts` |
| `T3.8` | 🟢 Built | task-files-todo | `file-exists` `src/telemetry/client.ts` · `file-exists` `tests/telemetry-client.test.ts` |
| `T3.9` | 🟢 Built | task-files-todo | `file-exists` `src/cli/opt-out.ts` |
| `T4.1` | 🟢 Built | task-files-todo | `file-exists` `.github/workflows/release.yml` |
| `T4.2` | 🟢 Built | task-files-todo | `file-exists` `.github/workflows/release.yml` · `file-exists` `.github/ISSUE_TEMPLATE/kpi3-survey.yml` |
| `T4.3` | 🟢 Built | task-files-todo | `file-exists` `.github/ISSUE_TEMPLATE/kpi3-survey.yml` |
| `T4.4` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:801` |
| `T4.5` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:805` |
| `T5.1` | 🟢 Built | task-files-todo | `file-exists` `src/cli/hook-install.ts` · `file-exists` `src/skill/orchestrator.ts` |
| `T5.2` | 🟢 Built | task-files-todo | `file-exists` `src/skill/orchestrator.ts` |
| `T5.3` | 🟢 Built | task-files-todo | `file-exists` `src/skill/orchestrator.ts` |
| `T5.4` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1068` |
| `T5.5` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1069` |
| `T5.6` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1070` |
| `T6.2` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1076` |
| `T6.3` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1077` |
| `T6.4` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1078` |
| `T6.5` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1079` |
| `T7.1` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1085` |
| `T7.2` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1086` |
| `T7.3` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1087` |
| `T7.4` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1088` |
| `T7.5` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1089` |
| `T8.1` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1119` |
| `T8.2` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1120` |
| `T8.3` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1121` |
| `T8.4` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1122` |
| `T8.5` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1123` |
| `T8.6` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1124` |
| `T9.1` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1095` |
| `T9.2` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1096` |
| `T9.3` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1097` |
| `T9.4` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1098` |
| `T9.5` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1099` |
| `T9.6` | 🔵 ManualReview | task-files-todo | `no-path-tokens` `13-implementation-plan.md:1100` |

## TC

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `TC-1` | 🟢 Built | test-grep | `test-pass` `tests/frontmatter.test.ts` · `test-pass` `tests/lint-ac-traceability.test.ts` |
| `TC-10` | 🟢 Built | test-grep | `test-pass` `tests/lint-r7-b2b.test.ts` · `test-pass` `tests/lint-r7-history.test.ts` |
| `TC-11` | 🟢 Built | test-grep | `test-pass` `tests/lint-r7-b2b.test.ts` · `test-pass` `tests/lint-secret-detect.test.ts` |
| `TC-12` | 🟢 Built | test-grep | `test-pass` `tests/e2e-s1-s2.test.ts` · `test-pass` `tests/lint-r7-b2b.test.ts` |
| `TC-13` | 🟢 Built | test-grep | `test-pass` `tests/lint-r7-b2b.test.ts` · `test-pass` `tests/lint-secret-detect.test.ts` |
| `TC-14` | 🟢 Built | test-grep | `test-pass` `tests/lint-r7-b2b.test.ts` · `test-pass` `tests/lint-secret-detect.test.ts` |
| `TC-15` | 🟢 Built | test-grep | `test-pass` `tests/lint-r7-b2b.test.ts` · `test-pass` `tests/lint-secret-detect.test.ts` |
| `TC-16` | 🟢 Built | test-grep | `test-pass` `tests/lint-r7-domain.test.ts` |
| `TC-17` | 🟢 Built | test-grep | `test-pass` `tests/lint-r7-history.test.ts` |
| `TC-18` | 🟢 Built | test-grep | `test-pass` `tests/subagent-wrapper.test.ts` |
| `TC-19` | 🟢 Built | test-grep | `test-pass` `tests/subagent-review.test.ts` |
| `TC-2` | 🟢 Built | test-grep | `test-pass` `tests/lint-ac-traceability.test.ts` · `test-pass` `tests/lint-anti-sycophancy.test.ts` |
| `TC-20` | 🟢 Built | test-grep | `test-pass` `tests/subagent-escalate.test.ts` |
| `TC-21` | 🟢 Built | test-grep | `test-pass` `tests/telemetry-consent.test.ts` |
| `TC-22` | 🟢 Built | test-grep | `test-pass` `tests/telemetry-client.test.ts` |
| `TC-23` | 🟢 Built | test-grep | `test-pass` `tests/telemetry-opt-out.test.ts` |
| `TC-3` | 🟢 Built | test-grep | `test-pass` `tests/id-counter.test.ts` · `test-pass` `tests/lint-ac-traceability.test.ts` |
| `TC-30` | 🟢 Built | test-grep | `test-pass` `tests/id-counter.test.ts` |
| `TC-31` | 🟢 Built | test-grep | `test-pass` `tests/id-consistency.test.ts` |
| `TC-32` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-33` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-34` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-35` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-36` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-37` | 🟢 Built | test-grep | `test-pass` `tests/telemetry-client.test.ts` |
| `TC-38` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-4` | 🟢 Built | test-grep | `test-pass` `tests/hook-install.test.ts` · `test-pass` `tests/lint-ac-traceability.test.ts` |
| `TC-40` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-41` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-42` | 🟢 Built | test-grep | `test-pass` `tests/patterns.test.ts` · `test-pass` `tests/verify-vitest-bridge.test.ts` |
| `TC-43` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-44` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-45` | 🟢 Built | test-grep | `test-pass` `tests/telemetry-client.test.ts` |
| `TC-46` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-47` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-48` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-49` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-5` | 🟢 Built | test-grep | `test-pass` `tests/lint-ac-traceability.test.ts` · `test-pass` `tests/lint-anti-sycophancy.test.ts` |
| `TC-50` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-51` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-52` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-53` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-54` | 🟢 Built | test-grep | `test-pass` `tests/edge-15-first-spec.test.ts` |
| `TC-55` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-56` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-57` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-58` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-59` | 🟢 Built | test-grep | `test-pass` `tests/telemetry-client.test.ts` |
| `TC-6` | 🟢 Built | test-grep | `test-pass` `tests/lint-anti-sycophancy.test.ts` · `test-pass` `tests/lint-atomic-commit.test.ts` |
| `TC-60` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-61` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-62` | 🟢 Built | test-grep | `test-pass` `tests/subagent-escalate.test.ts` |
| `TC-63` | 🟢 Built | test-grep | `test-pass` `tests/graph-builder-table-defs.test.ts` |
| `TC-64` | ⚪ NotBuilt | test-grep | `no-test-ref` |
| `TC-7` | 🟢 Built | test-grep | `test-pass` `tests/change-skill.test.ts` · `test-pass` `tests/graph-builder.test.ts` |
| `TC-70` | 🟢 Built | test-grep | `test-pass` `tests/perf-bench.test.ts` |
| `TC-71` | 🟢 Built | test-grep | `test-pass` `tests/perf-bench.test.ts` |
| `TC-72` | 🟢 Built | test-grep | `test-pass` `tests/perf-bench.test.ts` |
| `TC-73` | 🟢 Built | test-grep | `test-pass` `tests/perf-bench.test.ts` |
| `TC-74` | 🟢 Built | test-grep | `test-pass` `tests/perf-bench.test.ts` |
| `TC-75` | 🟢 Built | test-grep | `test-pass` `tests/perf-bench.test.ts` |
| `TC-76` | 🟢 Built | test-grep | `test-pass` `tests/perf-bench.test.ts` |
| `TC-77` | 🟢 Built | test-grep | `test-pass` `tests/perf-bench.test.ts` |
| `TC-8` | 🟢 Built | test-grep | `test-pass` `tests/downstream.test.ts` · `test-pass` `tests/lint-ac-traceability.test.ts` |
| `TC-9` | 🟢 Built | test-grep | `test-pass` `tests/lint-anti-sycophancy.test.ts` · `test-pass` `tests/lint-r7-b2b.test.ts` |

## unknown

| ID | Reality | Rule | Evidence |
|---|---|---|---|
| `AC` | ⚪ NotBuilt | skeleton |  |
| `Accessibility` | ⚪ NotBuilt | skeleton |  |
| `Appendix` | ⚪ NotBuilt | skeleton |  |
| `Blocking` | ⚪ NotBuilt | skeleton |  |
| `Conditional` | ⚪ NotBuilt | skeleton |  |
| `Connectivity` | ⚪ NotBuilt | skeleton |  |
| `Consequences` | ⚪ NotBuilt | skeleton |  |
| `Context` | ⚪ NotBuilt | skeleton |  |
| `Decision` | ⚪ NotBuilt | skeleton |  |
| `Dependencies` | ⚪ NotBuilt | skeleton |  |
| `Description` | ⚪ NotBuilt | skeleton |  |
| `DoS` | ⚪ NotBuilt | skeleton |  |
| `Edge-1` | ⚪ NotBuilt | skeleton |  |
| `Edge-2` | ⚪ NotBuilt | skeleton |  |
| `Edge-3` | ⚪ NotBuilt | skeleton |  |
| `Files` | ⚪ NotBuilt | skeleton |  |
| `Goal` | ⚪ NotBuilt | skeleton |  |
| `GraphEdge` | ⚪ NotBuilt | skeleton |  |
| `GraphNode` | ⚪ NotBuilt | skeleton |  |
| `Interactions` | ⚪ NotBuilt | skeleton |  |
| `Interfaces` | ⚪ NotBuilt | skeleton |  |
| `Layout` | ⚪ NotBuilt | skeleton |  |
| `M0` | ⚪ NotBuilt | skeleton |  |
| `M1` | ⚪ NotBuilt | skeleton |  |
| `M2` | ⚪ NotBuilt | skeleton |  |
| `M3` | ⚪ NotBuilt | skeleton |  |
| `M4` | ⚪ NotBuilt | skeleton |  |
| `Make-or-break` | ⚪ NotBuilt | skeleton |  |
| `Mode` | ⚪ NotBuilt | skeleton |  |
| `Node.js.` | ⚪ NotBuilt | skeleton |  |
| `Non-blocking` | ⚪ NotBuilt | skeleton |  |
| `Operations` | ⚪ NotBuilt | skeleton |  |
| `Page` | ⚪ NotBuilt | skeleton |  |
| `Plugin` | ⚪ NotBuilt | skeleton |  |
| `PRD` | ⚪ NotBuilt | skeleton |  |
| `References` | ⚪ NotBuilt | skeleton |  |
| `Repudiation` | ⚪ NotBuilt | skeleton |  |
| `Responsibility` | ⚪ NotBuilt | skeleton |  |
| `Responsive` | ⚪ NotBuilt | skeleton |  |
| `Reversibility` | ⚪ NotBuilt | skeleton |  |
| `Risk` | ⚪ NotBuilt | skeleton |  |
| `S1` | ⚪ NotBuilt | skeleton |  |
| `S2` | ⚪ NotBuilt | skeleton |  |
| `S3` | ⚪ NotBuilt | skeleton |  |
| `SEC-1` | ⚪ NotBuilt | skeleton |  |
| `SEC-2` | ⚪ NotBuilt | skeleton |  |
| `SEC-3` | ⚪ NotBuilt | skeleton |  |
| `SEC-4` | ⚪ NotBuilt | skeleton |  |
| `SEC-5` | ⚪ NotBuilt | skeleton |  |
| `SEC-6` | ⚪ NotBuilt | skeleton |  |
| `Self-Check` | ⚪ NotBuilt | skeleton |  |
| `Single-user.` | ⚪ NotBuilt | skeleton |  |
| `SM-Change-Lifecycle` | ⚪ NotBuilt | skeleton |  |
| `SM-Consent` | ⚪ NotBuilt | skeleton |  |
| `SM-Hook` | ⚪ NotBuilt | skeleton |  |
| `SM-Phase-Lifecycle` | ⚪ NotBuilt | skeleton |  |
| `SM-Spec-Status` | ⚪ NotBuilt | skeleton |  |
| `SM-Subagent` | ⚪ NotBuilt | skeleton |  |
| `Spoofing` | ⚪ NotBuilt | skeleton |  |
| `Status` | ⚪ NotBuilt | skeleton |  |
| `Step-by-Step` | ⚪ NotBuilt | skeleton |  |
| `T2.1b` | ⚪ NotBuilt | skeleton |  |
| `T2.5a` | ⚪ NotBuilt | skeleton |  |
| `T2.5b` | ⚪ NotBuilt | skeleton |  |
| `T2.5c` | ⚪ NotBuilt | skeleton |  |
| `Tampering` | ⚪ NotBuilt | skeleton |  |
| `US-11.2` | ⚪ NotBuilt | skeleton |  |
| `W-CC-pattern` | ⚪ NotBuilt | skeleton |  |
| `Wireframe` | ⚪ NotBuilt | skeleton |  |
