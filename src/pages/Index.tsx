import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Landing from "./Landing";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/hoje");
    }
  }, [user, loading, navigate]);

  // Show landing page for unauthenticated users
  if (!loading && !user) {
    return <Landing />;
  }

  // Loading state
  return null;
};

export default Index;
