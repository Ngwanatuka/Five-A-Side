import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const teams = await sql`
      SELECT * FROM teams ORDER BY name ASC
    `
    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, logo_url, primary_color, secondary_color } = body

    const result = await sql`
      INSERT INTO teams (name, logo_url, primary_color, secondary_color)
      VALUES (${name}, ${logo_url || null}, ${primary_color || '#10b981'}, ${secondary_color || '#064e3b'})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}
