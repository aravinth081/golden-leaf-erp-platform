// ──────────────────────────────────────────────────
// Golden Leaf Finance — Protected Route Guard
// Validates auth + role before rendering
// ──────────────────────────────────────────────────

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import type { UserRole } from '../../types';
import { PageSkeleton } from '../ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hasUser = useAuthStore((s) => !!s.user);
  const userRole = useAuthStore((s) => s.user?.customClaims?.role);
  const location = useLocation();

  // Still checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-gold animate-pulse-gold">
            <span className="text-white font-display font-bold text-xl">GL</span>
          </div>
          <p className="text-sm text-rich-silver font-body">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated || !hasUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
