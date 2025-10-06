import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Pill, TrendingUp, Package, User, Activity, Ruler } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, differenceInYears, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navigation from "@/components/Navigation";
import AdBanner from "@/components/AdBanner";
import AdherenceChart from "@/components/AdherenceChart";
import GoogleAd from "@/components/GoogleAd";
import Header from "@/components/Header";
import logo from "@/assets/horamend-logo.png";
import { useMedicationAlarm } from "@/hooks/useMedicationAlarm";

interface DoseInstance {
  id: string;
  due_at: string;
  status: string;
  item_id: string;
  items: {
    name: string;
    dose_text: string | null;
    with_food: boolean;
  };
}

interface LowStock {
  id: string;
  name: string;
  units_left: number;
  unit_label: string;
  projected_days_left: number;
}

interface UserProfile {
  full_name: string | null;
  nickname: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  height_cm: number | null;
}

export default function Today() {
  const [upcomingDoses, setUpcomingDoses] = useState<DoseInstance[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weeklyAdherence, setWeeklyAdherence] = useState<{ day: string; taken: number; total: number }[]>([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    completed: 0,
    pending: 0,
    lowStock: 0,
    weeklyAdherence: 0,
  });

  // Initialize medication alarm system
  useMedicationAlarm();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Bom dia");
    else if (hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");

    fetchTodayData();
    fetchProfile();
    loadStats();
    loadWeeklyAdherence();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, nickname, birth_date, weight_kg, height_cm")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchTodayData = async () => {
    try {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch upcoming doses for today
      const { data: doses, error: dosesError } = await supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          status,
          item_id,
          items (name, dose_text, with_food)
        `)
        .eq("status", "scheduled")
        .gte("due_at", now.toISOString())
        .lte("due_at", endOfDay.toISOString())
        .order("due_at", { ascending: true })
        .limit(5);

      if (dosesError) throw dosesError;
      setUpcomingDoses(doses || []);

      // Fetch low stock items
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select(`
          id,
          name,
          stock (units_left, unit_label, projected_end_at)
        `)
        .eq("is_active", true);

      if (itemsError) throw itemsError;

      const lowStock = items
        ?.filter((item: any) => {
          if (!item.stock?.[0]) return false;
          const stock = item.stock[0];
          if (!stock.projected_end_at) return false;
          const daysLeft = Math.ceil(
            (new Date(stock.projected_end_at).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return daysLeft <= 7 && daysLeft > 0;
        })
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          units_left: item.stock[0].units_left,
          unit_label: item.stock[0].unit_label,
          projected_days_left: Math.ceil(
            (new Date(item.stock[0].projected_end_at).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        }))
        .sort((a: LowStock, b: LowStock) => a.projected_days_left - b.projected_days_left);

      setLowStockItems(lowStock || []);
    } catch (error) {
      console.error("Error fetching today data:", error);
      toast.error("Erro ao carregar dados de hoje");
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyAdherence = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const day = startOfDay(subDays(new Date(), i));
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);

        const { data: doses } = await supabase
          .from("dose_instances")
          .select(`
            *,
            items!inner(user_id)
          `)
          .eq("items.user_id", user.id)
          .gte("due_at", day.toISOString())
          .lt("due_at", nextDay.toISOString());

        const total = doses?.length || 0;
        const taken = doses?.filter((d) => d.status === "taken").length || 0;

        weekData.push({
          day: format(day, "EEE", { locale: ptBR }),
          taken,
          total,
        });
      }

      setWeeklyAdherence(weekData);
    } catch (error) {
      console.error("Error loading weekly adherence:", error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayDoses } = await supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(user_id)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", today.toISOString())
        .lt("due_at", tomorrow.toISOString());

      const completed = todayDoses?.filter((d) => d.status === "taken").length || 0;
      const pending = todayDoses?.filter((d) => d.status === "scheduled").length || 0;

      // Calculate weekly adherence
      const last7Days = subDays(new Date(), 7);
      const { data: weekDoses } = await supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(user_id)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", last7Days.toISOString());

      const weekTotal = weekDoses?.length || 0;
      const weekTaken = weekDoses?.filter((d) => d.status === "taken").length || 0;
      const weeklyAdherence = weekTotal > 0 ? Math.round((weekTaken / weekTotal) * 100) : 0;

      const { data: stockData } = await supabase
        .from("stock")
        .select(`
          *,
          items!inner(user_id)
        `)
        .eq("items.user_id", user.id);

      const lowStock = stockData?.filter((s) => s.units_left < s.units_total * 0.2).length || 0;

      setStats({
        totalToday: todayDoses?.length || 0,
        completed,
        pending,
        lowStock,
        weeklyAdherence,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const markAsTaken = async (doseId: string, itemId: string) => {
    try {
      const takenAt = new Date();
      const { error } = await supabase
        .from("dose_instances")
        .update({
          status: "taken",
          taken_at: takenAt.toISOString(),
        })
        .eq("id", doseId);

      if (error) throw error;

      // Decrement stock
      const { data: stockData } = await supabase
        .from("stock")
        .select("units_left, units_total")
        .eq("item_id", itemId)
        .single();

      if (stockData && stockData.units_left > 0) {
        await supabase
          .from("stock")
          .update({ units_left: stockData.units_left - 1 })
          .eq("item_id", itemId);
      }

      toast.success("Dose confirmada! 💚");
      fetchTodayData();
    } catch (error) {
      console.error("Error marking dose as taken:", error);
      toast.error("Erro ao confirmar dose");
    }
  };

  const snoozeDose = async (doseId: string, minutes: number) => {
    try {
      const { data: dose } = await supabase
        .from("dose_instances")
        .select("due_at")
        .eq("id", doseId)
        .single();

      if (dose) {
        const newTime = new Date(dose.due_at);
        newTime.setMinutes(newTime.getMinutes() + minutes);

        await supabase
          .from("dose_instances")
          .update({
            due_at: newTime.toISOString(),
            status: "snoozed",
          })
          .eq("id", doseId);

        toast.success(`Lembrete adiado por ${minutes} minutos`);
        fetchTodayData();
      }
    } catch (error) {
      console.error("Error snoozing dose:", error);
      toast.error("Erro ao adiar lembrete");
    }
  };

  const skipDose = async (doseId: string) => {
    try {
      await supabase
        .from("dose_instances")
        .update({ status: "skipped" })
        .eq("id", doseId);

      toast("Dose pulada");
      fetchTodayData();
    } catch (error) {
      console.error("Error skipping dose:", error);
      toast.error("Erro ao pular dose");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <AdBanner />

          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
              {greeting}{profile?.nickname ? `, ${profile.nickname}` : ""}! <span className="text-primary">👋</span>
            </h2>
            <p className="text-muted-foreground">
              {format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          {/* User Health Stats */}
          {profile && (profile.birth_date || profile.weight_kg || profile.height_cm) && (
            <div className="grid grid-cols-3 gap-3">
              {profile.birth_date && (
                <Card className="p-4 bg-primary/10 border-primary/20">
                  <div className="flex flex-col gap-1">
                    <div className="text-2xl text-primary">🎂</div>
                    <p className="text-xs text-muted-foreground">Idade</p>
                    <p className="text-xl font-bold text-foreground">
                      {differenceInYears(new Date(), new Date(profile.birth_date))} anos
                    </p>
                  </div>
                </Card>
              )}
              {profile.weight_kg && (
                <Card className="p-4 bg-primary/10 border-primary/20">
                  <div className="flex flex-col gap-1">
                    <div className="text-2xl text-primary">⚖️</div>
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <p className="text-xl font-bold text-foreground">{profile.weight_kg} kg</p>
                  </div>
                </Card>
              )}
              {profile.height_cm && (
                <Card className="p-4 bg-primary/10 border-primary/20">
                  <div className="flex flex-col gap-1">
                    <div className="text-2xl text-primary">📏</div>
                    <p className="text-xs text-muted-foreground">Altura</p>
                    <p className="text-xl font-bold text-foreground">{(profile.height_cm / 100).toFixed(2)} m</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Upcoming Doses */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Próximas doses
            </h2>

            {upcomingDoses.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhuma dose programada para hoje! 🎉
                </p>
              </Card>
            ) : (
              upcomingDoses.map((dose) => (
                <Card
                  key={dose.id}
                  className="p-5 hover:shadow-md transition-shadow"
                >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {dose.items.name}
                      </h3>
                      {dose.items.dose_text && (
                        <p className="text-sm text-muted-foreground">
                          {dose.items.dose_text}
                        </p>
                      )}
                      {dose.items.with_food && (
                        <p className="text-xs text-primary font-medium">
                          <span className="text-primary">🍽️</span> Tomar com alimento
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {format(parseISO(dose.due_at), "HH:mm")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => markAsTaken(dose.id, dose.item_id)}
                      className="flex-1 bg-success hover:bg-success/90"
                    >
                      ✓ Tomei
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => snoozeDose(dose.id, 15)}
                      className="border-primary/30 hover:bg-primary/5"
                    >
                      +15 min
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => snoozeDose(dose.id, 30)}
                      className="border-primary/30 hover:bg-primary/5"
                    >
                      +30 min
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => skipDose(dose.id)}
                      className="text-muted-foreground"
                    >
                      Pular
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-destructive">
                <Package className="h-5 w-5" />
                Estoque baixo
              </h2>
              {lowStockItems.map((item) => (
                <Card
                  key={item.id}
                  className="p-5 border-destructive/30 bg-destructive/5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.units_left} {item.unit_label} restantes
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-destructive">
                        ~{item.projected_days_left} dias
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-primary/10 border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Adesão semanal</p>
                  <p className="text-2xl font-bold text-foreground">{stats.weeklyAdherence}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-primary/10 border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold text-foreground">{upcomingDoses.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-primary/10 border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Acabando</p>
                  <p className="text-2xl font-bold text-foreground">{lowStockItems.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Weekly Adherence Chart */}
          {weeklyAdherence.length > 0 && (
            <AdherenceChart weeklyData={weeklyAdherence} />
          )}
        </div>
      </div>
      <Navigation />
    </>
  );
}
