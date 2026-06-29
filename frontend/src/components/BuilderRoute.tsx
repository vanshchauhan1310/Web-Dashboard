import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const BuilderRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_builder) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default BuilderRoute;
