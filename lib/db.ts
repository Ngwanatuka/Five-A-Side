import { neon } from '@neondatabase/serverless'

// Create a function that returns the sql client - this way we don't throw at build time
export function getDb() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return neon(connectionString)
}

// Type definitions based on database schema
export type Season = {
  id: number
  name: string
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
}

export type Division = {
  id: number
  name: string
  season_id: number
  created_at: string
}

export type Team = {
  id: number
  name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  created_at: string
}

export type Player = {
  id: number
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  team_id: number | null
  jersey_number: number | null
  position: string | null
  created_at: string
}

export type TeamSeasonRegistration = {
  id: number
  team_id: number
  season_id: number
  division_id: number
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  points: number
  registration_fee_paid: boolean
  created_at: string
}

export type Match = {
  id: number
  season_id: number
  division_id: number
  home_team_id: number
  away_team_id: number
  match_date: string
  kick_off_time: string | null
  venue: string | null
  home_score: number | null
  away_score: number | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled'
  matchday: number | null
  created_at: string
}

export type PlayerSeasonFinance = {
  id: number
  player_id: number
  season_id: number
  amount_due: number
  amount_paid: number
  payment_status: 'unpaid' | 'partial' | 'paid'
  last_payment_date: string | null
  created_at: string
}

export type MatchRoster = {
  id: number
  match_id: number
  player_id: number
  team_id: number
  goals_scored: number
  assists: number
  yellow_cards: number
  red_cards: number
  minutes_played: number | null
}

// Extended types for joined queries
export type StandingRow = TeamSeasonRegistration & {
  team_name: string
  logo_url: string | null
  primary_color: string
  goal_difference: number
}

export type MatchWithTeams = Match & {
  home_team_name: string
  away_team_name: string
  home_team_color: string
  away_team_color: string
}

export type PlayerWithTeam = Player & {
  team_name: string | null
}

export type PlayerFinanceWithDetails = PlayerSeasonFinance & {
  first_name: string
  last_name: string
  team_name: string | null
}
