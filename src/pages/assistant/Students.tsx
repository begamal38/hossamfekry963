import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, GraduationCap, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { StudentFilters } from '@/components/assistant/StudentFilters';
import { Badge } from '@/components/ui/badge';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  grade: string | null;
  academic_year: string | null;
  language_track: string | null;
  created_at: string;
}

// Helper to get group label
const getGroupLabel = (academicYear: string | null, languageTrack: string | null, isArabic: boolean): string | null => {
  if (!academicYear || !languageTrack) return null;
  
  const yearLabels: Record<string, { ar: string; en: string }> = {
    'second_secondary': { ar: 'الثاني الثانوي', en: 'Second Secondary' },
    'third_secondary': { ar: 'الثالث الثانوي', en: 'Third Secondary' },
  };
  
  const trackLabels: Record<string, { ar: string; en: string }> = {
    'arabic': { ar: 'عربي', en: 'Arabic' },
    'languages': { ar: 'لغات', en: 'Languages' },
  };
  
  const year = yearLabels[academicYear];
  const track = trackLabels[languageTrack];
  if (!year || !track) return null;
  return isArabic ? `${year.ar} - ${track.ar}` : `${year.en} - ${track.en}`;
};

export default function Students() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Profile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('all');
  const [languageTrackFilter, setLanguageTrackFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  const [examFilter, setExamFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
    }
  }, [roleLoading, canAccessDashboard, navigate]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user || !canAccessDashboard()) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, phone, grade, academic_year, language_track, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setStudents(data || []);
        setFilteredStudents(data || []);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!roleLoading && canAccessDashboard()) {
      fetchStudents();
    }
  }, [user, roleLoading, canAccessDashboard]);

  useEffect(() => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.phone?.includes(searchTerm)
      );
    }

    // Academic year filter
    if (academicYearFilter !== 'all') {
      filtered = filtered.filter((s) => s.academic_year === academicYearFilter);
    }

    // Language track filter
    if (languageTrackFilter !== 'all') {
      filtered = filtered.filter((s) => s.language_track === languageTrackFilter);
    }

    // Progress and exam filters would need additional data from enrollments/results
    // For now, they're placeholders

    setFilteredStudents(filtered);
  }, [searchTerm, academicYearFilter, languageTrackFilter, progressFilter, examFilter, students]);

  const clearFilters = () => {
    setSearchTerm('');
    setAcademicYearFilter('all');
    setLanguageTrackFilter('all');
    setProgressFilter('all');
    setExamFilter('all');
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
            <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isRTL ? 'إدارة الطلاب' : 'Student Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL ? `${filteredStudents.length} طالب` : `${filteredStudents.length} students`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <StudentFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          academicYearFilter={academicYearFilter}
          onAcademicYearFilterChange={setAcademicYearFilter}
          languageTrackFilter={languageTrackFilter}
          onLanguageTrackFilterChange={setLanguageTrackFilter}
          progressFilter={progressFilter}
          onProgressFilterChange={setProgressFilter}
          examFilter={examFilter}
          onExamFilterChange={setExamFilter}
          isRTL={isRTL}
          onClearFilters={clearFilters}
        />

        {/* Students List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {isRTL ? 'لا يوجد طلاب' : 'No students found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'الطالب' : 'Student'}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'الهاتف' : 'Phone'}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'المجموعة' : 'Group'}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'تاريخ التسجيل' : 'Registered'}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((student) => {
                    const groupLabel = getGroupLabel(student.academic_year, student.language_track, isRTL);
                    
                    return (
                      <tr 
                        key={student.id} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/assistant/students/${student.user_id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">
                              {student.full_name || (isRTL ? 'بدون اسم' : 'No name')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span dir="ltr">{student.phone || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {groupLabel ? (
                            <Badge variant="secondary" className="font-normal">
                              <GraduationCap className="h-3 w-3 me-1" />
                              {groupLabel}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(student.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="outline" size="sm">
                            {isRTL ? 'عرض التفاصيل' : 'View Details'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}