import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get('seasonId')

    let finances
    if (seasonId) {
      finances = await sql`
        SELECT 
          psf.*,
          p.first_name,
          p.last_name,
          t.name as team_name
        FROM player_season_finances psf
        JOIN players p ON psf.player_id = p.id
        LEFT JOIN teams t ON p.team_id = t.id
        WHERE psf.season_id = ${parseInt(seasonId)}
        ORDER BY p.last_name ASC, p.first_name ASC
      `
    } else {
      // Get finances for active season
      finances = await sql`
        SELECT 
          psf.*,
          p.first_name,
          p.last_name,
          t.name as team_name
        FROM player_season_finances psf
        JOIN players p ON psf.player_id = p.id
        LEFT JOIN teams t ON p.team_id = t.id
        JOIN seasons s ON psf.season_id = s.id
        WHERE s.is_active = true
        ORDER BY p.last_name ASC, p.first_name ASC
      `
    }

    return NextResponse.json(finances)
  } catch (error) {
    console.error('Error fetching finances:', error)
    return NextResponse.json({ error: 'Failed to fetch finances' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()
    const { player_id, season_id, amount_due, amount_paid } = body

    const payment_status = amount_paid >= amount_due ? 'paid' : amount_paid > 0 ? 'partial' : 'unpaid'

    const result = await sql`
      INSERT INTO player_season_finances (player_id, season_id, amount_due, amount_paid, payment_status)
      VALUES (${player_id}, ${season_id}, ${amount_due}, ${amount_paid || 0}, ${payment_status})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating finance record:', error)
    return NextResponse.json({ error: 'Failed to create finance record' }, { status: 500 })
  }
}
