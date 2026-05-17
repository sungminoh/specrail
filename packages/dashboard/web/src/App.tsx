import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './shell/AppShell.js';
import { ProjectListPage } from './features/projects/ProjectListPage.js';
import { OnboardingPage } from './features/projects/OnboardingPage.js';
import { PhaseRoute } from './features/phases/PhaseRoute.js';
import { ProjectRoute } from './shell/ProjectRoute.js';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<ProjectListPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/p/:projectId/*" element={<ProjectRoute />}>
        <Route index element={<Navigate to="phase/1" replace />} />
        <Route path="phase/:n" element={<PhaseRoute />} />
      </Route>
    </Routes>
  );
}
