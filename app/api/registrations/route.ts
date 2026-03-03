import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get('seasonId')

    let registrations
    if (seasonId) {
      registrations = await sql`
        SELECT 
          tsr.*,
          t.name as team_name,
          t.primary_color,
          d.name as division_name
        FROM team_season_registrations tsr
        JOIN teams t ON tsr.team_id = t.id
        JOIN divisions d ON tsr.division_id = d.id
        WHERE tsr.season_id = ${parseInt(seasonId)}
        ORDER BY t.name ASC
      `
    } else {
      registrations = await sql`
        SELECT 
          tsr.*,
          t.name as team_name,
          t.primary_color,
          d.name as division_name
        FROM team_season_registrations tsr
        JOIN teams t ON tsr.team_id = t.id
        JOIN divisions d ON tsr.division_id = d.id
        JOIN seasons s ON tsr.season_id = s.id
        WHERE s.is_active = true
        ORDER BY t.name ASC
      `
    }

    return NextResponse.json(registrations)
  } catch (error) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()
    const { team_id, season_id, division_id } = body

    const result = await sql`
      INSERT INTO team_season_registrations (team_id, season_id, division_id)
      VALUES (${team_id}, ${season_id}, ${division_id})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating registration:', error)
    return NextResponse.json({ error: 'Failed to create registration' }, { status: 500 })
  }
}
