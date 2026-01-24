import React from 'react';
import { User, Mail, Phone, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getAcademicYearLabel, getLanguageTrackLabel, getFullGroupLabel } from '@/lib/gradeLabels';

interface StudentIdentityCardProps {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  grade: string | null;
  languageTrack: string | null;
  attendanceMode: 'online' | 'center' | 'hybrid' | null;
  centerGroupName: string | null;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
  isArabic: boolean;
}

export const StudentIdentityCard: React.FC<StudentIdentityCardProps> = ({
  fullName,
  email,
  phone,
  grade,
  languageTrack,
  attendanceMode,
  centerGroupName,
  isSuspended,
  createdAt,
  updatedAt,
  isArabic,
}) => {
  const academicLabel = getAcademicYearLabel(grade, isArabic);
  const trackLabel = getLanguageTrackLabel(languageTrack, isArabic);
  const fullGroupLabel = getFullGroupLabel(grade, languageTrack, isArabic);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header Section with Avatar */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center shrink-0">
            <User className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          
          {/* Identity Info */}
          <div className="flex-1 min-w-0">
            {/* Name + Status */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                {fullName || (isArabic ? 'بدون اسم' : 'No Name')}
              </h2>
              {isSuspended && (
                <Badge variant="destructive" className="text-xs">
                  {isArabic ? 'موقوف' : 'Suspended'}
                </Badge>
              )}
            </div>
            
            {/* Academic Path Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Grade Badge */}
              <Badge variant="outline" className="font-medium bg-background/50">
                {academicLabel}
              </Badge>
              
              {/* Track Badge */}
              {languageTrack && (
                <Badge variant="secondary" className="font-medium">
                  {trackLabel}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Study Mode Section */}
      <div className="px-6 py-4 border-t border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {isArabic ? 'نظام الدراسة' : 'Study Mode'}
          </span>
          {attendanceMode === 'center' ? (
            <Badge className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
              {isArabic ? 'سنتر' : 'Center'} – {centerGroupName || (isArabic ? 'بدون مجموعة' : 'No Group')}
            </Badge>
          ) : attendanceMode === 'online' ? (
            <Badge variant="secondary" className="gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {isArabic ? 'أونلاين' : 'Online'}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              {isArabic ? 'غير محدد' : 'Not Set'}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Contact & Dates Grid */}
      <div className="p-6 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {/* Email */}
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0 text-primary/60" />
          <span className="truncate">{email || (isArabic ? 'لا يوجد' : 'N/A')}</span>
        </div>
        
        {/* Phone */}
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <Phone className="h-4 w-4 shrink-0 text-primary/60" />
          <span dir="ltr">{phone || (isArabic ? 'لا يوجد' : 'N/A')}</span>
        </div>
        
        {/* Registration Date */}
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0 text-primary/60" />
          <span>
            {isArabic ? 'تسجيل:' : 'Joined:'}{' '}
            {new Date(createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
          </span>
        </div>
        
        {/* Last Update */}
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0 text-primary/60" />
          <span>
            {isArabic ? 'آخر تحديث:' : 'Updated:'}{' '}
            {new Date(updatedAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
          </span>
        </div>
      </div>
    </div>
  );
};
