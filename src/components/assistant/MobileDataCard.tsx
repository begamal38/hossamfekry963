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
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  label?: string;
}

interface MobileDataCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'accent';
  badgeClassName?: string;
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
};

const badgeClassMap: Record<string, string> = {
  success: 'bg-green-500/10 text-green-600 border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  accent: 'bg-primary/10 text-primary border-primary/20',
};

export const MobileDataCard: React.FC<MobileDataCardProps> = ({
  title,
  subtitle,
  badge,
  badgeVariant = 'default',
  badgeClassName,
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
        "bg-card border border-border rounded-xl p-3 sm:p-4 transition-all duration-200",
        (href || onClick) && "hover:border-primary/30 hover:bg-muted/30 cursor-pointer active:scale-[0.99]",
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
              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{title}</h3>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {badge && (
                <Badge 
                  variant={badgeVariantMap[badgeVariant] || 'default'} 
                  className={cn(
                    "text-[10px] sm:text-xs",
                    badgeClassMap[badgeVariant],
                    badgeClassName
                  )}
                >
                  {badge}
                </Badge>
              )}
              {(href || onClick) && !actions && (
                isRTL ? (
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )
              )}
            </div>
          </div>
          
          {metadata && metadata.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {metadata.map((item, index) => (
                <div key={index} className={cn("flex items-center gap-1 text-xs text-muted-foreground", item.className)}>
                  {item.icon && <item.icon className="w-3 h-3" />}
                  <span>{item.label}</span>
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
                  action.onClick();
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
