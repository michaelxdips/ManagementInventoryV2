import { NavLink, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useAuth from '../../../hooks/useAuth';
import { navItems, getVisibleNavItems } from '../shared/NavItems';
import Icon from '../shared/Icon';
import ProfilePopover from '../shared/ProfilePopover';
import { useTranslation } from '../../../hooks/useTranslation';

interface DesktopSidebarProps {
    collapsed: boolean;
}

type SidebarMetric = {
    top: number;
    height: number;
};

/**
 * Desktop Sidebar component.
 * Displays navigation menu and user profile in desktop layout.
 * Includes premium liquid glass indicator.
 */
const DesktopSidebar = ({ collapsed }: DesktopSidebarProps) => {
    const { hasRole, user } = useAuth();
    const { t } = useTranslation();
    const location = useLocation();
    const [profileOpen, setProfileOpen] = useState(false);
    
    const [reducedMotion, setReducedMotion] = useState(false);

    const displayName = user?.name ?? 'User';
    const displayRole = user?.role ?? 'user';
    const avatarText = (displayName || 'User')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'U';

    const visibleNavItems = getVisibleNavItems(navItems, hasRole);

    const navMenuRef = useRef<HTMLElement>(null);
    const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const metricsRef = useRef<SidebarMetric[]>([]);
    const rAFRef = useRef<number | null>(null);

    const activeIndex = useMemo(() => {
        for (let i = 0; i < visibleNavItems.length; i++) {
            const item = visibleNavItems[i];
            if (location.pathname === item.path || 
               (item.path !== '/dashboard' && location.pathname.startsWith(`${item.path}/`))) {
                return i;
            }
        }
        return -1;
    }, [location.pathname, visibleNavItems]);

    const updateIndicatorCSS = useCallback((y: number, height: number, opacity: number) => {
        if (!navMenuRef.current) return;
        if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
        
        rAFRef.current = requestAnimationFrame(() => {
            navMenuRef.current?.style.setProperty('--sidebar-indicator-y', `${y}px`);
            navMenuRef.current?.style.setProperty('--sidebar-indicator-height', `${height}px`);
            navMenuRef.current?.style.setProperty('--sidebar-indicator-opacity', `${opacity}`);
        });
    }, []);

    const measureTabs = useCallback(() => {
        if (!navMenuRef.current) return;
        const navRect = navMenuRef.current.getBoundingClientRect();
        
        const newMetrics = itemRefs.current.map(el => {
            if (!el) return { top: 0, height: 0 };
            const rect = el.getBoundingClientRect();
            // Calculate top relative to the nav container
            const top = rect.top - navRect.top + navMenuRef.current!.scrollTop;
            return {
                top,
                height: rect.height
            };
        });
        metricsRef.current = newMetrics;
        
        if (activeIndex >= 0 && activeIndex < newMetrics.length) {
            updateIndicatorCSS(newMetrics[activeIndex].top, newMetrics[activeIndex].height, 1);
        } else {
            updateIndicatorCSS(0, 0, 0);
        }
    }, [activeIndex, updateIndicatorCSS]);

    // Setup Reduced Motion
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mediaQuery.matches);
        const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, []);

    useEffect(() => {
        const timer = setTimeout(measureTabs, 50);
        
        let observer: ResizeObserver | null = null;
        if (window.ResizeObserver && navMenuRef.current) {
            observer = new ResizeObserver(() => {
                requestAnimationFrame(measureTabs);
            });
            observer.observe(navMenuRef.current);
        }
        
        return () => {
            clearTimeout(timer);
            observer?.disconnect();
            if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
        };
    }, [measureTabs]);

    useEffect(() => {
        if (collapsed) {
            setProfileOpen(false);
            // Re-measure after collapse animation completes
            setTimeout(measureTabs, 300);
        }
    }, [collapsed, measureTabs]);

    return (
        <aside className={`sidebar desktop-sidebar ${collapsed ? 'is-collapsed' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}>
            <div className="brand">
                <div className="brand-icon" aria-hidden />
                <div className="brand-text">
                    <span className="brand-title">Inventory ATK</span>
                </div>
            </div>

            <p className="sidebar-section">Menu</p>
            <nav className="nav-menu" ref={navMenuRef}>
                <div className="desktop-sidebar-indicator" />
                {visibleNavItems.map((item, index) => {
                    const isActiveRoute = activeIndex === index;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            title={collapsed ? t(item.label) : undefined}
                            className={`nav-item sidebar-nav-item ${isActiveRoute ? 'is-active' : ''}`}
                            ref={el => { itemRefs.current[index] = el; }}
                        >
                            <span className="nav-icon">
                                <Icon name={item.icon} />
                            </span>
                            <span className="nav-label">{t(item.label)}</span>
                        </NavLink>
                    );
                })}
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
