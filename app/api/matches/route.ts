import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get('seasonId')
    const status = searchParams.get('status')

    let matches
    if (seasonId && status) {
      matches = await sql`
        SELECT 
          m.*,
          ht.name as home_team_name,
          at.name as away_team_name,
          ht.primary_color as home_team_color,
          at.primary_color as away_team_color
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        WHERE m.season_id = ${parseInt(seasonId)} AND m.status = ${status}
        ORDER BY m.match_date ASC, m.kick_off_time ASC
      `
    } else if (seasonId) {
      matches = await sql`
        SELECT 
          m.*,
          ht.name as home_team_name,
          at.name as away_team_name,
          ht.primary_color as home_team_color,
          at.primary_color as away_team_color
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        WHERE m.season_id = ${parseInt(seasonId)}
        ORDER BY m.match_date ASC, m.kick_off_time ASC
      `
    } else {
      // Get matches for active season
      matches = await sql`
        SELECT 
          m.*,
          ht.name as home_team_name,
          at.name as away_team_name,
          ht.primary_color as home_team_color,
          at.primary_color as away_team_color
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        JOIN seasons s ON m.season_id = s.id
        WHERE s.is_active = true
        ORDER BY m.match_date ASC, m.kick_off_time ASC
      `
    }

    return NextResponse.json(matches)
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()
    const { 
      season_id, division_id, home_team_id, away_team_id, 
      match_date, kick_off_time, venue, matchday 
    } = body

    const result = await sql`
      INSERT INTO matches (season_id, division_id, home_team_id, away_team_id, match_date, kick_off_time, venue, matchday)
      VALUES (${season_id}, ${division_id}, ${home_team_id}, ${away_team_id}, ${match_date}, ${kick_off_time || null}, ${venue || null}, ${matchday || null})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating match:', error)
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
  }
}
