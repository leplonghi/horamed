import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Download, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function MonthlyReportWidget() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [lastReportDate, setLastReportDate] = useState<Date | null>(null);

  const locale = language === 'pt' ? ptBR : enUS;
  const lastMonth = subMonths(new Date(), 1);
  const monthName = format(lastMonth, 'MMMM', { locale });

  useEffect(() => {
    checkReportData();
  }, []);

  const checkReportData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user has any dose data from last month
    const monthStart = startOfMonth(lastMonth);
    const monthEnd = endOfMonth(lastMonth);

    const { count } = await supabase
      .from('dose_instances')
      .select('id', { count: 'exact', head: true })
      .gte('due_at', monthStart.toISOString())
      .lte('due_at', monthEnd.toISOString());

    setHasEnoughData((count || 0) >= 7); // At least a week of data
  };

  if (!hasEnoughData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border-purple-500/20 mb-4">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                {language === 'pt' 
                  ? `📊 Relatório de ${monthName}` 
                  : `📊 ${monthName} Report`}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'pt'
                  ? 'Pronto para consulta médica'
                  : 'Ready for your doctor'}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/relatorios')}
              className="shrink-0 text-xs h-8 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-500/10"
            >
              {language === 'pt' ? 'Ver' : 'View'}
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
