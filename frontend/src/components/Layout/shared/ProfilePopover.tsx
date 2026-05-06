import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import Icon from './Icon';

/**
 * Shared ProfilePopover component for user profile menu.
 * Used by both DesktopLayout (sidebar) and MobileLayout (drawer/popover).
 * Contains NO business logic - only UI presentation and navigation triggers.
 */
interface ProfilePopoverProps {
    isOpen: boolean;
    onClose: () => void;
    position?: 'bottom' | 'top'; // Position relative to trigger
}

const ProfilePopover = ({ isOpen, onClose, position = 'bottom' }: ProfilePopoverProps) => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [loggingOut, setLoggingOut] = useState(false);
    const popoverRef = useRef<HTMLDivElement | null>(null);

    const displayName = user?.name ?? 'User';
    const displayUsername = user?.username ?? 'user';
    const avatarText = (displayName || 'User')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'U';

    const handleSettings = () => {
        onClose();
        navigate('/settings');
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
            navigate('/login');
        } finally {
            setLoggingOut(false);
            onClose();
        }
    };

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClick = (e: MouseEvent) => {
            if (!popoverRef.current) return;
            if (!popoverRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const positionClass = position === 'top' ? 'profile-popover--top' : 'profile-popover--bottom';

    return (
        <div className={`profile-popover ${positionClass}`} ref={popoverRef}>
            <div className="profile-header">
                <div className="avatar">{avatarText}</div>
                <div className="profile-meta">
                    <span className="profile-name">{displayName}</span>
                    <span className="profile-username">{displayUsername}</span>
                </div>
            </div>

            <button type="button" className="profile-item" onClick={handleSettings}>
                <span className="profile-icon" aria-hidden>
                    <Icon name="settings" />
                </span>
                <span className="profile-label">Settings</span>
            </button>

            <button type="button" className="profile-item" onClick={handleLogout} disabled={loggingOut}>
                <span className="profile-icon" aria-hidden>
                    <Icon name="logout" />
                </span>
                <span className="profile-label">{loggingOut ? 'Logging out...' : 'Log out'}</span>
            </button>
        </div>
    );
};

export default ProfilePopover;
