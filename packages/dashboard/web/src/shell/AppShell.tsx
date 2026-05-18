import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { TopBar } from './TopBar.js';
import { Sidebar } from './Sidebar.js';
import { IdPopover } from '../features/phases/IdPopover.js';
import { useIdIndex } from '../features/phases/useIdIndex.js';
import { QuickSwitcher } from '../features/quick-switcher/QuickSwitcher.js';
import { ConnectionsPanel } from '../features/connections/ConnectionsPanel.js';
import { ChatDrawer } from '../features/ai-chat/ChatDrawer.js';
import { usePanel } from './usePanelState.js';
import type { PhaseNumber } from '@specrail/core';

export function AppShell({ children, projectId }: { children: ReactNode; projectId: string }) {
  const { data: idIndex } = useIdIndex(projectId);
  const params = useParams<{ n?: string }>();
  const phaseNum = params.n ? (Number(params.n) as PhaseNumber) : null;
  const connOpen = usePanel('connections');
  const chatOpen = usePanel('chat') && phaseNum != null;
  const panelClass = [
    connOpen ? 'has-conn' : '',
    chatOpen ? 'has-chat' : '',
  ].filter(Boolean).join(' ');
  return (
    <div className={`shell ${panelClass}`}>
      <TopBar projectId={projectId} />
      <div className="shell-body">
        <Sidebar projectId={projectId} />
        <main className="shell-main">{children}</main>
      </div>
      {/* Right-side floating panels (T9.6). Mounted globally so focus state
          survives phase navigation. */}
      <ConnectionsPanel projectId={projectId} />
      {phaseNum != null && chatOpen && (
        <ChatDrawer projectId={projectId} currentPhase={phaseNum} />
      )}
      {idIndex && <IdPopover index={idIndex} selector=".id-chip, .conn-neighbor-id" />}
      <QuickSwitcher projectId={projectId} />
    </div>
  );
}
