import { createClient } from '@/lib/supabase'
import type { Goal, GoalInsert, GoalUpdate } from '@/types'

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
  const { data, error } = await supabase
    .from('goals')
    .insert(payload)
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
