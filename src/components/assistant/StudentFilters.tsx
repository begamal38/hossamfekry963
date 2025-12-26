import React from 'react';
import { Search, X, Wifi, Building2, Shuffle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StudentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  academicYearFilter: string;
  onAcademicYearFilterChange: (value: string) => void;
  languageTrackFilter: string;
  onLanguageTrackFilterChange: (value: string) => void;
  progressFilter: string;
  onProgressFilterChange: (value: string) => void;
  examFilter: string;
  onExamFilterChange: (value: string) => void;
  attendanceModeFilter?: string;
  onAttendanceModeFilterChange?: (value: string) => void;
  isRTL?: boolean;
  onClearFilters?: () => void;
}

export const StudentFilters: React.FC<StudentFiltersProps> = ({
  searchTerm,
  onSearchChange,
  academicYearFilter,
  onAcademicYearFilterChange,
  languageTrackFilter,
  onLanguageTrackFilterChange,
  progressFilter,
  onProgressFilterChange,
  examFilter,
  onExamFilterChange,
  attendanceModeFilter,
  onAttendanceModeFilterChange,
  isRTL,
  onClearFilters,
}) => {
  const hasActiveFilters = academicYearFilter !== 'all' || languageTrackFilter !== 'all' || progressFilter !== 'all' || examFilter !== 'all' || (attendanceModeFilter && attendanceModeFilter !== 'all');

  return (
    <div className="bg-card rounded-xl border border-border p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRTL ? 'بحث بالاسم أو رقم الهاتف...' : 'Search by name or phone...'}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="ps-10"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3">
          {/* Academic Year Filter */}
          <select
            value={academicYearFilter}
            onChange={(e) => onAcademicYearFilterChange(e.target.value)}
            className="px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground min-w-[140px]"
          >
            <option value="all">{isRTL ? 'كل الصفوف' : 'All Years'}</option>
            <option value="second_secondary">{isRTL ? 'الثاني الثانوي' : 'Second Secondary'}</option>
            <option value="third_secondary">{isRTL ? 'الثالث الثانوي' : 'Third Secondary'}</option>
          </select>

          {/* Language Track Filter */}
          <select
            value={languageTrackFilter}
            onChange={(e) => onLanguageTrackFilterChange(e.target.value)}
            className="px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground min-w-[140px]"
          >
            <option value="all">{isRTL ? 'كل الأنواع' : 'All Tracks'}</option>
            <option value="arabic">{isRTL ? 'عربي' : 'Arabic'}</option>
            <option value="languages">{isRTL ? 'لغات' : 'Languages'}</option>
          </select>

          {/* Attendance Mode Filter */}
          {onAttendanceModeFilterChange && (
            <select
              value={attendanceModeFilter || 'all'}
              onChange={(e) => onAttendanceModeFilterChange(e.target.value)}
              className="px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground min-w-[140px]"
            >
              <option value="all">{isRTL ? 'كل أنواع الحضور' : 'All Modes'}</option>
              <option value="online">{isRTL ? 'أونلاين' : 'Online'}</option>
              <option value="center">{isRTL ? 'سنتر' : 'Center'}</option>
              <option value="hybrid">{isRTL ? 'هجين' : 'Hybrid'}</option>
            </select>
          )}

          {/* Progress Filter */}
          <select
            value={progressFilter}
            onChange={(e) => onProgressFilterChange(e.target.value)}
            className="px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground min-w-[140px]"
          >
            <option value="all">{isRTL ? 'كل التقدم' : 'All Progress'}</option>
            <option value="not_started">{isRTL ? 'لم يبدأ' : 'Not Started'}</option>
            <option value="in_progress">{isRTL ? 'جاري' : 'In Progress'}</option>
            <option value="completed">{isRTL ? 'مكتمل' : 'Completed'}</option>
          </select>

          {/* Exam Filter */}
          <select
            value={examFilter}
            onChange={(e) => onExamFilterChange(e.target.value)}
            className="px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground min-w-[140px]"
          >
            <option value="all">{isRTL ? 'كل الامتحانات' : 'All Exams'}</option>
            <option value="taken">{isRTL ? 'أجرى امتحان' : 'Taken Exam'}</option>
            <option value="pending">{isRTL ? 'لم يمتحن' : 'Not Taken'}</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground gap-1"
            >
              <X className="w-4 h-4" />
              {isRTL ? 'مسح' : 'Clear'}
            </Button>
          )}
        </div>

        {/* Active Filter Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {academicYearFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                {academicYearFilter === 'second_secondary' 
                  ? (isRTL ? 'الثاني الثانوي' : 'Second Secondary')
                  : (isRTL ? 'الثالث الثانوي' : 'Third Secondary')
                }
              </span>
            )}
            {languageTrackFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                {languageTrackFilter === 'arabic'
                  ? (isRTL ? 'عربي' : 'Arabic')
                  : (isRTL ? 'لغات' : 'Languages')
                }
              </span>
            )}
            {attendanceModeFilter && attendanceModeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                {attendanceModeFilter === 'online' && <Wifi className="h-3 w-3" />}
                {attendanceModeFilter === 'center' && <Building2 className="h-3 w-3" />}
                {attendanceModeFilter === 'hybrid' && <Shuffle className="h-3 w-3" />}
                {attendanceModeFilter === 'online'
                  ? (isRTL ? 'أونلاين' : 'Online')
                  : attendanceModeFilter === 'center'
                  ? (isRTL ? 'سنتر' : 'Center')
                  : (isRTL ? 'هجين' : 'Hybrid')
                }
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};