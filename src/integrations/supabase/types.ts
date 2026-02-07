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
      age_rules: {
        Row: {
          allowed_tenses: string[]
          created_at: string | null
          dialogue_ratio: string | null
          example_sentences: string[] | null
          id: string
          language: string
          max_age: number
          max_sentence_length: number
          max_word_count: number
          min_age: number
          min_word_count: number
          narrative_guidelines: string
          narrative_perspective: string | null
          paragraph_length: string | null
          sentence_structures: string
          updated_at: string | null
        }
        Insert: {
          allowed_tenses: string[]
          created_at?: string | null
          dialogue_ratio?: string | null
          example_sentences?: string[] | null
          id?: string
          language: string
          max_age: number
          max_sentence_length: number
          max_word_count: number
          min_age: number
          min_word_count: number
          narrative_guidelines: string
          narrative_perspective?: string | null
          paragraph_length?: string | null
          sentence_structures: string
          updated_at?: string | null
        }
        Update: {
          allowed_tenses?: string[]
          created_at?: string | null
          dialogue_ratio?: string | null
          example_sentences?: string[] | null
          id?: string
          language?: string
          max_age?: number
          max_sentence_length?: number
          max_word_count?: number
          min_age?: number
          min_word_count?: number
          narrative_guidelines?: string
          narrative_perspective?: string | null
          paragraph_length?: string | null
          sentence_structures?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
      collected_items: {
        Row: {
          category: Database["public"]["Enums"]["collectible_category"]
          collected_at: string
          id: string
          item_description: string | null
          item_emoji: string
          item_name: string
          kid_profile_id: string
          rarity: string
          story_id: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["collectible_category"]
          collected_at?: string
          id?: string
          item_description?: string | null
          item_emoji?: string
          item_name: string
          kid_profile_id: string
          rarity?: string
          story_id?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["collectible_category"]
          collected_at?: string
          id?: string
          item_description?: string | null
          item_emoji?: string
          item_name?: string
          kid_profile_id?: string
          rarity?: string
          story_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collected_items_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collected_items_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collected_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collectible_pool: {
        Row: {
          category: Database["public"]["Enums"]["collectible_category"]
          created_at: string
          id: string
          item_description: string | null
          item_emoji: string
          item_name: string
          keywords: string[] | null
          rarity: string
        }
        Insert: {
          category: Database["public"]["Enums"]["collectible_category"]
          created_at?: string
          id?: string
          item_description?: string | null
          item_emoji: string
          item_name: string
          keywords?: string[] | null
          rarity?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["collectible_category"]
          created_at?: string
          id?: string
          item_description?: string | null
          item_emoji?: string
          item_name?: string
          keywords?: string[] | null
          rarity?: string
        }
        Relationships: []
      }
      comprehension_questions: {
        Row: {
          created_at: string
          expected_answer: string
          id: string
          options: string[] | null
          order_index: number
          question: string
          question_language: string
          story_id: string
        }
        Insert: {
          created_at?: string
          expected_answer: string
          id?: string
          options?: string[] | null
          order_index?: number
          question: string
          question_language?: string
          story_id: string
        }
        Update: {
          created_at?: string
          expected_answer?: string
          id?: string
          options?: string[] | null
          order_index?: number
          question?: string
          question_language?: string
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
      consistency_check_results: {
        Row: {
          created_at: string
          difficulty: string
          id: string
          issue_details: string[] | null
          issues_corrected: number
          issues_found: number
          story_id: string | null
          story_length: string
          story_title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          difficulty: string
          id?: string
          issue_details?: string[] | null
          issues_corrected?: number
          issues_found?: number
          story_id?: string | null
          story_length: string
          story_title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          difficulty?: string
          id?: string
          issue_details?: string[] | null
          issues_corrected?: number
          issues_found?: number
          story_id?: string | null
          story_length?: string
          story_title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consistency_check_results_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consistency_check_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_themes_by_level: {
        Row: {
          created_at: string | null
          example_texts: Json
          id: string
          labels: Json
          min_age: number | null
          min_safety_level: number
          sort_order: number
          theme_key: string
        }
        Insert: {
          created_at?: string | null
          example_texts: Json
          id?: string
          labels: Json
          min_age?: number | null
          min_safety_level: number
          sort_order?: number
          theme_key: string
        }
        Update: {
          created_at?: string | null
          example_texts?: Json
          id?: string
          labels?: Json
          min_age?: number | null
          min_safety_level?: number
          sort_order?: number
          theme_key?: string
        }
        Relationships: []
      }
      difficulty_rules: {
        Row: {
          created_at: string | null
          description: Json
          difficulty_level: number
          example_vocabulary: string[] | null
          figurative_language: string
          humor_types: string[]
          id: string
          idiom_usage: string
          label: Json
          language: string
          new_words_per_story: number
          repetition_strategy: string
          updated_at: string | null
          vocabulary_scope: string
        }
        Insert: {
          created_at?: string | null
          description: Json
          difficulty_level: number
          example_vocabulary?: string[] | null
          figurative_language: string
          humor_types: string[]
          id?: string
          idiom_usage: string
          label: Json
          language: string
          new_words_per_story: number
          repetition_strategy: string
          updated_at?: string | null
          vocabulary_scope: string
        }
        Update: {
          created_at?: string | null
          description?: Json
          difficulty_level?: number
          example_vocabulary?: string[] | null
          figurative_language?: string
          humor_types?: string[]
          id?: string
          idiom_usage?: string
          label?: Json
          language?: string
          new_words_per_story?: number
          repetition_strategy?: string
          updated_at?: string | null
          vocabulary_scope?: string
        }
        Relationships: []
      }
      emotion_rules: {
        Row: {
          character_development: string
          conflict_patterns: string[]
          created_at: string | null
          emotion_key: string
          emotional_vocabulary: string[] | null
          id: string
          labels: Json
          language: string
          resolution_patterns: string[] | null
          updated_at: string | null
        }
        Insert: {
          character_development: string
          conflict_patterns: string[]
          created_at?: string | null
          emotion_key: string
          emotional_vocabulary?: string[] | null
          id?: string
          labels: Json
          language: string
          resolution_patterns?: string[] | null
          updated_at?: string | null
        }
        Update: {
          character_development?: string
          conflict_patterns?: string[]
          created_at?: string | null
          emotion_key?: string
          emotional_vocabulary?: string[] | null
          id?: string
          labels?: Json
          language?: string
          resolution_patterns?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      image_cache: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          last_used_at: string | null
          prompt_hash: string
          prompt_text: string
          use_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          last_used_at?: string | null
          prompt_hash: string
          prompt_text: string
          use_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          last_used_at?: string | null
          prompt_hash?: string
          prompt_text?: string
          use_count?: number | null
        }
        Relationships: []
      }
      image_style_rules: {
        Row: {
          age_group: string
          art_style: string | null
          color_palette: string | null
          created_at: string | null
          id: string
          negative_prompt: string | null
          style_prompt: string
          theme_key: string | null
          updated_at: string | null
        }
        Insert: {
          age_group: string
          art_style?: string | null
          color_palette?: string | null
          created_at?: string | null
          id?: string
          negative_prompt?: string | null
          style_prompt: string
          theme_key?: string | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string
          art_style?: string | null
          color_palette?: string | null
          created_at?: string | null
          id?: string
          negative_prompt?: string | null
          style_prompt?: string
          theme_key?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kid_characters: {
        Row: {
          age: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          kid_profile_id: string
          name: string
          relation: string | null
          role: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          kid_profile_id: string
          name: string
          relation?: string | null
          role: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          kid_profile_id?: string
          name?: string
          relation?: string | null
          role?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kid_characters_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_profiles: {
        Row: {
          age: number | null
          color_palette: string
          content_safety_level: number
          cover_image_url: string | null
          created_at: string
          difficulty_level: number
          explanation_language: string
          gender: string | null
          hobbies: string
          home_languages: string[]
          id: string
          image_style: string | null
          name: string
          reading_language: string
          school_class: string
          school_system: string
          ui_language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          color_palette?: string
          content_safety_level?: number
          cover_image_url?: string | null
          created_at?: string
          difficulty_level?: number
          explanation_language?: string
          gender?: string | null
          hobbies?: string
          home_languages?: string[]
          id?: string
          image_style?: string | null
          name?: string
          reading_language?: string
          school_class?: string
          school_system?: string
          ui_language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          color_palette?: string
          content_safety_level?: number
          cover_image_url?: string | null
          created_at?: string
          difficulty_level?: number
          explanation_language?: string
          gender?: string | null
          hobbies?: string
          home_languages?: string[]
          id?: string
          image_style?: string | null
          name?: string
          reading_language?: string
          school_class?: string
          school_system?: string
          ui_language?: string
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
      learning_themes: {
        Row: {
          category: string
          created_at: string | null
          descriptions: Json
          id: string
          labels: Json
          sort_order: number
          theme_key: string
        }
        Insert: {
          category: string
          created_at?: string | null
          descriptions: Json
          id?: string
          labels: Json
          sort_order?: number
          theme_key: string
        }
        Update: {
          category?: string
          created_at?: string | null
          descriptions?: Json
          id?: string
          labels?: Json
          sort_order?: number
          theme_key?: string
        }
        Relationships: []
      }
      level_settings: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          level_number: number
          min_points: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          level_number: number
          min_points: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
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
          explanation_language: string
          id: string
          is_learned: boolean | null
          quiz_history: string[] | null
          story_id: string
          word: string
          word_language: string
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          explanation_language?: string
          id?: string
          is_learned?: boolean | null
          quiz_history?: string[] | null
          story_id: string
          word: string
          word_language?: string
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          explanation_language?: string
          id?: string
          is_learned?: boolean | null
          quiz_history?: string[] | null
          story_id?: string
          word?: string
          word_language?: string
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
      parent_learning_config: {
        Row: {
          active_themes: string[]
          created_at: string | null
          frequency: number
          id: string
          kid_profile_id: string
          updated_at: string | null
        }
        Insert: {
          active_themes?: string[]
          created_at?: string | null
          frequency?: number
          id?: string
          kid_profile_id: string
          updated_at?: string | null
        }
        Update: {
          active_themes?: string[]
          created_at?: string | null
          frequency?: number
          id?: string
          kid_profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_learning_config_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: true
            referencedRelation: "kid_profiles"
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
      point_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kid_profile_id: string
          points: number
          story_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kid_profile_id: string
          points: number
          story_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kid_profile_id?: string
          points?: number
          story_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_stories: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          retrieved_count: number
          share_token: string
          story_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          retrieved_count?: number
          share_token: string
          story_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          retrieved_count?: number
          share_token?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_stories_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          concrete_theme: string | null
          content: string
          cover_image_status: string | null
          cover_image_url: string | null
          created_at: string
          difficulty: string | null
          emotional_coloring: string | null
          emotional_depth: number | null
          emotional_secondary: string | null
          ending_type: Database["public"]["Enums"]["ending_type"] | null
          episode_number: number | null
          generation_status: string | null
          generation_time_ms: number | null
          humor_level: number | null
          id: string
          is_deleted: boolean
          kid_profile_id: string | null
          learning_theme_applied: string | null
          moral_topic: string | null
          parent_prompt_text: string | null
          prompt: string | null
          series_id: string | null
          story_images: string[] | null
          story_images_status: string | null
          structure_beginning: number | null
          structure_ending: number | null
          structure_middle: number | null
          text_language: string
          text_type: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          concrete_theme?: string | null
          content: string
          cover_image_status?: string | null
          cover_image_url?: string | null
          created_at?: string
          difficulty?: string | null
          emotional_coloring?: string | null
          emotional_depth?: number | null
          emotional_secondary?: string | null
          ending_type?: Database["public"]["Enums"]["ending_type"] | null
          episode_number?: number | null
          generation_status?: string | null
          generation_time_ms?: number | null
          humor_level?: number | null
          id?: string
          is_deleted?: boolean
          kid_profile_id?: string | null
          learning_theme_applied?: string | null
          moral_topic?: string | null
          parent_prompt_text?: string | null
          prompt?: string | null
          series_id?: string | null
          story_images?: string[] | null
          story_images_status?: string | null
          structure_beginning?: number | null
          structure_ending?: number | null
          structure_middle?: number | null
          text_language?: string
          text_type?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          concrete_theme?: string | null
          content?: string
          cover_image_status?: string | null
          cover_image_url?: string | null
          created_at?: string
          difficulty?: string | null
          emotional_coloring?: string | null
          emotional_depth?: number | null
          emotional_secondary?: string | null
          ending_type?: Database["public"]["Enums"]["ending_type"] | null
          episode_number?: number | null
          generation_status?: string | null
          generation_time_ms?: number | null
          humor_level?: number | null
          id?: string
          is_deleted?: boolean
          kid_profile_id?: string | null
          learning_theme_applied?: string | null
          moral_topic?: string | null
          parent_prompt_text?: string | null
          prompt?: string | null
          series_id?: string | null
          story_images?: string[] | null
          story_images_status?: string | null
          structure_beginning?: number | null
          structure_ending?: number | null
          structure_middle?: number | null
          text_language?: string
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
      streak_milestones: {
        Row: {
          claimed_at: string
          id: string
          kid_profile_id: string
          milestone_days: number
          streak_count: number
        }
        Insert: {
          claimed_at?: string
          id?: string
          kid_profile_id: string
          milestone_days: number
          streak_count: number
        }
        Update: {
          claimed_at?: string
          id?: string
          kid_profile_id?: string
          milestone_days?: number
          streak_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "streak_milestones_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_rules: {
        Row: {
          character_archetypes: string[] | null
          created_at: string | null
          id: string
          labels: Json
          language: string
          plot_templates: string[]
          sensory_details: string | null
          setting_descriptions: string
          theme_key: string
          typical_conflicts: string[] | null
          updated_at: string | null
        }
        Insert: {
          character_archetypes?: string[] | null
          created_at?: string | null
          id?: string
          labels: Json
          language: string
          plot_templates: string[]
          sensory_details?: string | null
          setting_descriptions: string
          theme_key: string
          typical_conflicts?: string[] | null
          updated_at?: string | null
        }
        Update: {
          character_archetypes?: string[] | null
          created_at?: string | null
          id?: string
          labels?: Json
          language?: string
          plot_templates?: string[]
          sensory_details?: string | null
          setting_descriptions?: string
          theme_key?: string
          typical_conflicts?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
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
      user_progress: {
        Row: {
          created_at: string
          current_level: number
          current_streak: number
          id: string
          kid_profile_id: string
          last_read_date: string | null
          longest_streak: number
          quizzes_passed: number
          quizzes_perfect: number
          stories_read_total: number
          streak_freeze_available: boolean
          streak_freeze_used_this_week: string | null
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          kid_profile_id: string
          last_read_date?: string | null
          longest_streak?: number
          quizzes_passed?: number
          quizzes_perfect?: number
          stories_read_total?: number
          streak_freeze_available?: boolean
          streak_freeze_used_this_week?: string | null
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          kid_profile_id?: string
          last_read_date?: string | null
          longest_streak?: number
          quizzes_passed?: number
          quizzes_perfect?: number
          stories_read_total?: number
          streak_freeze_available?: boolean
          streak_freeze_used_this_week?: string | null
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: true
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_results: {
        Row: {
          activity_type: string
          correct_answers: number | null
          created_at: string
          difficulty: string | null
          id: string
          kid_profile_id: string | null
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
          kid_profile_id?: string | null
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
          kid_profile_id?: string | null
          points_earned?: number
          reference_id?: string | null
          total_questions?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_results_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
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
      collectible_category: "creature" | "place" | "object" | "star"
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
      collectible_category: ["creature", "place", "object", "star"],
      ending_type: ["A", "B", "C"],
    },
  },
} as const
