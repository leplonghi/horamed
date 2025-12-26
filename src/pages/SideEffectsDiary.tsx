import PageHeader from "@/components/PageHeader";
import { SideEffectsDashboard } from "@/components/SideEffectsDashboard";
import { useLanguage } from "@/contexts/LanguageContext";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";

export default function SideEffectsDiary() {
  const { t } = useLanguage();
  
  return (
    <>
      <Header />
      <div className="container max-w-6xl pt-20 py-6 space-y-6">
        <PageHeader
          title={t('sideEffects.title')}
          description={t('sideEffects.description')}
        />
        
        <SideEffectsDashboard />
      </div>
      <Navigation />
    </>
  );
}