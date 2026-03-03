import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const sql = getDb()
    const { teamId } = await params
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get('seasonId')

    if (!seasonId) {
      return NextResponse.json({ error: 'seasonId is required' }, { status: 400 })
    }

    // Get players with their finance info for this team
    const players = await sql`
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.jersey_number,
        p.position,
        COALESCE(psf.id, 0) as finance_id,
        COALESCE(psf.amount_due, 0) as amount_due,
        COALESCE(psf.amount_paid, 0) as amount_paid,
        COALESCE(psf.payment_status, 'unpaid') as payment_status,
        psf.last_payment_date
      FROM players p
      LEFT JOIN player_season_finances psf ON psf.player_id = p.id AND psf.season_id = ${seasonId}
      WHERE p.team_id = ${teamId}
      ORDER BY p.last_name ASC, p.first_name ASC
    `

    return NextResponse.json(players)
  } catch (error) {
    console.error('Error fetching team players finances:', error)
    return NextResponse.json({ error: 'Failed to fetch team players' }, { status: 500 })
  }
}
