import { useState, useEffect, useCallback } from "react";
import { decrementStockWithProjection } from "@/lib/stockHelpers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import SimpleNavigation from "@/components/SimpleNavigation";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { Check, Clock, AlertTriangle, Plus, Flame, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface DoseItem {
  id: string;
  due_at: string;
  status: string;
  item_id: string;
  items: {
    name: string;
    dose_text: string | null;
  };
}

export default function SimpleTodayPage() {
  const navigate = useNavigate();
  const streakData = useStreakCalculator();
  const { activeProfile } = useUserProfiles();
  const { triggerSuccess } = useHapticFeedback();
  
  const [doses, setDoses] = useState<DoseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [hasAnyItems, setHasAnyItems] = useState(true);
  const [takingDose, setTakingDose] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("nickname, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setUserName(profileData.nickname || profileData.full_name?.split(' ')[0] || "");
      }

      let allItemsQuery = supabase.from("items").select("id", { count: "exact", head: true });
      if (activeProfile) allItemsQuery = allItemsQuery.eq("profile_id", activeProfile.id);
      const { count: itemCount } = await allItemsQuery;
      setHasAnyItems((itemCount || 0) > 0);

      let itemsQuery = supabase.from("items").select("id");
      if (activeProfile) itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      const { data: profileItems } = await itemsQuery;
      const itemIds = profileItems?.map(item => item.id) || [];

      const dayStart = startOfDay(new Date());
      const dayEnd = endOfDay(new Date());

      if (itemIds.length > 0) {
        const { data: dosesData } = await supabase
          .from("dose_instances")
          .select(`id, due_at, status, item_id, items (name, dose_text)`)
          .in("item_id", itemIds)
          .gte("due_at", dayStart.toISOString())
          .lte("due_at", dayEnd.toISOString())
          .order("due_at", { ascending: true });
        setDoses(dosesData || []);
      } else {
        setDoses([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (activeProfile) { setLoading(true); loadData(); } }, [activeProfile?.id]);

  const markAsTaken = async (dose: DoseItem) => {
    setTakingDose(dose.id);
    try {
      await supabase.from("dose_instances")
        .update({ status: "taken", taken_at: new Date().toISOString() })
        .eq("id", dose.id);

      await decrementStockWithProjection(dose.item_id);
      triggerSuccess();
      toast.success(`${dose.items.name} tomado!`);
      loadData();
      streakData.refresh();
    } catch (error) {
      toast.error("Erro ao confirmar");
    } finally {
      setTakingDose(null);
    }
  };

  const skipDose = async (dose: DoseItem) => {
    try {
      await supabase.from("dose_instances").update({ status: "skipped" }).eq("id", dose.id);
      toast.success("Dose pulada");
      loadData();
    } catch (error) {
      toast.error("Erro");
    }
  };

  const now = new Date();
  const pendingDoses = doses.filter(d => d.status === "scheduled");
  const overdueDoses = pendingDoses.filter(d => new Date(d.due_at) < now);
  const upcomingDoses = pendingDoses.filter(d => new Date(d.due_at) >= now);
  const takenDoses = doses.filter(d => d.status === "taken");

  const totalDoses = doses.length;
  const completedDoses = takenDoses.length;
  const progressPercent = totalDoses > 0 ? Math.round((completedDoses / totalDoses) * 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  if (loading) {
    return (<><PageSkeleton /><SimpleNavigation /></>);
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 pt-8">
        
        {/* Header simples */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-muted-foreground text-sm mb-1">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          <h1 className="text-2xl font-bold">
            {greeting}, {userName || "você"} 👋
          </h1>
          
          {/* Streak inline */}
          {streakData.currentStreak > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full">
                <Flame className="w-4 h-4" />
                <span className="font-bold">{streakData.currentStreak}</span>
                <span className="text-sm">dias seguidos</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Progress Card - Grande e visual */}
        {totalDoses > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-3xl p-6 mb-8 ${
              progressPercent === 100 
                ? 'bg-success/10 border-2 border-success/30' 
                : 'bg-primary/5 border border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-sm">Progresso de hoje</p>
                <p className="text-3xl font-bold">
                  {completedDoses}/{totalDoses}
                </p>
              </div>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                progressPercent === 100 ? 'bg-success text-white' : 'bg-primary/10'
              }`}>
                {progressPercent === 100 ? (
                  <Check className="w-8 h-8" />
                ) : (
                  <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
                )}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${progressPercent === 100 ? 'bg-success' : 'bg-primary'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            
            {progressPercent === 100 && (
              <p className="text-success font-medium mt-3 text-center">
                Parabéns! Todas as doses do dia foram tomadas! 🎉
              </p>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!hasAnyItems && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Plus className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Comece agora</h2>
            <p className="text-muted-foreground mb-8 max-w-[280px] mx-auto">
              Adicione seu primeiro medicamento e nunca mais esqueça uma dose
            </p>
            <Button onClick={() => navigate("/adicionar-medicamento")} size="lg" className="px-8">
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Medicamento
            </Button>
          </motion.div>
        )}

        {/* ATRASADOS - Destaque vermelho */}
        <AnimatePresence>
          {overdueDoses.length > 0 && (
            <motion.section 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h2 className="font-bold text-destructive">Atrasados ({overdueDoses.length})</h2>
              </div>
              <div className="space-y-3">
                {overdueDoses.map((dose) => (
                  <SimpleDoseCard 
                    key={dose.id} 
                    dose={dose} 
                    onTake={() => markAsTaken(dose)}
                    onSkip={() => skipDose(dose)}
                    isOverdue
                    isTaking={takingDose === dose.id}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* PRÓXIMOS */}
        <AnimatePresence>
          {upcomingDoses.length > 0 && (
            <motion.section 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="font-bold">Próximos ({upcomingDoses.length})</h2>
              </div>
              <div className="space-y-3">
                {upcomingDoses.map((dose) => (
                  <SimpleDoseCard 
                    key={dose.id} 
                    dose={dose} 
                    onTake={() => markAsTaken(dose)}
                    onSkip={() => skipDose(dose)}
                    isTaking={takingDose === dose.id}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* TOMADOS - Lista compacta */}
        {takenDoses.length > 0 && (
          <motion.section 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-success" />
              <h2 className="font-bold text-muted-foreground">Tomados</h2>
            </div>
            <div className="space-y-2">
              {takenDoses.map((dose) => (
                <div 
                  key={dose.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30"
                >
                  <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-success" />
                  </div>
                  <span className="flex-1 text-muted-foreground text-sm line-through">{dose.items.name}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(dose.due_at), "HH:mm")}</span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Tudo pronto */}
        {hasAnyItems && totalDoses === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-muted-foreground">Nenhuma dose para hoje</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">Seu próximo medicamento será amanhã</p>
          </motion.div>
        )}
      </div>

      <SimpleNavigation />
    </div>
  );
}

// Card de dose simples e claro
interface SimpleDoseCardProps {
  dose: DoseItem;
  onTake: () => void;
  onSkip: () => void;
  isOverdue?: boolean;
  isTaking?: boolean;
}

function SimpleDoseCard({ dose, onTake, onSkip, isOverdue, isTaking }: SimpleDoseCardProps) {
  const time = format(new Date(dose.due_at), "HH:mm");
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        rounded-2xl p-4 
        ${isOverdue 
          ? 'bg-destructive/10 border-2 border-destructive/40' 
          : 'bg-card border border-border shadow-sm'
        }
      `}
    >
      <div className="flex items-center gap-4">
        {/* Hora - Grande e clara */}
        <div className={`text-center min-w-[60px] ${isOverdue ? 'text-destructive' : 'text-primary'}`}>
          <span className="text-2xl font-bold">{time}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{dose.items.name}</h3>
          {dose.items.dose_text && (
            <span className="text-sm text-muted-foreground">{dose.items.dose_text}</span>
          )}
        </div>

        {/* Ações - Grandes e tocáveis */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSkip}
            className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors"
            aria-label="Pular"
          >
            <X className="w-5 h-5" />
          </button>
          
          <button
            onClick={onTake}
            disabled={isTaking}
            className={`
              w-14 h-14 rounded-xl flex items-center justify-center
              text-white font-medium transition-all
              ${isOverdue ? 'bg-destructive' : 'bg-success'}
              ${isTaking ? 'opacity-60' : 'active:scale-95'}
            `}
            aria-label="Marcar como tomado"
          >
            {isTaking ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-7 h-7" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
