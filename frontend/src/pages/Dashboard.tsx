import { useTranslation } from '../hooks/useTranslation';
import useAuth from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import AdminDashboard from './dashboard/AdminDashboard';
import UserDashboard from './dashboard/UserDashboard';
import { RefreshCw, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';

const Dashboard = () => {
	const { hasRole, user } = useAuth();
	const { data, loading, refreshing, error, refetch } = useDashboard();

	// Greeting based on time of day
	const hour = new Date().getHours();
	const { t } = useTranslation();
	const greeting = hour < 12 ? t('dashboard.greetingMorning') : hour < 17 ? t('dashboard.greetingAfternoon') : t('dashboard.greetingEvening');

	if (loading) {
		return (
			<div className="page-container" aria-busy="true">
				<header className="page-header">
					<div>
						<h1 className="page-title">Dashboard</h1>
						<p className="page-description">{t('dashboard.preparing')}</p>
					</div>
				</header>
				<section className="calendar-summary-grid">
					<SkeletonCard />
					<SkeletonCard />
					<SkeletonCard />
					<SkeletonCard />
				</section>
			</div>
		);
	}

	if (error) {
		return (
			<div className="dashboard-error-state">
				<AlertCircle size={48} color="#d73a49" />
				<h3 className="dashboard-error-title">{t('dashboard.loadError')}</h3>
				<p className="dashboard-error-message">{error}</p>
				<Button type="button" variant="secondary" onClick={refetch} className="action-button-inline mt-2">
					<RefreshCw size={16} />
					{t('common.tryAgain')}
				</Button>
			</div>
		);
	}

	if (!data) return null;

	const isAdmin = hasRole(['admin', 'superadmin']);

	return (
		<div className="dashboard dashboard-page dashboard-fade-in">
			{isAdmin
				? <AdminDashboard metrics={data} greeting={greeting} userName={user?.name || 'Admin'} onRefresh={refetch} refreshing={refreshing} />
				: <UserDashboard metrics={data} greeting={greeting} userName={user?.name || 'User'} onRefresh={refetch} />
			}
		</div>
	);
};

export default Dashboard;
