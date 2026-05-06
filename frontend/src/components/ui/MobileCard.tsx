import { ReactNode } from 'react';
import { useBreakpoint } from '../Layout';

interface MobileCardField {
    label: string;
    value: ReactNode;
}

interface MobileCardProps {
    fields: MobileCardField[];
    actions?: ReactNode;
    header?: ReactNode;
    className?: string;
}

/**
 * MobileCard - Card view for displaying table row data on mobile.
 * Replaces traditional table rows with a stacked card layout.
 * 
 * USAGE:
 * - Pass fields array with label/value pairs
 * - Pass actions for action buttons (Approve, Reject, Edit, etc.)
 */
export const MobileCard = ({ fields, actions, header, className }: MobileCardProps) => {
    return (
        <div className={`mobile-card-item ${className || ''}`.trim()}>
            {header && <div className="mobile-card-header">{header}</div>}
            <div className="mobile-card-body">
                {fields.map((field, idx) => (
                    <div key={idx} className="mobile-card-row">
                        <span className="mobile-card-label">{field.label}</span>
                        <span className="mobile-card-value">{field.value}</span>
                    </div>
                ))}
            </div>
            {actions && <div className="mobile-card-actions">{actions}</div>}
        </div>
    );
};

interface MobileCardListProps {
    children: ReactNode;
    emptyMessage?: string;
    isEmpty?: boolean;
    isLoading?: boolean;
}

/**
 * MobileCardList - Container for mobile cards.
 * Shows loading state, empty state, or card list.
 */
export const MobileCardList = ({
    children,
    emptyMessage = 'Tidak ada data',
    isEmpty = false,
    isLoading = false,
}: MobileCardListProps) => {
    if (isLoading) {
        return (
            <div className="mobile-card-list">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="mobile-card-item mobile-card-skeleton">
                        <div className="skeleton-line skeleton-line--lg" />
                        <div className="skeleton-line skeleton-line--md" />
                        <div className="skeleton-line skeleton-line--sm" />
                    </div>
                ))}
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="mobile-empty-state">
                <div className="mobile-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <path d="M9 9h6M9 12h4" strokeLinecap="round" />
                    </svg>
                </div>
                <p className="mobile-empty-text">{emptyMessage}</p>
            </div>
        );
    }

    return <div className="mobile-card-list">{children}</div>;
};

interface ResponsiveTableProps {
    /** Table component to show on desktop */
    desktopTable: ReactNode;
    /** Card list to show on mobile */
    mobileCards: ReactNode;
}

/**
 * ResponsiveTable - Wrapper that switches between table and card view.
 * Uses useBreakpoint to determine which view to show.
 */
export const ResponsiveTable = ({ desktopTable, mobileCards }: ResponsiveTableProps) => {
    const { isMobile } = useBreakpoint(768);

    return (
        <>
            {!isMobile && desktopTable}
            {isMobile && mobileCards}
        </>
    );
};

export default MobileCard;
