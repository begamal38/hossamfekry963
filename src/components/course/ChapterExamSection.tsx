import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Play, CheckCircle2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ChapterExamSectionProps {
  chapterId: string;
  isArabic: boolean;
}

interface Exam {
  id: string;
  title: string;
  title_ar: string;
  max_score: number;
  questions_count?: number;
}

interface ExamAttempt {
  score: number;
  total_questions: number;
}

export const ChapterExamSection: React.FC<ChapterExamSectionProps> = ({
  chapterId,
  isArabic,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExam();
  }, [chapterId, user]);

  const fetchExam = async () => {
    try {
      // Fetch exam for this chapter
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('chapter_id', chapterId)
        .maybeSingle();

      if (examError) throw examError;
      
      if (!examData) {
        setLoading(false);
        return;
      }

      // Get question count
      const { count } = await supabase
        .from('exam_questions')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examData.id);

      setExam({ ...examData, questions_count: count || 0 });

      // Check for user attempt
      if (user) {
        const { data: attemptData } = await supabase
          .from('exam_attempts')
          .select('score, total_questions')
          .eq('exam_id', examData.id)
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .maybeSingle();

        if (attemptData) {
          setAttempt(attemptData);
        }
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!exam || (exam.questions_count || 0) === 0) {
    return null;
  }

  const hasCompleted = !!attempt;
  const percentage = attempt ? Math.round((attempt.score / attempt.total_questions) * 100) : 0;
  const passed = percentage >= 60;

  return (
    <Card className={cn(
      "border-2 transition-all",
      hasCompleted 
        ? passed ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"
        : "border-primary/30 bg-primary/5"
    )}>
      <CardContent className="py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              hasCompleted 
                ? passed ? "bg-green-500/10" : "bg-amber-500/10"
                : "bg-primary/10"
            )}>
              {hasCompleted ? (
                passed ? <Trophy className="w-6 h-6 text-green-500" /> : <FileText className="w-6 h-6 text-amber-500" />
              ) : (
                <FileText className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                {isArabic ? 'اختبار الباب' : 'Chapter Exam'}
                {hasCompleted && (
                  <Badge className={passed ? "bg-green-500" : "bg-amber-500"}>
                    {attempt?.score}/{attempt?.total_questions}
                  </Badge>
                )}
              </h4>
              <p className="text-sm text-muted-foreground">
                {exam.questions_count} {isArabic ? 'سؤال' : 'questions'}
                {hasCompleted && ` • ${percentage}%`}
              </p>
            </div>
          </div>

          <Button
            onClick={() => navigate(`/exam/${exam.id}`)}
            variant={hasCompleted ? "outline" : "default"}
            className="gap-2"
          >
            {hasCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {isArabic ? 'عرض النتيجة' : 'View Result'}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {isArabic ? 'ابدأ الاختبار' : 'Start Exam'}
              </>
            )}
          </Button>
        </div>

        {!hasCompleted && (
          <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
            {isArabic 
              ? 'الاختبار ده عشان تتأكد إنك فاهم الباب كويس 👌'
              : 'This exam is to make sure you understand the chapter well 👌'
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
};
