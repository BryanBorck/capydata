export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          wallet_address: string
          username: string
          points: number
          created_at: string
        }
        Insert: {
          wallet_address: string
          username: string
          points?: number
          created_at?: string
        }
        Update: {
          wallet_address?: string
          username?: string
          points?: number
          created_at?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          id: string
          owner_wallet: string
          name: string
          rarity: 'common' | 'rare' | 'epic' | 'legendary'
          variant: 'default' | 'pink' | 'blue' | 'ice' | 'black'
          background: 'farm' | 'ice' | 'beach' | 'forest' | 'lake'
          social: number
          trivia: number
          science: number
          code: number
          trenches: number
          streak: number
          created_at: string
        }
        Insert: {
          id?: string
          owner_wallet: string
          name?: string
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          variant?: 'default' | 'pink' | 'blue' | 'ice' | 'black'
          background?: 'farm' | 'ice' | 'beach' | 'forest' | 'lake'
          social?: number
          trivia?: number
          science?: number
          code?: number
          trenches?: number
          streak?: number
          created_at?: string
        }
        Update: {
          id?: string
          owner_wallet?: string
          name?: string
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          variant?: 'default' | 'pink' | 'blue' | 'ice' | 'black'
          background?: 'farm' | 'ice' | 'beach' | 'forest' | 'lake'
          social?: number
          trivia?: number
          science?: number
          code?: number
          trenches?: number
          streak?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_wallet_fkey"
            columns: ["owner_wallet"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["wallet_address"]
          }
        ]
      }
      items: {
        Row: {
          id: string
          name: string
          price: number
          rarity: 'common' | 'rare' | 'epic' | 'legendary'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          rarity: 'common' | 'rare' | 'epic' | 'legendary'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          created_at?: string
        }
        Relationships: []
      }
      pet_items: {
        Row: {
          pet_id: string
          item_id: string
          equipped_at: string
        }
        Insert: {
          pet_id: string
          item_id: string
          equipped_at?: string
        }
        Update: {
          pet_id?: string
          item_id?: string
          equipped_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_items_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          }
        ]
      }
      achievements: {
        Row: {
          id: string
          code: string
          title: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          title: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          title?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      pet_achievements: {
        Row: {
          pet_id: string
          achievement_id: string
          achieved_at: string
        }
        Insert: {
          pet_id: string
          achievement_id: string
          achieved_at?: string
        }
        Update: {
          pet_id?: string
          achievement_id?: string
          achieved_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_achievements_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          }
        ]
      }
      language_progress: {
        Row: {
          id: string
          wallet_address: string
          language: string
          level: number
          experience_points: number
          current_difficulty: 'beginner' | 'intermediate' | 'advanced'
          total_words_learned: number
          total_sessions_completed: number
          current_streak: number
          best_streak: number
          accuracy_rate: number
          last_played: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          language: string
          level?: number
          experience_points?: number
          current_difficulty?: 'beginner' | 'intermediate' | 'advanced'
          total_words_learned?: number
          total_sessions_completed?: number
          current_streak?: number
          best_streak?: number
          accuracy_rate?: number
          last_played?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          language?: string
          level?: number
          experience_points?: number
          current_difficulty?: 'beginner' | 'intermediate' | 'advanced'
          total_words_learned?: number
          total_sessions_completed?: number
          current_streak?: number
          best_streak?: number
          accuracy_rate?: number
          last_played?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "language_progress_wallet_address_fkey"
            columns: ["wallet_address"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["wallet_address"]
          }
        ]
      }
      flashcard_sessions: {
        Row: {
          id: string
          wallet_address: string
          language: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          total_cards: number
          correct_answers: number
          total_points: number
          duration_seconds: number
          session_data: Json
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          language: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          total_cards: number
          correct_answers: number
          total_points: number
          duration_seconds: number
          session_data?: Json
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          language?: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          total_cards?: number
          correct_answers?: number
          total_points?: number
          duration_seconds?: number
          session_data?: Json
          completed_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_sessions_wallet_address_fkey"
            columns: ["wallet_address"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["wallet_address"]
          }
        ]
      }
      learned_words: {
        Row: {
          id: string
          wallet_address: string
          language: string
          word: string
          translation: string
          pronunciation: string
          times_seen: number
          times_correct: number
          mastery_level: number
          last_seen: string
          first_learned: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          language: string
          word: string
          translation: string
          pronunciation: string
          times_seen?: number
          times_correct?: number
          mastery_level?: number
          last_seen?: string
          first_learned?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          language?: string
          word?: string
          translation?: string
          pronunciation?: string
          times_seen?: number
          times_correct?: number
          mastery_level?: number
          last_seen?: string
          first_learned?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learned_words_wallet_address_fkey"
            columns: ["wallet_address"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["wallet_address"]
          }
        ]
      }
      skill_events: {
        Row: {
          id: string
          pet_id: string
          source: string
          delta_social: number
          delta_trivia: number
          delta_science: number
          delta_code: number
          delta_trenches: number
          delta_streak: number
          raw_data: Json | null
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          source: string
          delta_social?: number
          delta_trivia?: number
          delta_science?: number
          delta_code?: number
          delta_trenches?: number
          delta_streak?: number
          raw_data?: Json | null
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          source?: string
          delta_social?: number
          delta_trivia?: number
          delta_science?: number
          delta_code?: number
          delta_trenches?: number
          delta_streak?: number
          raw_data?: Json | null
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_events_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          }
        ]
      }
      datainstances: {
        Row: {
          id: string
          pet_id: string
          content: string
          content_type: string
          content_hash: string
          metadata: Json
          category: 'social' | 'trivia' | 'science' | 'code' | 'trenches' | 'general'
          tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          content: string
          content_type: string
          content_hash: string
          metadata?: Json
          category?: 'social' | 'trivia' | 'science' | 'code' | 'trenches' | 'general'
          tags?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          content?: string
          content_type?: string
          content_hash?: string
          metadata?: Json
          category?: 'social' | 'trivia' | 'science' | 'code' | 'trenches' | 'general'
          tags?: string[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "datainstances_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          }
        ]
      }
      knowledge: {
        Row: {
          id: string
          url: string
          content: string
          title: string | null
          content_hash: string
          metadata: Json
          category: 'social' | 'trivia' | 'science' | 'code' | 'trenches' | 'general'
          tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          url: string
          content: string
          title?: string | null
          content_hash: string
          metadata?: Json
          category?: 'social' | 'trivia' | 'science' | 'code' | 'trenches' | 'general'
          tags?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          url?: string
          content?: string
          title?: string | null
          content_hash?: string
          metadata?: Json
          category?: 'social' | 'trivia' | 'science' | 'code' | 'trenches' | 'general'
          tags?: string[]
          created_at?: string
        }
        Relationships: []
      }
      images: {
        Row: {
          id: string
          image_url: string
          alt_text: string | null
          url_hash: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          image_url: string
          alt_text?: string | null
          url_hash: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          image_url?: string
          alt_text?: string | null
          url_hash?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      datainstance_knowledge: {
        Row: {
          datainstance_id: string
          knowledge_id: string
        }
        Insert: {
          datainstance_id: string
          knowledge_id: string
        }
        Update: {
          datainstance_id?: string
          knowledge_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "datainstance_knowledge_datainstance_id_fkey"
            columns: ["datainstance_id"]
            isOneToOne: false
            referencedRelation: "datainstances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datainstance_knowledge_knowledge_id_fkey"
            columns: ["knowledge_id"]
            isOneToOne: false
            referencedRelation: "knowledge"
            referencedColumns: ["id"]
          }
        ]
      }
      datainstance_images: {
        Row: {
          datainstance_id: string
          image_id: string
        }
        Insert: {
          datainstance_id: string
          image_id: string
        }
        Update: {
          datainstance_id?: string
          image_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "datainstance_images_datainstance_id_fkey"
            columns: ["datainstance_id"]
            isOneToOne: false
            referencedRelation: "datainstances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datainstance_images_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_boosts: {
        Row: {
          id: string
          category: 'social' | 'trivia' | 'science' | 'code' | 'trenches' | 'general'
          data_type: string
          social_boost: number
          trivia_boost: number
          science_boost: number
          code_boost: number
          trenches_boost: number
          streak_boost: number
          created_at: string
        }
        Insert: {
          id?: string
          category: 'social' | 'trivia' | 'science' | 'code' | 'trenches' | 'general'
          data_type: string
          social_boost?: number
          trivia_boost?: number
          science_boost?: number
          code_boost?: number
          trenches_boost?: number
          streak_boost?: number
          created_at?: string
        }
        Update: {
          id?: string
          category?: 'social' | 'trivia' | 'science' | 'code' | 'trenches' | 'general'
          data_type?: string
          social_boost?: number
          trivia_boost?: number
          science_boost?: number
          code_boost?: number
          trenches_boost?: number
          streak_boost?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      rarity_t: 'common' | 'rare' | 'epic' | 'legendary'
      data_category_t: 'social' | 'trivia' | 'science' | 'code' | 'trenches' | 'general'
      pet_variant_t: 'default' | 'pink' | 'blue' | 'ice' | 'black'
      pet_background_t: 'farm' | 'ice' | 'beach' | 'forest' | 'lake'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never 