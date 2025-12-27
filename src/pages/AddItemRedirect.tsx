import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * Redirects to the unified AddItemWizard page
 */
export default function AddItemRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const editId = searchParams.get("edit");
  const name = searchParams.get("name");
  const category = searchParams.get("category");

  useEffect(() => {
    if (editId) {
      // Redirect to edit page
      navigate(`/edit/${editId}?edit=${editId}`, { replace: true });
    } else {
      // Redirect to new wizard with any prefill params
      const params = new URLSearchParams();
      if (name) params.set("name", name);
      if (category) params.set("category", category);
      const queryString = params.toString();
      navigate(`/adicionar-medicamento${queryString ? `?${queryString}` : ""}`, { replace: true });
    }
  }, [editId, name, category, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}