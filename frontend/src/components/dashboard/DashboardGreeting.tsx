import React from 'react';
interface DashboardGreetingProps {
  greeting: string;
  userName: string;
  summaryText: string;
}

const DashboardGreeting: React.FC<DashboardGreetingProps> = ({ greeting, userName, summaryText }) => {
  return (
    <div className="dashboard-greeting" style={{ minWidth: 0 }}>
      <h2 className="dashboard-greeting-title" style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 700 }}>
        {greeting}, <span className="highlight-name">{userName}</span> 👋
      </h2>
      <p className="dashboard-greeting-sub" style={{ margin: 0, color: 'var(--muted)', fontSize: '15px' }}>{summaryText}</p>
    </div>
  );
};

export default DashboardGreeting;
