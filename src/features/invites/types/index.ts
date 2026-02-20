// ── Access Level ─────────────────────────────────────────────────────────────

export type AccessLevel = 'founding' | 'admin' | 'paid' | 'free'

// ── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  access_level: AccessLevel
  trial_ends_at: string | null
  max_plants: number
  created_at: string
  updated_at: string
}

// ── Invite ───────────────────────────────────────────────────────────────────

export type InviteStatus = 'pending' | 'consumed' | 'expired'

export interface Invite {
  id: string
  token: string
  lead_id: string
  email: string
  name: string
  access_level: AccessLevel
  max_plants: number
  status: InviteStatus
  expires_at: string
  consumed_at: string | null
  created_by: string
  created_at: string
}
