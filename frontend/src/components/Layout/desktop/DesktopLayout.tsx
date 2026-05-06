import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import DesktopSidebar from './DesktopSidebar';
import DesktopNavbar from './DesktopNavbar';

const SIDEBAR_COLLAPSED_KEY = 'inventory_sidebar_collapsed';

const TABLET_SIDEBAR_QUERY = '(min-width: 769px) and (max-width: 1024px)';

/**
 * Desktop Layout component.
 * Renders the desktop shell with sidebar and content area.
 * Pure layout composition only (no business logic).
 */
const DesktopLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
        localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
    );
    const [tabletSidebar, setTabletSidebar] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(TABLET_SIDEBAR_QUERY);
        const syncTabletSidebar = () => setTabletSidebar(mediaQuery.matches);

        syncTabletSidebar();
        mediaQuery.addEventListener('change', syncTabletSidebar);

        return () => mediaQuery.removeEventListener('change', syncTabletSidebar);
    }, []);

    useEffect(() => {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    const effectiveSidebarCollapsed = sidebarCollapsed || tabletSidebar;
    const toggleSidebarCollapsed = () => setSidebarCollapsed((prev) => !prev);

    return (
        <div
            className="app-shell desktop-layout"
            data-sidebar-collapsed={effectiveSidebarCollapsed ? 'true' : 'false'}
        >
            <DesktopSidebar collapsed={effectiveSidebarCollapsed} />
            <section className="main-panel">
                <DesktopNavbar
                    sidebarCollapsed={effectiveSidebarCollapsed}
                    onToggleSidebar={toggleSidebarCollapsed}
                />
                <div className="content-area">
                    <Outlet />
                </div>
            </section>
        </div>
    );
};

export default DesktopLayout;
