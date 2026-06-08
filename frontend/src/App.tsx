import AppRoutes from './routes';
import OfflineBanner from './components/ui/OfflineBanner';

const App = () => {
	return (
		<>
			<AppRoutes />
			<OfflineBanner />
		</>
	);
};

export default App;
