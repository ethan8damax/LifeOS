import { createClient } from '@/lib/supabase'

// ── Households ────────────────────────────────────────────────────────────────

/**
 * Create a new household with a random 8-char invite code.
 * Returns the new household id and invite_code.
 */
export async function createHousehold(name: string): Promise<{ id: string; invite_code: string }> {
  const supabase = createClient()
  const inviteCode = generateInviteCode()

  const { data, error } = await supabase
    .from('households')
    .insert({ name, invite_code: inviteCode })
    .select('id, invite_code')
    .single()

  if (error) throw error
  return { id: data.id, invite_code: data.invite_code ?? inviteCode }
}

/**
 * Find a household by invite code, then add the user as a member.
 */
export async function joinHousehold(
  inviteCode: string,
  userId: string,
  displayName: string,
): Promise<void> {
  const supabase = createClient()

  const { data: household, error: findError } = await supabase
    .from('households')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (findError) throw findError

  await addMemberToHousehold(household.id, userId, displayName)
}

/**
 * Add a user to an existing household.
 */
export async function addMemberToHousehold(
  householdId: string,
  userId: string,
  displayName: string,
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('household_members')
    .insert({ household_id: householdId, user_id: userId, display_name: displayName })

  if (error) throw error
}

/**
 * Get the household membership for a user. Returns null if the user has no household.
 */
export async function getHouseholdMember(
  userId: string,
): Promise<{ household_id: string; display_name: string | null } | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('household_members')
    .select('household_id, display_name')
    .eq('user_id', userId)
    .maybeSingle()

  // PGRST116 = no rows found — treat as null, not an error
  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
