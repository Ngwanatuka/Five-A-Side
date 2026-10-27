import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = getDb()
    const { id: rawId } = await params

    // Resolve numeric ID from either "123" or "p-123" format
    const numericId = /^p-(\d+)$/.test(rawId)
      ? parseInt(rawId.replace('p-', ''), 10)
      : /^\d+$/.test(rawId)
      ? parseInt(rawId, 10)
      : null

    if (numericId === null || isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 })
    }

    const existing = await sql`SELECT id FROM players WHERE id = ${numericId}`
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Remove FK dependencies first
    await sql`DELETE FROM player_season_finances WHERE player_id = ${numericId}`
    await sql`DELETE FROM match_rosters WHERE player_id = ${numericId}`
    await sql`DELETE FROM players WHERE id = ${numericId}`

    return NextResponse.json({ success: true, deletedId: rawId })
  } catch (error) {
    console.error('Error deleting player:', error)
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 })
  }
}
