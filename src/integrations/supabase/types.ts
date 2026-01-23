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
      assistant_action_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          assistant_id: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          assistant_id: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          assistant_id?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: []
      }
      assistant_teacher_permissions: {
        Row: {
          can_export_students: boolean
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_export_students?: boolean
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_export_students?: boolean
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      center_group_members: {
        Row: {
          enrolled_at: string
          group_id: string
          id: string
          is_active: boolean
          student_id: string
        }
        Insert: {
          enrolled_at?: string
          group_id: string
          id?: string
          is_active?: boolean
          student_id: string
        }
        Update: {
          enrolled_at?: string
          group_id?: string
          id?: string
          is_active?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "center_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      center_group_transfers: {
        Row: {
          created_at: string
          id: string
          new_group_id: string
          performed_by: string
          previous_group_id: string | null
          reason: string | null
          student_id: string
          transferred_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_group_id: string
          performed_by: string
          previous_group_id?: string | null
          reason?: string | null
          student_id: string
          transferred_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          new_group_id?: string
          performed_by?: string
          previous_group_id?: string | null
          reason?: string | null
          student_id?: string
          transferred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_group_transfers_new_group_id_fkey"
            columns: ["new_group_id"]
            isOneToOne: false
            referencedRelation: "center_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "center_group_transfers_previous_group_id_fkey"
            columns: ["previous_group_id"]
            isOneToOne: false
            referencedRelation: "center_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      center_groups: {
        Row: {
          assistant_teacher_id: string
          created_at: string
          days_of_week: string[]
          grade: string
          id: string
          is_active: boolean
          language_track: string
          name: string
          time_slot: string
          updated_at: string
        }
        Insert: {
          assistant_teacher_id: string
          created_at?: string
          days_of_week?: string[]
          grade: string
          id?: string
          is_active?: boolean
          language_track: string
          name: string
          time_slot: string
          updated_at?: string
        }
        Update: {
          assistant_teacher_id?: string
          created_at?: string
          days_of_week?: string[]
          grade?: string
          id?: string
          is_active?: boolean
          language_track?: string
          name?: string
          time_slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      center_session_attendance: {
        Row: {
          id: string
          marked_at: string
          marked_by: string
          notes: string | null
          session_id: string
          status: string
          student_id: string
        }
        Insert: {
          id?: string
          marked_at?: string
          marked_by: string
          notes?: string | null
          session_id: string
          status: string
          student_id: string
        }
        Update: {
          id?: string
          marked_at?: string
          marked_by?: string
          notes?: string | null
          session_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "center_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      center_sessions: {
        Row: {
          assistant_teacher_id: string
          created_at: string
          group_id: string
          id: string
          is_completed: boolean
          notes: string | null
          session_date: string
          session_time: string
        }
        Insert: {
          assistant_teacher_id: string
          created_at?: string
          group_id: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          session_date: string
          session_time: string
        }
        Update: {
          assistant_teacher_id?: string
          created_at?: string
          group_id?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          session_date?: string
          session_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "center_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_enrollments: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          chapter_id: string
          course_id: string
          created_at: string
          enrolled_at: string
          expires_at: string | null
          id: string
          status: string
          suspended_at: string | null
          suspended_by: string | null
          suspended_reason: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          chapter_id: string
          course_id: string
          created_at?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          chapter_id?: string
          course_id?: string
          created_at?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_enrollments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          order_index: number | null
          title: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          order_index?: number | null
          title: string
          title_ar: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          order_index?: number | null
          title?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assistant_teacher_id: string
          created_at: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          student_id: string
          unread_count_assistant: number | null
          unread_count_student: number | null
          updated_at: string | null
        }
        Insert: {
          assistant_teacher_id: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          student_id: string
          unread_count_assistant?: number | null
          unread_count_student?: number | null
          updated_at?: string | null
        }
        Update: {
          assistant_teacher_id?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          student_id?: string
          unread_count_assistant?: number | null
          unread_count_student?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      course_activity_summaries: {
        Row: {
          avg_session_gap_hours: number | null
          chapters_accessed: number
          consistency_score: string
          course_id: string
          coverage_label: string
          coverage_percentage: number
          created_at: string
          engagement_score: string
          frozen_at: string
          frozen_by: string
          id: string
          learning_days: number
          lessons_accessed: number
          lessons_completed: number
          total_active_minutes: number
          total_chapters: number
          total_focus_sessions: number
          total_lessons: number
          total_paused_minutes: number
          user_id: string
        }
        Insert: {
          avg_session_gap_hours?: number | null
          chapters_accessed?: number
          consistency_score: string
          course_id: string
          coverage_label: string
          coverage_percentage: number
          created_at?: string
          engagement_score: string
          frozen_at?: string
          frozen_by: string
          id?: string
          learning_days?: number
          lessons_accessed?: number
          lessons_completed?: number
          total_active_minutes?: number
          total_chapters?: number
          total_focus_sessions?: number
          total_lessons?: number
          total_paused_minutes?: number
          user_id: string
        }
        Update: {
          avg_session_gap_hours?: number | null
          chapters_accessed?: number
          consistency_score?: string
          course_id?: string
          coverage_label?: string
          coverage_percentage?: number
          created_at?: string
          engagement_score?: string
          frozen_at?: string
          frozen_by?: string
          id?: string
          learning_days?: number
          lessons_accessed?: number
          lessons_completed?: number
          total_active_minutes?: number
          total_chapters?: number
          total_focus_sessions?: number
          total_lessons?: number
          total_paused_minutes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_activity_summaries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          completed_lessons: number | null
          course_id: string
          enrolled_at: string
          expires_at: string | null
          id: string
          progress: number | null
          status: string
          suspended_at: string | null
          suspended_by: string | null
          suspended_reason: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          completed_lessons?: number | null
          course_id: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          progress?: number | null
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          completed_lessons?: number | null
          course_id?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          progress?: number | null
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
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
          is_hidden: boolean
          is_primary: boolean
          lessons_count: number | null
          price: number | null
          short_id: number
          slug: string
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
          is_hidden?: boolean
          is_primary?: boolean
          lessons_count?: number | null
          price?: number | null
          short_id?: number
          slug: string
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
          is_hidden?: boolean
          is_primary?: boolean
          lessons_count?: number | null
          price?: number | null
          short_id?: number
          slug?: string
          thumbnail_url?: string | null
          title?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          exam_id: string
          id: string
          is_completed: boolean
          score: number
          started_at: string
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          exam_id: string
          id?: string
          is_completed?: boolean
          score?: number
          started_at?: string
          total_questions?: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          exam_id?: string
          id?: string
          is_completed?: boolean
          score?: number
          started_at?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          correct_option: string
          created_at: string
          exam_id: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index: number | null
          question_image_url: string | null
          question_text: string
          question_type: Database["public"]["Enums"]["exam_question_type"]
        }
        Insert: {
          correct_option: string
          created_at?: string
          exam_id: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index?: number | null
          question_image_url?: string | null
          question_text: string
          question_type?: Database["public"]["Enums"]["exam_question_type"]
        }
        Update: {
          correct_option?: string
          created_at?: string
          exam_id?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          order_index?: number | null
          question_image_url?: string | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["exam_question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
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
          chapter_id: string | null
          closed_at: string | null
          course_id: string
          created_at: string
          exam_date: string | null
          id: string
          max_attempts: number | null
          max_score: number
          pass_mark: number
          published_at: string | null
          show_results: boolean
          status: Database["public"]["Enums"]["exam_status"]
          time_limit_minutes: number | null
          title: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          chapter_id?: string | null
          closed_at?: string | null
          course_id: string
          created_at?: string
          exam_date?: string | null
          id?: string
          max_attempts?: number | null
          max_score?: number
          pass_mark?: number
          published_at?: string | null
          show_results?: boolean
          status?: Database["public"]["Enums"]["exam_status"]
          time_limit_minutes?: number | null
          title: string
          title_ar: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string | null
          closed_at?: string | null
          course_id?: string
          created_at?: string
          exam_date?: string | null
          id?: string
          max_attempts?: number | null
          max_score?: number
          pass_mark?: number
          published_at?: string | null
          show_results?: boolean
          status?: Database["public"]["Enums"]["exam_status"]
          time_limit_minutes?: number | null
          title?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          completed_segments: number
          course_id: string
          created_at: string
          ended_at: string | null
          id: string
          interruptions: number
          is_completed: boolean
          lesson_id: string
          started_at: string
          total_active_seconds: number
          total_paused_seconds: number
          user_id: string
        }
        Insert: {
          completed_segments?: number
          course_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          interruptions?: number
          is_completed?: boolean
          lesson_id: string
          started_at?: string
          total_active_seconds?: number
          total_paused_seconds?: number
          user_id: string
        }
        Update: {
          completed_segments?: number
          course_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          interruptions?: number
          is_completed?: boolean
          lesson_id?: string
          started_at?: string
          total_active_seconds?: number
          total_paused_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      free_lesson_analytics: {
        Row: {
          created_at: string
          enrolled_at: string | null
          id: string
          is_completed: boolean | null
          lesson_id: string
          preview_seconds: number | null
          session_id: string
          user_id: string | null
          view_ended_at: string | null
          view_started_at: string
        }
        Insert: {
          created_at?: string
          enrolled_at?: string | null
          id?: string
          is_completed?: boolean | null
          lesson_id: string
          preview_seconds?: number | null
          session_id: string
          user_id?: string | null
          view_ended_at?: string | null
          view_started_at?: string
        }
        Update: {
          created_at?: string
          enrolled_at?: string | null
          id?: string
          is_completed?: boolean | null
          lesson_id?: string
          preview_seconds?: number | null
          session_id?: string
          user_id?: string | null
          view_ended_at?: string | null
          view_started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_lesson_analytics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
      lesson_completions: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          user_id: string
          watch_time_seconds: number | null
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          user_id: string
          watch_time_seconds?: number | null
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
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
          assistant_notes: string | null
          assistant_notes_ar: string | null
          chapter_id: string | null
          course_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          is_free_lesson: boolean
          key_points: Json | null
          lesson_type: string
          linked_exam_id: string | null
          order_index: number | null
          requires_exam_pass: boolean | null
          requires_previous_completion: boolean | null
          short_id: number
          summary: string | null
          summary_ar: string | null
          title: string
          title_ar: string
          video_url: string | null
        }
        Insert: {
          assistant_notes?: string | null
          assistant_notes_ar?: string | null
          chapter_id?: string | null
          course_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_free_lesson?: boolean
          key_points?: Json | null
          lesson_type?: string
          linked_exam_id?: string | null
          order_index?: number | null
          requires_exam_pass?: boolean | null
          requires_previous_completion?: boolean | null
          short_id?: number
          summary?: string | null
          summary_ar?: string | null
          title: string
          title_ar: string
          video_url?: string | null
        }
        Update: {
          assistant_notes?: string | null
          assistant_notes_ar?: string | null
          chapter_id?: string | null
          course_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_free_lesson?: boolean
          key_points?: Json | null
          lesson_type?: string
          linked_exam_id?: string | null
          order_index?: number | null
          requires_exam_pass?: boolean | null
          requires_previous_completion?: boolean | null
          short_id?: number
          summary?: string | null
          summary_ar?: string | null
          title?: string
          title_ar?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_linked_exam_id_fkey"
            columns: ["linked_exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          message_text: string
          read_at: string | null
          sender_id: string
          sender_role: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          message_text: string
          read_at?: string | null
          sender_id: string
          sender_role: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          message_text?: string
          read_at?: string | null
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
      platform_consent_events: {
        Row: {
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          attendance_mode: Database["public"]["Enums"]["attendance_mode"] | null
          auth_methods: string[] | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          google_email: string | null
          google_id: string | null
          google_linked_at: string | null
          governorate: string | null
          grade: string | null
          is_suspended: boolean
          language_track: string | null
          phone: string | null
          short_id: number
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_year?: string | null
          attendance_mode?:
            | Database["public"]["Enums"]["attendance_mode"]
            | null
          auth_methods?: string[] | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          google_email?: string | null
          google_id?: string | null
          google_linked_at?: string | null
          governorate?: string | null
          grade?: string | null
          is_suspended?: boolean
          language_track?: string | null
          phone?: string | null
          short_id?: number
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_year?: string | null
          attendance_mode?:
            | Database["public"]["Enums"]["attendance_mode"]
            | null
          auth_methods?: string[] | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          google_email?: string | null
          google_id?: string | null
          google_linked_at?: string | null
          governorate?: string | null
          grade?: string | null
          is_suspended?: boolean
          language_track?: string | null
          phone?: string | null
          short_id?: number
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_notes: {
        Row: {
          assistant_id: string
          created_at: string
          id: string
          note: string
          student_id: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          id?: string
          note: string
          student_id: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          id?: string
          note?: string
          student_id?: string
        }
        Relationships: []
      }
      top_students: {
        Row: {
          created_at: string
          created_by: string | null
          display_month: string
          display_order: number
          id: string
          is_active: boolean
          student_name_ar: string
          student_name_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_month: string
          display_order?: number
          id?: string
          is_active?: boolean
          student_name_ar: string
          student_name_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_month?: string
          display_order?: number
          id?: string
          is_active?: boolean
          student_name_ar?: string
          student_name_en?: string
          updated_at?: string
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
      can_assistant_view_student: {
        Args: { _assistant_id: string; _student_id: string }
        Returns: boolean
      }
      cleanup_orphan_user_rows: { Args: never; Returns: Json }
      generate_course_slug: {
        Args: { p_course_id?: string; p_grade: string; p_title_ar: string }
        Returns: string
      }
      get_chapter_progress: {
        Args: { p_course_id: string; p_user_id?: string }
        Returns: {
          chapter_id: string
          chapter_title: string
          chapter_title_ar: string
          completed_lessons: number
          exam_completed: boolean
          exam_id: string
          exam_score: number
          exam_title: string
          exam_title_ar: string
          has_exam: boolean
          is_complete: boolean
          order_index: number
          progress_percent: number
          total_lessons: number
        }[]
      }
      get_course_id_by_short_id: {
        Args: { p_short_id: number }
        Returns: string
      }
      get_exam_attempts_count: { Args: { exam_uuid: string }; Returns: number }
      get_lesson_id_by_short_id: {
        Args: { p_short_id: number }
        Returns: string
      }
      get_user_id_by_short_id: { Args: { p_short_id: number }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      sync_enrollment_progress: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "assistant_teacher" | "student"
      attendance_mode: "online" | "center" | "hybrid"
      attendance_type: "center" | "online"
      exam_question_type: "mcq" | "essay"
      exam_status: "draft" | "published" | "closed" | "archived"
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
      exam_question_type: ["mcq", "essay"],
      exam_status: ["draft", "published", "closed", "archived"],
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
