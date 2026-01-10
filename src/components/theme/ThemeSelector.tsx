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

/**
 * Theme Selector - Uses centralized translation keys
 * Supports Light, Dark, and System (Auto) themes
 */
export const ThemeSelector: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t, isRTL } = useLanguage();

  const themes: { value: Theme; labelKey: string; icon: React.ReactNode }[] = [
    { value: 'light', labelKey: 'theme.light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', labelKey: 'theme.dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'system', labelKey: 'theme.system', icon: <Monitor className="w-4 h-4" /> },
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
          aria-label={isRTL ? 'تغيير السمة' : 'Toggle theme'}
        >
          {currentIcon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              theme === themeOption.value && "bg-accent text-accent-foreground"
            )}
          >
            {themeOption.icon}
            <span>{t(themeOption.labelKey)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};