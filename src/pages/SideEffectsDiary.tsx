import PageHeader from "@/components/PageHeader";
import { SideEffectsDashboard } from "@/components/SideEffectsDashboard";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SideEffectsDiary() {
  const { t } = useLanguage();
  
  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <PageHeader
        title={t('sideEffects.title')}
        description={t('sideEffects.description')}
      />
      
      <SideEffectsDashboard />
    </div>
  );
}