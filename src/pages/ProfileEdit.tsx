import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState<any>({
    full_name: "",
    nickname: "",
    weight_kg: "",
    height_cm: "",
    birth_date: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          ...data,
          weight_kg: data.weight_kg?.toString() || "",
          height_cm: data.height_cm?.toString() || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const weightValue = profile.weight_kg ? parseFloat(profile.weight_kg) : null;
      const heightValue = profile.height_cm ? parseFloat(profile.height_cm) : null;

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          nickname: profile.nickname,
          weight_kg: weightValue,
          height_cm: heightValue,
          birth_date: profile.birth_date || null,
        });

      if (error) throw error;

      // If weight or height changed, save to health history
      if (weightValue || heightValue) {
        await supabase
          .from("health_history")
          .insert({
            user_id: user.id,
            weight_kg: weightValue,
            height_cm: heightValue,
            recorded_at: new Date().toISOString(),
          });
      }

      toast.success("Perfil atualizado com sucesso!");
      navigate("/perfil");
    } catch (error: any) {
      toast.error("Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-md mx-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/perfil")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Dados Pessoais</h1>
        </div>

        {/* Email (Read-only) */}
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={userEmail}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </Card>

        {/* Personal Info */}
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome completo</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <Label htmlFor="nickname">Apelido</Label>
              <Input
                id="nickname"
                value={profile.nickname}
                onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                placeholder="Como gostaria de ser chamado?"
              />
            </div>

            <div>
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={profile.birth_date}
                onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Health Data */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Dados de Saúde</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={profile.weight_kg}
                onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
                placeholder="Ex: 70.5"
              />
            </div>

            <div>
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                value={profile.height_cm}
                onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
                placeholder="Ex: 175"
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSaveProfile} 
          disabled={loading} 
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
