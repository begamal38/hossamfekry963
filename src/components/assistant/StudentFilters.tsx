import React from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StudentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  gradeFilter: string;
  onGradeFilterChange: (value: string) => void;
  progressFilter: string;
  onProgressFilterChange: (value: string) => void;
  examFilter: string;
  onExamFilterChange: (value: string) => void;
  isRTL?: boolean;
  onClearFilters?: () => void;
}

export const StudentFilters: React.FC<StudentFiltersProps> = ({
  searchTerm,
  onSearchChange,
  gradeFilter,
  onGradeFilterChange,
  progressFilter,
  onProgressFilterChange,
  examFilter,
  onExamFilterChange,
  isRTL,
  onClearFilters,
}) => {
  const hasActiveFilters = gradeFilter !== 'all' || progressFilter !== 'all' || examFilter !== 'all';

  return (
    <div className="bg-card rounded-xl border border-border p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
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
          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => onGradeFilterChange(e.target.value)}
            className="px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground min-w-[140px]"
          >
            <option value="all">{isRTL ? 'جميع المراحل' : 'All Grades'}</option>
            <option value="first">{isRTL ? 'الصف الأول' : '1st Secondary'}</option>
            <option value="second_arabic">{isRTL ? 'ثانية عربي' : '2nd Arabic'}</option>
            <option value="second_languages">{isRTL ? 'ثانية لغات' : '2nd Languages'}</option>
            <option value="third_arabic">{isRTL ? 'ثالثة عربي' : '3rd Arabic'}</option>
            <option value="third_languages">{isRTL ? 'ثالثة لغات' : '3rd Languages'}</option>
          </select>

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
              className="text-muted-foreground"
            >
              {isRTL ? 'مسح الفلاتر' : 'Clear Filters'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
