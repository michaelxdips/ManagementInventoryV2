import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LayoutSwitcher } from '../components/Layout';
import GuestLayout from '../layouts/GuestLayout';
import { SkeletonCard } from '../components/ui/Skeleton';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

const Approval = lazy(() => import('../pages/Approval'));
const ApprovalFinalize = lazy(() => import('../pages/ApprovalFinalize'));
const AtkItems = lazy(() => import('../pages/AtkItems'));
const BarangKosong = lazy(() => import('../pages/BarangKosong'));
const BarangMasukCreate = lazy(() => import('../pages/BarangMasukCreate'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const HistoryKeluar = lazy(() => import('../pages/HistoryKeluar'));
const HistoryMasuk = lazy(() => import('../pages/HistoryMasuk'));
const Information = lazy(() => import('../pages/Information'));
const Login = lazy(() => import('../pages/auth/Login'));
const ManageUnits = lazy(() => import('../pages/ManageUnits'));
const ManageUnitsCreate = lazy(() => import('../pages/ManageUnitsCreate'));
const ManageAnnouncements = lazy(() => import('../pages/ManageAnnouncements'));
const PasswordSettings = lazy(() => import('../pages/PasswordSettings'));
const ProfileSettings = lazy(() => import('../pages/ProfileSettings'));
const Requests = lazy(() => import('../pages/Requests'));
const RequestsCreate = lazy(() => import('../pages/RequestsCreate'));
const NewItemRequestApproval = lazy(() => import('../pages/NewItemRequestApproval'));
const StockOpname = lazy(() => import('../pages/StockOpname'));
const AuditLogs = lazy(() => import('../pages/AuditLogs'));
const RequestCalendar = lazy(() => import('../pages/RequestCalendar'));

const RouteFallback = () => (
	<div className="route-fallback" role="status" aria-live="polite">
		<SkeletonCard />
		<SkeletonCard />
	</div>
);

const AppRoutes = () => {
	return (
		<Suspense fallback={<RouteFallback />}>
			<Routes>
				{/* Guest Routes - Login */}
				<Route element={<GuestLayout />}>
					<Route index element={<Login />} />
				</Route>

				{/* Protected Routes - Authenticated Users */}
				<Route element={<ProtectedRoute />}>
					{/* LayoutSwitcher automatically selects desktop/mobile layout */}
					<Route element={<LayoutSwitcher />}>
						{/* Common routes for all authenticated users */}
						<Route path="/dashboard" element={<Dashboard />} />

						<Route path="/items" element={<AtkItems />} />
						<Route path="/settings" element={<ProfileSettings />} />
						<Route path="/settings/password" element={<PasswordSettings />} />

						{/* User role routes */}
						<Route element={<RoleRoute allow={["user"]} />}>
							<Route path="/requests" element={<Requests />} />
							<Route path="/requests/create" element={<RequestsCreate />} />
							<Route path="/information" element={<Information />} />
						</Route>

						{/* Admin/Superadmin role routes */}
						<Route element={<RoleRoute allow={["admin", "superadmin"]} />}>
							<Route path="/barang-masuk/create" element={<BarangMasukCreate />} />
							<Route path="/history-masuk" element={<HistoryMasuk />} />
							<Route path="/history-keluar" element={<HistoryKeluar />} />
							<Route path="/barang-kosong" element={<BarangKosong />} />
							<Route path="/approval" element={<Approval />} />
							<Route path="/request-calendar" element={<RequestCalendar />} />
							<Route path="/approval/:id/finalize" element={<ApprovalFinalize />} />
							<Route path="/new-item-requests" element={<NewItemRequestApproval />} />
							<Route path="/stock-opname" element={<StockOpname />} />
							<Route path="/audit-logs" element={<AuditLogs />} />
							<Route path="/announcements" element={<ManageAnnouncements />} />
						</Route>

						{/* Superadmin only routes */}
						<Route element={<RoleRoute allow={["superadmin"]} />}>
							<Route path="/manage-units" element={<ManageUnits />} />
							<Route path="/manage-units/create" element={<ManageUnitsCreate />} />
						</Route>
					</Route>
				</Route>

				{/* Catch all - redirect to home */}
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</Suspense>
	);
};

export default AppRoutes;
