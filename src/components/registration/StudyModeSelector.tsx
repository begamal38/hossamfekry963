/**
 * Study Mode Selector
 * 
 * Allows students to choose between Online and Center study modes.
 * When Center is selected, shows the CenterGroupSelector.
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CenterGroupSelector } from './CenterGroupSelector';
import { Monitor, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StudyMode = 'online' | 'center';

interface StudyModeSelectorProps {
  value: StudyMode | null; // Can be null to force explicit selection
  onChange: (mode: StudyMode) => void;
  grade: string;
  languageTrack: string;
  centerGroupId: string | null;
  onCenterGroupChange: (groupId: string | null) => void;
  error?: string;
  centerGroupError?: string;
  className?: string;
  required?: boolean; // Show required indicator
}

export function StudyModeSelector({
  value,
  onChange,
  grade,
  languageTrack,
  centerGroupId,
  onCenterGroupChange,
  error,
  centerGroupError,
  className,
  required = false,
}: StudyModeSelectorProps) {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  const tr = (ar: string, en: string) => isArabic ? ar : en;

  const modes = [
    {
      id: 'online' as StudyMode,
      icon: Monitor,
      label: tr('أونلاين', 'أونلاين'),
      description: tr('تعلم من المنزل', 'تعلم من المنزل'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500',
    },
    {
      id: 'center' as StudyMode,
      icon: MapPin,
      label: tr('سنتر', 'سنتر'),
      description: tr('حضور في السنتر', 'حضور في السنتر'),
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500',
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mode Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          {tr('طريقة الدراسة', 'طريقة الدراسة')}
          {required && <span className="text-destructive">*</span>}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = value === mode.id;
            
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  onChange(mode.id);
                  if (mode.id === 'online') {
                    onCenterGroupChange(null);
                  }
                }}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  isSelected
                    ? `${mode.borderColor} ${mode.bgColor}`
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isSelected ? mode.bgColor : "bg-muted"
                )}>
                  <Icon className={cn("h-5 w-5", isSelected ? mode.color : "text-muted-foreground")} />
                </div>
                <div className="text-center">
                  <div className={cn(
                    "font-medium",
                    isSelected ? mode.color : "text-foreground"
                  )}>
                    {mode.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {mode.description}
                  </div>
                </div>
                {isSelected && (
                  <div className={cn(
                    "absolute top-2 right-2 w-2 h-2 rounded-full",
                    mode.id === 'online' ? 'bg-blue-500' : 'bg-green-500'
                  )} />
                )}
              </button>
            );
          })}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Center Group Selector (only when center mode is selected) */}
      {value === 'center' && grade && languageTrack && (
        <CenterGroupSelector
          grade={grade}
          languageTrack={languageTrack}
          value={centerGroupId}
          onChange={onCenterGroupChange}
          error={centerGroupError}
        />
      )}
    </div>
  );
}
