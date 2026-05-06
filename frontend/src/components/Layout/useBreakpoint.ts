import { useState, useEffect } from 'react';

/**
 * Hook to detect screen width and determine if mobile view should be used.
 * ONLY reads screen width - NO business logic, NO data fetching.
 * 
 * @param breakpoint - Width threshold in pixels (default: 768)
 * @returns Object with isMobile boolean
 */
export function useBreakpoint(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(() => {
        // Check if window is available (SSR safety)
        if (typeof window === 'undefined') return false;
        return window.innerWidth < breakpoint;
    });

    useEffect(() => {
        // Skip if no window (SSR)
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Listen for resize events
        window.addEventListener('resize', handleResize);

        // Initial check
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [breakpoint]);

    return { isMobile };
}

export default useBreakpoint;
