import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const currentLang = languages.find(l => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl">
          <Globe className="h-4 w-4" />
          <span>{currentLang?.flag}</span>
          <span className="hidden sm:inline">{currentLang?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`gap-2 cursor-pointer ${language === lang.code ? 'bg-primary/10' : ''}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
            {language === lang.code && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{t('settings.language')}</p>
          <p className="text-sm text-muted-foreground">{t('settings.languageDesc')}</p>
        </div>
      </div>
      <div className="flex gap-1 p-1 rounded-xl bg-muted/50">
        <Button
          size="sm"
          variant={language === 'pt' ? 'default' : 'ghost'}
          className="rounded-lg px-3"
          onClick={() => setLanguage('pt')}
        >
          🇧🇷 PT
        </Button>
        <Button
          size="sm"
          variant={language === 'en' ? 'default' : 'ghost'}
          className="rounded-lg px-3"
          onClick={() => setLanguage('en')}
        >
          🇺🇸 EN
        </Button>
      </div>
    </div>
  );
}
