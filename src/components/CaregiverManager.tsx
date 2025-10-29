import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2, Copy, CheckCircle, Clock } from 'lucide-react';
import { useCaregivers } from '@/hooks/useCaregivers';
import { useToast } from '@/hooks/use-toast';

export default function CaregiverManager() {
  const { caregivers, loading, inviteCaregiver, revokeCaregiver } = useCaregivers();
  const { toast } = useToast();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [role, setRole] = useState<'viewer' | 'helper'>('viewer');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!emailOrPhone.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Digite um email ou telefone',
        variant: 'destructive'
      });
      return;
    }

    setInviting(true);
    try {
      const result = await inviteCaregiver(emailOrPhone, role);
      
      // Copiar link
      await navigator.clipboard.writeText(result.inviteUrl);
      toast({
        title: 'Link copiado!',
        description: 'Compartilhe o link com o cuidador'
      });

      setEmailOrPhone('');
    } catch (error) {
      // Error já tratado no hook
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Convidar Cuidador</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="contact">Email ou Telefone</Label>
            <Input
              id="contact"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="email@exemplo.com ou (11) 98765-4321"
            />
          </div>

          <div>
            <Label htmlFor="role">Permissão</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'viewer' | 'helper')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Visualizador (somente leitura)</SelectItem>
                <SelectItem value="helper">Ajudante (pode marcar doses)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleInvite}
            disabled={inviting}
            className="w-full"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {inviting ? 'Enviando...' : 'Gerar Convite'}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cuidadores Ativos</h3>
        
        {caregivers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum cuidador cadastrado ainda
          </p>
        ) : (
          <div className="space-y-3">
            {caregivers.map((caregiver) => (
              <div
                key={caregiver.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{caregiver.email_or_phone}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={caregiver.role === 'helper' ? 'default' : 'secondary'}>
                      {caregiver.role === 'helper' ? 'Ajudante' : 'Visualizador'}
                    </Badge>
                    {caregiver.accepted_at ? (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => revokeCaregiver(caregiver.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          <strong>Visualizadores</strong> recebem notificações apenas em exceções (doses perdidas, estoque crítico).
          <br />
          <strong>Ajudantes</strong> podem também marcar doses como tomadas.
        </p>
      </Card>
    </div>
  );
}
