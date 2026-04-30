// Generated from verified live schema — lubdjwdzezlamaqpjivk
// Finance v2: zero-based budgeting system

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
      assets: {
        Row: {
          id:          string
          name:        string
          account_ref: string | null
          balance:     number
          type:        string
        }
        Insert: {
          id?:          string
          name:         string
          account_ref?: string | null
          balance?:     number
          type?:        string
        }
        Update: {
          id?:          string
          name?:        string
          account_ref?: string | null
          balance?:     number
          type?:        string
        }
        Relationships: []
      }
      budget_categories: {
        Row: {
          id:       string
          name:     string
          expected: number
          actual:   number
          month:    string
        }
        Insert: {
          id?:       string
          name:      string
          expected?: number
          actual?:   number
          month:     string
        }
        Update: {
          id?:       string
          name?:     string
          expected?: number
          actual?:   number
          month?:    string
        }
        Relationships: []
      }
      debts: {
        Row: {
          id:          string
          owner:       string
          name:        string
          amount_owed: number
          due_date:    string | null
        }
        Insert: {
          id?:          string
          owner:        string
          name:         string
          amount_owed?: number
          due_date?:    string | null
        }
        Update: {
          id?:          string
          owner?:       string
          name?:        string
          amount_owed?: number
          due_date?:    string | null
        }
        Relationships: []
      }
      goal_habits: {
        Row: {
          id:       string
          goal_id:  string | null
          habit_id: string | null
        }
        Insert: {
          id?:       string
          goal_id?:  string | null
          habit_id?: string | null
        }
        Update: {
          id?:       string
          goal_id?:  string | null
          habit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'goal_habits_goal_id_fkey'
            columns: ['goal_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'goal_habits_habit_id_fkey'
            columns: ['habit_id']
            isOneToOne: false
            referencedRelation: 'habits'
            referencedColumns: ['id']
          },
        ]
      }
      goals: {
        Row: {
          id:          string
          title:       string
          description: string | null
          vision:      string | null
          start_date:  string | null
          end_date:    string | null
          target_date: string | null
          status:      string | null
          created_at:  string | null
        }
        Insert: {
          id?:          string
          title:        string
          description?: string | null
          vision?:      string | null
          start_date?:  string | null
          end_date?:    string | null
          target_date?: string | null
          status?:      string | null
          created_at?:  string | null
        }
        Update: {
          id?:          string
          title?:       string
          description?: string | null
          vision?:      string | null
          start_date?:  string | null
          end_date?:    string | null
          target_date?: string | null
          status?:      string | null
          created_at?:  string | null
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          id:          string
          habit_id:    string | null
          logged_date: string
          completed:   boolean | null
        }
        Insert: {
          id?:          string
          habit_id?:    string | null
          logged_date:  string
          completed?:   boolean | null
        }
        Update: {
          id?:          string
          habit_id?:    string | null
          logged_date?: string
          completed?:   boolean | null
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
          id:         string
          title:      string
          days:       string[] | null
          goal_id:    string | null
          created_at: string | null
        }
        Insert: {
          id?:         string
          title:       string
          days?:       string[] | null
          goal_id?:    string | null
          created_at?: string | null
        }
        Update: {
          id?:         string
          title?:      string
          days?:       string[] | null
          goal_id?:    string | null
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
      income_sources: {
        Row: {
          id:       string
          owner:    string
          name:     string
          expected: number
          actual:   number
          month:    string
        }
        Insert: {
          id?:       string
          owner:     string
          name:      string
          expected?: number
          actual?:   number
          month:     string
        }
        Update: {
          id?:       string
          owner?:    string
          name?:     string
          expected?: number
          actual?:   number
          month?:    string
        }
        Relationships: []
      }
      net_worth_snapshots: {
        Row: {
          id:            string
          month:         string
          total_assets:  number | null
          total_debt:    number | null
          net_worth:     number | null
          snapshot_date: string | null
        }
        Insert: {
          id?:            string
          month:          string
          total_assets?:  number | null
          total_debt?:    number | null
          net_worth?:     number | null
          snapshot_date?: string | null
        }
        Update: {
          id?:            string
          month?:         string
          total_assets?:  number | null
          total_debt?:    number | null
          net_worth?:     number | null
          snapshot_date?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          id:         string
          title:      string
          status:     string | null
          goal_id:    string | null
          created_at: string | null
        }
        Insert: {
          id?:         string
          title:       string
          status?:     string | null
          goal_id?:    string | null
          created_at?: string | null
        }
        Update: {
          id?:         string
          title?:      string
          status?:     string | null
          goal_id?:    string | null
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
      recurring_payments: {
        Row: {
          id:     string
          name:   string
          amount: number
        }
        Insert: {
          id?:    string
          name:   string
          amount: number
        }
        Update: {
          id?:     string
          name?:   string
          amount?: number
        }
        Relationships: []
      }
      savings_pods: {
        Row: {
          id:       string
          name:     string
          allotted: number
          goal:     number
        }
        Insert: {
          id?:       string
          name:      string
          allotted?: number
          goal?:     number
        }
        Update: {
          id?:       string
          name?:     string
          allotted?: number
          goal?:     number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id:           string
          title:        string
          notes:        string | null
          status:       string | null
          priority:     string | null
          due_date:     string | null
          project_id:   string | null
          goal_id:      string | null
          tag:          string | null
          is_recurring: boolean | null
          recur_rule:   string | null
          created_at:   string | null
        }
        Insert: {
          id?:           string
          title:         string
          notes?:        string | null
          status?:       string | null
          priority?:     string | null
          due_date?:     string | null
          project_id?:   string | null
          goal_id?:      string | null
          tag?:          string | null
          is_recurring?: boolean | null
          recur_rule?:   string | null
          created_at?:   string | null
        }
        Update: {
          id?:           string
          title?:        string
          notes?:        string | null
          status?:       string | null
          priority?:     string | null
          due_date?:     string | null
          project_id?:   string | null
          goal_id?:      string | null
          tag?:          string | null
          is_recurring?: boolean | null
          recur_rule?:   string | null
          created_at?:   string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_goal_id_fkey'
            columns: ['goal_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ── Row types ─────────────────────────────────────────────────────────────────

export type Task             = Database['public']['Tables']['tasks']['Row']
export type Project          = Database['public']['Tables']['projects']['Row']
export type Goal             = Database['public']['Tables']['goals']['Row']
export type GoalHabit        = Database['public']['Tables']['goal_habits']['Row']
export type Habit            = Database['public']['Tables']['habits']['Row']
export type HabitLog         = Database['public']['Tables']['habit_logs']['Row']
export type BudgetCategory   = Database['public']['Tables']['budget_categories']['Row']
export type IncomeSource     = Database['public']['Tables']['income_sources']['Row']
export type RecurringPayment = Database['public']['Tables']['recurring_payments']['Row']
export type Debt             = Database['public']['Tables']['debts']['Row']
export type SavingsPod       = Database['public']['Tables']['savings_pods']['Row']
export type Asset            = Database['public']['Tables']['assets']['Row']
export type NetWorthSnapshot = Database['public']['Tables']['net_worth_snapshots']['Row']

// ── Insert types ──────────────────────────────────────────────────────────────

export type TaskInsert             = Database['public']['Tables']['tasks']['Insert']
export type ProjectInsert          = Database['public']['Tables']['projects']['Insert']
export type GoalInsert             = Database['public']['Tables']['goals']['Insert']
export type GoalHabitInsert        = Database['public']['Tables']['goal_habits']['Insert']
export type HabitInsert            = Database['public']['Tables']['habits']['Insert']
export type HabitLogInsert         = Database['public']['Tables']['habit_logs']['Insert']
export type BudgetCategoryInsert   = Database['public']['Tables']['budget_categories']['Insert']
export type IncomeSourceInsert     = Database['public']['Tables']['income_sources']['Insert']
export type RecurringPaymentInsert = Database['public']['Tables']['recurring_payments']['Insert']
export type DebtInsert             = Database['public']['Tables']['debts']['Insert']
export type SavingsPodInsert       = Database['public']['Tables']['savings_pods']['Insert']
export type AssetInsert            = Database['public']['Tables']['assets']['Insert']
export type NetWorthSnapshotInsert = Database['public']['Tables']['net_worth_snapshots']['Insert']

// ── Update types ──────────────────────────────────────────────────────────────

export type TaskUpdate             = Database['public']['Tables']['tasks']['Update']
export type ProjectUpdate          = Database['public']['Tables']['projects']['Update']
export type GoalUpdate             = Database['public']['Tables']['goals']['Update']
export type GoalHabitUpdate        = Database['public']['Tables']['goal_habits']['Update']
export type HabitUpdate            = Database['public']['Tables']['habits']['Update']
export type HabitLogUpdate         = Database['public']['Tables']['habit_logs']['Update']
export type BudgetCategoryUpdate   = Database['public']['Tables']['budget_categories']['Update']
export type IncomeSourceUpdate     = Database['public']['Tables']['income_sources']['Update']
export type RecurringPaymentUpdate = Database['public']['Tables']['recurring_payments']['Update']
export type DebtUpdate             = Database['public']['Tables']['debts']['Update']
export type SavingsPodUpdate       = Database['public']['Tables']['savings_pods']['Update']
export type AssetUpdate            = Database['public']['Tables']['assets']['Update']
export type NetWorthSnapshotUpdate = Database['public']['Tables']['net_worth_snapshots']['Update']

// ── Derived types ─────────────────────────────────────────────────────────────

export type GoalHabitWithHabit = {
  goal_id:  string
  habit_id: string
  habit:    Habit
}
