import { Outlet } from 'react-router-dom';

const GuestLayout = () => {
	return (
		<div className="guest-shell">
			<main className="guest-main">
				<Outlet />
			</main>
		</div>
	);
};

export default GuestLayout;
