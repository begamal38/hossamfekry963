import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Play, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

export const MobileBottomNav: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { canAccessDashboard, isStudent } = useUserRole();
  const location = useLocation();

  // Determine platform route based on user role
  const getPlatformRoute = (): string => {
    if (!user) return '/auth';
    if (canAccessDashboard()) return '/assistant';
    if (isStudent()) return '/platform';
    return '/auth';
  };

  const navItems: NavItem[] = [
    { icon: Home, label: t('nav.home'), href: '/' },
    { icon: BookOpen, label: t('nav.courses'), href: '/courses' },
    { icon: Play, label: t('nav.freeLessons'), href: '/free-lessons' },
    { icon: LayoutDashboard, label: t('nav.platform'), href: getPlatformRoute() },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/assistant' || path === '/platform') {
      return location.pathname.startsWith('/assistant') || 
             location.pathname.startsWith('/platform') ||
             location.pathname.startsWith('/dashboard');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav 
      className="fixed inset-x-0 bottom-0 z-50 md:hidden flex justify-center pointer-events-none"
      role="navigation"
      aria-label="Main navigation"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)' }}
    >
      <div 
        className={cn(
          "pointer-events-auto",
          "mx-3 w-[calc(100%-24px)] max-w-md",
          "bg-[#F7F9FC] dark:bg-card/95 backdrop-blur-[6px]",
          "rounded-2xl",
          "shadow-[0_-6px_20px_rgba(0,0,0,0.06)]",
          "border border-[#E6ECF2] dark:border-border/50",
          "flex items-center justify-around",
          "h-[68px] px-2"
        )}
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1.5 gap-1 transition-colors duration-150",
                "touch-manipulation relative"
              )}
              aria-current={active ? 'page' : undefined}
            >
              {/* Active top indicator line */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-primary" />
              )}
              {/* Icon container with active pill highlight */}
              <div className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                active 
                  ? "bg-primary/12" 
                  : "bg-transparent"
              )}>
                <Icon 
                  className={cn(
                    "w-[22px] h-[22px] transition-colors duration-150",
                    active ? "text-primary" : "text-muted-foreground"
                  )} 
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </div>
              <span className={cn(
                "text-[10px] leading-tight text-center transition-colors duration-150",
                active 
                  ? "font-semibold text-primary" 
                  : "font-medium text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
