import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get('seasonId')

    if (!seasonId) {
      return NextResponse.json({ error: 'seasonId is required' }, { status: 400 })
    }

    // Get team finance summaries
    const teamFinances = await sql`
      SELECT 
        t.id as team_id,
        t.name as team_name,
        t.primary_color,
        t.secondary_color,
        COUNT(DISTINCT p.id) as total_players,
        COALESCE(SUM(psf.amount_due), 0) as total_due,
        COALESCE(SUM(psf.amount_paid), 0) as total_paid,
        COALESCE(SUM(psf.amount_due), 0) - COALESCE(SUM(psf.amount_paid), 0) as balance
      FROM teams t
      LEFT JOIN players p ON p.team_id = t.id
      LEFT JOIN player_season_finances psf ON psf.player_id = p.id AND psf.season_id = ${seasonId}
      GROUP BY t.id, t.name, t.primary_color, t.secondary_color
      ORDER BY balance DESC
    `

    return NextResponse.json(teamFinances)
  } catch (error) {
    console.error('Error fetching team finances:', error)
    return NextResponse.json({ error: 'Failed to fetch team finances' }, { status: 500 })
  }
}
