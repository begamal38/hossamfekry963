import React from 'react';
import { LucideIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MetadataItem {
  label: string;
  icon?: LucideIcon;
  className?: string;
}

interface ActionItem {
  icon: LucideIcon;
  onClick: (e?: React.MouseEvent) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  label?: string;
}

interface MobileDataCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'accent' | 'muted';
  badgeClassName?: string;
  secondaryBadge?: string;
  secondaryBadgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'accent' | 'muted';
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  metadata?: MetadataItem[];
  actions?: ActionItem[] | React.ReactNode;
  href?: string;
  isRTL?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const badgeVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  default: 'default',
  secondary: 'secondary',
  destructive: 'destructive',
  outline: 'outline',
  success: 'secondary',
  warning: 'secondary',
  accent: 'secondary',
  muted: 'outline',
};

const badgeClassMap: Record<string, string> = {
  default: 'bg-primary/10 text-primary border-transparent font-medium',
  secondary: 'bg-muted text-muted-foreground border-transparent',
  success: 'bg-green-500/15 text-green-700 dark:text-green-400 border-transparent',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent',
  destructive: 'bg-destructive/10 text-destructive border-transparent',
  accent: 'bg-primary/10 text-primary border-primary/20',
  muted: 'bg-muted/60 text-muted-foreground border-transparent text-[10px]',
  outline: 'bg-transparent text-muted-foreground border-border',
};

export const MobileDataCard: React.FC<MobileDataCardProps> = ({
  title,
  subtitle,
  badge,
  badgeVariant = 'default',
  badgeClassName,
  secondaryBadge,
  secondaryBadgeVariant = 'secondary',
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
  metadata,
  actions,
  href,
  isRTL = false,
  onClick,
  className,
  children,
}) => {
  const content = (
    <div
      className={cn(
        "bg-card border border-border/80 rounded-xl p-3 sm:p-4 transition-all duration-200",
        (href || onClick) && "hover:border-primary/40 hover:bg-muted/40 cursor-pointer active:scale-[0.99]",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBgColor)}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {/* Title - Primary emphasis */}
              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate leading-tight">{title}</h3>
              {/* Subtitle - Secondary, muted */}
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate font-medium">{subtitle}</p>
              )}
            </div>
            
            {/* Badges - Aligned right, stacked vertically on mobile */}
            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end max-w-[45%]">
              {/* Primary badge (grade/track) - More prominent */}
              {badge && (
                <Badge 
                  variant={badgeVariantMap[badgeVariant] || 'default'} 
                  className={cn(
                    "text-[10px] sm:text-xs font-medium",
                    badgeClassMap[badgeVariant],
                    badgeClassName
                  )}
                >
                  {badge}
                </Badge>
              )}
              {/* Secondary badge (study mode) - Subtle */}
              {secondaryBadge && (
                <Badge 
                  variant={badgeVariantMap[secondaryBadgeVariant] || 'secondary'} 
                  className={cn(
                    "text-[10px] sm:text-xs",
                    badgeClassMap[secondaryBadgeVariant]
                  )}
                >
                  {secondaryBadge}
                </Badge>
              )}
              {(href || onClick) && !actions && (
                isRTL ? (
                  <ChevronLeft className="w-4 h-4 text-muted-foreground/70" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
                )
              )}
            </div>
          </div>
          
          {/* Metadata row - Quick insights */}
          {metadata && metadata.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {metadata.map((item, index) => (
                <div key={index} className={cn(
                  "flex items-center gap-1 text-xs text-muted-foreground",
                  item.className
                )}>
                  {item.icon && <item.icon className="w-3 h-3 flex-shrink-0" />}
                  <span className="tabular-nums">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions - Icon buttons on the side */}
        {actions && Array.isArray(actions) && actions.length > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {(actions as ActionItem[]).map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'ghost'}
                size="icon"
                className={cn("h-8 w-8", action.className)}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(e);
                }}
              >
                <action.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {/* Actions - Custom React Node (full width below content) */}
      {actions && !Array.isArray(actions) && actions}
      
      {children}
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};
