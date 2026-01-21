import React from 'react';
import { User, Phone, GraduationCap, TrendingUp, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StudentTableRowData {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  grade?: string;
  enrolledCourses: number;
  completedLessons: number;
  totalLessons: number;
  examsTaken: number;
  registeredAt: string;
}

interface StudentTableProps {
  students: StudentTableRowData[];
  isRTL?: boolean;
  onViewStudent?: (userId: string) => void;
}

// Supports both normalized format (second_secondary) and legacy combined format
const gradeLabels: Record<string, { ar: string; en: string }> = {
  'first': { ar: 'أولى ثانوي', en: '1st Sec' },
  'second_secondary': { ar: 'تانية ثانوي', en: '2nd Sec' },
  'third_secondary': { ar: 'تالته ثانوي', en: '3rd Sec' },
  // Legacy combined format (kept for backwards compatibility)
  'second_arabic': { ar: 'ثانية عربي', en: '2nd Arabic' },
  'second_languages': { ar: 'ثانية لغات', en: '2nd Lang' },
  'third_arabic': { ar: 'ثالثة عربي', en: '3rd Arabic' },
  'third_languages': { ar: 'ثالثة لغات', en: '3rd Lang' },
  'grade_1': { ar: 'الصف الأول', en: 'Grade 1' },
  'grade_2': { ar: 'الصف الثاني', en: 'Grade 2' },
  'grade_3': { ar: 'الصف الثالث', en: 'Grade 3' },
};

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  isRTL,
  onViewStudent,
}) => {
  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-muted-foreground">
          {isRTL ? 'لا يوجد طلاب' : 'No students found'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-4 py-3 text-start text-sm font-medium text-muted-foreground">
              {isRTL ? 'الطالب' : 'Student'}
            </th>
            <th className="px-4 py-3 text-start text-sm font-medium text-muted-foreground hidden md:table-cell">
              {isRTL ? 'الهاتف' : 'Phone'}
            </th>
            <th className="px-4 py-3 text-start text-sm font-medium text-muted-foreground">
              {isRTL ? 'المرحلة' : 'Grade'}
            </th>
            <th className="px-4 py-3 text-start text-sm font-medium text-muted-foreground hidden lg:table-cell">
              {isRTL ? 'التقدم' : 'Progress'}
            </th>
            <th className="px-4 py-3 text-start text-sm font-medium text-muted-foreground hidden sm:table-cell">
              {isRTL ? 'الكورسات' : 'Courses'}
            </th>
            <th className="px-4 py-3 text-start text-sm font-medium text-muted-foreground hidden sm:table-cell">
              {isRTL ? 'الامتحانات' : 'Exams'}
            </th>
            <th className="px-4 py-3 text-end text-sm font-medium text-muted-foreground">
              {isRTL ? 'الإجراءات' : 'Actions'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {students.map((student) => {
            const progressPercent = student.totalLessons > 0 
              ? Math.round((student.completedLessons / student.totalLessons) * 100) 
              : 0;
            const gradeLabel = student.grade && gradeLabels[student.grade] 
              ? (isRTL ? gradeLabels[student.grade].ar : gradeLabels[student.grade].en)
              : '-';

            return (
              <tr 
                key={student.id} 
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground truncate max-w-[150px]">
                      {student.name || (isRTL ? 'بدون اسم' : 'No name')}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="text-muted-foreground" dir="ltr">
                    {student.phone || '-'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <Badge variant="secondary" className="text-xs">
                    {gradeLabel}
                  </Badge>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress value={progressPercent} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground w-10">{progressPercent}%</span>
                  </div>
                </td>
                <td className="px-4 py-4 hidden sm:table-cell">
                  <span className="text-foreground font-medium">{student.enrolledCourses}</span>
                </td>
                <td className="px-4 py-4 hidden sm:table-cell">
                  <span className="text-foreground font-medium">{student.examsTaken}</span>
                </td>
                <td className="px-4 py-4 text-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onViewStudent?.(student.userId)}
                    className="gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">{isRTL ? 'عرض' : 'View'}</span>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
