import { createClient } from '@/lib/supabase/client'
import type {
  BudgetCategory, BudgetCategoryInsert, BudgetCategoryUpdate,
  IncomeSource, IncomeSourceInsert, IncomeSourceUpdate,
  RecurringPayment, RecurringPaymentInsert, RecurringPaymentUpdate,
  Debt, DebtInsert, DebtUpdate,
  SavingsPod, SavingsPodInsert, SavingsPodUpdate,
  Asset, AssetInsert, AssetUpdate,
  NetWorthSnapshot, NetWorthSnapshotInsert,
} from '@/types'

// ── Private helper ────────────────────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof createClient>

async function resolveHouseholdId(supabase: SupabaseClient): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', session.user.id)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No household found — complete onboarding first')
  return data.household_id
}

// ── Budget categories ─────────────────────────────────────────────────────────

export async function getBudgetCategories(month: string): Promise<BudgetCategory[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('month', month)
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createBudgetCategory(payload: BudgetCategoryInsert): Promise<BudgetCategory> {
  const supabase = createClient()
  const household_id = await resolveHouseholdId(supabase)
  const { data, error } = await supabase
    .from('budget_categories')
    .insert({ ...payload, household_id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBudgetCategory(id: string, payload: BudgetCategoryUpdate): Promise<BudgetCategory> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budget_categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBudgetCategory(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('budget_categories').delete().eq('id', id)
  if (error) throw error
}

// ── Income sources ────────────────────────────────────────────────────────────

export async function getIncomeSources(month: string): Promise<IncomeSource[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('income_sources')
    .select('*')
    .eq('month', month)
    .order('owner', { ascending: true })
  if (error) throw error
  return data
}

export async function createIncomeSource(payload: IncomeSourceInsert): Promise<IncomeSource> {
  const supabase = createClient()
  const household_id = await resolveHouseholdId(supabase)
  const { data, error } = await supabase
    .from('income_sources')
    .insert({ ...payload, household_id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateIncomeSource(id: string, payload: IncomeSourceUpdate): Promise<IncomeSource> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('income_sources')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteIncomeSource(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('income_sources').delete().eq('id', id)
  if (error) throw error
}

// ── Recurring payments ────────────────────────────────────────────────────────

export async function getRecurringPayments(): Promise<RecurringPayment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recurring_payments')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createRecurringPayment(payload: RecurringPaymentInsert): Promise<RecurringPayment> {
  const supabase = createClient()
  const household_id = await resolveHouseholdId(supabase)
  const { data, error } = await supabase
    .from('recurring_payments')
    .insert({ ...payload, household_id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRecurringPayment(id: string, payload: RecurringPaymentUpdate): Promise<RecurringPayment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recurring_payments')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRecurringPayment(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('recurring_payments').delete().eq('id', id)
  if (error) throw error
}

// ── Debts ─────────────────────────────────────────────────────────────────────

export async function getDebts(): Promise<Debt[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .order('owner', { ascending: true })
  if (error) throw error
  return data
}

export async function createDebt(payload: DebtInsert): Promise<Debt> {
  const supabase = createClient()
  const household_id = await resolveHouseholdId(supabase)
  const { data, error } = await supabase
    .from('debts')
    .insert({ ...payload, household_id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateDebt(id: string, payload: DebtUpdate): Promise<Debt> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('debts')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDebt(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('debts').delete().eq('id', id)
  if (error) throw error
}

// ── Savings pods ──────────────────────────────────────────────────────────────

export async function getSavingsPods(): Promise<SavingsPod[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('savings_pods')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createSavingsPod(payload: SavingsPodInsert): Promise<SavingsPod> {
  const supabase = createClient()
  const household_id = await resolveHouseholdId(supabase)
  const { data, error } = await supabase
    .from('savings_pods')
    .insert({ ...payload, household_id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSavingsPod(id: string, payload: SavingsPodUpdate): Promise<SavingsPod> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('savings_pods')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSavingsPod(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('savings_pods').delete().eq('id', id)
  if (error) throw error
}

// ── Assets ────────────────────────────────────────────────────────────────────

export async function getAssets(): Promise<Asset[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createAsset(payload: AssetInsert): Promise<Asset> {
  const supabase = createClient()
  const household_id = await resolveHouseholdId(supabase)
  const { data, error } = await supabase
    .from('assets')
    .insert({ ...payload, household_id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateAsset(id: string, payload: AssetUpdate): Promise<Asset> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('assets')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAsset(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('assets').delete().eq('id', id)
  if (error) throw error
}

// ── Net worth snapshots ───────────────────────────────────────────────────────

export async function getNetWorthSnapshots(): Promise<NetWorthSnapshot[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('net_worth_snapshots')
    .select('*')
    .order('month', { ascending: true })
  if (error) throw error
  return data
}

export async function createNetWorthSnapshot(payload: NetWorthSnapshotInsert): Promise<NetWorthSnapshot> {
  const supabase = createClient()
  const household_id = await resolveHouseholdId(supabase)
  const { data, error } = await supabase
    .from('net_worth_snapshots')
    .insert({ ...payload, household_id })
    .select()
    .single()
  if (error) throw error
  return data
}
