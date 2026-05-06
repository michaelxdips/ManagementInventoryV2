import { LayoutSwitcher } from '../components/Layout';

/**
 * @deprecated Legacy compatibility wrapper.
 *
 * Main authenticated layout composition is now centralized in route index
 * via LayoutSwitcher + DesktopLayout/MobileLayout.
 *
 * This component is intentionally kept as a thin passthrough so any stale
 * imports to `layouts/AuthLayout` do not break at runtime.
 */
const AuthLayout = () => {
    return <LayoutSwitcher />;
};

export default AuthLayout;
