import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, User, Phone, GraduationCap, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  grade: string | null;
  created_at: string;
}

const gradeLabels: Record<string, string> = {
  'grade_1': 'الصف الأول الثانوي',
  'grade_2': 'الصف الثاني الثانوي',
  'grade_3': 'الصف الثالث الثانوي',
};

export default function Students() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Profile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

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
          .select('*')
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

    // Grade filter
    if (gradeFilter !== 'all') {
      filtered = filtered.filter((s) => s.grade === gradeFilter);
    }

    setFilteredStudents(filtered);
  }, [searchTerm, gradeFilter, students]);

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
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRTL ? 'بحث بالاسم أو رقم الهاتف...' : 'Search by name or phone...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10"
              />
            </div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-4 py-2 bg-background border border-input rounded-lg text-foreground"
            >
              <option value="all">{isRTL ? 'جميع المراحل' : 'All Grades'}</option>
              <option value="grade_1">{isRTL ? 'الصف الأول' : 'Grade 1'}</option>
              <option value="grade_2">{isRTL ? 'الصف الثاني' : 'Grade 2'}</option>
              <option value="grade_3">{isRTL ? 'الصف الثالث' : 'Grade 3'}</option>
            </select>
          </div>
        </div>

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
                      {isRTL ? 'المرحلة' : 'Grade'}
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
                  {filteredStudents.map((student) => (
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
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {student.grade ? (gradeLabels[student.grade] || student.grade) : '-'}
                          </span>
                        </div>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
