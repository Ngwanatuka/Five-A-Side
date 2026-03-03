import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const sql = getDb()
    const seasons = await sql`
      SELECT * FROM seasons WHERE is_active = true LIMIT 1
    `
    if (seasons.length === 0) {
      return NextResponse.json({ error: 'No active season found' }, { status: 404 })
    }
    return NextResponse.json(seasons[0])
  } catch (error) {
    console.error('Error fetching active season:', error)
    return NextResponse.json({ error: 'Failed to fetch active season' }, { status: 500 })
  }
}
