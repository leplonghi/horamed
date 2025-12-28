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
import { useLanguage } from '@/contexts/LanguageContext';

export default function CaregiverManager() {
  const { caregivers, loading, inviteCaregiver, revokeCaregiver } = useCaregivers();
  const { toast } = useToast();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [role, setRole] = useState<'viewer' | 'helper'>('viewer');
  const [inviting, setInviting] = useState(false);
  const { t } = useLanguage();

  const handleInvite = async () => {
    if (!emailOrPhone.trim()) {
      toast({
        title: t('caregiver.fieldRequired'),
        description: t('caregiver.enterEmailOrPhone'),
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
        title: t('caregiver.linkCopied'),
        description: t('caregiver.shareLink')
      });

      setEmailOrPhone('');
    } catch (error) {
      // Error já tratado no hook
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('caregiver.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('caregiver.inviteTitle')}</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="contact">{t('caregiver.emailOrPhone')}</Label>
            <Input
              id="contact"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder={t('caregiver.emailOrPhonePlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="role">{t('caregiver.permission')}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'viewer' | 'helper')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">{t('caregiver.viewer')}</SelectItem>
                <SelectItem value="helper">{t('caregiver.helper')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleInvite}
            disabled={inviting}
            className="w-full"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {inviting ? t('caregiver.sendingInvite') : t('caregiver.generateInvite')}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('caregiver.activeCaregivers')}</h3>
        
        {caregivers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t('caregiver.noCaregivers')}
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
                      {caregiver.role === 'helper' ? t('caregiver.helperRole') : t('caregiver.viewerRole')}
                    </Badge>
                    {caregiver.accepted_at ? (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {t('caregiver.activeStatus')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {t('caregiver.pendingStatus')}
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
          <strong>{t('caregiver.viewerRole')}:</strong> {t('caregiver.viewerInfo')}
          <br />
          <strong>{t('caregiver.helperRole')}:</strong> {t('caregiver.helperInfo')}
        </p>
      </Card>
    </div>
  );
}
