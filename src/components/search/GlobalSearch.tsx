import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, FileText, HelpCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'course' | 'lesson' | 'exam';
  title: string;
  subtitle?: string;
  link: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const isArabic = language === 'ar';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    const searchContent = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      const searchResults: SearchResult[] = [];

      // Search courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, title_ar, grade')
        .or(`title.ilike.%${query}%,title_ar.ilike.%${query}%`)
        .limit(5);

      if (courses) {
        courses.forEach(course => {
          searchResults.push({
            id: course.id,
            type: 'course',
            title: isArabic ? course.title_ar : course.title,
            subtitle: course.grade,
            link: `/course/${course.id}`
          });
        });
      }

      // Search lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, title_ar, course:courses(title, title_ar)')
        .or(`title.ilike.%${query}%,title_ar.ilike.%${query}%`)
        .limit(5);

      if (lessons) {
        lessons.forEach(lesson => {
          const course = lesson.course as unknown as { title: string; title_ar: string } | null;
          searchResults.push({
            id: lesson.id,
            type: 'lesson',
            title: isArabic ? lesson.title_ar : lesson.title,
            subtitle: course ? (isArabic ? course.title_ar : course.title) : undefined,
            link: `/lesson/${lesson.id}`
          });
        });
      }

      // Search exams
      const { data: exams } = await supabase
        .from('exams')
        .select('id, title, title_ar, course:courses(title, title_ar)')
        .or(`title.ilike.%${query}%,title_ar.ilike.%${query}%`)
        .limit(5);

      if (exams) {
        exams.forEach(exam => {
          const course = exam.course as unknown as { title: string; title_ar: string } | null;
          searchResults.push({
            id: exam.id,
            type: 'exam',
            title: isArabic ? exam.title_ar : exam.title,
            subtitle: course ? (isArabic ? course.title_ar : course.title) : undefined,
            link: `/courses` // Exams are accessed through courses
          });
        });
      }

      setResults(searchResults);
      setLoading(false);
    };

    const debounce = setTimeout(searchContent, 300);
    return () => clearTimeout(debounce);
  }, [query, isArabic]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.link);
    onClose();
    setQuery('');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-5 h-5" />;
      case 'lesson': return <FileText className="w-5 h-5" />;
      case 'exam': return <HelpCircle className="w-5 h-5" />;
      default: return <Search className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'course': return isArabic ? 'كورس' : 'Course';
      case 'lesson': return isArabic ? 'حصة' : 'Lesson';
      case 'exam': return isArabic ? 'امتحان' : 'Exam';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl px-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={isArabic ? 'ابحث عن كورسات، حصص، امتحانات...' : 'Search courses, lessons, exams...'}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 text-lg"
            />
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="p-8 text-center text-muted-foreground">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{isArabic ? 'مفيش نتايج للبحث ده' : 'No results found'}</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "w-full flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors text-start",
                      index !== results.length - 1 && "border-b border-border/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                      {getTypeLabel(result.type)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">
                  {isArabic ? 'اكتب حرفين على الأقل للبحث' : 'Type at least 2 characters to search'}
                </p>
              </div>
            )}
          </div>

          {/* Keyboard hint */}
          <div className="px-4 py-2 bg-muted/50 border-t border-border text-xs text-muted-foreground">
            <span>{isArabic ? 'اضغط ESC للإغلاق' : 'Press ESC to close'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
