'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import LoadingSpinner from './LoadingSpinner';
import { getStoredSession, subscribeToAuthChanges, UserRole } from '@/lib/auth';

interface RoleProtectedRouteProps {
  allowedRoles: UserRole[];
  redirectTo: string;
  children: React.ReactNode;
}

export default function RoleProtectedRoute({
  allowedRoles,
  redirectTo,
  children
}: RoleProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      const session = getStoredSession();
      const hasPermission = Boolean(session && allowedRoles.includes(session.user.Role));

      setIsAuthorized(hasPermission);
      setIsLoading(false);

      if (!hasPermission) {
        const redirectUrl = pathname
          ? `${redirectTo}?redirect=${encodeURIComponent(pathname)}`
          : redirectTo;
        router.push(redirectUrl);
      }
    };

    checkSession();
    return subscribeToAuthChanges(checkSession);
  }, [allowedRoles, pathname, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
