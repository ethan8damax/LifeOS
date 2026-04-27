// Generated from verified live schema — lubdjwdzezlamaqpjivk
// Matches supabase gen types typescript output format exactly.

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
      budgets: {
        Row: {
          id: string
          category: string
          limit_amount: number
          month: string
        }
        Insert: {
          id?: string
          category: string
          limit_amount: number
          month: string
        }
        Update: {
          id?: string
          category?: string
          limit_amount?: number
          month?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          title: string
          description: string | null
          target_date: string | null
          progress: number | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          target_date?: string | null
          progress?: number | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          target_date?: string | null
          progress?: number | null
          status?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string | null
          logged_date: string
          completed: boolean | null
        }
        Insert: {
          id?: string
          habit_id?: string | null
          logged_date: string
          completed?: boolean | null
        }
        Update: {
          id?: string
          habit_id?: string | null
          logged_date?: string
          completed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'habit_logs_habit_id_fkey'
            columns: ['habit_id']
            isOneToOne: false
            referencedRelation: 'habits'
            referencedColumns: ['id']
          },
        ]
      }
      habits: {
        Row: {
          id: string
          title: string
          frequency: string | null
          goal_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          frequency?: string | null
          goal_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          frequency?: string | null
          goal_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'habits_goal_id_fkey'
            columns: ['goal_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          id: string
          title: string
          status: string | null
          goal_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          status?: string | null
          goal_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          status?: string | null
          goal_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'projects_goal_id_fkey'
            columns: ['goal_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          id: string
          title: string
          notes: string | null
          status: string | null
          priority: string | null
          due_date: string | null
          project_id: string | null
          tag: string | null
          is_recurring: boolean | null
          recur_rule: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          notes?: string | null
          status?: string | null
          priority?: string | null
          due_date?: string | null
          project_id?: string | null
          tag?: string | null
          is_recurring?: boolean | null
          recur_rule?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          notes?: string | null
          status?: string | null
          priority?: string | null
          due_date?: string | null
          project_id?: string | null
          tag?: string | null
          is_recurring?: boolean | null
          recur_rule?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          id: string
          amount: number
          type: string
          category: string | null
          note: string | null
          date: string
          created_at: string | null
        }
        Insert: {
          id?: string
          amount: number
          type: string
          category?: string | null
          note?: string | null
          date: string
          created_at?: string | null
        }
        Update: {
          id?: string
          amount?: number
          type?: string
          category?: string | null
          note?: string | null
          date?: string
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ── Convenience type aliases ──────────────────────────────────────────────────
// Row types — what you get back from SELECT queries
export type Task        = Database['public']['Tables']['tasks']['Row']
export type Project     = Database['public']['Tables']['projects']['Row']
export type Goal        = Database['public']['Tables']['goals']['Row']
export type Habit       = Database['public']['Tables']['habits']['Row']
export type HabitLog    = Database['public']['Tables']['habit_logs']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Budget      = Database['public']['Tables']['budgets']['Row']

// Insert types — what you pass to INSERT
export type TaskInsert        = Database['public']['Tables']['tasks']['Insert']
export type ProjectInsert     = Database['public']['Tables']['projects']['Insert']
export type GoalInsert        = Database['public']['Tables']['goals']['Insert']
export type HabitInsert       = Database['public']['Tables']['habits']['Insert']
export type HabitLogInsert    = Database['public']['Tables']['habit_logs']['Insert']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type BudgetInsert      = Database['public']['Tables']['budgets']['Insert']

// Update types — what you pass to UPDATE
export type TaskUpdate        = Database['public']['Tables']['tasks']['Update']
export type ProjectUpdate     = Database['public']['Tables']['projects']['Update']
export type GoalUpdate        = Database['public']['Tables']['goals']['Update']
export type HabitUpdate       = Database['public']['Tables']['habits']['Update']
export type HabitLogUpdate    = Database['public']['Tables']['habit_logs']['Update']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']
export type BudgetUpdate      = Database['public']['Tables']['budgets']['Update']
