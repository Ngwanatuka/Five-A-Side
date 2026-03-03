import { CreditCard, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { sql } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import type { PlayerFinanceWithDetails } from "@/lib/db"

async function getFinances(): Promise<PlayerFinanceWithDetails[]> {
  try {
    const finances = await sql`
      SELECT 
        psf.*,
        p.first_name,
        p.last_name,
        t.name as team_name
      FROM player_season_finances psf
      JOIN players p ON psf.player_id = p.id
      LEFT JOIN teams t ON p.team_id = t.id
      JOIN seasons s ON psf.season_id = s.id
      WHERE s.is_active = true
      ORDER BY psf.payment_status ASC, p.last_name ASC, p.first_name ASC
    `
    return finances as PlayerFinanceWithDetails[]
  } catch {
    return []
  }
}

async function getActiveSeason() {
  try {
    const seasons = await sql`SELECT * FROM seasons WHERE is_active = true LIMIT 1`
    return seasons[0] || null
  } catch {
    return null
  }
}

export default async function PaymentsPage() {
  const [finances, season] = await Promise.all([getFinances(), getActiveSeason()])

  // Calculate totals
  const totalDue = finances.reduce((sum, f) => sum + Number(f.amount_due), 0)
  const totalPaid = finances.reduce((sum, f) => sum + Number(f.amount_paid), 0)
  const paidCount = finances.filter(f => f.payment_status === 'paid').length
  const partialCount = finances.filter(f => f.payment_status === 'partial').length
  const unpaidCount = finances.filter(f => f.payment_status === 'unpaid').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          {season && <p className="text-sm text-muted-foreground">{season.name}</p>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-muted-foreground">Total Due</div>
          <div className="text-2xl font-bold">{formatCurrency(totalDue)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-muted-foreground">Total Collected</div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-muted-foreground">Outstanding</div>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(totalDue - totalPaid)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-muted-foreground">Collection Rate</div>
          <div className="text-2xl font-bold">
            {totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 status-badge payment-paid">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>{paidCount} Paid</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 status-badge payment-partial">
            <Clock className="h-3.5 w-3.5" />
            <span>{partialCount} Partial</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 status-badge payment-unpaid">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{unpaidCount} Unpaid</span>
          </div>
        </div>
      </div>

      {/* Player Finance List */}
      {finances.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="standings-table">
              <thead className="border-b border-border">
                <tr>
                  <th>Player</th>
                  <th>Team</th>
                  <th className="text-right">Due</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Balance</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {finances.map((finance) => {
                  const balance = Number(finance.amount_due) - Number(finance.amount_paid)
                  return (
                    <tr key={finance.id}>
                      <td className="font-medium">
                        {finance.first_name} {finance.last_name}
                      </td>
                      <td className="text-muted-foreground">
                        {finance.team_name || '—'}
                      </td>
                      <td className="text-right">{formatCurrency(Number(finance.amount_due))}</td>
                      <td className="text-right text-primary">{formatCurrency(Number(finance.amount_paid))}</td>
                      <td className="text-right">
                        <span className={balance > 0 ? 'text-destructive' : 'text-primary'}>
                          {formatCurrency(balance)}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`status-badge payment-${finance.payment_status}`}>
                          {finance.payment_status === 'paid' && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                          {finance.payment_status === 'partial' && <Clock className="h-3.5 w-3.5 mr-1" />}
                          {finance.payment_status === 'unpaid' && <AlertCircle className="h-3.5 w-3.5 mr-1" />}
                          {finance.payment_status.charAt(0).toUpperCase() + finance.payment_status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No payment records</p>
          <p className="text-sm mt-2">Player payment information will appear here</p>
        </div>
      )}
    </div>
  )
}
