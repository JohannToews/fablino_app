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
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      comprehension_questions: {
        Row: {
          created_at: string
          expected_answer: string
          id: string
          order_index: number
          question: string
          story_id: string
        }
        Insert: {
          created_at?: string
          expected_answer: string
          id?: string
          order_index?: number
          question: string
          story_id: string
        }
        Update: {
          created_at?: string
          expected_answer?: string
          id?: string
          order_index?: number
          question?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comprehension_questions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_profiles: {
        Row: {
          color_palette: string
          cover_image_url: string | null
          created_at: string
          hobbies: string
          id: string
          image_style: string | null
          name: string
          school_class: string
          school_system: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color_palette?: string
          cover_image_url?: string | null
          created_at?: string
          hobbies?: string
          id?: string
          image_style?: string | null
          name?: string
          school_class?: string
          school_system?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color_palette?: string
          cover_image_url?: string | null
          created_at?: string
          hobbies?: string
          id?: string
          image_style?: string | null
          name?: string
          school_class?: string
          school_system?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      level_settings: {
        Row: {
          created_at: string
          id: string
          level_number: number
          min_points: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level_number: number
          min_points: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level_number?: number
          min_points?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      marked_words: {
        Row: {
          created_at: string
          difficulty: string | null
          explanation: string | null
          id: string
          is_learned: boolean | null
          quiz_history: string[] | null
          story_id: string
          word: string
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          is_learned?: boolean | null
          quiz_history?: string[] | null
          story_id: string
          word: string
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          is_learned?: boolean | null
          quiz_history?: string[] | null
          story_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "marked_words_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      point_settings: {
        Row: {
          category: string
          created_at: string
          difficulty: string
          id: string
          points: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          difficulty: string
          id?: string
          points?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          difficulty?: string
          id?: string
          points?: number
          updated_at?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          content: string
          cover_image_url: string | null
          created_at: string
          difficulty: string | null
          ending_type: Database["public"]["Enums"]["ending_type"] | null
          episode_number: number | null
          id: string
          is_deleted: boolean
          kid_profile_id: string | null
          prompt: string | null
          series_id: string | null
          story_images: string[] | null
          text_language: string | null
          text_type: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          cover_image_url?: string | null
          created_at?: string
          difficulty?: string | null
          ending_type?: Database["public"]["Enums"]["ending_type"] | null
          episode_number?: number | null
          id?: string
          is_deleted?: boolean
          kid_profile_id?: string | null
          prompt?: string | null
          series_id?: string | null
          story_images?: string[] | null
          text_language?: string | null
          text_type?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          cover_image_url?: string | null
          created_at?: string
          difficulty?: string | null
          ending_type?: Database["public"]["Enums"]["ending_type"] | null
          episode_number?: number | null
          id?: string
          is_deleted?: boolean
          kid_profile_id?: string | null
          prompt?: string | null
          series_id?: string | null
          story_images?: string[] | null
          text_language?: string | null
          text_type?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_ratings: {
        Row: {
          created_at: string
          id: string
          kid_name: string | null
          kid_profile_id: string | null
          kid_school_class: string | null
          kid_school_system: string | null
          quality_rating: number
          story_id: string | null
          story_prompt: string | null
          story_title: string
          user_id: string | null
          weakest_part: string | null
          weakness_reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kid_name?: string | null
          kid_profile_id?: string | null
          kid_school_class?: string | null
          kid_school_system?: string | null
          quality_rating: number
          story_id?: string | null
          story_prompt?: string | null
          story_title: string
          user_id?: string | null
          weakest_part?: string | null
          weakness_reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kid_name?: string | null
          kid_profile_id?: string | null
          kid_school_class?: string | null
          kid_school_system?: string | null
          quality_rating?: number
          story_id?: string | null
          story_prompt?: string | null
          story_title?: string
          user_id?: string | null
          weakest_part?: string | null
          weakness_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_ratings_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_ratings_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          admin_language: string
          app_language: string
          created_at: string
          display_name: string
          id: string
          password_hash: string
          system_prompt: string | null
          text_language: string
          updated_at: string
          username: string
        }
        Insert: {
          admin_language?: string
          app_language?: string
          created_at?: string
          display_name: string
          id?: string
          password_hash: string
          system_prompt?: string | null
          text_language?: string
          updated_at?: string
          username: string
        }
        Update: {
          admin_language?: string
          app_language?: string
          created_at?: string
          display_name?: string
          id?: string
          password_hash?: string
          system_prompt?: string | null
          text_language?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      user_results: {
        Row: {
          activity_type: string
          correct_answers: number | null
          created_at: string
          difficulty: string | null
          id: string
          points_earned: number
          reference_id: string | null
          total_questions: number | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          correct_answers?: number | null
          created_at?: string
          difficulty?: string | null
          id?: string
          points_earned?: number
          reference_id?: string | null
          total_questions?: number | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          correct_answers?: number | null
          created_at?: string
          difficulty?: string | null
          id?: string
          points_earned?: number
          reference_id?: string | null
          total_questions?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
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
      app_role: "admin" | "standard"
      ending_type: "A" | "B" | "C"
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
      app_role: ["admin", "standard"],
      ending_type: ["A", "B", "C"],
    },
  },
} as const
