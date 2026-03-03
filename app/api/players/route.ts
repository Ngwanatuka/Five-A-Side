import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    let players
    if (teamId) {
      players = await sql`
        SELECT 
          p.*,
          t.name as team_name
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        WHERE p.team_id = ${parseInt(teamId)}
        ORDER BY p.last_name ASC, p.first_name ASC
      `
    } else {
      players = await sql`
        SELECT 
          p.*,
          t.name as team_name
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        ORDER BY p.last_name ASC, p.first_name ASC
      `
    }

    return NextResponse.json(players)
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()
    const { first_name, last_name, email, phone, team_id, jersey_number, position } = body

    const result = await sql`
      INSERT INTO players (first_name, last_name, email, phone, team_id, jersey_number, position)
      VALUES (${first_name}, ${last_name}, ${email || null}, ${phone || null}, ${team_id || null}, ${jersey_number || null}, ${position || null})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
  }
}
