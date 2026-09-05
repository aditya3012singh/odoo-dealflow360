import { Navigate } from 'react-router-dom';

interface PortalProtectedRouteProps {
  children: React.ReactNode;
}

export function PortalProtectedRoute({ children }: PortalProtectedRouteProps) {
  const token = localStorage.getItem('portalToken');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
