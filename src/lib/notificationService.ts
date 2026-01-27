/**
 * UNIFIED NOTIFICATION SERVICE (SSOT)
 * 
 * Single Source of Truth for ALL notifications in the platform.
 * Every notification (platform + email) MUST go through this service.
 * 
 * RULES:
 * 1. All notifications use the same targeting logic
 * 2. Email dispatch is controlled by a unified flag
 * 3. Legacy 'hybrid' attendance_mode is normalized to 'online'
 * 4. Staff (admin, assistant_teacher) are ALWAYS excluded from student notifications
 */

import { supabase } from '@/integrations/supabase/client';
import { normalizeAttendanceMode } from './attendanceModeUtils';

// ============= TYPES =============
// Database-compatible notification types only
type DBNotificationType = 
  | 'course_announcement'
  | 'lesson_available'
  | 'lesson_reminder'
  | 'exam_available'
  | 'exam_reminder'
  | 'exam_completed'
  | 'attendance_center'
  | 'attendance_online'
  | 'attendance_followup'
  | 'system_message';

// Extended types for internal use (mapped to system_message for DB)
export type NotificationType = 
  | DBNotificationType
  | 'welcome'
  | 'profile_complete'
  | 'enrollment_confirmed';

export type TargetType = 
  | 'all' 
  | 'course' 
  | 'lesson' 
  | 'user' 
  | 'grade' 
  | 'attendance_mode' 
  | 'center_group';

// Map extended types to DB-compatible types
function toDBNotificationType(type: NotificationType): DBNotificationType {
  if (['welcome', 'profile_complete', 'enrollment_confirmed'].includes(type)) {
    return 'system_message';
  }
  return type as DBNotificationType;
}

export interface NotificationPayload {
  type: NotificationType;
  titleAr: string;
  titleEn?: string;
  messageAr: string;
  messageEn?: string;
  // Targeting
  targetType: TargetType;
  targetId?: string;          // User ID, Course ID, Lesson ID, or Group ID
  targetValue?: string;       // Grade value or attendance_mode value
  // Optional context
  courseId?: string;
  lessonId?: string;
  examId?: string;
  // Email control
  sendEmail?: boolean;        // Default: true
  // Sender
  senderId?: string;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  platformSent: boolean;
  emailsSent: number;
  errors?: string[];
}

// ============= CORE SERVICE =============

/**
 * Send a unified notification (platform + optional email)
 * This is the ONLY way to send notifications in the system.
 */
export async function sendUnifiedNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const result: NotificationResult = {
    success: false,
    platformSent: false,
    emailsSent: 0,
    errors: [],
  };

  try {
    // Auto-translate if English not provided
    let titleEn = payload.titleEn || payload.titleAr;
    let messageEn = payload.messageEn || payload.messageAr;

    if (!payload.titleEn || !payload.messageEn) {
      try {
        const translations = await Promise.all([
          translateText(payload.titleAr),
          translateText(payload.messageAr),
        ]);
        titleEn = translations[0];
        messageEn = translations[1];
      } catch {
        // Use Arabic as fallback
      }
    }

    // 1. Create platform notification
    const notificationData: any = {
      type: toDBNotificationType(payload.type),
      title: titleEn,
      title_ar: payload.titleAr,
      message: messageEn,
      message_ar: payload.messageAr,
      target_type: payload.targetType,
      sender_id: payload.senderId || null,
    };

    // Set target_id and target_value based on targetType
    if (payload.targetType === 'user' && payload.targetId) {
      notificationData.target_id = payload.targetId;
    } else if (payload.targetType === 'course' && payload.targetId) {
      notificationData.target_id = payload.targetId;
      notificationData.course_id = payload.targetId;
    } else if (payload.targetType === 'lesson' && payload.targetId) {
      notificationData.target_id = payload.targetId;
      notificationData.lesson_id = payload.targetId;
      notificationData.course_id = payload.courseId || null;
    } else if (payload.targetType === 'grade' && payload.targetValue) {
      notificationData.target_value = payload.targetValue;
    } else if (payload.targetType === 'attendance_mode' && payload.targetValue) {
      // Normalize legacy hybrid → online
      notificationData.target_value = normalizeAttendanceMode(payload.targetValue as any) || payload.targetValue;
    } else if (payload.targetType === 'center_group' && payload.targetId) {
      notificationData.target_id = payload.targetId;
      notificationData.target_value = payload.targetId;
    }

    // Add optional context
    if (payload.courseId) notificationData.course_id = payload.courseId;
    if (payload.lessonId) notificationData.lesson_id = payload.lessonId;
    if (payload.examId) notificationData.exam_id = payload.examId;

    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select('id')
      .single();

    if (notifError) {
      result.errors?.push(`Platform notification failed: ${notifError.message}`);
      console.error('[NotificationService] Platform error:', notifError);
    } else {
      result.platformSent = true;
      result.notificationId = notification?.id;
    }

    // 2. Send email if enabled (default: true)
    if (payload.sendEmail !== false) {
      try {
        const emailResult = await sendEmailNotification({
          type: payload.type,
          titleAr: payload.titleAr,
          titleEn,
          messageAr: payload.messageAr,
          messageEn,
          targetType: payload.targetType,
          targetId: payload.targetId,
          targetValue: payload.targetValue,
          courseId: payload.courseId,
        });
        result.emailsSent = emailResult.emailsSent;
        if (emailResult.errors?.length) {
          result.errors?.push(...emailResult.errors);
        }
      } catch (emailError: any) {
        result.errors?.push(`Email dispatch error: ${emailError.message}`);
        console.error('[NotificationService] Email error:', emailError);
      }
    }

    result.success = result.platformSent;

  } catch (error: any) {
    result.errors?.push(`Notification service error: ${error.message}`);
    console.error('[NotificationService] Error:', error);
  }

  return result;
}

/**
 * Send notification to multiple specific users
 */
export async function sendBulkUserNotification(
  userIds: string[],
  payload: Omit<NotificationPayload, 'targetType' | 'targetId'>
): Promise<NotificationResult> {
  const result: NotificationResult = {
    success: false,
    platformSent: false,
    emailsSent: 0,
    errors: [],
  };

  if (!userIds.length) {
    result.errors?.push('No users specified');
    return result;
  }

  try {
    // Auto-translate if English not provided
    let titleEn = payload.titleEn || payload.titleAr;
    let messageEn = payload.messageEn || payload.messageAr;

    if (!payload.titleEn || !payload.messageEn) {
      try {
        const translations = await Promise.all([
          translateText(payload.titleAr),
          translateText(payload.messageAr),
        ]);
        titleEn = translations[0];
        messageEn = translations[1];
      } catch {
        // Use Arabic as fallback
      }
    }

    // Create platform notifications for each user
    const notifications = userIds.map(userId => ({
      type: toDBNotificationType(payload.type),
      title: titleEn,
      title_ar: payload.titleAr,
      message: messageEn,
      message_ar: payload.messageAr,
      target_type: 'user' as const,
      target_id: userId,
      sender_id: payload.senderId || null,
      course_id: payload.courseId || null,
      lesson_id: payload.lessonId || null,
      exam_id: payload.examId || null,
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      result.errors?.push(`Platform notifications failed: ${notifError.message}`);
    } else {
      result.platformSent = true;
    }

    // Send emails if enabled
    if (payload.sendEmail !== false) {
      try {
        const { data, error } = await supabase.functions.invoke('send-notification-email', {
          body: {
            student_ids: userIds,
            title: titleEn,
            title_ar: payload.titleAr,
            message: messageEn,
            message_ar: payload.messageAr,
            type: payload.type,
          },
        });

        if (!error && data) {
          result.emailsSent = data.emails_sent || 0;
        }
      } catch {
        // Email failure is non-blocking
      }
    }

    result.success = result.platformSent;

  } catch (error: any) {
    result.errors?.push(`Bulk notification error: ${error.message}`);
  }

  return result;
}

// ============= HELPER FUNCTIONS =============

async function translateText(text: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('translate-content', {
      body: { text, targetLanguage: 'en' },
    });
    if (error) throw error;
    return data?.translatedText || text;
  } catch {
    return text;
  }
}

interface EmailNotificationParams {
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  targetType: TargetType;
  targetId?: string;
  targetValue?: string;
  courseId?: string;
}

async function sendEmailNotification(
  params: EmailNotificationParams
): Promise<{ emailsSent: number; errors?: string[] }> {
  const result = { emailsSent: 0, errors: [] as string[] };

  try {
    const emailPayload: any = {
      title: params.titleEn,
      title_ar: params.titleAr,
      message: params.messageEn,
      message_ar: params.messageAr,
      type: params.type,
      target_type: params.targetType,
    };

    if (params.targetId) {
      emailPayload.target_value = params.targetId;
    }
    if (params.targetValue) {
      emailPayload.target_value = params.targetValue;
    }
    if (params.courseId) {
      emailPayload.course_id = params.courseId;
    }

    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: emailPayload,
    });

    if (error) {
      result.errors.push(error.message);
    } else if (data) {
      result.emailsSent = data.emails_sent || 0;
    }
  } catch (error: any) {
    result.errors.push(error.message);
  }

  return result;
}

// ============= NOTIFICATION MATCHERS (for filtering) =============

/**
 * Check if a notification matches a user's profile.
 * Uses the same logic as NotificationBell and Notifications page.
 */
export function doesNotificationMatchUser(
  notification: {
    target_type: string;
    target_id?: string | null;
    target_value?: string | null;
    course_id?: string | null;
  },
  userProfile: {
    userId: string;
    grade?: string | null;
    attendanceMode?: string | null;
    enrolledCourseIds: string[];
  }
): boolean {
  switch (notification.target_type) {
    case 'user':
      return notification.target_id === userProfile.userId;
    case 'all':
      return true;
    case 'course':
      return notification.course_id 
        ? userProfile.enrolledCourseIds.includes(notification.course_id)
        : false;
    case 'lesson':
      return notification.course_id 
        ? userProfile.enrolledCourseIds.includes(notification.course_id)
        : false;
    case 'grade':
      return notification.target_value === userProfile.grade;
    case 'attendance_mode':
      // Normalize both sides for comparison (hybrid → online)
      const normalizedUserMode = normalizeAttendanceMode(userProfile.attendanceMode as any);
      const normalizedTargetMode = normalizeAttendanceMode(notification.target_value as any);
      return normalizedUserMode === normalizedTargetMode;
    default:
      return false;
  }
}

// ============= SPECIALIZED SENDERS =============

/**
 * Send welcome email to a new user
 */
export async function sendWelcomeNotification(
  userId: string,
  email: string,
  fullName?: string
): Promise<void> {
  try {
    await supabase.functions.invoke('send-welcome-email', {
      body: {
        user_id: userId,
        email,
        full_name: fullName || null,
      },
    });
    console.log('[NotificationService] Welcome email sent to:', email);
  } catch (error) {
    console.warn('[NotificationService] Welcome email failed:', error);
  }
}

/**
 * Notify user of successful profile completion
 */
export async function notifyProfileComplete(
  userId: string,
  email: string,
  fullName?: string,
  isGoogleUser = false
): Promise<void> {
  // For Google users who just completed their profile, send welcome email
  if (isGoogleUser) {
    await sendWelcomeNotification(userId, email, fullName);
  }

  // Create platform notification (silent, no email)
  await sendUnifiedNotification({
    type: 'profile_complete',
    titleAr: 'تم استكمال البيانات',
    messageAr: 'مرحباً بك في المنصة! يمكنك الآن استكشاف الكورسات.',
    targetType: 'user',
    targetId: userId,
    sendEmail: false, // Welcome email already sent above if applicable
  });
}

/**
 * Notify user of course enrollment
 */
export async function notifyEnrollmentConfirmed(
  userId: string,
  courseTitleAr: string,
  courseId: string
): Promise<void> {
  await sendUnifiedNotification({
    type: 'enrollment_confirmed',
    titleAr: 'تم تأكيد الاشتراك',
    messageAr: `تم تسجيلك في كورس "${courseTitleAr}" بنجاح.`,
    targetType: 'user',
    targetId: userId,
    courseId,
    sendEmail: true,
  });
}
