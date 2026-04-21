'use client';

import RoleProtectedRoute from './RoleProtectedRoute';

export default function CustomerProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['CUSTOMER']} redirectTo="/account/login">
      {children}
    </RoleProtectedRoute>
  );
}
