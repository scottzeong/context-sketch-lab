export type UserRole = "admin" | "tutor" | "student" | "parent";
export type AccountStatus = "active" | "disabled";
export type AgeRange =
  | "AGE_7_8"
  | "AGE_9_10"
  | "AGE_11_12"
  | "AGE_13_15"
  | "AGE_16_18"
  | "ADULT";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string | null;
          email: string | null;
          organization_id: string | null;
          birth_date: string | null;
          age_range: AgeRange | null;
          reading_level: string | null;
          account_status: AccountStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          display_name?: string | null;
          email?: string | null;
          organization_id?: string | null;
          birth_date?: string | null;
          age_range?: AgeRange | null;
          reading_level?: string | null;
          account_status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: UserRole;
          display_name?: string | null;
          email?: string | null;
          organization_id?: string | null;
          birth_date?: string | null;
          age_range?: AgeRange | null;
          reading_level?: string | null;
          account_status?: AccountStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      learning_groups: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          age_range: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          age_range?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          age_range?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      learning_group_members: {
        Row: {
          id: string;
          learning_group_id: string;
          profile_id: string;
          member_role: "tutor" | "student";
          created_at: string;
        };
        Insert: {
          id?: string;
          learning_group_id: string;
          profile_id: string;
          member_role: "tutor" | "student";
          created_at?: string;
        };
        Update: {
          member_role?: "tutor" | "student";
        };
        Relationships: [];
      };
      parent_student_links: {
        Row: {
          id: string;
          parent_id: string;
          student_id: string;
          relationship: string | null;
          status: "pending" | "approved" | "revoked";
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          student_id: string;
          relationship?: string | null;
          status?: "pending" | "approved" | "revoked";
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          relationship?: string | null;
          status?: "pending" | "approved" | "revoked";
          approved_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      texts: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string | null;
          title: string;
          body: string;
          source_type: "ai_generated" | "tutor_written" | "imported";
          age_range: string | null;
          difficulty_level: string | null;
          text_type: string | null;
          structure_type: string | null;
          status: "draft" | "approved" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by?: string | null;
          title: string;
          body: string;
          source_type: "ai_generated" | "tutor_written" | "imported";
          age_range?: string | null;
          difficulty_level?: string | null;
          text_type?: string | null;
          structure_type?: string | null;
          status?: "draft" | "approved" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          body?: string;
          source_type?: "ai_generated" | "tutor_written" | "imported";
          age_range?: string | null;
          difficulty_level?: string | null;
          text_type?: string | null;
          structure_type?: string | null;
          status?: "draft" | "approved" | "archived";
          updated_at?: string;
        };
        Relationships: [];
      };
      text_analyses: {
        Row: {
          id: string;
          text_id: string;
          analysis_json: unknown;
          structure_type: string | null;
          learning_goal: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          text_id: string;
          analysis_json: unknown;
          structure_type?: string | null;
          learning_goal?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          analysis_json?: unknown;
          structure_type?: string | null;
          learning_goal?: string | null;
        };
        Relationships: [];
      };
      learning_sessions: {
        Row: {
          id: string;
          organization_id: string;
          learning_group_id: string | null;
          group_name: string | null;
          text_id: string | null;
          text_analysis_id: string | null;
          title: string;
          learning_goal: string | null;
          worksheet_template_id: string | null;
          worksheet_template: string | null;
          status: "draft" | "published" | "closed";
          scheduled_for: string | null;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          learning_group_id?: string | null;
          group_name?: string | null;
          text_id?: string | null;
          text_analysis_id?: string | null;
          title: string;
          learning_goal?: string | null;
          worksheet_template_id?: string | null;
          worksheet_template?: string | null;
          status?: "draft" | "published" | "closed";
          scheduled_for?: string | null;
          published_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          learning_group_id?: string | null;
          group_name?: string | null;
          text_id?: string | null;
          text_analysis_id?: string | null;
          title?: string;
          learning_goal?: string | null;
          worksheet_template?: string | null;
          status?: "draft" | "published" | "closed";
          scheduled_for?: string | null;
          published_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          session_id: string;
          student_id: string | null;
          student_name: string | null;
          student_explanation: string | null;
          important_connection: string | null;
          difficult_part: string | null;
          status: "submitted" | "under_review" | "feedback_published";
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          student_id?: string | null;
          student_name?: string | null;
          student_explanation?: string | null;
          important_connection?: string | null;
          difficult_part?: string | null;
          status?: "submitted" | "under_review" | "feedback_published";
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          student_explanation?: string | null;
          important_connection?: string | null;
          difficult_part?: string | null;
          status?: "submitted" | "under_review" | "feedback_published";
          updated_at?: string;
        };
        Relationships: [];
      };
      submission_images: {
        Row: {
          id: string;
          submission_id: string;
          storage_path: string;
          image_kind: "original" | "revision";
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          storage_path: string;
          image_kind?: "original" | "revision";
          created_at?: string;
        };
        Update: {
          storage_path?: string;
          image_kind?: "original" | "revision";
        };
        Relationships: [];
      };
      tutor_reviews: {
        Row: {
          id: string;
          submission_id: string;
          tutor_id: string | null;
          observation: string | null;
          key_connections: string[];
          strengths: string[];
          misconceptions: string[];
          next_step: string | null;
          review_status: "draft" | "ai_drafted" | "approved" | "published";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          tutor_id?: string | null;
          observation?: string | null;
          key_connections?: string[];
          strengths?: string[];
          misconceptions?: string[];
          next_step?: string | null;
          review_status?: "draft" | "ai_drafted" | "approved" | "published";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          observation?: string | null;
          key_connections?: string[];
          strengths?: string[];
          misconceptions?: string[];
          next_step?: string | null;
          review_status?: "draft" | "ai_drafted" | "approved" | "published";
          updated_at?: string;
        };
        Relationships: [];
      };
      feedbacks: {
        Row: {
          id: string;
          submission_id: string;
          tutor_review_id: string | null;
          student_facing: string | null;
          tutor_notes: string | null;
          parent_summary: string | null;
          ai_draft_json: unknown | null;
          status: "draft" | "approved" | "published";
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          tutor_review_id?: string | null;
          student_facing?: string | null;
          tutor_notes?: string | null;
          parent_summary?: string | null;
          ai_draft_json?: unknown | null;
          status?: "draft" | "approved" | "published";
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tutor_review_id?: string | null;
          student_facing?: string | null;
          tutor_notes?: string | null;
          parent_summary?: string | null;
          ai_draft_json?: unknown | null;
          status?: "draft" | "approved" | "published";
          published_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      report_drafts: {
        Row: {
          id: string;
          organization_id: string;
          student_id: string | null;
          student_name: string;
          title: string;
          body: string;
          period_start: string | null;
          period_end: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          student_id?: string | null;
          student_name: string;
          title: string;
          body: string;
          period_start?: string | null;
          period_end?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          student_id?: string | null;
          student_name?: string;
          title?: string;
          body?: string;
          period_start?: string | null;
          period_end?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      config_options: {
        Row: {
          id: string;
          organization_id: string;
          category: "age_range" | "difficulty_level" | "target_length" | "text_structure";
          label: string;
          value: string;
          sort_order: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          category: "age_range" | "difficulty_level" | "target_length" | "text_structure";
          label: string;
          value: string;
          sort_order?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          label?: string;
          value?: string;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
