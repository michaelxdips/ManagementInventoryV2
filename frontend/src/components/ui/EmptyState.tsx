import type { ReactNode } from 'react';
import { ClipboardList } from 'lucide-react';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
};

const EmptyState = ({ title, description, icon, action, compact = false, className = '' }: EmptyStateProps) => (
  <div className={`empty-state ${compact ? 'empty-state--compact' : ''} ${className}`.trim()}>
    <div className="empty-state__icon" aria-hidden="true">
      {icon || <ClipboardList size={22} />}
    </div>
    <div>
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__description">{description}</p>}
    </div>
    {action && <div className="empty-state__action">{action}</div>}
  </div>
);

export const EmptyTableRow = ({ colSpan, ...props }: EmptyStateProps & { colSpan: number }) => (
  <tr>
    <td colSpan={colSpan} className="empty-row empty-row--rich">
      <EmptyState compact {...props} />
    </td>
  </tr>
);

export default EmptyState;
