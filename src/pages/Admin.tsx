import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeatureFlagsAdmin from "@/components/FeatureFlagsAdmin";
import NotificationMetrics from "@/components/NotificationMetrics";
import { Shield, Activity } from "lucide-react";

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Administração</h1>
          <p className="text-muted-foreground">
            Gerencie configurações e monitore métricas do sistema
          </p>
        </div>

        <Tabs defaultValue="flags" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="flags" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Feature Flags
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Métricas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flags">
            <FeatureFlagsAdmin />
          </TabsContent>

          <TabsContent value="metrics">
            <NotificationMetrics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
