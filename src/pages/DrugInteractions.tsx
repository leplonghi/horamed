import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Shield, Sparkles, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useMedicationInteractions } from '@/hooks/useMedicationInteractions';
import DrugInteractionCard from '@/components/DrugInteractionCard';
import { motion } from 'framer-motion';

export default function DrugInteractions() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { isPremium } = useSubscription();
  const { checkInteractions, loading } = useMedicationInteractions();
  const [searchMed, setSearchMed] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);

  // Interactions is a Premium feature
  const canAccess = isPremium;

  const handleSearch = async () => {
    if (!searchMed.trim()) return;
    const result = await checkInteractions(searchMed);
    setSearchResult(result);
  };

  const handleRefresh = async () => {
    await checkInteractions();
    setSearchResult(null);
    setSearchMed('');
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {language === 'en' ? 'Drug Interactions' : 'Interações Medicamentosas'}
            </h1>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {language === 'en' ? 'Drug Interaction Checker' : 'Verificador de Interações'}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                {language === 'en' 
                  ? 'Protect yourself from dangerous drug interactions. Our AI-powered system checks your medications for potential risks.'
                  : 'Proteja-se de interações medicamentosas perigosas. Nosso sistema verifica seus medicamentos em busca de riscos potenciais.'}
              </p>
            </div>

            <Card className="bg-muted/30 text-left">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <span className="text-red-600">⚠️</span>
                  </div>
                  <p className="text-sm">
                    {language === 'en' 
                      ? 'Detects contraindicated combinations'
                      : 'Detecta combinações contraindicadas'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="text-orange-600">🔔</span>
                  </div>
                  <p className="text-sm">
                    {language === 'en' 
                      ? 'Alerts for high-risk interactions'
                      : 'Alertas para interações de alto risco'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-blue-600">💡</span>
                  </div>
                  <p className="text-sm">
                    {language === 'en' 
                      ? 'Clara AI explains each interaction'
                      : 'Clara IA explica cada interação'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button size="lg" onClick={() => navigate('/planos')} className="gap-2">
              <Sparkles className="h-5 w-5" />
              {language === 'en' ? 'Upgrade to Premium' : 'Assinar Premium'}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">
            {language === 'en' ? 'Drug Interactions' : 'Interações Medicamentosas'}
          </h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Search for new medication */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {language === 'en' ? 'Check New Medication' : 'Verificar Novo Medicamento'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder={language === 'en' ? 'Enter medication name...' : 'Digite o nome do medicamento...'}
                value={searchMed}
                onChange={(e) => setSearchMed(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading || !searchMed.trim()}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {language === 'en' 
                ? 'Check if a new medication is safe to take with your current ones'
                : 'Verifique se um novo medicamento é seguro com os que você já toma'}
            </p>
          </CardContent>
        </Card>

        {/* Search result */}
        {searchResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={searchResult.has_critical 
              ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
              : searchResult.total > 0 
                ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20'
                : 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20'
            }>
              <CardContent className="py-4">
                <p className="font-medium">
                  {searchResult.total === 0 
                    ? (language === 'en' 
                        ? `✅ "${searchMed}" appears safe with your current medications`
                        : `✅ "${searchMed}" parece seguro com seus medicamentos atuais`)
                    : searchResult.has_critical
                      ? (language === 'en' 
                          ? `⚠️ "${searchMed}" has critical interactions!`
                          : `⚠️ "${searchMed}" tem interações críticas!`)
                      : (language === 'en' 
                          ? `⚡ "${searchMed}" has ${searchResult.total} interaction(s) to review`
                          : `⚡ "${searchMed}" tem ${searchResult.total} interação(ões) para revisar`)
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Current interactions */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            {language === 'en' ? 'Your Current Medications' : 'Seus Medicamentos Atuais'}
          </h2>
          <DrugInteractionCard showUpgrade={false} />
        </div>

        {/* Disclaimer */}
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">
              {language === 'en' 
                ? '⚕️ This tool provides general information about potential drug interactions. It is not a substitute for professional medical advice. Always consult your doctor or pharmacist before starting, stopping, or changing any medication.'
                : '⚕️ Esta ferramenta fornece informações gerais sobre possíveis interações medicamentosas. Não substitui orientação médica profissional. Sempre consulte seu médico ou farmacêutico antes de iniciar, parar ou alterar qualquer medicamento.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}