import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = getDb()
    const { id } = await params
    const matches = await sql`
      SELECT 
        m.*,
        ht.name as home_team_name,
        at.name as away_team_name,
        ht.primary_color as home_team_color,
        at.primary_color as away_team_color
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = ${parseInt(id)}
    `
    if (matches.length === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    return NextResponse.json(matches[0])
  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = getDb()
    const { id } = await params
    const body = await request.json()
    const { home_score, away_score, status } = body

    // Update match
    const result = await sql`
      UPDATE matches 
      SET 
        home_score = COALESCE(${home_score}, home_score),
        away_score = COALESCE(${away_score}, away_score),
        status = COALESCE(${status}, status)
      WHERE id = ${parseInt(id)}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // If match is completed, update standings
    if (status === 'completed' && home_score !== undefined && away_score !== undefined) {
      const match = result[0]
      
      // Determine result
      let homePoints = 0, awayPoints = 0
      let homeWon = 0, homeLost = 0, homeDrawn = 0
      let awayWon = 0, awayLost = 0, awayDrawn = 0
      
      if (home_score > away_score) {
        homePoints = 3
        homeWon = 1
        awayLost = 1
      } else if (away_score > home_score) {
        awayPoints = 3
        awayWon = 1
        homeLost = 1
      } else {
        homePoints = 1
        awayPoints = 1
        homeDrawn = 1
        awayDrawn = 1
      }

      // Update home team standings
      await sql`
        UPDATE team_season_registrations
        SET 
          played = played + 1,
          won = won + ${homeWon},
          drawn = drawn + ${homeDrawn},
          lost = lost + ${homeLost},
          goals_for = goals_for + ${home_score},
          goals_against = goals_against + ${away_score},
          points = points + ${homePoints}
        WHERE team_id = ${match.home_team_id} AND season_id = ${match.season_id}
      `

      // Update away team standings
      await sql`
        UPDATE team_season_registrations
        SET 
          played = played + 1,
          won = won + ${awayWon},
          drawn = drawn + ${awayDrawn},
          lost = lost + ${awayLost},
          goals_for = goals_for + ${away_score},
          goals_against = goals_against + ${home_score},
          points = points + ${awayPoints}
        WHERE team_id = ${match.away_team_id} AND season_id = ${match.season_id}
      `
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
  }
}
