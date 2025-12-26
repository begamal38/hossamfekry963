export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      course_enrollments: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          completed_lessons: number | null
          course_id: string
          enrolled_at: string
          id: string
          progress: number | null
          status: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          completed_lessons?: number | null
          course_id: string
          enrolled_at?: string
          id?: string
          progress?: number | null
          status?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          completed_lessons?: number | null
          course_id?: string
          enrolled_at?: string
          id?: string
          progress?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          duration_hours: number | null
          grade: string
          id: string
          is_free: boolean | null
          lessons_count: number | null
          price: number | null
          thumbnail_url: string | null
          title: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          duration_hours?: number | null
          grade: string
          id?: string
          is_free?: boolean | null
          lessons_count?: number | null
          price?: number | null
          thumbnail_url?: string | null
          title: string
          title_ar: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          duration_hours?: number | null
          grade?: string
          id?: string
          is_free?: boolean | null
          lessons_count?: number | null
          price?: number | null
          thumbnail_url?: string | null
          title?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          notes: string | null
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          notes?: string | null
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          notes?: string | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          course_id: string
          created_at: string
          exam_date: string | null
          id: string
          max_score: number
          title: string
          title_ar: string
        }
        Insert: {
          course_id: string
          created_at?: string
          exam_date?: string | null
          id?: string
          max_score?: number
          title: string
          title_ar: string
        }
        Update: {
          course_id?: string
          created_at?: string
          exam_date?: string | null
          id?: string
          max_score?: number
          title?: string
          title_ar?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_answers: {
        Row: {
          answer: string
          answered_by: string
          created_at: string
          id: string
          question_id: string
        }
        Insert: {
          answer: string
          answered_by: string
          created_at?: string
          id?: string
          question_id: string
        }
        Update: {
          answer?: string
          answered_by?: string
          created_at?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "lesson_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_attendance: {
        Row: {
          attendance_type: Database["public"]["Enums"]["attendance_type"]
          attended_at: string
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          attendance_type?: Database["public"]["Enums"]["attendance_type"]
          attended_at?: string
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          attendance_type?: Database["public"]["Enums"]["attendance_type"]
          attended_at?: string
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_attendance_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_questions: {
        Row: {
          created_at: string
          id: string
          is_answered: boolean | null
          lesson_id: string
          question: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_answered?: boolean | null
          lesson_id: string
          question: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_answered?: boolean | null
          lesson_id?: string
          question?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          lesson_type: string
          order_index: number | null
          title: string
          title_ar: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          lesson_type?: string
          order_index?: number | null
          title: string
          title_ar: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          lesson_type?: string
          order_index?: number | null
          title?: string
          title_ar?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          course_id: string | null
          created_at: string
          exam_id: string | null
          id: string
          lesson_id: string | null
          message: string
          message_ar: string
          sender_id: string | null
          target_id: string | null
          target_type: Database["public"]["Enums"]["notification_target_type"]
          target_value: string | null
          title: string
          title_ar: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          exam_id?: string | null
          id?: string
          lesson_id?: string | null
          message: string
          message_ar: string
          sender_id?: string | null
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["notification_target_type"]
          target_value?: string | null
          title: string
          title_ar: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          course_id?: string | null
          created_at?: string
          exam_id?: string | null
          id?: string
          lesson_id?: string | null
          message?: string
          message_ar?: string
          sender_id?: string | null
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["notification_target_type"]
          target_value?: string | null
          title?: string
          title_ar?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_attempts: {
        Row: {
          attempted_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_answer: boolean | null
          selected_option: number | null
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_answer?: boolean | null
          selected_option?: number | null
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_answer?: boolean | null
          selected_option?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "practice_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_questions: {
        Row: {
          correct_answer: boolean | null
          created_at: string
          explanation: string | null
          explanation_ar: string | null
          id: string
          lesson_id: string
          options: Json | null
          order_index: number | null
          question: string
          question_ar: string
          question_type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          correct_answer?: boolean | null
          created_at?: string
          explanation?: string | null
          explanation_ar?: string | null
          id?: string
          lesson_id: string
          options?: Json | null
          order_index?: number | null
          question: string
          question_ar: string
          question_type?: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          correct_answer?: boolean | null
          created_at?: string
          explanation?: string | null
          explanation_ar?: string | null
          id?: string
          lesson_id?: string
          options?: Json | null
          order_index?: number | null
          question?: string
          question_ar?: string
          question_type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "practice_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          academic_year: string | null
          attendance_mode: Database["public"]["Enums"]["attendance_mode"]
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          grade: string | null
          language_track: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_year?: string | null
          attendance_mode?: Database["public"]["Enums"]["attendance_mode"]
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          grade?: string | null
          language_track?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_year?: string | null
          attendance_mode?: Database["public"]["Enums"]["attendance_mode"]
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          grade?: string | null
          language_track?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          browser_info: string | null
          created_at: string
          device_fingerprint: string
          device_name: string | null
          first_seen_at: string
          id: string
          is_primary: boolean | null
          last_seen_at: string
          user_id: string
        }
        Insert: {
          browser_info?: string | null
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          first_seen_at?: string
          id?: string
          is_primary?: boolean | null
          last_seen_at?: string
          user_id: string
        }
        Update: {
          browser_info?: string | null
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          first_seen_at?: string
          id?: string
          is_primary?: boolean | null
          last_seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          device_id: string | null
          ended_at: string | null
          ended_reason: string | null
          id: string
          is_active: boolean | null
          session_token: string
          started_at: string
          user_id: string
        }
        Insert: {
          device_id?: string | null
          ended_at?: string | null
          ended_reason?: string | null
          id?: string
          is_active?: boolean | null
          session_token: string
          started_at?: string
          user_id: string
        }
        Update: {
          device_id?: string | null
          ended_at?: string | null
          ended_reason?: string | null
          id?: string
          is_active?: boolean | null
          session_token?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "user_devices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "assistant_teacher" | "student"
      attendance_mode: "online" | "center" | "hybrid"
      attendance_type: "center" | "online"
      notification_target_type:
        | "all"
        | "course"
        | "lesson"
        | "user"
        | "grade"
        | "attendance_mode"
      notification_type:
        | "course_announcement"
        | "lesson_available"
        | "lesson_reminder"
        | "exam_available"
        | "exam_reminder"
        | "exam_completed"
        | "attendance_center"
        | "attendance_online"
        | "attendance_followup"
        | "system_message"
      question_type: "mcq" | "true_false"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "assistant_teacher", "student"],
      attendance_mode: ["online", "center", "hybrid"],
      attendance_type: ["center", "online"],
      notification_target_type: [
        "all",
        "course",
        "lesson",
        "user",
        "grade",
        "attendance_mode",
      ],
      notification_type: [
        "course_announcement",
        "lesson_available",
        "lesson_reminder",
        "exam_available",
        "exam_reminder",
        "exam_completed",
        "attendance_center",
        "attendance_online",
        "attendance_followup",
        "system_message",
      ],
      question_type: ["mcq", "true_false"],
    },
  },
} as const
