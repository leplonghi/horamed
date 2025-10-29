import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QrCode, Copy, ExternalLink, Clock } from 'lucide-react';
import { useConsultationCard } from '@/hooks/useConsultationCard';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function ConsultationCardGenerator() {
  const { profiles } = useUserProfiles();
  const { loading, createCard } = useConsultationCard();
  const { toast } = useToast();
  
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [hours, setHours] = useState('48');
  const [cardData, setCardData] = useState<{ cardUrl: string; expiresAt: string } | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleGenerate = async () => {
    try {
      const data = await createCard(
        selectedProfile || undefined,
        parseInt(hours)
      );
      
      setCardData(data);
      setShowDialog(true);
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const handleCopy = async () => {
    if (cardData) {
      await navigator.clipboard.writeText(cardData.cardUrl);
      toast({
        title: 'Link copiado!',
        description: 'Compartilhe com seu médico'
      });
    }
  };

  const handleOpen = () => {
    if (cardData) {
      window.open(cardData.cardUrl, '_blank');
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <QrCode className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">Cartão de Consulta</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Gere um QR code temporário com seus medicamentos e adesão para mostrar ao médico.
        </p>

        <div className="space-y-4">
          <div>
            <Label>Perfil</Label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Meu perfil principal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Meu perfil principal</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Validade</Label>
            <Select value={hours} onValueChange={setHours}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 horas</SelectItem>
                <SelectItem value="48">48 horas</SelectItem>
                <SelectItem value="72">72 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            <QrCode className="mr-2 h-4 w-4" />
            {loading ? 'Gerando...' : 'Gerar Cartão'}
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <Clock className="inline h-3 w-3 mr-1" />
            O link expira automaticamente e pode ser revogado a qualquer momento.
            Acessos são registrados no seu histórico.
          </p>
        </div>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cartão de Consulta Gerado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center p-6 bg-white rounded-lg">
              {cardData && (
                <QRCodeSVG
                  value={cardData.cardUrl}
                  size={200}
                  level="H"
                  includeMargin
                />
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Válido até{' '}
              {cardData && new Date(cardData.expiresAt).toLocaleString('pt-BR')}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                Copiar Link
              </Button>
              <Button onClick={handleOpen} variant="outline" className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
