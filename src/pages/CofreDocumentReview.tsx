import { useParams, useLocation, Navigate } from "react-router-dom";
import PrescriptionReviewScreen from "@/components/cofre/PrescriptionReviewScreen";
import ExamReviewScreen from "@/components/cofre/ExamReviewScreen";
import VaccineReviewScreen from "@/components/cofre/VaccineReviewScreen";
import DocumentReviewScreen from "@/components/cofre/DocumentReviewScreen";

export default function CofreDocumentReview() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { type, extractedData } = location.state || {};

  if (!id || !type || !extractedData) {
    return <Navigate to="/carteira" replace />;
  }

  const handleComplete = () => {
    // Handled by individual review screens
  };

  switch (type) {
    case "receita":
      return (
        <PrescriptionReviewScreen
          documentId={id}
          extractedData={extractedData}
          onComplete={handleComplete}
        />
      );
    case "exame":
      return (
        <ExamReviewScreen
          documentId={id}
          extractedData={extractedData}
          onComplete={handleComplete}
        />
      );
    case "vacina":
      return (
        <VaccineReviewScreen
          documentId={id}
          extractedData={extractedData}
          onComplete={handleComplete}
        />
      );
    case "outro":
      return (
        <DocumentReviewScreen
          documentId={id}
          extractedData={extractedData}
          onComplete={handleComplete}
        />
      );
    default:
      return <Navigate to="/carteira" replace />;
  }
}
