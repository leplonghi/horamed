import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, AlertTriangle, Info, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface HealthInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  severity: string;
  metadata?: any;
  is_read: boolean;
  created_at: string;
}

export default function HealthAnalysis() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [adherenceRate, setAdherenceRate] = useState<number | null>(null);

  const fetchInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('health_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
      toast.error('Erro ao carregar análises');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-health-analysis');

      if (error) throw error;

      if (data.insights && data.insights.length > 0) {
        setInsights(data.insights);
        setAdherenceRate(data.adherence_rate);
        toast.success(`${data.insights.length} insights gerados com sucesso!`);
      } else {
        toast.info('Não há dados suficientes para análise ainda. Continue registrando suas doses!');
      }
    } catch (error: any) {
      console.error('Erro ao executar análise:', error);
      toast.error('Erro ao gerar insights: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setAnalyzing(false);
    }
  };

  const markAsRead = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('health_insights')
        .update({ is_read: true })
        .eq('id', insightId);

      if (error) throw error;

      setInsights(prev => 
        prev.map(i => i.id === insightId ? { ...i, is_read: true } : i)
      );
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'warning':
        return <Badge className="bg-warning text-warning-foreground">Atenção</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-6 pt-24 space-y-6">{/* pt-24 para compensar o header fixo */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              Análise Preditiva
            </h1>
            <p className="text-muted-foreground mt-1">
              Insights inteligentes sobre sua adesão ao tratamento
            </p>
          </div>

          <Button 
            onClick={runAnalysis} 
            disabled={analyzing}
            size="lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Nova Análise
              </>
            )}
          </Button>
        </div>

        {adherenceRate !== null && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Taxa de Adesão</AlertTitle>
            <AlertDescription>
              Nos últimos 30 dias: <strong>{adherenceRate.toFixed(1)}%</strong>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : insights.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma análise disponível ainda.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Nova Análise" para gerar insights sobre seus dados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card 
                key={insight.id}
                className={`transition-all ${!insight.is_read ? 'border-primary/50 shadow-sm' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(insight.severity)}
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <CardDescription>{insight.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getSeverityBadge(insight.severity)}
                      {!insight.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(insight.id)}
                        >
                          Marcar como lido
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {insight.metadata && (
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {insight.metadata.day_of_week && (
                        <p>Dia: {insight.metadata.day_of_week}</p>
                      )}
                      {insight.metadata.hour && (
                        <p>Horário: {insight.metadata.hour}h</p>
                      )}
                      {insight.metadata.adherence_rate !== undefined && (
                        <p>Taxa de adesão: {(insight.metadata.adherence_rate * 100).toFixed(1)}%</p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
