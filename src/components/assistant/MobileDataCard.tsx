import React from 'react';
import { LucideIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MobileDataCardProps {
  /** Main title */
  title: string;
  /** Subtitle or secondary info */
  subtitle?: string;
  /** Badge text */
  badge?: string;
  /** Badge variant */
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  /** Badge custom class */
  badgeClassName?: string;
  /** Icon for the card */
  icon?: LucideIcon;
  /** Icon color class */
  iconColor?: string;
  /** Icon background color class */
  iconBgColor?: string;
  /** Additional metadata items */
  metadata?: Array<{ label: string; value: string; icon?: LucideIcon }>;
  /** Action buttons */
  actions?: React.ReactNode;
  /** Link to navigate */
  href?: string;
  /** RTL mode */
  isRTL?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
  /** Children content */
  children?: React.ReactNode;
}

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
      {/* Header Row */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBgColor)}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{title}</h3>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
            
            {/* Badge & Arrow */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {badge && (
                <Badge variant={badgeVariant} className={cn("text-[10px] sm:text-xs", badgeClassName)}>
                  {badge}
                </Badge>
              )}
              {(href || onClick) && (
                isRTL ? (
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )
              )}
            </div>
          </div>
          
          {/* Metadata */}
          {metadata && metadata.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {metadata.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {item.icon && <item.icon className="w-3 h-3" />}
                  <span className="text-muted-foreground">{item.label}:</span>
                  <span className="text-foreground font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Children content */}
      {children}
      
      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          {actions}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};
