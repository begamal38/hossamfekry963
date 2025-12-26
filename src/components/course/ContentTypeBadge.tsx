import React from 'react';
import { Lock, Unlock, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ContentTypeBadgeProps {
  isFree: boolean;
  variant?: 'default' | 'small' | 'large';
  className?: string;
}

export const ContentTypeBadge: React.FC<ContentTypeBadgeProps> = ({ 
  isFree, 
  variant = 'default',
  className 
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const sizes = {
    small: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    large: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    default: 'w-3.5 h-3.5',
    large: 'w-4 h-4'
  };

  if (isFree) {
    return (
      <Badge 
        variant="secondary"
        className={cn(
          "bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1",
          sizes[variant],
          className
        )}
      >
        <Unlock className={iconSizes[variant]} />
        <span>{isArabic ? 'مجاني' : 'Free'}</span>
      </Badge>
    );
  }

  return (
    <Badge 
      variant="secondary"
      className={cn(
        "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 gap-1",
        sizes[variant],
        className
      )}
    >
      <Crown className={iconSizes[variant]} />
      <span>{isArabic ? 'مدفوع' : 'Paid'}</span>
    </Badge>
  );
};
