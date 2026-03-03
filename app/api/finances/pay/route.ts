import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()
    const { player_id, season_id, amount } = body

    if (!player_id || !season_id || !amount || amount <= 0) {
      return NextResponse.json({ error: 'player_id, season_id, and positive amount are required' }, { status: 400 })
    }

    // Check if finance record exists
    const existing = await sql`
      SELECT * FROM player_season_finances 
      WHERE player_id = ${player_id} AND season_id = ${season_id}
    `

    if (existing.length === 0) {
      // Create new finance record with this payment
      const result = await sql`
        INSERT INTO player_season_finances (player_id, season_id, amount_due, amount_paid, payment_status, last_payment_date)
        VALUES (${player_id}, ${season_id}, 0, ${amount}, 'paid', NOW())
        RETURNING *
      `
      return NextResponse.json(result[0])
    }

    // Update existing record
    const currentPaid = Number(existing[0].amount_paid) || 0
    const amountDue = Number(existing[0].amount_due) || 0
    const newPaid = currentPaid + Number(amount)
    const newStatus = newPaid >= amountDue ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid'

    const result = await sql`
      UPDATE player_season_finances 
      SET 
        amount_paid = ${newPaid},
        payment_status = ${newStatus},
        last_payment_date = NOW()
      WHERE player_id = ${player_id} AND season_id = ${season_id}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}
