import { createClient } from '@/lib/supabase'
import type { Transaction, TransactionInsert, TransactionUpdate, Budget, BudgetInsert, BudgetUpdate } from '@/types'

// ── Transactions ──────────────────────────────────────────────────────────────

export async function getTransactions(filters?: {
  type?: string
  month?: string   // 'YYYY-MM' — filters date within that calendar month
}): Promise<Transaction[]> {
  const supabase = createClient()
  let query = supabase.from('transactions').select('*').order('date', { ascending: false })

  if (filters?.type)  query = query.eq('type', filters.type)
  if (filters?.month) {
    const [y, mo] = filters.month.split('-').map(Number)
    const nextMonth = mo === 12
      ? `${y + 1}-01`
      : `${y}-${String(mo + 1).padStart(2, '0')}`
    query = query
      .gte('date', `${filters.month}-01`)
      .lt('date',  `${nextMonth}-01`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getTransactionById(id: string): Promise<Transaction> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createTransaction(payload: TransactionInsert): Promise<Transaction> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTransaction(id: string, payload: TransactionUpdate): Promise<Transaction> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}

// ── Budgets ───────────────────────────────────────────────────────────────────

export async function getBudgets(month: string): Promise<Budget[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('month', month)
    .order('category', { ascending: true })
  if (error) throw error
  return data
}

export async function getBudgetById(id: string): Promise<Budget> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createBudget(payload: BudgetInsert): Promise<Budget> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budgets')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBudget(id: string, payload: BudgetUpdate): Promise<Budget> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budgets')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBudget(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('budgets').delete().eq('id', id)
  if (error) throw error
}
