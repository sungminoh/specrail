import type { ReactNode } from 'react';
import { TopBar } from './TopBar.js';
import { Sidebar } from './Sidebar.js';

export function AppShell({ children, projectId }: { children: ReactNode; projectId: string }) {
  return (
    <div className="shell">
      <TopBar projectId={projectId} />
      <div className="shell-body">
        <Sidebar projectId={projectId} />
        <main className="shell-main">{children}</main>
      </div>
    </div>
  );
}
