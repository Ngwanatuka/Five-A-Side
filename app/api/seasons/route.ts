import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const seasons = await sql`
      SELECT * FROM seasons ORDER BY start_date DESC
    `
    return NextResponse.json(seasons)
  } catch (error) {
    console.error('Error fetching seasons:', error)
    return NextResponse.json({ error: 'Failed to fetch seasons' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, start_date, end_date, is_active } = body

    const result = await sql`
      INSERT INTO seasons (name, start_date, end_date, is_active)
      VALUES (${name}, ${start_date}, ${end_date || null}, ${is_active || false})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating season:', error)
    return NextResponse.json({ error: 'Failed to create season' }, { status: 500 })
  }
}
