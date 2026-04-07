/**
 * Contrat Supabase ↔ TypeScript.
 * Aligné sur le schéma réel du projet (tables vues dans le dashboard Supabase).
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          status: string;
          player_count: number;
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          status: string;
          player_count: number;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status?: string;
          player_count?: number;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      game_players: {
        Row: {
          id: string;
          game_id: string;
          player_id: string;
          seat_order: number;
          display_name_snapshot: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          player_id: string;
          seat_order: number;
          display_name_snapshot?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          player_id?: string;
          seat_order?: number;
          display_name_snapshot?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'game_players_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'games';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_players_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
        ];
      };
      rounds: {
        Row: {
          id: string;
          game_id: string;
          round_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          round_number: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          round_number?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rounds_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'games';
            referencedColumns: ['id'];
          },
        ];
      };
      round_results: {
        Row: {
          id: string;
          round_id: string;
          game_player_id: string;
          bid: number;
          tricks_won: number | null;
          score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          game_player_id: string;
          bid: number;
          tricks_won?: number | null;
          score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          game_player_id?: string;
          bid?: number;
          tricks_won?: number | null;
          score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'round_results_round_id_fkey';
            columns: ['round_id'];
            isOneToOne: false;
            referencedRelation: 'rounds';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'round_results_game_player_id_fkey';
            columns: ['game_player_id'];
            isOneToOne: false;
            referencedRelation: 'game_players';
            referencedColumns: ['id'];
          },
        ];
      };
      game_config_templates: {
        Row: {
          id: string;
          name: string | null;
          player_count: number;
          is_last_used: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          player_count: number;
          is_last_used?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          player_count?: number;
          is_last_used?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      game_config_template_players: {
        Row: {
          id: string;
          template_id: string;
          player_id: string | null;
          seat_order: number;
          display_name_snapshot: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          player_id?: string | null;
          seat_order: number;
          display_name_snapshot?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          player_id?: string | null;
          seat_order?: number;
          display_name_snapshot?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'game_config_template_players_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'game_config_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_config_template_players_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
