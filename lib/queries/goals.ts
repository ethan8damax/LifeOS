import { createClient } from '@/lib/supabase/client'
import type {
  Goal, GoalInsert, GoalUpdate,
  GoalHabit, GoalHabitWithHabit,
  Habit,
} from '@/types'

// ── Goals ─────────────────────────────────────────────────────────────────────

export async function getGoals(filters?: {
  status?: string
}): Promise<Goal[]> {
  const supabase = createClient()
  let query = supabase.from('goals').select('*').order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getGoalById(id: string): Promise<Goal> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createGoal(payload: GoalInsert): Promise<Goal> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase
    .from('goals')
    .insert({ ...payload, ...(session?.user ? { user_id: session.user.id } : {}) })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateGoal(id: string, payload: GoalUpdate): Promise<Goal> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('goals')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteGoal(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw error
}

// ── Goal ↔ habit links ────────────────────────────────────────────────────────

/**
 * Fetch all goal_habits rows for a list of goal IDs, with the full habit record
 * joined in. Returns a flat array of { goal_id, habit_id, habit }.
 */
export async function getGoalHabitsWithHabits(
  goalIds: string[],
): Promise<GoalHabitWithHabit[]> {
  if (goalIds.length === 0) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('goal_habits')
    .select('goal_id, habit_id, habit:habits(*)')
    .in('goal_id', goalIds)
  if (error) throw error
  return (data as Array<{ goal_id: string; habit_id: string; habit: Habit }>).map(row => ({
    goal_id:  row.goal_id,
    habit_id: row.habit_id,
    habit:    row.habit,
  }))
}

export async function linkHabitToGoal(
  goalId:  string,
  habitId: string,
): Promise<GoalHabit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase
    .from('goal_habits')
    .upsert(
      {
        goal_id: goalId,
        habit_id: habitId,
        ...(session?.user ? { user_id: session.user.id } : {}),
      },
      { onConflict: 'goal_id,habit_id' },
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function unlinkHabitFromGoal(
  goalId:  string,
  habitId: string,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('goal_habits')
    .delete()
    .eq('goal_id', goalId)
    .eq('habit_id', habitId)
  if (error) throw error
}
