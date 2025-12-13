import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isLandingDomain, isAppDomain } from "@/lib/domainConfig";
import Landing from "./Landing";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // On landing domain (horamed.net or www.horamed.net): always show landing
    if (isLandingDomain()) {
      if (!loading && user) {
        // Authenticated user on landing → redirect to app domain
        window.location.href = "https://app.horamed.net/hoje";
      }
      // Otherwise, do nothing - just show landing page
      return;
    }

    // On app domain (app.horamed.net): redirect based on auth state
    if (isAppDomain()) {
      if (!loading) {
        if (user) {
          navigate("/hoje");
        } else {
          navigate("/auth");
        }
      }
    }
  }, [user, loading, navigate]);

  // On landing domain: always show landing page (don't wait for auth)
  if (isLandingDomain()) {
    return <Landing />;
  }

  // On app domain: show nothing while redirecting
  return null;
};

export default Index;
