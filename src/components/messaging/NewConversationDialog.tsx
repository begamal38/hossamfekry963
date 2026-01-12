import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Student {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  grade: string | null;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectStudent: (studentId: string) => void;
  isRTL?: boolean;
}

export const NewConversationDialog: React.FC<NewConversationDialogProps> = ({
  open,
  onOpenChange,
  onSelectStudent,
  isRTL = true
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = students.filter(s =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.includes(searchTerm)
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Get all student user IDs
      const { data: studentRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (!studentRoles || studentRoles.length === 0) {
        setStudents([]);
        setFilteredStudents([]);
        return;
      }

      // Get profiles for students
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, grade')
        .in('user_id', studentRoles.map(r => r.user_id))
        .order('full_name');

      setStudents(profiles || []);
      setFilteredStudents(profiles || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = async (studentId: string) => {
    setSelecting(studentId);
    try {
      await onSelectStudent(studentId);
      onOpenChange(false);
      setSearchTerm('');
    } finally {
      setSelecting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {isRTL ? 'محادثة جديدة' : 'New Conversation'}
          </DialogTitle>
          <DialogDescription>
            {isRTL ? 'اختر طالب لبدء محادثة معه' : 'Select a student to start a conversation'}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
            isRTL ? "right-3" : "left-3"
          )} />
          <Input
            placeholder={isRTL ? 'ابحث بالاسم أو الموبايل...' : 'Search by name or phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(isRTL ? "pr-10" : "pl-10")}
          />
        </div>

        {/* Students List */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 min-h-[200px] max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                {searchTerm 
                  ? (isRTL ? 'لا يوجد نتائج' : 'No results found')
                  : (isRTL ? 'لا يوجد طلاب' : 'No students found')
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredStudents.map((student) => (
                <button
                  key={student.user_id}
                  onClick={() => handleSelectStudent(student.user_id)}
                  disabled={selecting !== null}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-right",
                    selecting === student.user_id && "bg-primary/5"
                  )}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {student.full_name?.charAt(0) || '؟'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {student.full_name || (isRTL ? 'بدون اسم' : 'No name')}
                    </h3>
                    {student.phone && (
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {student.phone}
                      </p>
                    )}
                  </div>

                  {/* Loading indicator */}
                  {selecting === student.user_id && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};