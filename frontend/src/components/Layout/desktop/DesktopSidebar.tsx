import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuth from '../../../hooks/useAuth';
import { navItems, getVisibleNavItems } from '../shared/NavItems';
import Icon from '../shared/Icon';
import ProfilePopover from '../shared/ProfilePopover';
import { useTranslation } from '../../../hooks/useTranslation';

interface DesktopSidebarProps {
    collapsed: boolean;
}

/**
 * Desktop Sidebar component.
 * Displays navigation menu and user profile in desktop layout.
 * NO business logic - only presentation and navigation.
 */
const DesktopSidebar = ({ collapsed }: DesktopSidebarProps) => {
    const { hasRole, user } = useAuth();
    const { t } = useTranslation();
    const [profileOpen, setProfileOpen] = useState(false);

    const displayName = user?.name ?? 'User';
    const displayRole = user?.role ?? 'user';
    const avatarText = (displayName || 'User')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'U';

    const visibleNavItems = getVisibleNavItems(navItems, hasRole);

    useEffect(() => {
        if (collapsed) {
            setProfileOpen(false);
        }
    }, [collapsed]);

    return (
        <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
            <div className="brand">
                <div className="brand-icon" aria-hidden />
                <div className="brand-text">
                    <span className="brand-title">Inventory ATK</span>
                </div>
            </div>

            <p className="sidebar-section">Menu</p>
            <nav className="nav-menu">
                {visibleNavItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        title={collapsed ? t(item.label) : undefined}
                        className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
                    >
                        <span className="nav-icon">
                            <Icon name={item.icon} />
                        </span>
                        <span className="nav-label">{t(item.label)}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <ProfilePopover
                    isOpen={profileOpen}
                    onClose={() => setProfileOpen(false)}
                    position="top"
                />

                <button
                    type="button"
                    className="user-chip"
                    onClick={() => setProfileOpen((prev) => !prev)}
                    title={collapsed ? `${displayName} (${displayRole})` : undefined}
                    aria-label="Buka menu profil"
                >
                    <div className="avatar">{avatarText}</div>
                    {!collapsed && (
                        <>
                            <div className="user-meta">
                                <span className="user-name">{displayName}</span>
                                <span className="user-role">{displayRole}</span>
                            </div>
                            <span className="chevron">›</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default DesktopSidebar;
