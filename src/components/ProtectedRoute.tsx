import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F2DFFF] bg-opacity-30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#9268AF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#1E2934BA]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
