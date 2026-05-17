import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { csrf, csrfTokenFor } from './middleware/csrf.js';
import { projectsRoutes } from './routes/projects.js';
import { phasesRoutes } from './routes/phases.js';
import { eventsRoutes } from './routes/events.js';
import { issuesRoutes } from './routes/issues.js';
import { patchesRoutes } from './routes/patches.js';
import { aiRoutes } from './routes/ai.js';
import { graphRoutes } from './routes/graph.js';
import { ProjectsService } from './services/projects.js';
import { PhasesService } from './services/phases.js';
import { IssuesService } from './services/issues.js';
import { PatchesService } from './services/patches.js';
import { AiService } from './services/ai.js';
import { WatcherManager } from './services/watcher-manager.js';
import { RegistryAdapter } from './adapters/registry.js';
import type { ClaudeCli } from './adapters/claude-cli.js';

export interface AppDeps {
  registry: RegistryAdapter;
  watchers?: WatcherManager;
  /** Inject a fake CLI for tests. */
  claudeCli?: ClaudeCli;
}

export function buildApp(deps: AppDeps): Hono {
  const projects = new ProjectsService(deps.registry);
  const phases = new PhasesService(projects);
  const issues = new IssuesService(projects);
  const patches = new PatchesService(projects, phases);
  const ai = new AiService(projects, phases, patches, deps.claudeCli);
  const watchers = deps.watchers ?? new WatcherManager(projects);

  const app = new Hono();
  app.use('*', cors({ origin: 'http://127.0.0.1:0', credentials: true }));
  app.use('*', csrf());

  app.get('/api/health', (c) => c.json({ ok: true, csrf: csrfTokenFor(c) }));
  app.route('/api/projects', projectsRoutes(projects));
  app.route('/api/projects', phasesRoutes(phases));
  app.route('/api/projects', issuesRoutes(issues));
  app.route('/api/projects', patchesRoutes(patches));
  app.route('/api/projects', aiRoutes(ai));
  app.route('/api/projects', graphRoutes(projects));
  app.route('/api/projects', eventsRoutes(watchers));

  return app;
}

export type App = ReturnType<typeof buildApp>;
