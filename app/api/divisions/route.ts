import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get('seasonId')

    let divisions
    if (seasonId) {
      divisions = await sql`
        SELECT * FROM divisions 
        WHERE season_id = ${parseInt(seasonId)}
        ORDER BY name ASC
      `
    } else {
      divisions = await sql`
        SELECT d.* FROM divisions d
        JOIN seasons s ON d.season_id = s.id
        WHERE s.is_active = true
        ORDER BY d.name ASC
      `
    }

    return NextResponse.json(divisions)
  } catch (error) {
    console.error('Error fetching divisions:', error)
    return NextResponse.json({ error: 'Failed to fetch divisions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()
    const { name, season_id } = body

    const result = await sql`
      INSERT INTO divisions (name, season_id)
      VALUES (${name}, ${season_id})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating division:', error)
    return NextResponse.json({ error: 'Failed to create division' }, { status: 500 })
  }
}
