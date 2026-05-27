import { Role } from '../../../types/auth';

export type NavItem = {
    label: string;
    path: string;
    icon: string;
    roles?: Role[]; // if set, only these roles can see the menu
};

/**
 * Shared navigation items configuration.
 * Used by both DesktopSidebar and MobileBottomNav.
 * This ensures navigation consistency across layouts.
 */
export const navItems: NavItem[] = [
    { label: 'sidebar.dashboard', path: '/dashboard', icon: 'grid' },
    { label: 'sidebar.items', path: '/items', icon: 'box' },
    { label: 'sidebar.historyIn', path: '/history-masuk', icon: 'in', roles: ['admin', 'superadmin'] },
    { label: 'sidebar.historyOut', path: '/history-keluar', icon: 'out', roles: ['admin', 'superadmin'] },
    { label: 'sidebar.requests', path: '/requests', icon: 'request', roles: ['user'] },
    { label: 'sidebar.information', path: '/information', icon: 'info', roles: ['user'] },
    { label: 'sidebar.emptyItems', path: '/barang-kosong', icon: 'empty', roles: ['admin', 'superadmin'] },
    { label: 'sidebar.approval', path: '/approval', icon: 'check', roles: ['admin', 'superadmin'] },
    { label: 'sidebar.calendar', path: '/request-calendar', icon: 'calendar', roles: ['admin', 'superadmin'] },
    { label: 'sidebar.newRequests', path: '/new-item-requests', icon: 'star', roles: ['admin', 'superadmin'] },
    { label: 'sidebar.stockOpname', path: '/stock-opname', icon: 'file-text', roles: ['admin', 'superadmin'] },
    { label: 'sidebar.audit', path: '/audit-logs', icon: 'clock', roles: ['admin', 'superadmin'] },
    { label: 'sidebar.announcements', path: '/announcements', icon: 'megaphone', roles: ['admin', 'superadmin'] },
    { label: 'sidebar.manageUnits', path: '/manage-units', icon: 'units', roles: ['superadmin'] },
];

/**
 * Primary navigation items for mobile bottom nav.
 * Limited to 4-5 items for thumb-friendly navigation.
 * Remaining items go to "More" menu.
 */
export const mobileBottomNavItems: NavItem[] = [
    { label: 'sidebar.dashboard', path: '/dashboard', icon: 'grid' },
    { label: 'sidebar.items', path: '/items', icon: 'box' },
];

/**
 * Get visible nav items based on user role.
 */
export const getVisibleNavItems = (
    items: NavItem[],
    hasRole: (roles: Role[]) => boolean
): NavItem[] => {
    return items.filter((item) => !item.roles || hasRole(item.roles));
};
