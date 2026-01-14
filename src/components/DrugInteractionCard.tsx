import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  XCircle, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Shield,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMedicationInteractions, MedicationInteraction } from '@/hooks/useMedicationInteractions';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

interface DrugInteractionCardProps {
  profileId?: string;
  compact?: boolean;
  showUpgrade?: boolean;
}

const severityConfig = {
  contraindicated: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-600 text-white',
    labelPt: 'Contraindicado',
    labelEn: 'Contraindicated',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-600 text-white',
    labelPt: 'Alto Risco',
    labelEn: 'High Risk',
  },
  moderate: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-600 text-white',
    labelPt: 'Moderado',
    labelEn: 'Moderate',
  },
  low: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-600 text-white',
    labelPt: 'Baixo Risco',
    labelEn: 'Low Risk',
  },
};

function InteractionItem({ interaction, language }: { interaction: MedicationInteraction; language: string }) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[interaction.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border ${config.bg} ${config.border}`}
    >
      <div 
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">
              {interaction.item_a_name}
            </span>
            <span className="text-muted-foreground">+</span>
            <span className="font-semibold text-foreground">
              {interaction.item_b_name}
            </span>
            <Badge className={`${config.badge} text-xs`}>
              {language === 'en' ? config.labelEn : config.labelPt}
            </Badge>
          </div>
          <p className={`text-sm mt-1 ${config.color}`}>
            {interaction.description}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-current/10 space-y-2">
              {interaction.recommendation && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    {language === 'en' ? 'Recommendation' : 'Recomendação'}
                  </p>
                  <p className="text-sm text-foreground">{interaction.recommendation}</p>
                </div>
              )}
              {interaction.mechanism && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    {language === 'en' ? 'Mechanism' : 'Mecanismo'}
                  </p>
                  <p className="text-sm text-muted-foreground">{interaction.mechanism}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DrugInteractionCard({ profileId, compact = false, showUpgrade = true }: DrugInteractionCardProps) {
  const { language } = useLanguage();
  const { isPremium, hasFeature } = useSubscription();
  const navigate = useNavigate();
  const { interactions, loading, hasCritical, hasWarnings } = useMedicationInteractions(profileId);

  // Feature check - interactions is a Premium feature
  const canSeeInteractions = isPremium;

  if (!canSeeInteractions && showUpgrade) {
    return (
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {language === 'en' ? 'Drug Interaction Checker' : 'Verificador de Interações'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {language === 'en' 
                  ? 'Upgrade to Premium to check for dangerous drug interactions'
                  : 'Atualize para Premium para verificar interações medicamentosas'}
              </p>
            </div>
            <Button onClick={() => navigate('/planos')} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {language === 'en' ? 'Unlock Feature' : 'Desbloquear'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            {language === 'en' ? 'Checking interactions...' : 'Verificando interações...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasWarnings) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">
                {language === 'en' ? 'No interactions detected' : 'Nenhuma interação detectada'}
              </p>
              <p className="text-sm text-green-600/80 dark:text-green-400/80">
                {language === 'en' 
                  ? 'Your medications appear to be safe to take together'
                  : 'Seus medicamentos parecem seguros para uso conjunto'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact mode for widget
  if (compact) {
    const criticalCount = interactions.filter(i => i.severity === 'contraindicated' || i.severity === 'high').length;
    const config = hasCritical ? severityConfig.high : severityConfig.moderate;
    const Icon = config.icon;

    return (
      <Alert className={`${config.bg} ${config.border} cursor-pointer`} onClick={() => navigate('/saude/interacoes')}>
        <Icon className={`h-4 w-4 ${config.color}`} />
        <AlertTitle className={config.color}>
          {language === 'en' 
            ? `${interactions.length} interaction${interactions.length > 1 ? 's' : ''} found`
            : `${interactions.length} interaç${interactions.length > 1 ? 'ões' : 'ão'} encontrada${interactions.length > 1 ? 's' : ''}`}
        </AlertTitle>
        <AlertDescription className="text-sm">
          {hasCritical && (
            <span className="text-red-600 dark:text-red-400 font-medium">
              {criticalCount} {language === 'en' ? 'critical' : 'crítica(s)'}
            </span>
          )}
          <span className="flex items-center gap-1 mt-1 text-muted-foreground">
            {language === 'en' ? 'Tap to view details' : 'Toque para ver detalhes'}
            <ExternalLink className="h-3 w-3" />
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            {language === 'en' ? 'Drug Interactions' : 'Interações Medicamentosas'}
          </CardTitle>
          <Badge variant={hasCritical ? 'destructive' : 'secondary'}>
            {interactions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {interactions.map(interaction => (
          <InteractionItem 
            key={interaction.id} 
            interaction={interaction} 
            language={language} 
          />
        ))}
        
        <p className="text-xs text-muted-foreground pt-2 border-t">
          {language === 'en' 
            ? '⚠️ This information is for educational purposes only. Always consult your doctor or pharmacist.'
            : '⚠️ Esta informação é apenas educativa. Sempre consulte seu médico ou farmacêutico.'}
        </p>
      </CardContent>
    </Card>
  );
}