import { createClient } from '@/lib/supabase'
import type { Task, TaskInsert, TaskUpdate, Project, ProjectInsert, ProjectUpdate } from '@/types'

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function getTasks(filters?: {
  status?: string
  due_date?: string
  project_id?: string
}): Promise<Task[]> {
  const supabase = createClient()
  let query = supabase.from('tasks').select('*').order('due_date', { ascending: true, nullsFirst: false })

  if (filters?.status)     query = query.eq('status', filters.status)
  if (filters?.due_date)   query = query.eq('due_date', filters.due_date)
  if (filters?.project_id) query = query.eq('project_id', filters.project_id)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getTaskById(id: string): Promise<Task> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createTask(payload: TaskInsert): Promise<Task> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...payload, ...(session?.user ? { user_id: session.user.id } : {}) })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTask(id: string, payload: TaskUpdate): Promise<Task> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// Returns all tasks (tactics) linked directly to any of the given goal IDs.
export async function getTasksByGoalIds(goalIds: string[]): Promise<Task[]> {
  if (goalIds.length === 0) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .in('goal_id', goalIds)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function getProjects(filters?: {
  status?: string
  goal_id?: string
}): Promise<Project[]> {
  const supabase = createClient()
  let query = supabase.from('projects').select('*').order('created_at', { ascending: false })

  if (filters?.status)  query = query.eq('status', filters.status)
  if (filters?.goal_id) query = query.eq('goal_id', filters.goal_id)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getProjectById(id: string): Promise<Project> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createProject(payload: ProjectInsert): Promise<Project> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...payload, ...(session?.user ? { user_id: session.user.id } : {}) })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProject(id: string, payload: ProjectUpdate): Promise<Project> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}
