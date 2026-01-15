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

const getSeverityConfig = (t: (key: string) => string) => ({
  contraindicated: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-600 text-white',
    label: t('interactions.contraindicated'),
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-600 text-white',
    label: t('interactions.highRisk'),
  },
  moderate: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-600 text-white',
    label: t('interactions.moderate'),
  },
  low: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-600 text-white',
    label: t('interactions.lowRisk'),
  },
});

function InteractionItem({ interaction, t }: { interaction: MedicationInteraction; t: (key: string) => string }) {
  const [expanded, setExpanded] = useState(false);
  const severityConfig = getSeverityConfig(t);
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
              {config.label}
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
                    {t('interactions.recommendation')}
                  </p>
                  <p className="text-sm text-foreground">{interaction.recommendation}</p>
                </div>
              )}
              {interaction.mechanism && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    {t('interactions.mechanism')}
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
  const { t } = useLanguage();
  const { isPremium } = useSubscription();
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
                {t('interactions.checker')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('interactions.upgradeDesc')}
              </p>
            </div>
            <Button onClick={() => navigate('/planos')} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {t('interactions.unlockFeature')}
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
            {t('interactions.checking')}
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
                {t('interactions.noDetected')}
              </p>
              <p className="text-sm text-green-600/80 dark:text-green-400/80">
                {t('interactions.safeToTake')}
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
    const severityConfig = getSeverityConfig(t);
    const config = hasCritical ? severityConfig.high : severityConfig.moderate;
    const Icon = config.icon;

    return (
      <Alert className={`${config.bg} ${config.border} cursor-pointer`} onClick={() => navigate('/saude/interacoes')}>
        <Icon className={`h-4 w-4 ${config.color}`} />
        <AlertTitle className={config.color}>
          {interactions.length} {interactions.length > 1 ? t('interactions.foundPlural') : t('interactions.found')}
        </AlertTitle>
        <AlertDescription className="text-sm">
          {hasCritical && (
            <span className="text-red-600 dark:text-red-400 font-medium">
              {criticalCount} {t('interactions.critical')}
            </span>
          )}
          <span className="flex items-center gap-1 mt-1 text-muted-foreground">
            {t('interactions.tapDetails')}
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
            {t('interactions.title')}
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
            t={t} 
          />
        ))}
        
        <p className="text-xs text-muted-foreground pt-2 border-t">
          {t('interactions.disclaimer')}
        </p>
      </CardContent>
    </Card>
  );
}