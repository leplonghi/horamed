import { useState, useEffect, useCallback } from "react";
import { decrementStockWithProjection } from "@/lib/stockHelpers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
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
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import TutorialHint from "@/components/TutorialHint";
import HelpTooltip from "@/components/HelpTooltip";
import { microcopy } from "@/lib/microcopy";
import ClaraSuggestions from "@/components/ClaraSuggestions";
import TodayWeightWidget from "@/components/TodayWeightWidget";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t, language } = useLanguage();
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
        toast.error(t('today.stockEmpty'));
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
      toast.error(t('today.confirmError'));
    } finally {
      setTakingDose(null);
    }
  };

  const skipDose = async (dose: DoseItem) => {
    try {
      await supabase.from("dose_instances").update({ status: "skipped" }).eq("id", dose.id);
      toast.success(t('today.doseSkipped'));
      loadData();
    } catch (error) {
      toast.error(t('common.error'));
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
  const greeting = hour < 12 ? t('today.goodMorning') : hour < 18 ? t('today.goodAfternoon') : t('today.goodEvening');
  const dateLocale = language === 'pt' ? ptBR : enUS;

  if (loading) {
    return (<><Header /><PageSkeleton /><Navigation /></>);
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-subtle pb-28">
        <div className="container-fluid pt-20">
          
          {/* Hero Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="py-8"
          >
            <p className="text-muted-foreground text-sm mb-2 text-center">
              {format(new Date(), "EEEE, d MMM", { locale: dateLocale })}
            </p>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {greeting}, {userName || (language === 'pt' ? "você" : "you")}
              </h1>
              <HelpTooltip 
                content={t('today.helpTooltip')} 
                iconSize="lg"
              />
            </div>
            
            {/* Streak Badge */}
            {streakData.currentStreak > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center mt-4"
              >
                <div className="pill-warning">
                  <Flame className="w-4 h-4" />
                  <span className="font-semibold">{streakData.currentStreak} {language === 'pt' ? 'dias' : 'days'}</span>
                  <span className="text-muted-foreground">{t('today.daysInRow')}</span>
                  <HelpTooltip content={microcopy.help.today.streak} side="bottom" iconSize="sm" />
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Progress Ring - Clean */}
          {totalDoses > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center mb-10"
            >
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56" cy="56" r="50"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/20"
                  />
                  <motion.circle
                    cx="56" cy="56" r="50"
                    stroke={progressPercent === 100 ? "hsl(var(--success))" : "hsl(var(--primary))"}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 314" }}
                    animate={{ strokeDasharray: `${(progressPercent / 100) * 314} 314` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {progressPercent === 100 ? (
                    <Check className="w-10 h-10 text-success" />
                  ) : (
                    <span className="stat-number text-foreground">{progressPercent}%</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <p className={`text-sm ${progressPercent === 100 ? 'text-success font-medium' : 'text-muted-foreground'}`}>
                  {progressPercent === 100 ? `${t('today.allTaken')} 🎉` : `${completedDoses} ${t('today.ofDoses')} ${totalDoses} ${t('today.doses')}`}
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

          {/* Weight Widget - Only for GLP-1/Bariatric users */}
          <TodayWeightWidget profileId={activeProfile?.id} />

          {/* Tutorial for new users */}
          <TutorialHint
            id={microcopy.tutorials.today.id}
            title={microcopy.tutorials.today.title}
            message={microcopy.tutorials.today.message}
          />

          {/* Empty State - Clean */}
          {!hasAnyItems && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Pill className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-medium mb-2">{t('today.addFirstMed')}</h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-[260px] mx-auto">
                {t('today.weRemindYou')}
              </p>
              <Button onClick={() => navigate("/adicionar-medicamento")} size="lg">
                <Plus className="w-5 h-5" />
                {t('common.add')}
              </Button>
            </motion.div>
          )}

          {/* OVERDUE - Clean */}
          <AnimatePresence>
            {overdueDoses.length > 0 && (
              <motion.section 
                id="overdue-section"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="mb-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="pill-destructive">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t('today.overdue')}
                  </span>
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

          {/* UPCOMING - Clean */}
          <AnimatePresence>
            {upcomingDoses.length > 0 && (
              <motion.section 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="mb-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="pill-primary">
                    <Clock className="w-3.5 h-3.5" />
                    {t('today.upcoming')}
                  </span>
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

          {/* COMPLETED - Clean */}
          {takenDoses.length > 0 && (
            <motion.section 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="pill-success">
                  <Check className="w-3.5 h-3.5" />
                  {t('today.taken')}
                </span>
              </div>
              <div className="space-y-2">
                {takenDoses.map((dose) => (
                  <motion.div 
                    key={dose.id}
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-success/5"
                  >
                    <div className="w-8 h-8 rounded-xl bg-success/15 flex items-center justify-center">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground truncate">{dose.items.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(dose.due_at), "HH:mm")}</span>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* No events today - only show when there are items but no scheduled/upcoming doses AND no overdue doses */}
          {hasAnyItems && doses.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-10"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted/30 flex items-center justify-center">
                <Clock className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground">{t('today.noDoses')}</h3>
              <p className="text-muted-foreground/70 text-sm mt-1">
                {t('today.noScheduledDoses')}
              </p>
            </motion.div>
          )}

          {/* Show message only when no upcoming doses but NOT when there are overdue doses */}
          {hasAnyItems && upcomingDoses.length === 0 && overdueDoses.length === 0 && takenDoses.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-success/10 flex items-center justify-center">
                <Check className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-base font-medium text-muted-foreground">
                {t('today.noPendingDoses')}
              </h3>
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

// Modern Swipeable Dose Card - Clean Design
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
  const { triggerSuccess, triggerWarning, triggerLight } = useHapticFeedback();
  const { t } = useLanguage();
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  
  const x = useMotionValue(0);
  const SWIPE_THRESHOLD = 100;
  
  // Transform x motion into background colors and opacity
  const rightBackground = useTransform(x, [0, SWIPE_THRESHOLD], ["rgba(34, 197, 94, 0)", "rgba(34, 197, 94, 0.15)"]);
  const leftBackground = useTransform(x, [-SWIPE_THRESHOLD, 0], ["rgba(239, 68, 68, 0.15)", "rgba(239, 68, 68, 0)"]);
  const rightIconOpacity = useTransform(x, [0, SWIPE_THRESHOLD / 2], [0, 1]);
  const leftIconOpacity = useTransform(x, [-SWIPE_THRESHOLD / 2, 0], [1, 0]);
  const rightIconScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.5, 1.2]);
  const leftIconScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1.2, 0.5]);

  const handleDragEnd = (_: any, info: any) => {
    const offsetX = info.offset.x;
    
    if (offsetX > SWIPE_THRESHOLD) {
      triggerSuccess();
      setExitDirection("right");
      setIsExiting(true);
      setTimeout(() => onTake(), 200);
    } else if (offsetX < -SWIPE_THRESHOLD) {
      triggerWarning();
      setExitDirection("left");
      setIsExiting(true);
      setTimeout(() => onSkip(), 200);
    }
  };

  const handleDrag = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD - 10 && Math.abs(info.offset.x) < SWIPE_THRESHOLD + 10) {
      triggerLight();
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: isExiting ? 0 : 1, 
        y: 0,
        x: isExiting ? (exitDirection === "right" ? 300 : -300) : 0,
        scale: isExiting ? 0.8 : 1
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: isExiting ? 0 : delay, duration: 0.3 }}
      layout
      className="group relative"
    >
      {/* Background indicators */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute inset-0 flex items-center pl-4"
          style={{ backgroundColor: rightBackground }}
        >
          <motion.div 
            style={{ opacity: rightIconOpacity, scale: rightIconScale }}
            className="flex items-center gap-2 text-success"
          >
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm">{t('today.take')}</span>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="absolute inset-0 flex items-center justify-end pr-4"
          style={{ backgroundColor: leftBackground }}
        >
          <motion.div 
            style={{ opacity: leftIconOpacity, scale: leftIconScale }}
            className="flex items-center gap-2 text-destructive"
          >
            <span className="font-medium text-sm">{t('today.skip')}</span>
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <X className="w-6 h-6" />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Main card content - draggable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ cursor: "grabbing" }}
        className={`
          relative rounded-2xl p-4 backdrop-blur-sm transition-colors duration-300
          shadow-[var(--shadow-sm)] touch-pan-y select-none
          ${isOverdue 
            ? 'bg-destructive/10 ring-2 ring-destructive/40 border-l-4 border-l-destructive shadow-lg shadow-destructive/10' 
            : 'bg-card'
          }
        `}
      >
        <div className="flex items-center gap-4">
          {/* Time */}
          <div className={`
            text-center min-w-[3.5rem]
            ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}
          `}>
            <span className="text-2xl font-semibold tracking-tight">{time}</span>
          </div>

          {/* Divider */}
          <div className={`w-px h-12 ${isOverdue ? 'bg-destructive/20' : 'bg-border'}`} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base truncate">{dose.items.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {dose.items.dose_text && (
                <span className="text-sm text-muted-foreground">{dose.items.dose_text}</span>
              )}
              {dose.items.with_food && (
                <span className="pill-warning text-xs py-0.5">
                  <Utensils className="w-3 h-3" />
                  {t('today.withFood')}
                </span>
              )}
            </div>
          </div>

          {/* Actions - fallback for accessibility */}
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onSkip}
              className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors"
              aria-label={t('today.skip')}
            >
              <X className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={onTake}
              disabled={isTaking}
              className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                font-medium text-white transition-all duration-300
                shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]
                ${isOverdue ? 'bg-destructive' : 'bg-success'}
                ${isTaking ? 'opacity-60' : ''}
              `}
              aria-label={t('today.markAsTaken')}
            >
              {isTaking ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Swipe hint */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-muted-foreground/50">{t('today.swipeHint')}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
