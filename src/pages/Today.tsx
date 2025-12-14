import { useState, useEffect, useCallback } from "react";
import { decrementStockWithProjection } from "@/lib/stockHelpers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, isToday } from "date-fns";
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StreakBadge from "@/components/StreakBadge";
import CriticalAlertBanner from "@/components/CriticalAlertBanner";
import MilestoneReward from "@/components/gamification/MilestoneReward";
import AchievementShareDialog from "@/components/gamification/AchievementShareDialog";
import { useAchievements } from "@/hooks/useAchievements";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useSmartRedirect } from "@/hooks/useSmartRedirect";
import { SideEffectQuickLog } from "@/components/SideEffectQuickLog";
import { Check, Clock, AlertCircle, Pill, ChevronRight, Plus, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [hasAnyItems, setHasAnyItems] = useState(true);
  const [showMilestoneReward, setShowMilestoneReward] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  
  // Side Effects Log states
  const [sideEffectLogOpen, setSideEffectLogOpen] = useState(false);
  const [loggedDoseId, setLoggedDoseId] = useState<string>("");
  const [loggedItemId, setLoggedItemId] = useState<string>("");
  const [loggedItemName, setLoggedItemName] = useState<string>("");

  // Show milestone reward when detected
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
      7: "week_streak",
      30: "month_streak",
      90: "quarter_streak",
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

      // Load user name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("nickname, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setUserName(profileData.nickname || profileData.full_name || "");
      }

      // Check if user has any items
      let allItemsQuery = supabase
        .from("items")
        .select("id", { count: "exact", head: true });

      if (activeProfile) {
        allItemsQuery = allItemsQuery.eq("profile_id", activeProfile.id);
      }

      const { count: itemCount } = await allItemsQuery;
      setHasAnyItems((itemCount || 0) > 0);

      // Get items for the active profile
      let itemsQuery = supabase.from("items").select("id");
      if (activeProfile) {
        itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      }

      const { data: profileItems } = await itemsQuery;
      const itemIds = profileItems?.map(item => item.id) || [];

      // Load today's doses
      const dayStart = startOfDay(new Date());
      const dayEnd = endOfDay(new Date());

      if (itemIds.length > 0) {
        const { data: dosesData } = await supabase
          .from("dose_instances")
          .select(`
            id,
            due_at,
            status,
            item_id,
            items (name, dose_text, with_food)
          `)
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
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Bom dia");
    } else if (hour < 18) {
      setGreeting("Boa tarde");
    } else {
      setGreeting("Boa noite");
    }
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeProfile) {
      setLoading(true);
      loadData();
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    scheduleNotificationsForNextDay();
    const channel = supabase
      .channel('today-doses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dose_instances' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAsTaken = async (dose: DoseItem) => {
    try {
      const { data: stockData } = await supabase
        .from("stock")
        .select("units_left")
        .eq("item_id", dose.item_id)
        .maybeSingle();

      if (stockData && stockData.units_left === 0) {
        toast.error("Estoque zerado! Reabasteça antes de registrar dose.");
        return;
      }

      await supabase
        .from("dose_instances")
        .update({
          status: "taken",
          taken_at: new Date().toISOString(),
        })
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
      console.error("Error marking dose:", error);
      toast.error("Erro ao confirmar dose");
    }
  };

  const skipDose = async (dose: DoseItem) => {
    try {
      await supabase
        .from("dose_instances")
        .update({ status: "skipped" })
        .eq("id", dose.id);
      toast.success("Dose pulada");
      loadData();
    } catch (error) {
      toast.error("Erro ao pular dose");
    }
  };

  // Separate doses by status
  const now = new Date();
  const pendingDoses = doses.filter(d => d.status === "scheduled");
  const overdueDoses = pendingDoses.filter(d => new Date(d.due_at) < now);
  const upcomingDoses = pendingDoses.filter(d => new Date(d.due_at) >= now);
  const takenDoses = doses.filter(d => d.status === "taken");
  const skippedDoses = doses.filter(d => d.status === "skipped" || d.status === "missed");

  const totalDoses = doses.length;
  const completedDoses = takenDoses.length;
  const progressPercent = totalDoses > 0 ? Math.round((completedDoses / totalDoses) * 100) : 0;

  if (loading) {
    return (
      <>
        <Header />
        <PageSkeleton />
        <Navigation />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-24">
        <div className="max-w-lg mx-auto px-4 space-y-6">
          
          {/* Header Section - Simple & Clear */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {greeting}{userName && `, ${userName}`}!
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              {streakData.currentStreak > 0 && (
                <StreakBadge streak={streakData.currentStreak} type="current" />
              )}
            </div>

            {/* Progress Bar - Very Visual */}
            {totalDoses > 0 && (
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progresso de Hoje</span>
                    <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {completedDoses} de {totalDoses} doses tomadas
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Critical Alerts */}
          {criticalAlerts.alerts.length > 0 && (
            <CriticalAlertBanner 
              alerts={criticalAlerts.alerts}
              onDismiss={criticalAlerts.dismissAlert}
              onDismissAll={criticalAlerts.dismissAll}
            />
          )}

          {/* Empty State */}
          {!hasAnyItems && (
            <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
              <CardContent className="py-10 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Pill className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Adicione seu primeiro medicamento</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Configure seus horários e nós avisamos quando for hora de tomar.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/adicionar-medicamento")} 
                  size="lg"
                  className="gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Medicamento
                </Button>
              </CardContent>
            </Card>
          )}

          {/* OVERDUE DOSES - Most Urgent Section */}
          {overdueDoses.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <h2 className="font-bold text-destructive">
                  Atrasadas ({overdueDoses.length})
                </h2>
              </div>
              <AnimatePresence>
                {overdueDoses.map((dose) => (
                  <DoseCardSimple 
                    key={dose.id} 
                    dose={dose} 
                    onTake={() => markAsTaken(dose)}
                    onSkip={() => skipDose(dose)}
                    isOverdue
                  />
                ))}
              </AnimatePresence>
            </section>
          )}

          {/* UPCOMING DOSES - Main Action Area */}
          {upcomingDoses.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="font-bold">Próximas Doses</h2>
              </div>
              <AnimatePresence>
                {upcomingDoses.map((dose) => (
                  <DoseCardSimple 
                    key={dose.id} 
                    dose={dose} 
                    onTake={() => markAsTaken(dose)}
                    onSkip={() => skipDose(dose)}
                  />
                ))}
              </AnimatePresence>
            </section>
          )}

          {/* COMPLETED TODAY */}
          {takenDoses.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <h2 className="font-bold text-green-700 dark:text-green-400">
                  Tomadas Hoje ({takenDoses.length})
                </h2>
              </div>
              <div className="space-y-2 opacity-70">
                {takenDoses.map((dose) => (
                  <Card key={dose.id} className="bg-green-50/50 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/30">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm line-through text-muted-foreground">{dose.items.name}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(dose.due_at), "HH:mm")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* No doses today */}
          {hasAnyItems && doses.length === 0 && (
            <Card className="bg-muted/30">
              <CardContent className="py-8 text-center">
                <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Nenhuma dose programada para hoje</p>
              </CardContent>
            </Card>
          )}

          {/* All done for today */}
          {hasAnyItems && doses.length > 0 && pendingDoses.length === 0 && (
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
              <CardContent className="py-6 text-center">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="font-bold text-lg text-green-700 dark:text-green-400">
                  Parabéns! Tudo em dia!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Você completou todas as doses de hoje.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <section className="pt-4 space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-between h-14"
              onClick={() => navigate("/rotina")}
            >
              <span className="flex items-center gap-3">
                <Pill className="w-5 h-5" />
                Ver Todos os Medicamentos
              </span>
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between h-14"
              onClick={() => navigate("/carteira")}
            >
              <span className="flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                Carteira de Saúde
              </span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </section>

        </div>
      </div>

      <Navigation />

      {/* Milestone Reward Modal */}
      {milestone && (
        <MilestoneReward
          milestone={milestone}
          visible={showMilestoneReward}
          onClose={handleMilestoneClose}
          onShare={handleMilestoneShare}
        />
      )}

      {/* Side Effect Log Modal */}
      <SideEffectQuickLog
        open={sideEffectLogOpen}
        onOpenChange={setSideEffectLogOpen}
        doseId={loggedDoseId}
        itemId={loggedItemId}
        itemName={loggedItemName}
        profileId={activeProfile?.id}
      />

      {/* Achievement Share Dialog */}
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

// Simple, intuitive dose card
interface DoseCardSimpleProps {
  dose: DoseItem;
  onTake: () => void;
  onSkip: () => void;
  isOverdue?: boolean;
}

function DoseCardSimple({ dose, onTake, onSkip, isOverdue }: DoseCardSimpleProps) {
  const time = format(new Date(dose.due_at), "HH:mm");
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className={`border-l-4 ${isOverdue ? 'border-l-destructive bg-destructive/5' : 'border-l-primary bg-card'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon & Time */}
            <div className="text-center shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOverdue ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                <Pill className={`w-6 h-6 ${isOverdue ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <p className={`text-sm font-bold mt-1 ${isOverdue ? 'text-destructive' : 'text-primary'}`}>{time}</p>
            </div>

            {/* Medication Info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg truncate">{dose.items.name}</p>
              {dose.items.dose_text && (
                <p className="text-sm text-muted-foreground">{dose.items.dose_text}</p>
              )}
              {dose.items.with_food && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">🍽️ Tomar com alimento</p>
              )}
            </div>

            {/* Action Button - BIG & CLEAR */}
            <Button
              onClick={onTake}
              size="lg"
              className={`shrink-0 h-14 w-14 rounded-full ${isOverdue ? 'bg-destructive hover:bg-destructive/90' : 'bg-green-600 hover:bg-green-700'}`}
            >
              <Check className="w-7 h-7" />
            </Button>
          </div>

          {/* Skip option - subtle */}
          <div className="mt-3 pt-3 border-t flex justify-end">
            <Button variant="ghost" size="sm" className="text-muted-foreground text-xs" onClick={onSkip}>
              Pular esta dose
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
