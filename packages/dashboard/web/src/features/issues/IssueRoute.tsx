import { useParams } from 'react-router-dom';
import { IssueInbox } from './IssueInbox.js';

export function IssueRoute() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="display">Issues</h1>
      </header>
      <IssueInbox projectId={projectId} />
    </div>
  );
}
