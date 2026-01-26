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
    // Handle platform routes - any assistant or platform route
    if (path === '/assistant' || path === '/platform') {
      return location.pathname.startsWith('/assistant') || 
             location.pathname.startsWith('/platform') ||
             location.pathname.startsWith('/dashboard');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav 
      className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-card border-t border-border"
      role="navigation"
      aria-label="Main navigation"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="flex items-center justify-around h-16 px-1 max-w-full">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 px-1 gap-0.5 transition-colors duration-150",
                "touch-manipulation",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? 'page' : undefined}
            >
              {/* Icon container - flat, minimal */}
              <div className={cn(
                "relative p-2 rounded-md",
                active && "bg-primary/10"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-tight text-center",
                active && "font-semibold text-primary"
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
