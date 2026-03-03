import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get('seasonId')

    let standings
    if (seasonId) {
      standings = await sql`
        SELECT 
          tsr.*,
          t.name as team_name,
          t.logo_url,
          t.primary_color,
          (tsr.goals_for - tsr.goals_against) as goal_difference
        FROM team_season_registrations tsr
        JOIN teams t ON tsr.team_id = t.id
        WHERE tsr.season_id = ${parseInt(seasonId)}
        ORDER BY tsr.points DESC, goal_difference DESC, tsr.goals_for DESC
      `
    } else {
      // Get standings for active season
      standings = await sql`
        SELECT 
          tsr.*,
          t.name as team_name,
          t.logo_url,
          t.primary_color,
          (tsr.goals_for - tsr.goals_against) as goal_difference
        FROM team_season_registrations tsr
        JOIN teams t ON tsr.team_id = t.id
        JOIN seasons s ON tsr.season_id = s.id
        WHERE s.is_active = true
        ORDER BY tsr.points DESC, goal_difference DESC, tsr.goals_for DESC
      `
    }

    return NextResponse.json(standings)
  } catch (error) {
    console.error('Error fetching standings:', error)
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 })
  }
}
