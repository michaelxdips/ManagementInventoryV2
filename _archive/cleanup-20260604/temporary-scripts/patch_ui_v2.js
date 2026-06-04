const fs = require('fs');

const path = 'frontend/src/pages/dashboard/UserDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `      {/* Frequent Items Section */}
      <article className="dash-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FastForward size={18} color="var(--accent)" /> 
            {t('dashboard.frequentRequests')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {metrics.frequentItems && metrics.frequentItems.length > 0 ? metrics.frequentItems.map((item, idx) => (
              <div key={idx} style={{ padding: '16px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                   onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                   onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                   onClick={() => navigate(\`/requests/create?item=\${encodeURIComponent(item.nama_barang)}\`)}>
                <Package size={24} color="var(--muted)" style={{ marginBottom: '12px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600 }}>{item.nama_barang}</h4>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--muted)' }}>{t('dashboard.requestedCount', { count: item.freq })}</p>
                <Button type="button" variant="secondary" style={{ width: '100%', fontSize: '12px', padding: '6px 0' }}>{t('dashboard.requestAgain')}</Button>
              </div>
            )) : (
              <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: 'var(--muted)', background: 'var(--panel)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                {t('dashboard.noRequestHistory')}
              </div>
            )}
          </div>
        </article>`;

const replacement = `      {/* Frequent Items Section */}
      <article className="dash-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FastForward size={18} color="var(--accent)" /> 
              {t('dashboard.frequentRequests')}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>Quickly request items you frequently need</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {metrics.frequentItems && metrics.frequentItems.length > 0 ? (
              <>
                {metrics.frequentItems.map((item, idx) => (
                  <div key={idx} style={{ 
                        padding: '16px', background: 'var(--panel)', border: '1px solid var(--border)', 
                        borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', 
                        transition: 'all 0.2s', cursor: 'pointer' 
                       }}
                       onMouseEnter={e => { 
                           e.currentTarget.style.transform = 'translateY(-2px)'; 
                           e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; 
                           e.currentTarget.style.borderColor = 'var(--accent)';
                       }}
                       onMouseLeave={e => { 
                           e.currentTarget.style.transform = 'none'; 
                           e.currentTarget.style.boxShadow = 'none'; 
                           e.currentTarget.style.borderColor = 'var(--border)';
                       }}
                       onClick={() => navigate(\`/requests/create?item=\${encodeURIComponent(item.nama_barang)}\`)}>
                    
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={24} color="var(--accent)" />
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.nama_barang}
                        </h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                            {t('dashboard.requestedCount', { count: item.freq })}
                        </p>
                    </div>
                    
                    <Button type="button" variant="secondary" style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {t('dashboard.requestAgain')}
                    </Button>
                  </div>
                ))}
                
                {/* Ghost Placeholders to keep grid filled */}
                {Array.from({ length: Math.max(0, 4 - metrics.frequentItems.length) }).map((_, i) => (
                  <div key={\`ghost-\${i}\`} onClick={() => navigate('/requests/create')} style={{ 
                      padding: '16px', background: 'var(--panel)', border: '1px dashed var(--border)', 
                      borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', 
                      opacity: 0.7, cursor: 'pointer', transition: 'all 0.2s'
                  }} onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = 'var(--accent)'}} onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.borderColor = 'var(--border)'}}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'transparent', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Plus size={24} color="var(--muted)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: 'var(--muted)' }}>{t('dashboard.newRequest')}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>{t('dashboard.browseInventory', 'Browse inventory')}</p>
                      </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: 'var(--muted)', background: 'var(--panel)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                {t('dashboard.noRequestHistory')}
              </div>
            )}
          </div>
        </article>`;

content = content.replace(targetStr, replacement);
fs.writeFileSync(path, content);
console.log('UserDashboard UI updated correctly with ghost placeholders');
