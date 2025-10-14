import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, ChevronDown } from 'lucide-react';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';

export default function ProfileSelector() {
  const { profiles, activeProfile, switchProfile } = useUserProfiles();
  const { isPremium } = useSubscription();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreateProfile = () => {
    if (!isPremium) {
      navigate('/planos');
      return;
    }
    navigate('/perfis/novo');
    setOpen(false);
  };

  const handleSelectProfile = (profile: any) => {
    switchProfile(profile);
    setOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRelationshipLabel = (relationship: string) => {
    const labels: { [key: string]: string } = {
      self: 'Você',
      child: 'Filho(a)',
      parent: 'Pai/Mãe',
      spouse: 'Cônjuge',
      other: 'Outro'
    };
    return labels[relationship] || relationship;
  };

  if (!activeProfile) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={activeProfile.avatar_url} />
            <AvatarFallback className="text-xs">
              {getInitials(activeProfile.name)}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[100px] truncate">{activeProfile.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecionar Perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => handleSelectProfile(profile)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                activeProfile.id === profile.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }`}
            >
              <Avatar>
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{profile.name}</p>
                  {profile.is_primary && (
                    <Badge variant="secondary" className="text-xs">Principal</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {getRelationshipLabel(profile.relationship)}
                </p>
              </div>
            </button>
          ))}

          <Button
            onClick={handleCreateProfile}
            variant="outline"
            className="w-full gap-2"
            disabled={!isPremium && profiles.length >= 1}
          >
            <Plus className="h-4 w-4" />
            Adicionar Perfil {!isPremium && '(Premium)'}
          </Button>

          {!isPremium && (
            <p className="text-xs text-center text-muted-foreground">
              Múltiplos perfis disponível apenas no Premium
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}