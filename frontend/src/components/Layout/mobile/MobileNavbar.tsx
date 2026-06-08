import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { navItems, getVisibleNavItems } from '../shared/NavItems';
import Icon from '../shared/Icon';
import ThemeToggle from '../../ThemeToggle';
import { useNotifications } from '../../../hooks/useNotifications';
import NotificationBell from '../../ui/NotificationBell';
import NetworkSignalBar from '../../ui/NetworkSignalBar';
import { useTranslation } from '../../../hooks/useTranslation';

/**
 * Mobile Navbar (Top Navigation) component.
 * Shows brand, hamburger menu, and profile access.
 * NO business logic - only presentation and navigation.
 */
const MobileNavbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { hasRole, user, logout } = useAuth();
    const { t } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const token = localStorage.getItem('auth_token');
    const { notifications, isConnected, markAllAsRead, markOneAsRead, clearAll } = useNotifications(token);

    const displayName = user?.name ?? 'User';
    const displayRole = user?.role ?? 'user';
    const avatarText = (displayName || 'User')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'U';

    const visibleNavItems = getVisibleNavItems(navItems, hasRole);
    const rawActiveTitle = visibleNavItems.find((item) =>
        location.pathname.startsWith(item.path)
    )?.label ?? (location.pathname.startsWith('/settings') ? 'settings.settingsTitle' : 'sidebar.dashboard');
    const activeTitle = t(rawActiveTitle);

    const handleNavClick = (path: string) => {
        navigate(path);
        setMenuOpen(false);
    };

    const handleSettings = () => {
        navigate('/settings');
        setMenuOpen(false);
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
            navigate('/login');
        } finally {
            setLoggingOut(false);
            setMenuOpen(false);
        }
    };

    return (
        <>
            <header className="mobile-topbar">
                <button
                    type="button"
                    className="mobile-menu-btn"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open menu"
                >
                    <Icon name="menu" />
                </button>

                <div className="mobile-title">
                    <span>{activeTitle}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <NotificationBell 
                        notifications={notifications} 
                        isConnected={isConnected}
                        onMarkAllAsRead={markAllAsRead}
                        onMarkOneAsRead={markOneAsRead}
                        onClearAll={clearAll} 
                    />
                    <ThemeToggle />
                </div>
            </header>

            {/* Mobile Drawer Menu */}
            <div className={`mobile-drawer-overlay ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(false)}>
                <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-drawer-header mobile-drawer-brand">
                            <div className="mobile-drawer-brand-main">
                                <div className="brand-icon mobile-drawer-brand-logo" aria-hidden />
                                <span className="mobile-drawer-brand-title">Inventory ATK</span>
                            </div>
                            <div className="mobile-drawer-brand-status">
                                <NetworkSignalBar variant="compact" />
                            </div>
                        </div>

                        <nav className="mobile-drawer-nav">
                            {visibleNavItems.map((item) => (
                                <button
                                    key={item.path}
                                    type="button"
                                    className={`mobile-drawer-item ${location.pathname.startsWith(item.path) ? 'is-active' : ''}`}
                                    onClick={() => handleNavClick(item.path)}
                                >
                                    <span className="nav-icon">
                                        <Icon name={item.icon} />
                                    </span>
                                    <span className="nav-label">{t(item.label)}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="mobile-drawer-footer">
                            <div className="mobile-user-info">
                                <div className="avatar">{avatarText}</div>
                                <div className="user-meta">
                                    <span className="user-name">{displayName}</span>
                                    <span className="user-role">{displayRole}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="mobile-drawer-item"
                                onClick={handleSettings}
                            >
                                <span className="nav-icon">
                                    <Icon name="settings" />
                                </span>
                                <span className="nav-label">{t('settings.settingsTitle')}</span>
                            </button>

                            <button
                                type="button"
                                className="mobile-drawer-item mobile-logout-btn"
                                onClick={handleLogout}
                                disabled={loggingOut}
                            >
                                <span className="nav-icon">
                                    <Icon name="logout" />
                                </span>
                                <span className="nav-label">{loggingOut ? t('settings.deleting') : t('sidebar.logout')}</span>
                            </button>
                        </div>
                </div>
            </div>
        </>
    );
};

export default MobileNavbar;
