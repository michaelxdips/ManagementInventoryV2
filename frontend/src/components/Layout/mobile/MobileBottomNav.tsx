import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { navItems, getVisibleNavItems } from '../shared/NavItems';
import Icon from '../shared/Icon';
import { useTranslation } from '../../../hooks/useTranslation';

/**
 * Mobile Bottom Navigation component.
 * First 4 items + "Lainnya" when additional routes exist (overflow opens panel).
 */
const MobileBottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { hasRole } = useAuth();
    const { t } = useTranslation();

    const visibleNavItems = getVisibleNavItems(navItems, hasRole);

    const bottomNavSlots = 4;
    const primaryItems = visibleNavItems.slice(0, bottomNavSlots);
    const overflowItems = visibleNavItems.slice(bottomNavSlots);

    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!moreOpen) return;
        const close = (e: MouseEvent) => {
            if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
                setMoreOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [moreOpen]);

    useEffect(() => {
        setMoreOpen(false);
    }, [location.pathname]);

    const overflowHasActive = overflowItems.some((item) =>
        location.pathname.startsWith(item.path)
    );

    const handleOverflowNav = (path: string) => {
        navigate(path);
        setMoreOpen(false);
    };

    return (
        <nav className="mobile-bottom-nav" aria-label="Navigasi utama">
                {primaryItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`mobile-bottom-item ${isActive ? 'is-active' : ''}`}
                        >
                            <span className="mobile-bottom-icon">
                                <Icon name={item.icon} />
                            </span>
                            <span className="mobile-bottom-label">{t(item.label)}</span>
                        </NavLink>
                    );
                })}

                {overflowItems.length > 0 && (
                    <div className="mobile-bottom-more-wrap" ref={moreRef}>
                        <button
                            type="button"
                            className={`mobile-bottom-item mobile-bottom-more-btn ${overflowHasActive || moreOpen ? 'is-active' : ''}`}
                            aria-expanded={moreOpen ? 'true' : 'false'}
                            aria-haspopup="true"
                            onClick={() => setMoreOpen((o) => !o)}
                        >
                            <span className="mobile-bottom-icon">
                                <Icon name="more" />
                            </span>
                            <span className="mobile-bottom-label">Lainnya</span>
                        </button>

                        {moreOpen && (
                            <div className="mobile-bottom-more-panel" role="menu">
                                {overflowItems.map((item) => {
                                    const isActive = location.pathname.startsWith(item.path);
                                    return (
                                        <button
                                            key={item.path}
                                            type="button"
                                            role="menuitem"
                                            className={`mobile-bottom-more-row ${isActive ? 'is-active' : ''}`}
                                            onClick={() => handleOverflowNav(item.path)}
                                        >
                                            <span className="mobile-bottom-more-icon">
                                                <Icon name={item.icon} />
                                            </span>
                                            <span>{t(item.label)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
        </nav>
    );
};

export default MobileBottomNav;
