import { Outlet } from 'react-router-dom';
import MobileNavbar from './MobileNavbar';
import MobileBottomNav from './MobileBottomNav';

/**
 * Mobile Layout component.
 * Renders the mobile shell with top navbar, content area, and bottom navigation.
 * NO business logic - only layout structure.
 * 
 * Structure:
 * - Top: Mobile Navbar (hamburger menu, page title)
 * - Middle: Content area (scrollable)
 * - Bottom: Fixed bottom navigation (4 primary items)
 */
const MobileLayout = () => {
    return (
        <div className="app-shell mobile-layout">
            <MobileNavbar />
            <main className="mobile-content">
                <Outlet />
            </main>
            <MobileBottomNav />
        </div>
    );
};

export default MobileLayout;
