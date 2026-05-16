#!/usr/bin/env node
import { argv, exit } from 'node:process';

const [, , command, ...args] = argv;

async function main() {
  switch (command) {
    case 'init': {
      const { bootstrap } = await import('../cli/install.js');
      await bootstrap(process.cwd());
      console.log('✓ Initialized specrail at ' + process.cwd());
      console.log('Edit docs/spec/01-prd.md to begin.');
      break;
    }
    case 'approve': {
      const phaseN = parseInt(args[0] ?? '', 10);
      if (Number.isNaN(phaseN) || phaseN < 1 || phaseN > 13) {
        console.error('Usage: specrail approve <1-13>');
        exit(2);
      }
      const { approve } = await import('../cli/approve.js');
      const result = await approve(process.cwd(), phaseN);
      console.log(result.message);
      break;
    }
    case 'status': {
      const { status } = await import('../cli/status.js');
      const s = await status(process.cwd());
      console.log(JSON.stringify(s, null, 2));
      break;
    }
    case 'next': {
      // L-Round4-2: blocked == "approve required" is normal state, not error.
      // exit 2 differentiates from generic error (exit 1).
      const { nextPhase } = await import('../skill/orchestrator.js');
      const r = await nextPhase(process.cwd());
      console.log(JSON.stringify(r, null, 2));
      exit(r.blocked ? 2 : 0);
    }
    case 'change': {
      const topic = args[0];
      const idsArg = args.find((a) => a.startsWith('--ids=')) ?? '';
      const ids = idsArg.replace('--ids=', '').split(',').filter(Boolean);
      if (!topic) {
        console.error('Usage: specrail change "<topic>" --ids=R1,F1.1');
        exit(2);
      }
      const { draftChange } = await import('../cli/change.js');
      const r = await draftChange(process.cwd(), topic, ids);
      console.log('Drafted: ' + r.proposalPath);
      console.log('Affected phases: ' + r.affectedPhases.join(', '));
      break;
    }
    case 'check': {
      const { runAllChecks } = await import('../lint/run-all.js');
      const strict = args.includes('--strict');
      const r = await runAllChecks(process.cwd(), { strict });
      for (const sr of r.reports) {
        const icon = sr.status === 'PASS' ? '✓' : sr.status === 'WARN' ? '⚠' : '✗';
        console.log(`${icon} ${sr.name}: ${sr.details}`);
      }
      console.log(`\nOverall: ${r.overall}`);
      exit(r.overall === 'FAIL' ? 1 : 0);
    }
    case 'install-hook': {
      const { installHook } = await import('../cli/hook-install.js');
      await installHook(process.cwd());
      break;
    }
    case 'verify': {
      const { runVerifyCli } = await import('../cli/verify.js');
      const { exitCode, output } = await runVerifyCli(process.cwd(), args);
      process.stdout.write(output + (output.endsWith('\n') ? '' : '\n'));
      exit(exitCode);
    }
    case 'audit': {
      const { runAttrsAudit, renderAttrsAuditMarkdown } = await import('../cli/attrs-audit.js');
      const r = await runAttrsAudit({ projectRoot: process.cwd() });
      const md = renderAttrsAuditMarkdown(r);
      process.stdout.write(md);
      exit(r.reviewRequiredCount > 0 ? 1 : 0);
    }
    case 'migrate': {
      const { runMigrate } = await import('../migrate/codemod.js');
      const apply = args.includes('--apply');
      const dryRun = args.includes('--dry-run') || !apply;
      const phaseArg = args.find((a) => a.startsWith('--phase='));
      const phase = phaseArg ? parseInt(phaseArg.slice('--phase='.length), 10) : undefined;
      const r = await runMigrate({
        projectRoot: process.cwd(),
        apply: !dryRun,
        phase: Number.isFinite(phase as number) ? (phase as number) : undefined,
      });
      const mode = r.dryRun ? '[dry-run]' : '[applied]';
      console.log(`${mode} files=${r.filesScanned} renamed=${r.renamed.length} conflicts=${r.conflicts.length}`);
      for (const x of r.renamed.slice(0, 20)) {
        console.log(`  ${x.kind}: ${x.from} → ${x.to}  (${x.file})`);
      }
      if (r.renamed.length > 20) console.log(`  ... ${r.renamed.length - 20} more`);
      exit(r.conflicts.length > 0 ? 1 : 0);
    }
    default: {
      // Usage: stdout if user asked (no command); stderr if command was unknown
      const out = command ? console.error : console.log;
      out('specrail — Spec discipline harness');
      out('');
      out('Commands:');
      out('  init                          Initialize spec scaffold');
      out('  status                        Show current phase status');
      out('  next                          Show next recommended phase');
      out('  approve <N>                   Mark phase N Draft → Approved');
      out('  change "<topic>" --ids=...    Draft a change proposal');
      out('  check [--strict]              Run all lint checks');
      out('  install-hook                  Install git pre-commit hook');
      out('  verify [--json|--md] [...]   Auto-derived implementation status report');
      out('  migrate [--apply] [--phase=N] T-CSA codemod (Phase 5 FLN/FLE rename + report)');
      out('  audit                         Attrs coverage report (KPI-7) — markdown to stdout');
      exit(command ? 1 : 0);
    }
  }
}

main().catch((e) => {
  console.error(`✗ ${String(e?.message ?? e)}`);
  exit(1);
});
