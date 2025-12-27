import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language } = useLanguage();

  const themes: { value: Theme; label: string; labelAr: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', labelAr: 'فاتح', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', labelAr: 'داكن', icon: <Moon className="w-4 h-4" /> },
    { value: 'system', label: 'Auto', labelAr: 'تلقائي', icon: <Monitor className="w-4 h-4" /> },
  ];

  const currentIcon = theme === 'system' 
    ? <Monitor className="w-5 h-5" /> 
    : resolvedTheme === 'dark' 
      ? <Moon className="w-5 h-5" /> 
      : <Sun className="w-5 h-5" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          aria-label={language === 'ar' ? 'تغيير السمة' : 'Toggle theme'}
        >
          {currentIcon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              theme === t.value && "bg-accent text-accent-foreground"
            )}
          >
            {t.icon}
            <span>{language === 'ar' ? t.labelAr : t.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
