/**
 * Study Mode Selector
 * 
 * Allows students to choose between Online and Center study modes.
 * When Center is selected, shows the CenterGroupSelector.
 * 
 * SMART VALIDATION: Disables modes that have no available groups,
 * preventing students from reaching dead-end states.
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudyModeAvailability } from '@/hooks/useStudyModeAvailability';
import { CenterGroupSelector } from './CenterGroupSelector';
import { Monitor, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StudyMode = 'online' | 'center';

interface StudyModeSelectorProps {
  value: StudyMode | null;
  onChange: (mode: StudyMode) => void;
  grade: string;
  languageTrack: string;
  centerGroupId: string | null;
  onCenterGroupChange: (groupId: string | null) => void;
  error?: string;
  centerGroupError?: string;
  className?: string;
  required?: boolean;
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
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  // Pre-fetch availability to prevent dead-end selections
  const { availability, loading: checkingAvailability } = useStudyModeAvailability({
    grade: grade || null,
    languageTrack: languageTrack || null,
  });

  const tr = (ar: string, en: string) => isArabic ? ar : en;

  const modes = [
    {
      id: 'online' as StudyMode,
      icon: Monitor,
      label: tr('أونلاين', 'Online'),
      description: tr('تعلم من المنزل', 'Learn from home'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500',
      disabledColor: 'text-muted-foreground',
      disabledBg: 'bg-muted/30',
    },
    {
      id: 'center' as StudyMode,
      icon: MapPin,
      label: tr('سنتر', 'Center'),
      description: tr('حضور في السنتر', 'Attend at center'),
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500',
      disabledColor: 'text-muted-foreground',
      disabledBg: 'bg-muted/30',
    },
  ];

  // Get availability status for each mode
  const getModeAvailability = (modeId: StudyMode) => {
    if (modeId === 'online') return availability.online;
    return availability.center;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mode Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          {tr('طريقة الدراسة', 'Study Mode')}
          {required && <span className="text-destructive">*</span>}
        </label>

        {/* Loading state while checking availability */}
        {checkingAvailability ? (
          <div className="flex items-center justify-center gap-2 p-4 rounded-lg border border-border bg-muted/20">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {tr('جاري التحقق من الخيارات المتاحة...', 'Checking available options...')}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = value === mode.id;
              const modeAvailability = getModeAvailability(mode.id);
              const isDisabled = !modeAvailability.available;
              
              return (
                <button
                  key={mode.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    onChange(mode.id);
                    if (mode.id === 'online') {
                      onCenterGroupChange(null);
                    }
                  }}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-150 active:scale-[0.98]",
                    isDisabled
                      ? "cursor-not-allowed opacity-60 border-border/50 bg-muted/20"
                      : isSelected
                        ? `${mode.borderColor} ${mode.bgColor}`
                        : "border-border hover:border-primary/50"
                  )}
                  aria-disabled={isDisabled}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isDisabled
                      ? mode.disabledBg
                      : isSelected 
                        ? mode.bgColor 
                        : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      isDisabled
                        ? mode.disabledColor
                        : isSelected 
                          ? mode.color 
                          : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      "font-medium",
                      isDisabled
                        ? mode.disabledColor
                        : isSelected 
                          ? mode.color 
                          : "text-foreground"
                    )}>
                      {mode.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isDisabled && modeAvailability.reason
                        ? modeAvailability.reason
                        : mode.description}
                    </div>
                  </div>
                  {isSelected && !isDisabled && (
                    <div className={cn(
                      "absolute top-2 right-2 w-2 h-2 rounded-full",
                      mode.id === 'online' ? 'bg-blue-500' : 'bg-green-500'
                    )} />
                  )}
                  {/* Unavailable indicator */}
                  {isDisabled && (
                    <div className="absolute top-2 left-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Helper text when center is unavailable but selected was attempted */}
        {!checkingAvailability && !availability.center.available && value === null && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="text-sm">
              {tr(
                'نظام السنتر غير متاح حالياً لصفك الدراسي. يمكنك الاشتراك أونلاين.',
                'Center mode is not available for your grade. You can subscribe online.'
              )}
            </span>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Center Group Selector (only when center mode is selected and available) */}
      {value === 'center' && grade && languageTrack && availability.center.available && (
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
