import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { navItems, getVisibleNavItems } from '../shared/NavItems';
import Icon from '../shared/Icon';
import { useTranslation } from '../../../hooks/useTranslation';

type TabMetric = {
    left: number;
    width: number;
    centerX: number;
};

type NavMetrics = {
    navWidth: number;
    tabs: TabMetric[];
};

type DragState = {
    pointerId: number;
    startX: number;
    lastX: number;
    wasDrag: boolean;
};

const DRAG_THRESHOLD_PX = 7;
const BASE_STRETCH = 1;
const MAX_STRETCH = 1.14;

/**
 * Mobile Bottom Navigation component.
 * Floating liquid glass tab bar with drag-aware physics.
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
    const [reducedMotion, setReducedMotion] = useState(false);

    const navRef = useRef<HTMLElement>(null);
    const moreRef = useRef<HTMLDivElement>(null);
    const moreBtnRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
    const itemRefs = useRef<(HTMLElement | null)[]>([]);
    
    // Cached measurements
    const metricsRef = useRef<NavMetrics>({ navWidth: 0, tabs: [] });
    
    // Drag state
    const dragRef = useRef<DragState | null>(null);
    const suppressClickRef = useRef(false);
    const rAFRef = useRef<number | null>(null);

    // Strict overflow active logic
    const overflowHasActive = overflowItems.some((item) =>
        location.pathname.startsWith(item.path)
    );

    const activeIndex = useMemo(() => {
        for (let i = 0; i < primaryItems.length; i++) {
            if (location.pathname === primaryItems[i].path || 
               (primaryItems[i].path !== '/dashboard' && location.pathname.startsWith(primaryItems[i].path))) {
                return i;
            }
        }
        if (overflowHasActive) return primaryItems.length;
        return -1;
    }, [location.pathname, primaryItems, overflowHasActive]);

    const updateIndicatorCSS = useCallback((x: number, stretch: number, opacity: number, width?: number) => {
        if (!navRef.current) return;
        if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
        
        rAFRef.current = requestAnimationFrame(() => {
            navRef.current?.style.setProperty('--mobile-nav-indicator-x', `${x}px`);
            navRef.current?.style.setProperty('--mobile-nav-indicator-stretch', `${stretch}`);
            navRef.current?.style.setProperty('--mobile-nav-indicator-opacity', `${opacity}`);
            if (width !== undefined) {
                navRef.current?.style.setProperty('--mobile-nav-indicator-width', `${width}px`);
            }
        });
    }, []);

    const measureTabs = useCallback(() => {
        if (!navRef.current) return;
        const navRect = navRef.current.getBoundingClientRect();
        
        const tabs = itemRefs.current.map(el => {
            if (!el) return { left: 0, width: 0, centerX: 0 };
            const rect = el.getBoundingClientRect();
            const left = rect.left - navRect.left;
            return {
                left,
                width: rect.width,
                centerX: left + rect.width / 2
            };
        });
        metricsRef.current = { navWidth: navRect.width, tabs };
        
        if (activeIndex >= 0 && activeIndex < tabs.length && !dragRef.current?.wasDrag) {
            updateIndicatorCSS(tabs[activeIndex].left, BASE_STRETCH, 1, tabs[activeIndex].width);
        } else if (activeIndex < 0) {
            updateIndicatorCSS(0, BASE_STRETCH, 0);
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

    // Initial Measurement & ResizeObserver
    useEffect(() => {
        // Delay measurement slightly to ensure layout is painted
        const timer = setTimeout(measureTabs, 50);
        
        let observer: ResizeObserver | null = null;
        if (window.ResizeObserver && navRef.current) {
            observer = new ResizeObserver(() => {
                // Throttle observer
                requestAnimationFrame(measureTabs);
            });
            observer.observe(navRef.current);
        }
        
        return () => {
            clearTimeout(timer);
            observer?.disconnect();
            if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
        };
    }, [measureTabs]);

    // Body Scroll Lock & Escape handling for More Sheet
    useEffect(() => {
        if (!moreOpen) return;
        
        const originalOverflow = document.body.style.overflow;
        const originalPadding = document.body.style.paddingRight;
        
        document.body.style.overflow = 'hidden';
        
        const close = (e: MouseEvent | TouchEvent) => {
            if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
                setMoreOpen(false);
                moreBtnRef.current?.focus();
            }
        };
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMoreOpen(false);
                moreBtnRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', close);
        document.addEventListener('touchstart', close, { passive: true });
        document.addEventListener('keydown', handleKeyDown);
        
        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPadding;
            document.removeEventListener('mousedown', close);
            document.removeEventListener('touchstart', close);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [moreOpen]);

    // Close More sheet on route change
    useEffect(() => {
        setMoreOpen(false);
    }, [location.pathname]);

    // Pointer Drag Handling
    const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
        if (reducedMotion || e.button !== 0 || activeIndex < 0) return;
        const navEl = navRef.current;
        if (!navEl) return;
        
        // Ignore interactions inside More sheet only; More button remains part of drag metrics.
        if (moreRef.current?.contains(e.target as Node)) return;

        measureTabs();

        try {
            navEl.setPointerCapture(e.pointerId);
        } catch {
            // Safari fallback
        }

        const startX = e.clientX;
        dragRef.current = {
            pointerId: e.pointerId,
            startX,
            lastX: startX,
            wasDrag: false
        };
        suppressClickRef.current = false;
        
        // Add active press state to container
        navEl.classList.add('is-pressed');
    };

    const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
        if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
        
        const dx = e.clientX - dragRef.current.startX;
        if (!dragRef.current.wasDrag && Math.abs(dx) > DRAG_THRESHOLD_PX) {
            dragRef.current.wasDrag = true;
            navRef.current?.classList.add('is-dragging');
        }
        
        if (dragRef.current.wasDrag) {
            const currentMetric = metricsRef.current.tabs[activeIndex];
            if (!currentMetric) return;
            
            const delta = e.clientX - dragRef.current.lastX;
            dragRef.current.lastX = e.clientX;
            
            // Calculate new X using raw inline style value if possible, else fallback to metric.
            // All bounds use cached measurements; pointermove never reads layout.
            const currentXStr = navRef.current?.style.getPropertyValue('--mobile-nav-indicator-x');
            const prevX = currentXStr ? parseFloat(currentXStr) : currentMetric.left;
            const currentIndWidth = currentMetric.width;
            
            let nextX = prevX + delta;
            nextX = Math.max(0, Math.min(nextX, metricsRef.current.navWidth - currentIndWidth));
            
            const speed = Math.abs(delta);
            const targetStretch = reducedMotion
                ? BASE_STRETCH
                : BASE_STRETCH + Math.min(speed * 0.012, MAX_STRETCH - BASE_STRETCH);
            
            updateIndicatorCSS(nextX, targetStretch, 1);
        }
    };

    const snapToNearest = () => {
        if (!navRef.current || metricsRef.current.tabs.length === 0) return;
        
        const currentXStr = navRef.current.style.getPropertyValue('--mobile-nav-indicator-x');
        if (!currentXStr) return;
        
        const currentX = parseFloat(currentXStr);
        const currentMetric = metricsRef.current.tabs[activeIndex];
        const currentWidth = currentMetric ? currentMetric.width : 0;
        const centerX = currentX + currentWidth / 2;
        
        let minDiff = Infinity;
        let nearestIndex = activeIndex;
        
        metricsRef.current.tabs.forEach((m, idx) => {
            const diff = Math.abs(centerX - m.centerX);
            if (diff < minDiff) {
                minDiff = diff;
                nearestIndex = idx;
            }
        });
        
        if (nearestIndex === primaryItems.length) {
            setMoreOpen(true);
            const snapIndex = activeIndex >= 0 ? activeIndex : nearestIndex;
            const metric = metricsRef.current.tabs[snapIndex];
            if (metric) {
                updateIndicatorCSS(metric.left, BASE_STRETCH, activeIndex >= 0 ? 1 : 0, metric.width);
            }
            return;
        }

        if (nearestIndex !== activeIndex) {
            navigate(primaryItems[nearestIndex].path);
        }
        
        const metric = metricsRef.current.tabs[nearestIndex];
        if (metric) {
            updateIndicatorCSS(metric.left, BASE_STRETCH, 1, metric.width);
        } else {
            updateIndicatorCSS(0, BASE_STRETCH, 0);
        }
    };

    const endDrag = (e: React.PointerEvent<HTMLElement>) => {
        if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
        
        const wasDrag = dragRef.current.wasDrag;
        if (wasDrag) {
            suppressClickRef.current = true;
            snapToNearest();
        }
        
        try {
            navRef.current?.releasePointerCapture(e.pointerId);
        } catch {
            // Ignore if pointer capture fails
        }
        
        dragRef.current = null;
        navRef.current?.classList.remove('is-dragging', 'is-pressed');
        
        // Reset stretch just in case
        if (!wasDrag && activeIndex >= 0 && metricsRef.current.tabs[activeIndex]) {
             updateIndicatorCSS(metricsRef.current.tabs[activeIndex].left, BASE_STRETCH, 1, metricsRef.current.tabs[activeIndex].width);
        }
    };

    const handleItemClick = (e: React.MouseEvent, index: number) => {
        if (suppressClickRef.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClickRef.current = false;
            return;
        }
        const metric = metricsRef.current.tabs[index];
        if (metric && index !== primaryItems.length) {
            updateIndicatorCSS(metric.left, BASE_STRETCH, 1, metric.width);
        }
    };

    const handleOverflowNav = (path: string) => {
        navigate(path);
        setMoreOpen(false);
    };

    return (
        <nav 
            className={`mobile-bottom-nav ${moreOpen ? 'is-more-open' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}
            aria-label="Navigasi utama"
            ref={navRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
        >
            <div className="mobile-bottom-indicator" />
            
            {primaryItems.map((item, index) => {
                const isActive = activeIndex === index;
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={`mobile-bottom-item ${isActive ? 'is-active' : ''}`}
                        ref={el => { itemRefs.current[index] = el; }}
                        onClick={(e) => handleItemClick(e, index)}
                    >
                        <span className="mobile-bottom-icon">
                            <Icon name={item.icon} />
                        </span>
                        <span className="mobile-bottom-label">{t(item.label)}</span>
                    </NavLink>
                );
            })}

            {overflowItems.length > 0 && (
                <>
                    <button
                        type="button"
                        className={`mobile-bottom-item mobile-bottom-more-btn ${activeIndex === primaryItems.length ? 'is-active' : ''}`}
                        aria-expanded={moreOpen ? 'true' : 'false'}
                        aria-haspopup="true"
                        ref={el => { 
                            itemRefs.current[primaryItems.length] = el; 
                            moreBtnRef.current = el;
                        }}
                        onClick={(e) => {
                            if (suppressClickRef.current) {
                                e.preventDefault();
                                e.stopPropagation();
                                suppressClickRef.current = false;
                                return;
                            }
                            setMoreOpen((o) => !o);
                        }}
                    >
                        <span className="mobile-bottom-icon">
                            <Icon name="more" />
                        </span>
                        <span className="mobile-bottom-label">{t('common.more')}</span>
                    </button>

                    {moreOpen && (
                        <div className="mobile-more-backdrop" aria-hidden="true" />
                    )}
                    
                    <div 
                        className={`mobile-more-sheet ${moreOpen ? 'is-open' : ''}`} 
                        ref={moreRef}
                        role="dialog"
                        aria-label="Menu Lainnya"
                    >
                        <div className="mobile-more-sheet-handle" aria-hidden="true" />
                        <div className="mobile-more-sheet-header">
                            <h3>{t('common.more')}</h3>
                            <button type="button" className="mobile-more-sheet-close" onClick={() => setMoreOpen(false)} aria-label="Tutup menu">
                                &times;
                            </button>
                        </div>
                        <div className="mobile-more-sheet-body" role="menu">
                            {overflowItems.map((item) => {
                                const isActive = location.pathname.startsWith(item.path);
                                return (
                                    <button
                                        key={item.path}
                                        type="button"
                                        role="menuitem"
                                        className={`mobile-more-sheet-item ${isActive ? 'is-active' : ''}`}
                                        onClick={() => handleOverflowNav(item.path)}
                                    >
                                        <div className="mobile-more-sheet-item-icon">
                                            <Icon name={item.icon} />
                                        </div>
                                        <div className="mobile-more-sheet-item-text">
                                            <span className="mobile-more-sheet-item-label">{t(item.label)}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
};

export default MobileBottomNav;
