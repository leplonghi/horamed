import PageHeader from "@/components/PageHeader";
import { SideEffectsDashboard } from "@/components/SideEffectsDashboard";

export default function SideEffectsDiary() {
  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <PageHeader
        title="Diário de Efeitos"
        description="Registre e acompanhe como você se sente após cada dose"
      />
      
      <SideEffectsDashboard />
    </div>
  );
}
