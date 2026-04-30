import { createClient } from '@/lib/supabase'
import type { Habit, HabitInsert, HabitUpdate, HabitLog, HabitLogInsert } from '@/types'

// ── Habits ────────────────────────────────────────────────────────────────────

export async function getHabits(): Promise<Habit[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getHabitById(id: string): Promise<Habit> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createHabit(payload: HabitInsert): Promise<Habit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase
    .from('habits')
    .insert({ ...payload, ...(session?.user ? { user_id: session.user.id } : {}) })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateHabit(id: string, payload: HabitUpdate): Promise<Habit> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('habits')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHabit(id: string): Promise<void> {
  const supabase = createClient()
  // Delete logs first — no ON DELETE CASCADE on the FK
  const { error: logsError } = await supabase.from('habit_logs').delete().eq('habit_id', id)
  if (logsError) throw logsError
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) throw error
}

// ── Habit logs ────────────────────────────────────────────────────────────────

/**
 * Fetch logs for one habit within a date range (inclusive).
 * Used to render the dots for a single habit on the habits page.
 */
export async function getHabitLogs(
  habitId: string,
  from: string,
  to: string,
): Promise<HabitLog[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .gte('logged_date', from)
    .lte('logged_date', to)
    .order('logged_date', { ascending: true })
  if (error) throw error
  return data
}

/**
 * Fetch logs for multiple habits within a date range.
 * Used by the dashboard and habits page to load the full week in one query.
 */
export async function getHabitLogsForWeek(
  habitIds: string[],
  from: string,
  to: string,
): Promise<HabitLog[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .in('habit_id', habitIds)
    .gte('logged_date', from)
    .lte('logged_date', to)
    .order('logged_date', { ascending: true })
  if (error) throw error
  return data
}

/**
 * Mark a habit as completed for a given date.
 * Uses upsert to handle the unique(habit_id, logged_date) constraint — safe to call
 * multiple times for the same day.
 */
export async function logHabit(habitId: string, date: string): Promise<HabitLog> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase
    .from('habit_logs')
    .upsert(
      {
        habit_id: habitId,
        logged_date: date,
        completed: true,
        ...(session?.user ? { user_id: session.user.id } : {}),
      },
      { onConflict: 'habit_id,logged_date' },
    )
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Remove a habit log for a given date (un-check).
 */
export async function unlogHabit(habitId: string, date: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('logged_date', date)
  if (error) throw error
}

export async function createHabitLog(payload: HabitLogInsert): Promise<HabitLog> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase
    .from('habit_logs')
    .insert({ ...payload, ...(session?.user ? { user_id: session.user.id } : {}) })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHabitLog(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('habit_logs').delete().eq('id', id)
  if (error) throw error
}
