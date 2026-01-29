import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  CheckCircle2, 
  XCircle,
  Trophy,
  Clock,
  Eye
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale/ar';
import { enUS } from 'date-fns/locale/en-US';

interface Exam {
  id: string;
  title: string;
  title_ar: string;
  pass_mark: number;
  max_score: number;
  course?: { title: string; title_ar: string };
  chapter?: { title: string; title_ar: string };
}

interface ExamAttempt {
  id: string;
  user_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  answers: unknown;
  profile?: {
    full_name: string;
    phone: string;
    grade: string;
  };
}

interface ExamStats {
  totalAttempts: number;
  passedCount: number;
  failedCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
}

export default function ExamResults() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [exam, setExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [stats, setStats] = useState<ExamStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examId) {
      fetchExamData();
    }
  }, [examId]);

  const fetchExamData = async () => {
    try {
      // Fetch exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(`
          *,
          course:courses (title, title_ar),
          chapter:chapters (title, title_ar)
        `)
        .eq('id', examId)
        .single();

      if (examError) throw examError;
      setExam(examData);

      // Fetch attempts - using exam_attempts table which has detailed answer data
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false });

      if (attemptsError) {
        console.error('Error fetching exam_attempts:', attemptsError);
        throw attemptsError;
      }

      // Fetch profiles for each attempt
      const userIds = [...new Set(attemptsData?.map(a => a.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, grade')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const attemptsWithProfiles = (attemptsData || []).map(attempt => ({
        ...attempt,
        profile: profilesMap.get(attempt.user_id),
      }));

      setAttempts(attemptsWithProfiles);

      // Calculate stats
      if (attemptsData && attemptsData.length > 0) {
        const scores = attemptsData.map(a => (a.score / a.total_questions) * 100);
        const passMark = examData.pass_mark || 60;
        
        setStats({
          totalAttempts: attemptsData.length,
          passedCount: scores.filter(s => s >= passMark).length,
          failedCount: scores.filter(s => s < passMark).length,
          averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          highestScore: Math.round(Math.max(...scores)),
          lowestScore: Math.round(Math.min(...scores)),
        });
      }
    } catch (error) {
      console.error('Error fetching exam data:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في تحميل البيانات' : 'Failed to load data',
      });
    } finally {
      setLoading(false);
    }
  };

  const getScorePercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100);
  };

  const isPassed = (score: number, total: number) => {
    return getScorePercentage(score, total) >= (exam?.pass_mark || 60);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-muted-foreground">
              {isArabic ? 'الامتحان غير موجود' : 'Exam not found'}
            </p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              {isArabic ? 'العودة' : 'Go Back'}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="pt-24 pb-16 content-appear">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="mb-4 gap-2"
            >
              <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
              {isArabic ? 'العودة' : 'Back'}
            </Button>

            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              {isArabic ? 'نتائج الامتحان' : 'Exam Results'}
            </h1>
            <p className="text-muted-foreground">
              {isArabic ? exam.title_ar : exam.title}
              {exam.chapter && ` • ${isArabic ? exam.chapter.title_ar : exam.chapter.title}`}
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'إجمالي المحاولات' : 'Total Attempts'}
                      </p>
                      <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'ناجحين' : 'Passed'}
                      </p>
                      <p className="text-2xl font-bold text-green-600">{stats.passedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'راسبين' : 'Failed'}
                      </p>
                      <p className="text-2xl font-bold text-red-600">{stats.failedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'متوسط الدرجات' : 'Average Score'}
                      </p>
                      <p className="text-2xl font-bold">{stats.averageScore}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Score Range */}
          {stats && (
            <Card className="mb-8">
              <CardContent className="py-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{isArabic ? 'أقل درجة:' : 'Lowest:'}</span>
                    <Badge variant="outline" className="bg-red-500/10 text-red-600">
                      {stats.lowestScore}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{isArabic ? 'درجة النجاح:' : 'Pass Mark:'}</span>
                    <Badge variant="secondary">{exam.pass_mark}%</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{isArabic ? 'أعلى درجة:' : 'Highest:'}</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">
                      {stats.highestScore}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attempts Table */}
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? 'المحاولات' : 'Attempts'}</CardTitle>
              <CardDescription>
                {isArabic ? 'قائمة بجميع محاولات الطلاب' : 'List of all student attempts'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {isArabic ? 'لا توجد محاولات بعد' : 'No attempts yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isArabic ? 'الطالب' : 'Student'}</TableHead>
                        <TableHead>{isArabic ? 'الهاتف' : 'Phone'}</TableHead>
                        <TableHead>{isArabic ? 'الدرجة' : 'Score'}</TableHead>
                        <TableHead>{isArabic ? 'النتيجة' : 'Result'}</TableHead>
                        <TableHead>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attempts.map((attempt) => {
                        const percentage = getScorePercentage(attempt.score, attempt.total_questions);
                        const passed = isPassed(attempt.score, attempt.total_questions);
                        
                        return (
                          <TableRow key={attempt.id}>
                            <TableCell className="font-medium">
                              {attempt.profile?.full_name || (isArabic ? 'غير معروف' : 'Unknown')}
                            </TableCell>
                            <TableCell dir="ltr">
                              {attempt.profile?.phone || '-'}
                            </TableCell>
                            <TableCell>
                              <span className={cn(
                                "font-bold",
                                passed ? "text-green-600" : "text-red-600"
                              )}>
                                {attempt.score}/{attempt.total_questions}
                              </span>
                              <span className="text-muted-foreground ms-2">
                                ({percentage}%)
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={passed ? "default" : "destructive"}>
                                {passed 
                                  ? (isArabic ? 'ناجح' : 'Passed')
                                  : (isArabic ? 'راسب' : 'Failed')
                                }
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {attempt.completed_at && format(
                                new Date(attempt.completed_at),
                                'dd MMM yyyy HH:mm',
                                { locale: isArabic ? ar : enUS }
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}