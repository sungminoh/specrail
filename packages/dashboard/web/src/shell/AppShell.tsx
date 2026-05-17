import type { ReactNode } from 'react';
import { TopBar } from './TopBar.js';
import { Sidebar } from './Sidebar.js';
import { IdPopover } from '../features/phases/IdPopover.js';
import { useIdIndex } from '../features/phases/useIdIndex.js';
import { QuickSwitcher } from '../features/quick-switcher/QuickSwitcher.js';

export function AppShell({ children, projectId }: { children: ReactNode; projectId: string }) {
  const { data: idIndex } = useIdIndex(projectId);
  return (
    <div className="shell">
      <TopBar projectId={projectId} />
      <div className="shell-body">
        <Sidebar projectId={projectId} />
        <main className="shell-main">{children}</main>
      </div>
      {idIndex && <IdPopover index={idIndex} />}
      <QuickSwitcher projectId={projectId} />
    </div>
  );
}
