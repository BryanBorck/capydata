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
          created_at: string
        }
        Insert: {
          wallet_address: string
          username: string
          created_at?: string
        }
        Update: {
          wallet_address?: string
          username?: string
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
          health: number
          strength: number
          social: number
          created_at: string
        }
        Insert: {
          id?: string
          owner_wallet: string
          name?: string
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          health?: number
          strength?: number
          social?: number
          created_at?: string
        }
        Update: {
          id?: string
          owner_wallet?: string
          name?: string
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          health?: number
          strength?: number
          social?: number
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
      skill_events: {
        Row: {
          id: string
          pet_id: string
          source: string
          delta_health: number
          delta_strength: number
          delta_social: number
          raw_data: Json | null
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          source: string
          delta_health?: number
          delta_strength?: number
          delta_social?: number
          raw_data?: Json | null
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          source?: string
          delta_health?: number
          delta_strength?: number
          delta_social?: number
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      rarity_t: 'common' | 'rare' | 'epic' | 'legendary'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 