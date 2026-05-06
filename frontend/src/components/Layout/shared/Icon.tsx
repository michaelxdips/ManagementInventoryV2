/**
 * Shared Icon component used by desktop and mobile navigation.
 * Centralizes SVG icon variants for layout/navigation UI.
 */
export const Icon = ({ name }: { name: string }) => {
    const stroke = 'currentColor';
    switch (name) {
        case 'grid':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
                    <rect x="4" y="4" width="6" height="6" rx="1.5" />
                    <rect x="14" y="4" width="6" height="6" rx="1.5" />
                    <rect x="4" y="14" width="6" height="6" rx="1.5" />
                    <rect x="14" y="14" width="6" height="6" rx="1.5" />
                </svg>
            );
        case 'box':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
                    <path d="M4 7.5 12 12l8-4.5M4 7.5 12 3l8 4.5M4 7.5v9L12 21l8-4.5v-9" strokeLinejoin="round" />
                </svg>
            );
        case 'in':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
                    <path d="M5 12h14M12 5v14M12 5l-3 3M12 5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case 'out':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
                    <path d="M5 12h14M12 19V5M12 19l-3-3M12 19l3-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case 'request':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M8 9h8M8 12h5" strokeLinecap="round" />
                </svg>
            );
        case 'info':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 9.5v5M12 7.2v.1" strokeLinecap="round" />
                </svg>
            );
        case 'check':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
                    <path d="M5 12.5 10 17l9-10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case 'calendar':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="5" width="16" height="15" rx="2" />
                    <path d="M8 3v4M16 3v4M4 10h16" />
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
                </svg>
            );
        case 'empty':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M8 8h8v8H8z" opacity="0.35" />
                </svg>
            );
        case 'star':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            );
        case 'units':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
                    <path d="M4 10h7V4H4v6Zm9 10h7v-6h-7v6ZM4 20h7v-6H4v6Zm9-10h7V4h-7v6Z" />
                </svg>
            );
        case 'quota':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9" />
                    <path d="M12 3v9l6.36 3.64" />
                </svg>
            );
        case 'menu':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
                    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </svg>
            );
        case 'close':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case 'more':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
                    <circle cx="12" cy="12" r="1.5" fill={stroke} />
                    <circle cx="12" cy="6" r="1.5" fill={stroke} />
                    <circle cx="12" cy="18" r="1.5" fill={stroke} />
                </svg>
            );
        case 'settings':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 3.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 7 3.6V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c0 .26.06.52.17.76a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
            );
        case 'file-text':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
            );
        case 'clock':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            );
        case 'megaphone':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 11V5l12-4v16L3 13v-2Z" />
                    <path d="M15 7v10c2.76 0 5-1.12 5-5s-2.24-5-5-5Z" />
                    <path d="M11.6 21.73a3 3 0 0 1-2.3-5.73" />
                </svg>
            );
        case 'logout':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="M16 17 21 12 16 7" />
                    <path d="M21 12H9" />
                </svg>
            );
        default:
            return null;
    }
};

export default Icon;
