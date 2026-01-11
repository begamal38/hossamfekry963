import React from 'react';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AssistantPageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  isRTL?: boolean;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export const AssistantPageHeader: React.FC<AssistantPageHeaderProps> = ({
  title,
  subtitle,
  backHref = '/assistant',
  isRTL = false,
  icon: Icon,
  actions,
  className,
}) => {
  const navigate = useNavigate();

  return (
    <div className={cn("flex items-center justify-between gap-3 mb-4", className)}>
      <div className="flex items-center gap-3 min-w-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(backHref)}
          className="flex-shrink-0 h-9 w-9"
        >
          <ArrowLeft className={cn("h-5 w-5", isRTL && "rotate-180")} />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
            )}
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{title}</h1>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
