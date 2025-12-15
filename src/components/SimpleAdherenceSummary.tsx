import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
interface SimpleAdherenceSummaryProps {
  taken: number;
  total: number;
  period?: string;
}
export default function SimpleAdherenceSummary({
  taken,
  total,
  period = "Este mês"
}: SimpleAdherenceSummaryProps) {
  const percentage = total > 0 ? Math.round(taken / total * 100) : 0;
  
  const getColor = () => {
    if (total === 0) return "text-muted-foreground";
    if (percentage >= 90) return "text-green-600 dark:text-green-400";
    if (percentage >= 70) return "text-primary";
    return "text-muted-foreground";
  };
  
  const getMessage = () => {
    if (total === 0) return "Nenhuma dose programada";
    if (percentage >= 90) return "Excelente! Continue assim";
    if (percentage >= 70) return "Bom progresso!";
    if (percentage > 0) return "Cada dose conta";
    return "O dia está começando";
  };
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }}>
      <Card className="h-full bg-gradient-to-br from-primary/5 to-background border-2 border-primary/20">
        <CardContent className="h-full p-6 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex-1">
              <p className="text-muted-foreground mb-1 text-base font-medium">{period}</p>
              <p className="text-xl font-bold text-foreground">
                Você tomou {taken} de {total} doses
              </p>
              <p className={`text-sm font-medium mt-1 ${getColor()}`}>
                {getMessage()}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <div className={`text-4xl font-bold ${getColor()}`}>
                {percentage}%
              </div>
              <TrendingUp className={`h-5 w-5 ${getColor()}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>;
}