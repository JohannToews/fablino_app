import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Set to true for routes that don't need a kid profile (e.g. admin) */
  skipKidCheck?: boolean;
}

const ProtectedRoute = ({ children, skipKidCheck = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { kidProfiles, isLoading: profilesLoading } = useKidProfile();

  // Show loading state while checking auth
  if (isLoading || (!skipKidCheck && profilesLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  // If user has no kid profiles, send them to onboarding
  if (!skipKidCheck && kidProfiles && kidProfiles.length === 0) {
    return <Navigate to="/onboarding/child" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
