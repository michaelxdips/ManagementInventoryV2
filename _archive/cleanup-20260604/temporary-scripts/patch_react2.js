const fs = require('fs');

// Patch Dashboard.tsx
let dashboard = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');
if (!dashboard.includes('useTranslation')) {
    dashboard = "import { useTranslation } from '../hooks/useTranslation';\n" + dashboard;
}
dashboard = dashboard.replace(
    /const greeting = hour < 12 \? 'Selamat Pagi' : hour < 17 \? 'Selamat Siang' : 'Selamat Malam';/,
    `const { t } = useTranslation();\n\tconst greeting = hour < 12 ? t('dashboard.greetingMorning') : hour < 17 ? t('dashboard.greetingAfternoon') : t('dashboard.greetingEvening');`
);
fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dashboard);

// Patch UserDashboard.tsx
let userDash = fs.readFileSync('frontend/src/pages/dashboard/UserDashboard.tsx', 'utf8');

// Header formatting: wrap in section.user-dashboard-hero
userDash = userDash.replace(
    /<DashboardGreeting greeting=\{greeting\} userName=\{userName\} summaryText=\{t\('dashboard\.summary'\)\} \/>/,
    `<div style={{ flex: 1, minWidth: '240px' }}>\n            <DashboardGreeting greeting={greeting} userName={userName} summaryText={t('dashboard.summary')} />\n          </div>`
);

// We need to change the style of the top section to make it not overflow.
userDash = userDash.replace(
    /<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' \}\}>/,
    `<section className="user-dashboard-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '16px 20px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>`
);

// We need to change the buttons in Header: "Refresh" and "New Request"
// Also change the flex container of buttons
userDash = userDash.replace(
    /<div style=\{\{ display: 'flex', gap: '8px' \}\}>[\s\S]*?<RefreshCw size=\{14\} \/>[\s\S]*?<\/Button>[\s\S]*?<Button type="button" variant="primary" onClick=\{.*?\}[\s\S]*?<Plus size=\{14\} \/>[\s\S]*?<\/Button>[\s\S]*?<\/div>/,
    `<div className="dashboard-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button type="button" variant="secondary" onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              {t('dashboard.refresh')}
            </Button>
            <Button type="button" variant="primary" onClick={() => navigate('/requests/new')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} />
              {t('dashboard.newRequest')}
            </Button>
          </div></section>`
);

// Fix Frequently Requested UI and texts
userDash = userDash.replace(/<h2>Frequently Requested \(Distribution\)<\/h2>/, `<h2>{t('dashboard.frequentlyRequested')}</h2>\n            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '-12px 0 16px 0' }}>{t('dashboard.frequentSubtitle')}</p>`);
userDash = userDash.replace(/<h2>Frequently Requested<\/h2>/, `<h2>{t('dashboard.frequentlyRequested')}</h2>\n            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '-12px 0 16px 0' }}>{t('dashboard.frequentSubtitle')}</p>`);

userDash = userDash.replace(/<p style=\{\{ margin: 0, fontSize: '14px', color: 'var\(--muted\)' \}\}>Requested (\{req\.count\}) times<\/p>/, `<p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>{t('dashboard.requestedTimes', { count: req.count }).replace('{{count}}', req.count.toString())}</p>`);
userDash = userDash.replace(/>Request Again<\/Button>/, `>{t('dashboard.requestAgain')}</Button>`);
userDash = userDash.replace(/<p style=\{\{ color: 'var\(--muted\)' \}\}>No frequently requested items yet\.<\/p>/, `<p style={{ color: 'var(--muted)', padding: '24px 0', textAlign: 'center' }}>{t('dashboard.noFrequentItems')}</p>`);

userDash = userDash.replace(/<h2>Announcements<\/h2>/, `<h2>{t('dashboard.announcements')}</h2>`);

// Fix stat card titles and styles
userDash = userDash.replace(/<h3 style=\{\{ margin: '0 0 4px', fontSize: '14px', color: 'var\(--muted\)', fontWeight: 500 \}\}>\{t\('dashboard\.totalRequests'\)\}<\/h3>/, `<h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{t('dashboard.totalRequests')}</h3>`);
userDash = userDash.replace(/<h3 style=\{\{ margin: '0 0 4px', fontSize: '14px', color: 'var\(--muted\)', fontWeight: 500 \}\}>\{t\('dashboard\.pendingValidation'\)\}<\/h3>/, `<h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{t('dashboard.pendingValidation')}</h3>`);
// Assuming there is an Approved stat block if we find it:
userDash = userDash.replace(/<h3 style=\{\{ margin: '0 0 4px', fontSize: '14px', color: 'var\(--muted\)', fontWeight: 500 \}\}>Approved<\/h3>/, `<h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{t('dashboard.approvedRequests')}</h3>`);


// Change DashboardGreeting sub header
let greeting = fs.readFileSync('frontend/src/components/dashboard/DashboardGreeting.tsx', 'utf8');
greeting = greeting.replace(/<p className="dashboard-greeting-sub"[\s\S]*?>\{summaryText\}<\/p>/, `<p className="dashboard-greeting-sub" style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5 }}>{summaryText}</p>`);
// Make username wrap
greeting = greeting.replace(/<h2 className="dashboard-greeting-title".*?>/, `<h2 className="dashboard-greeting-title" style={{ margin: '0', fontSize: '24px', fontWeight: 700, lineHeight: 1.3, wordBreak: 'break-word', maxWidth: '100%' }}>`);
fs.writeFileSync('frontend/src/components/dashboard/DashboardGreeting.tsx', greeting);

// Make the DashboardAnnouncement component smaller and compact
let announcement = fs.readFileSync('frontend/src/components/dashboard/DashboardAnnouncement.tsx', 'utf8');
announcement = announcement.replace(
    /padding: '20px'/,
    "padding: '16px'"
);
announcement = announcement.replace(
    /fontSize: '18px'/,
    "fontSize: '15px'"
);
announcement = announcement.replace(
    /marginBottom: '12px'/,
    "marginBottom: '6px'"
);
announcement = announcement.replace(
    /marginBottom: '20px'/,
    "marginBottom: '12px'"
);
fs.writeFileSync('frontend/src/components/dashboard/DashboardAnnouncement.tsx', announcement);


fs.writeFileSync('frontend/src/pages/dashboard/UserDashboard.tsx', userDash);

console.log('React patched');
