import useBreakpoint from './useBreakpoint';
import DesktopLayout from './desktop/DesktopLayout';
import MobileLayout from './mobile/MobileLayout';

/**
 * LayoutSwitcher - THE SINGLE place for layout selection.
 * 
 * RESPONSIBILITIES:
 * - Read screen width via useBreakpoint
 * - Choose DesktopLayout or MobileLayout
 * 
 * STRICTLY FORBIDDEN:
 * - ❌ NO data fetching
 * - ❌ NO business logic
 * - ❌ NO role/permission checks
 * - ❌ NO API calls
 * - ❌ NO conditional rendering based on user data
 * 
 * This component ONLY decides layout based on screen width.
 * All business logic stays in page components.
 */
const LayoutSwitcher = () => {
    const { isMobile } = useBreakpoint(768);

    if (isMobile) {
        return <MobileLayout />;
    }

    return <DesktopLayout />;
};

export default LayoutSwitcher;
