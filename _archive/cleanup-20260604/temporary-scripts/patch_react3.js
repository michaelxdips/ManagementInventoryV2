const fs = require('fs');

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

// Specifically replace the closing div with closing section by replacing the whole buttons block
const oldButtons = `<div style={{ display: 'flex', gap: '8px' }}>
          <Button type="button" variant="secondary" onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} />
            {t('dashboard.refresh')}
          </Button>
          <Button type="button" variant="primary" onClick={() => navigate('/requests/create')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            {t('dashboard.newRequest')}
          </Button>
        </div>
      </div>`;
const newButtons = `<div className="dashboard-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button type="button" variant="secondary" onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {t('dashboard.refresh')}
          </Button>
          <Button type="button" variant="primary" onClick={() => navigate('/requests/create')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} />
            {t('dashboard.newRequest')}
          </Button>
        </div>
      </section>`;

if (userDash.includes(oldButtons)) {
  userDash = userDash.replace(oldButtons, newButtons);
} else {
  // Try regex if exact match fails
  userDash = userDash.replace(
      /<div style=\{\{ display: 'flex', gap: '8px' \}\}>[\s\S]*?<RefreshCw size=\{14\} \/>[\s\S]*?<\/Button>[\s\S]*?<Button type="button" variant="primary" onClick=\{.*?\}[\s\S]*?<Plus size=\{16\} \/>[\s\S]*?<\/Button>[\s\S]*?<\/div>\s*<\/div>/,
      newButtons
  );
}

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
userDash = userDash.replace(/<h3 style=\{\{ margin: '0 0 4px', fontSize: '14px', color: 'var\(--muted\)', fontWeight: 500 \}\}>Approved<\/h3>/, `<h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{t('dashboard.approvedRequests')}</h3>`);
userDash = userDash.replace(/<h3 style=\{\{ margin: '0 0 4px', fontSize: '14px', color: 'var\(--muted\)', fontWeight: 500 \}\}>Rejected<\/h3>/, `<h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{t('dashboard.rejectedRequests')}</h3>`);


fs.writeFileSync('frontend/src/pages/dashboard/UserDashboard.tsx', userDash);
console.log('UserDashboard patched.');
