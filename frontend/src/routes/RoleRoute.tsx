import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Role } from '../types/auth';

type Props = {
  allow: Role[];
};

const RoleRoute = ({ allow }: Props) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (!hasRole(allow)) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default RoleRoute;
