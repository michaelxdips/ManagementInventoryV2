import { useLocation } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { navItems, getVisibleNavItems } from '../shared/NavItems';
import Icon from '../shared/Icon';
import ThemeToggle from '../../ThemeToggle';
import { useNotifications } from '../../../hooks/useNotifications';
import NotificationBell from '../../ui/NotificationBell';
import NetworkSignalBar from '../../ui/NetworkSignalBar';
import { useTranslation } from '../../../hooks/useTranslation';

interface DesktopNavbarProps {
    sidebarCollapsed: boolean;
    onToggleSidebar: () => void;
}

/**
 * Desktop Navbar (Topbar) component.
 * Shows current page title and theme toggle.
 * NO business logic - only presentation.
 */
const DesktopNavbar = ({ sidebarCollapsed, onToggleSidebar }: DesktopNavbarProps) => {
    const location = useLocation();
    const { hasRole } = useAuth();
    const { t } = useTranslation();
    
    const token = localStorage.getItem('auth_token');
    const { notifications, isConnected, markAllAsRead, markOneAsRead, clearAll } = useNotifications(token);

    const visibleNavItems = getVisibleNavItems(navItems, hasRole);
    const rawActiveTitle = visibleNavItems.find((item) =>
        location.pathname.startsWith(item.path)
    )?.label ?? (location.pathname.startsWith('/settings') ? 'settings.settingsTitle' : 'sidebar.dashboard');
    const activeTitle = t(rawActiveTitle);

    return (
        <header className="topbar">
            <div className="crumb">
                <button
                    type="button"
                    className="crumb-icon crumb-icon-button"
                    onClick={onToggleSidebar}
                    aria-label={sidebarCollapsed ? 'Perluas sidebar' : 'Lipat sidebar'}
                    title={sidebarCollapsed ? 'Perluas sidebar' : 'Lipat sidebar'}
                >
                    <Icon name="grid" />
                </button>
                <span className="crumb-text">{activeTitle}</span>
            </div>
            <div className="topbar-actions">
                <NetworkSignalBar variant="compact" />
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
    );
};

export default DesktopNavbar;
