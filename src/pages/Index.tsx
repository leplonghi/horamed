import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Landing from "./Landing";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Direct hostname check - more reliable than import.meta.env.PROD
  const hostname = window.location.hostname;
  const isOnLandingHost = hostname === 'horamed.net' || hostname === 'www.horamed.net';

  useEffect(() => {
    // On landing domain: only redirect authenticated users to app
    if (isOnLandingHost) {
      if (!loading && user) {
        window.location.href = "https://app.horamed.net/hoje";
      }
      return;
    }

    // On app domain: redirect based on auth state
    if (!loading) {
      if (user) {
        navigate("/hoje");
      } else {
        navigate("/auth");
      }
    }
  }, [user, loading, navigate, isOnLandingHost]);

  // CRITICAL: Show landing page immediately on landing domain
  if (isOnLandingHost) {
    return <Landing />;
  }

  // On app domain: show nothing while redirecting
  return null;
};

export default Index;
