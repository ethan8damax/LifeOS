import { createClient } from '@/lib/supabase/client'
import type { List, ListInsert, ListUpdate, ListItem, ListItemInsert, ListItemUpdate, ListWithItems } from '@/types'

// ── Lists ─────────────────────────────────────────────────────────────────────

export async function getLists(): Promise<List[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getAllListItems(): Promise<ListItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('list_items')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createList(payload: Omit<ListInsert, 'user_id'>): Promise<List> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('lists')
    .insert({ ...payload, user_id: session.user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateList(id: string, payload: ListUpdate): Promise<List> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lists')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteList(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('lists').delete().eq('id', id)
  if (error) throw error
}

// ── List items ────────────────────────────────────────────────────────────────

export async function createListItem(
  payload: Omit<ListItemInsert, 'user_id'>,
): Promise<ListItem> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('list_items')
    .insert({ ...payload, user_id: session.user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateListItem(id: string, payload: ListItemUpdate): Promise<ListItem> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('list_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteListItem(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('list_items').delete().eq('id', id)
  if (error) throw error
}

export async function clearCompletedItems(listId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('list_id', listId)
    .eq('is_checked', true)
  if (error) throw error
}

export async function reorderListItems(
  updates: { id: string; sort_order: number }[],
): Promise<void> {
  const supabase = createClient()
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase.from('list_items').update({ sort_order }).eq('id', id),
    ),
  )
}

// ── Goal linking ──────────────────────────────────────────────────────────────

export async function getListsForGoals(goalIds: string[]): Promise<{ goal_id: string; list: ListWithItems }[]> {
  if (goalIds.length === 0) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('goal_lists')
    .select('goal_id, list:lists(*, list_items(*))')
    .in('goal_id', goalIds)
  if (error) {
    // goal_lists table may not exist yet — return empty gracefully
    if (error.code === '42P01') return []
    throw error
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).flatMap((row: any) => {
    if (!row.list || !row.goal_id) return []
    const { list_items, ...listFields } = row.list
    return [{
      goal_id: row.goal_id as string,
      list: { ...listFields, items: (list_items ?? []) as ListItem[] } as ListWithItems,
    }]
  })
}

export async function linkListToGoal(goalId: string, listId: string): Promise<void> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')
  const { error } = await supabase
    .from('goal_lists')
    .insert({ goal_id: goalId, list_id: listId, user_id: session.user.id })
  if (error && error.code !== '23505') throw error // ignore unique constraint violation
}

export async function unlinkListFromGoal(goalId: string, listId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('goal_lists')
    .delete()
    .eq('goal_id', goalId)
    .eq('list_id', listId)
  if (error) throw error
}
