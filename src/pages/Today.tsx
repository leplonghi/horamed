import { useState, useEffect, useCallback } from "react";
import { decrementStockWithProjection } from "@/lib/stockHelpers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useMedicationAlarm } from "@/hooks/useMedicationAlarm";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { useMilestoneDetector } from "@/hooks/useMilestoneDetector";
import { useCriticalAlerts } from "@/hooks/useCriticalAlerts";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { useFeedbackToast } from "@/hooks/useFeedbackToast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import CriticalAlertBanner from "@/components/CriticalAlertBanner";
import MilestoneReward from "@/components/gamification/MilestoneReward";
import AchievementShareDialog from "@/components/gamification/AchievementShareDialog";
import { useAchievements } from "@/hooks/useAchievements";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useSmartRedirect } from "@/hooks/useSmartRedirect";
import { SideEffectQuickLog } from "@/components/SideEffectQuickLog";
import { Check, Clock, AlertTriangle, Pill, Plus, Flame, X, Utensils } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TutorialHint from "@/components/TutorialHint";
import HelpTooltip from "@/components/HelpTooltip";
import { microcopy } from "@/lib/microcopy";
import ClaraSuggestions from "@/components/ClaraSuggestions";

interface DoseItem {
  id: string;
  due_at: string;
  status: string;
  item_id: string;
  items: {
    name: string;
    dose_text: string | null;
    with_food: boolean | null;
  };
}

export default function Today() {
  const navigate = useNavigate();
  const { scheduleNotificationsForNextDay } = useMedicationAlarm();
  usePushNotifications();
  const streakData = useStreakCalculator();
  const { milestone, isNewMilestone, markAsSeen } = useMilestoneDetector();
  const { achievements } = useAchievements();
  const criticalAlerts = useCriticalAlerts();
  const { showFeedback } = useFeedbackToast();
  const { activeProfile } = useUserProfiles();
  useSmartRedirect();
  
  const [doses, setDoses] = useState<DoseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [hasAnyItems, setHasAnyItems] = useState(true);
  const [showMilestoneReward, setShowMilestoneReward] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [takingDose, setTakingDose] = useState<string | null>(null);
  
  // Side Effects Log states
  const [sideEffectLogOpen, setSideEffectLogOpen] = useState(false);
  const [loggedDoseId, setLoggedDoseId] = useState<string>("");
  const [loggedItemId, setLoggedItemId] = useState<string>("");
  const [loggedItemName, setLoggedItemName] = useState<string>("");
  
  // Low stock items for Clara suggestions
  const [lowStockItems, setLowStockItems] = useState<string[]>([]);

  useEffect(() => {
    if (isNewMilestone && milestone) {
      setShowMilestoneReward(true);
    }
  }, [isNewMilestone, milestone]);

  const handleMilestoneClose = () => {
    setShowMilestoneReward(false);
    markAsSeen();
  };

  const handleMilestoneShare = () => {
    setShowMilestoneReward(false);
    markAsSeen();
    const milestoneAchievements: Record<number, string> = {
      7: "week_streak", 30: "month_streak", 90: "quarter_streak",
    };
    const achievementId = milestone ? milestoneAchievements[milestone] : null;
    const achievement = achievements.find((a) => a.id === achievementId);
    if (achievement) {
      setSelectedAchievement(achievement);
      setShareDialogOpen(true);
    }
  };

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
          .select(`id, due_at, status, item_id, items (name, dose_text, with_food)`)
          .in("item_id", itemIds)
          .gte("due_at", dayStart.toISOString())
          .lte("due_at", dayEnd.toISOString())
          .order("due_at", { ascending: true });
        setDoses(dosesData || []);
        
        // Fetch low stock items for Clara suggestions
        const { data: stockData } = await supabase
          .from("stock")
          .select("units_left, items(name)")
          .in("item_id", itemIds)
          .lte("units_left", 7);
        
        const lowItems = (stockData || [])
          .filter((s: any) => s.items?.name)
          .map((s: any) => s.items.name);
        setLowStockItems(lowItems);
      } else {
        setDoses([]);
        setLowStockItems([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (activeProfile) { setLoading(true); loadData(); } }, [activeProfile?.id]);
  useEffect(() => {
    scheduleNotificationsForNextDay();
    const channel = supabase.channel('today-doses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dose_instances' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAsTaken = async (dose: DoseItem) => {
    setTakingDose(dose.id);
    try {
      const { data: stockData } = await supabase
        .from("stock").select("units_left").eq("item_id", dose.item_id).maybeSingle();

      if (stockData && stockData.units_left === 0) {
        toast.error("Estoque zerado!");
        setTakingDose(null);
        return;
      }

      await supabase.from("dose_instances")
        .update({ status: "taken", taken_at: new Date().toISOString() })
        .eq("id", dose.id);

      await decrementStockWithProjection(dose.item_id);
      showFeedback("dose-taken", { medicationName: dose.items.name });
      loadData();
      streakData.refresh();
      criticalAlerts.refresh();
      
      setLoggedDoseId(dose.id);
      setLoggedItemId(dose.item_id);
      setLoggedItemName(dose.items.name);
      setSideEffectLogOpen(true);
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
    return (<><Header /><PageSkeleton /><Navigation /></>);
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pt-20 pb-28">
        <div className="max-w-md mx-auto px-4">
          
          {/* Hero Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="py-6 text-center"
          >
            <p className="text-muted-foreground text-sm mb-1">
              {format(new Date(), "EEEE, d MMM", { locale: ptBR })}
            </p>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {greeting}, {userName || "você"}!
              </h1>
              <HelpTooltip 
                content="Esta é sua tela principal. Aqui você vê todas as doses do dia e confirma quando tomar cada medicamento." 
                iconSize="lg"
              />
            </div>
            
            {/* Streak Badge */}
            {streakData.currentStreak > 0 && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-full border border-orange-500/20"
              >
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-orange-600 dark:text-orange-400">{streakData.currentStreak} dias</span>
                <span className="text-sm text-muted-foreground">seguidos</span>
                <HelpTooltip content={microcopy.help.today.streak} side="bottom" iconSize="sm" />
              </motion.div>
            )}
          </motion.div>

          {/* Progress Ring */}
          {totalDoses > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center mb-8"
            >
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64" cy="64" r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted/30"
                  />
                  <motion.circle
                    cx="64" cy="64" r="56"
                    stroke="url(#progressGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 352" }}
                    animate={{ strokeDasharray: `${(progressPercent / 100) * 352} 352` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(142.1 76.2% 36.3%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{progressPercent}%</span>
                  <span className="text-xs text-muted-foreground">{completedDoses}/{totalDoses}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <p className="text-sm text-muted-foreground">
                  {pendingDoses.length === 0 ? "🎉 Tudo em dia!" : `${pendingDoses.length} dose${pendingDoses.length > 1 ? 's' : ''} restante${pendingDoses.length > 1 ? 's' : ''}`}
                </p>
                <HelpTooltip content={microcopy.help.today.progress} iconSize="sm" />
              </div>
            </motion.div>
          )}

          {/* Critical Alerts */}
          {criticalAlerts.alerts.length > 0 && (
            <div className="mb-6">
              <CriticalAlertBanner 
                alerts={criticalAlerts.alerts}
                onDismiss={criticalAlerts.dismissAlert}
                onDismissAll={criticalAlerts.dismissAll}
              />
            </div>
          )}

          {/* Clara Suggestions - Proactive AI suggestions */}
          {hasAnyItems && (
            <div className="mb-6">
              <ClaraSuggestions
                overdueDoses={overdueDoses.length}
                lowStockItems={lowStockItems}
                currentStreak={streakData.currentStreak}
                onTakeOverdue={() => {
                  const overdueSection = document.getElementById('overdue-section');
                  overdueSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                onCheckStock={() => navigate('/estoque')}
                onOpenClara={() => window.dispatchEvent(new CustomEvent('openClara'))}
              />
            </div>
          )}

          {/* Tutorial for new users */}
          <TutorialHint
            id={microcopy.tutorials.today.id}
            title={microcopy.tutorials.today.title}
            message={microcopy.tutorials.today.message}
          />

          {/* Empty State */}
          {!hasAnyItems && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Pill className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Adicione seu primeiro medicamento</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                Nós avisamos na hora certa de tomar
              </p>
              <Button onClick={() => navigate("/adicionar-medicamento")} size="lg" className="gap-2 rounded-full px-8">
                <Plus className="w-5 h-5" />
                Adicionar
              </Button>
            </motion.div>
          )}

          {/* OVERDUE - Urgent */}
          <AnimatePresence>
            {overdueDoses.length > 0 && (
              <motion.section 
                id="overdue-section"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-semibold text-destructive">Atrasadas</span>
                  <HelpTooltip content={microcopy.help.today.overdue} iconSize="sm" />
                </div>
                <div className="space-y-3">
                  {overdueDoses.map((dose, i) => (
                    <DoseCard 
                      key={dose.id} 
                      dose={dose} 
                      onTake={() => markAsTaken(dose)}
                      onSkip={() => skipDose(dose)}
                      isOverdue
                      isTaking={takingDose === dose.id}
                      delay={i * 0.05}
                    />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* UPCOMING */}
          <AnimatePresence>
            {upcomingDoses.length > 0 && (
              <motion.section 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Próximas</span>
                  <HelpTooltip content={microcopy.help.today.upcoming} iconSize="sm" />
                </div>
                <div className="space-y-3">
                  {upcomingDoses.map((dose, i) => (
                    <DoseCard 
                      key={dose.id} 
                      dose={dose} 
                      onTake={() => markAsTaken(dose)}
                      onSkip={() => skipDose(dose)}
                      isTaking={takingDose === dose.id}
                      delay={i * 0.05}
                    />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* COMPLETED */}
          {takenDoses.length > 0 && (
            <motion.section 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">Tomadas</span>
              </div>
              <div className="space-y-2">
                {takenDoses.map((dose) => (
                  <motion.div 
                    key={dose.id}
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 0.6 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-500/5 border border-green-500/10"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium line-through text-muted-foreground">{dose.items.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(dose.due_at), "HH:mm")}</span>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* All done celebration */}
          {hasAnyItems && doses.length > 0 && pendingDoses.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-green-600">Parabéns!</h3>
              <p className="text-muted-foreground text-sm">Todas as doses de hoje foram tomadas</p>
            </motion.div>
          )}

        </div>
      </div>

      <Navigation />

      {milestone && (
        <MilestoneReward
          milestone={milestone}
          visible={showMilestoneReward}
          onClose={handleMilestoneClose}
          onShare={handleMilestoneShare}
        />
      )}

      <SideEffectQuickLog
        open={sideEffectLogOpen}
        onOpenChange={setSideEffectLogOpen}
        doseId={loggedDoseId}
        itemId={loggedItemId}
        itemName={loggedItemName}
        profileId={activeProfile?.id}
      />

      {selectedAchievement && (
        <AchievementShareDialog
          achievement={selectedAchievement}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}
    </>
  );
}

// Modern Dose Card
interface DoseCardProps {
  dose: DoseItem;
  onTake: () => void;
  onSkip: () => void;
  isOverdue?: boolean;
  isTaking?: boolean;
  delay?: number;
}

function DoseCard({ dose, onTake, onSkip, isOverdue, isTaking, delay = 0 }: DoseCardProps) {
  const time = format(new Date(dose.due_at), "HH:mm");
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ delay }}
      layout
    >
      <div className={`
        relative overflow-hidden rounded-3xl p-4
        ${isOverdue 
          ? 'bg-gradient-to-r from-destructive/10 to-destructive/5 border-2 border-destructive/30' 
          : 'bg-gradient-to-r from-card to-muted/30 border border-border/50'
        }
        shadow-lg shadow-black/5
      `}>
        {/* Glow effect for overdue */}
        {isOverdue && (
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent animate-pulse" />
        )}
        
        <div className="relative flex items-center gap-4">
          {/* Time Badge */}
          <div className={`
            shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center
            ${isOverdue 
              ? 'bg-destructive/20 text-destructive' 
              : 'bg-primary/10 text-primary'
            }
          `}>
            <Clock className="w-4 h-4 mb-0.5" />
            <span className="text-lg font-bold">{time}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{dose.items.name}</h3>
            {dose.items.dose_text && (
              <p className="text-sm text-muted-foreground truncate">{dose.items.dose_text}</p>
            )}
            {dose.items.with_food && (
              <div className="flex items-center gap-1 mt-1">
                <Utensils className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-amber-600 dark:text-amber-400">Com alimento</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onTake}
            disabled={isTaking}
            className={`
              shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center
              font-bold text-white shadow-lg transition-all
              ${isOverdue 
                ? 'bg-gradient-to-br from-destructive to-destructive/80 shadow-destructive/30' 
                : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30'
              }
              ${isTaking ? 'opacity-50' : 'hover:shadow-xl'}
            `}
          >
            {isTaking ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-8 h-8" />
            )}
          </motion.button>
        </div>

        {/* Skip Button */}
        <div className="flex justify-end mt-2 -mb-1">
          <button 
            onClick={onSkip}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2"
          >
            <X className="w-3 h-3" />
            Pular
          </button>
        </div>
      </div>
    </motion.div>
  );
}
