import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, LogOut, Upload, FileText, Trash2, Pill } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState<any>({
    full_name: "",
    nickname: "",
    weight_kg: "",
    height_cm: "",
    birth_date: "",
    avatar_url: "",
  });
  const [exams, setExams] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
    loadExams();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
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

  const loadExams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("medical_exams")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error("Error loading exams:", error);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          nickname: profile.nickname,
          weight_kg: profile.weight_kg ? parseFloat(profile.weight_kg) : null,
          height_cm: profile.height_cm ? parseFloat(profile.height_cm) : null,
          birth_date: profile.birth_date || null,
          avatar_url: profile.avatar_url,
        });

      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <>
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">HoraMed</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>

          <h2 className="text-2xl font-bold text-foreground">Meu Perfil</h2>

          <Card className="p-6">
            <div className="flex items-center gap-6 mb-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-semibold">
                  {profile.full_name || "Usuário"}
                </h3>
                <p className="text-muted-foreground">{userEmail}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nome completo</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={profile.weight_kg}
                    onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={profile.height_cm}
                    onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
                {loading ? "Salvando..." : "Salvar Perfil"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <Navigation />
    </>
  );
}