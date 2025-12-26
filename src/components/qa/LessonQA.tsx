import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, User, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question: string;
  user_id: string;
  created_at: string;
  is_answered: boolean;
  profile?: {
    full_name: string | null;
  };
  answers?: Answer[];
}

interface Answer {
  id: string;
  answer: string;
  answered_by: string;
  created_at: string;
  profile?: {
    full_name: string | null;
  };
}

interface LessonQAProps {
  lessonId: string;
}

export const LessonQA: React.FC<LessonQAProps> = ({ lessonId }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { canAccessDashboard } = useUserRole();
  const isArabic = language === 'ar';
  const isStaff = canAccessDashboard();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('lesson_questions')
      .select(`
        id,
        question,
        user_id,
        created_at,
        is_answered
      `)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questions:', error);
      setLoading(false);
      return;
    }

    // Fetch answers for each question
    const questionsWithAnswers = await Promise.all(
      (data || []).map(async (q) => {
        const { data: answers } = await supabase
          .from('lesson_answers')
          .select('id, answer, answered_by, created_at')
          .eq('question_id', q.id)
          .order('created_at', { ascending: true });

        // Fetch profile for question asker
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', q.user_id)
          .maybeSingle();

        return {
          ...q,
          profile,
          answers: answers || []
        };
      })
    );

    setQuestions(questionsWithAnswers);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, [lessonId]);

  const handleSubmitQuestion = async () => {
    if (!user || !newQuestion.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from('lesson_questions').insert({
      lesson_id: lessonId,
      user_id: user.id,
      question: newQuestion.trim()
    });

    if (error) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'مقدرش أبعت السؤال' : 'Could not submit question',
        variant: 'destructive'
      });
    } else {
      toast({
        title: isArabic ? 'تم' : 'Success',
        description: isArabic ? 'تم إرسال سؤالك' : 'Your question has been submitted'
      });
      setNewQuestion('');
      fetchQuestions();
    }
    setSubmitting(false);
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!user || !replyText.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from('lesson_answers').insert({
      question_id: questionId,
      answered_by: user.id,
      answer: replyText.trim()
    });

    if (!error) {
      // Mark question as answered
      await supabase
        .from('lesson_questions')
        .update({ is_answered: true })
        .eq('id', questionId);

      toast({
        title: isArabic ? 'تم' : 'Success',
        description: isArabic ? 'تم إرسال الرد' : 'Answer submitted'
      });
      setReplyTo(null);
      setReplyText('');
      fetchQuestions();
    }
    setSubmitting(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <div className="mt-8 border-t border-border pt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {isArabic ? 'أسئلة الطلاب' : 'Student Questions'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isArabic ? 'اسأل سؤالك وهيتم الرد عليه' : 'Ask your question and get answers'}
          </p>
        </div>
      </div>

      {/* Ask Question */}
      {!isStaff && (
        <Card className="p-4 mb-6">
          <Textarea
            placeholder={isArabic ? 'اكتب سؤالك هنا...' : 'Type your question here...'}
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            className="mb-3 min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitQuestion}
              disabled={!newQuestion.trim() || submitting}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {isArabic ? 'إرسال السؤال' : 'Submit Question'}
            </Button>
          </div>
        </Card>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{isArabic ? 'لسه مفيش أسئلة' : 'No questions yet'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map(q => (
            <Card key={q.id} className="p-4">
              {/* Question */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-foreground">
                      {q.profile?.full_name || (isArabic ? 'طالب' : 'Student')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(q.created_at)}
                    </span>
                    <Badge 
                      variant={q.is_answered ? 'default' : 'secondary'} 
                      className={cn(
                        "text-xs",
                        q.is_answered && "bg-green-100 text-green-700"
                      )}
                    >
                      {q.is_answered 
                        ? (isArabic ? 'تم الرد' : 'Answered')
                        : (isArabic ? 'في انتظار الرد' : 'Pending')
                      }
                    </Badge>
                  </div>
                  <p className="text-foreground">{q.question}</p>
                </div>
              </div>

              {/* Answers */}
              {q.answers && q.answers.length > 0 && (
                <div className="mt-4 ms-11 space-y-3">
                  {q.answers.map(answer => (
                    <div key={answer.id} className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          {isArabic ? 'رد المدرس' : 'Teacher Response'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(answer.created_at)}
                        </span>
                      </div>
                      <p className="text-foreground text-sm">{answer.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply button for staff */}
              {isStaff && !q.is_answered && (
                <div className="mt-4 ms-11">
                  {replyTo === q.id ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder={isArabic ? 'اكتب ردك...' : 'Type your answer...'}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setReplyTo(null);
                            setReplyText('');
                          }}
                        >
                          {isArabic ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button
                          onClick={() => handleSubmitAnswer(q.id)}
                          disabled={!replyText.trim() || submitting}
                        >
                          {isArabic ? 'إرسال الرد' : 'Submit Answer'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReplyTo(q.id)}
                    >
                      {isArabic ? 'رد على السؤال' : 'Reply'}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
