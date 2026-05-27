import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
  children: React.ReactNode;
}

const AdminRoute: React.FC<Props> = ({ children }) => {
  const { token, user } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (!user?.is_admin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default AdminRoute;
