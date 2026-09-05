import { useAppSelector } from '../../store/hooks';
import type { Role } from '../../types';

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const user = useAppSelector((state) => state.auth.user);

  if (!user || !allowedRoles.includes(user.role as Role)) {
    return (
      <>
        {fallback ?? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-5xl mb-3">🔒</p>
              <p className="text-gray-600 font-medium">Access Restricted</p>
              <p className="text-sm text-gray-400 mt-1">
                Your role ({user?.role}) doesn't have permission to view this.
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
