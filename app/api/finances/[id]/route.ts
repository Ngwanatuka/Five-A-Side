import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { amount_paid } = body

    // Get current record to calculate new status
    const current = await sql`
      SELECT amount_due FROM player_season_finances WHERE id = ${parseInt(id)}
    `
    
    if (current.length === 0) {
      return NextResponse.json({ error: 'Finance record not found' }, { status: 404 })
    }

    const payment_status = amount_paid >= current[0].amount_due 
      ? 'paid' 
      : amount_paid > 0 
        ? 'partial' 
        : 'unpaid'

    const result = await sql`
      UPDATE player_season_finances 
      SET 
        amount_paid = ${amount_paid},
        payment_status = ${payment_status},
        last_payment_date = CASE WHEN ${amount_paid} > 0 THEN NOW() ELSE last_payment_date END
      WHERE id = ${parseInt(id)}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating finance record:', error)
    return NextResponse.json({ error: 'Failed to update finance record' }, { status: 500 })
  }
}
