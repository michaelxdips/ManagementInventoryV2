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
    { label: 'Dashboard', path: '/dashboard', icon: 'grid' },
    { label: 'Items', path: '/items', icon: 'box' },
    { label: 'History Masuk', path: '/history-masuk', icon: 'in', roles: ['admin', 'superadmin'] },
    { label: 'History Keluar', path: '/history-keluar', icon: 'out', roles: ['admin', 'superadmin'] },
    { label: 'Requests', path: '/requests', icon: 'request', roles: ['user'] },
    { label: 'Information', path: '/information', icon: 'info', roles: ['user'] },
    { label: 'Barang Kosong', path: '/barang-kosong', icon: 'empty', roles: ['admin', 'superadmin'] },
    { label: 'Approval', path: '/approval', icon: 'check', roles: ['admin', 'superadmin'] },
    { label: 'Kalender Request', path: '/request-calendar', icon: 'calendar', roles: ['admin', 'superadmin'] },
    { label: 'Request Baru', path: '/new-item-requests', icon: 'star', roles: ['admin', 'superadmin'] },
    { label: 'Stock Opname', path: '/stock-opname', icon: 'file-text', roles: ['admin', 'superadmin'] },
    { label: 'Audit Trail', path: '/audit-logs', icon: 'clock', roles: ['admin', 'superadmin'] },
    { label: 'Pengumuman', path: '/announcements', icon: 'megaphone', roles: ['admin', 'superadmin'] },
    { label: 'Kelola Unit', path: '/manage-units', icon: 'units', roles: ['superadmin'] },
];

/**
 * Primary navigation items for mobile bottom nav.
 * Limited to 4-5 items for thumb-friendly navigation.
 * Remaining items go to "More" menu.
 */
export const mobileBottomNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'grid' },
    { label: 'Items', path: '/items', icon: 'box' },
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
