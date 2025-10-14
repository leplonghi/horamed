import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  TrendingUp, 
  Shield, 
  X, 
  RefreshCw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

interface Insight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  severity: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

export default function HealthInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { isPremium } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (isPremium) {
      loadInsights();
    }
  }, [isPremium]);

  const loadInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('health_insights')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const runAnalysis = async () => {
    if (!isPremium) {
      navigate('/planos');
      return;
    }

    setAnalyzing(true);
    toast.loading('Analisando seus medicamentos...');

    try {
      // Análise de interações medicamentosas
      const { data: interactionData } = await supabase.functions.invoke(
        'analyze-drug-interactions'
      );

      // Análise preditiva de saúde
      const { data: predictiveData } = await supabase.functions.invoke(
        'predictive-health-analysis'
      );

      toast.dismiss();
      
      if (interactionData?.insights?.length > 0 || predictiveData?.insights?.length > 0) {
        toast.success('Análise concluída! Novos insights detectados', {
          description: `${interactionData?.total || 0} interações + ${predictiveData?.total || 0} padrões`
        });
        await loadInsights();
      } else {
        toast.success('Tudo certo! Nenhum problema detectado');
      }
    } catch (error: any) {
      toast.dismiss();
      console.error('Error running analysis:', error);
      toast.error('Erro ao executar análise');
    } finally {
      setAnalyzing(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('health_insights')
        .update({ is_read: true })
        .eq('id', id);
      
      setInsights(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <TrendingUp className="h-5 w-5 text-primary" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'warning':
        return <Badge className="bg-orange-500">Atenção</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  if (!isPremium) {
    return (
      <Card className="p-4 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              🛡️ Proteção Inteligente
              <Badge className="bg-primary">Premium</Badge>
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Detecte interações perigosas entre medicamentos e receba alertas antes que seja tarde
            </p>
            <Button onClick={() => navigate('/planos')} size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Ativar Proteção Inteligente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Proteção Inteligente
        </h2>
        <Button 
          onClick={runAnalysis} 
          disabled={analyzing}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analisando...' : 'Analisar'}
        </Button>
      </div>

      {insights.length === 0 ? (
        <Card className="p-4 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">
            Nenhum alerta no momento
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Execute uma análise para verificar interações
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {insights.map(insight => (
            <Card key={insight.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getSeverityIcon(insight.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getSeverityBadge(insight.severity)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {insight.description}
                  </p>
                  {insight.metadata?.recommendation && (
                    <p className="text-xs bg-primary/5 border border-primary/10 rounded p-2 text-foreground">
                      💡 <strong>Recomendação:</strong> {insight.metadata.recommendation}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => markAsRead(insight.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}