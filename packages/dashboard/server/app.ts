import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { csrf, csrfTokenFor } from './middleware/csrf.js';
import { projectsRoutes } from './routes/projects.js';
import { phasesRoutes } from './routes/phases.js';
import { eventsRoutes } from './routes/events.js';
import { ProjectsService } from './services/projects.js';
import { PhasesService } from './services/phases.js';
import { RegistryAdapter } from './adapters/registry.js';

export interface AppDeps {
  registry: RegistryAdapter;
}

export function buildApp(deps: AppDeps): Hono {
  const projects = new ProjectsService(deps.registry);
  const phases = new PhasesService(projects);

  const app = new Hono();
  app.use('*', cors({ origin: 'http://127.0.0.1:0', credentials: true }));
  app.use('*', csrf());

  app.get('/api/health', (c) => c.json({ ok: true, csrf: csrfTokenFor(c) }));
  app.route('/api/projects', projectsRoutes(projects));
  app.route('/api/projects', phasesRoutes(phases));
  app.route('/api/projects', eventsRoutes());

  return app;
}

export type App = ReturnType<typeof buildApp>;
