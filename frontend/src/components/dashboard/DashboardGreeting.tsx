import React from 'react';
interface DashboardGreetingProps {
  greeting: string;
  userName: string;
  summaryText: string;
}

const DashboardGreeting: React.FC<DashboardGreetingProps> = ({ greeting, userName, summaryText }) => {
  return (
    <div className="dashboard-greeting" style={{ minWidth: 0 }}>
      <h2 className="dashboard-greeting-title" style={{ margin: '0', fontSize: '24px', fontWeight: 700, lineHeight: 1.3, wordBreak: 'break-word', maxWidth: '100%' }}>
        {greeting}, <span className="highlight-name">{userName}</span> 👋
      </h2>
      <p className="dashboard-greeting-sub" style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5 }}>{summaryText}</p>
    </div>
  );
};

export default DashboardGreeting;
