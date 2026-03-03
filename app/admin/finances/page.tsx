"use client"

import { useState } from "react"
import useSWR from "swr"
import { CreditCard, Plus, Check, X, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { PlayerWithTeam, Season, PlayerFinanceWithDetails } from "@/lib/db"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminFinancesPage() {
  const { data: finances, mutate } = useSWR<PlayerFinanceWithDetails[]>('/api/finances', fetcher)
  const { data: players } = useSWR<PlayerWithTeam[]>('/api/players', fetcher)
  const { data: seasons } = useSWR<Season[]>('/api/seasons', fetcher)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [formData, setFormData] = useState({
    player_id: '',
    season_id: '',
    amount_due: '',
    amount_paid: '0'
  })

  const activeSeason = seasons?.find(s => s.is_active)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: parseInt(formData.player_id),
          season_id: parseInt(formData.season_id || activeSeason?.id?.toString() || '0'),
          amount_due: parseFloat(formData.amount_due),
          amount_paid: parseFloat(formData.amount_paid)
        })
      })
      mutate()
      setIsAdding(false)
      setFormData({ player_id: '', season_id: '', amount_due: '', amount_paid: '0' })
    } catch (error) {
      console.error('Error creating finance record:', error)
    }
  }

  const handlePaymentUpdate = async (id: number) => {
    try {
      await fetch(`/api/finances/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paid: parseFloat(editAmount)
        })
      })
      mutate()
      setEditingId(null)
      setEditAmount('')
    } catch (error) {
      console.error('Error updating payment:', error)
    }
  }

  const totalDue = finances?.reduce((sum, f) => sum + Number(f.amount_due), 0) || 0
  const totalPaid = finances?.reduce((sum, f) => sum + Number(f.amount_paid), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manage Finances</h1>
            <p className="text-sm text-muted-foreground">Track and record payments</p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Record
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-muted-foreground">Total Due</div>
          <div className="text-2xl font-bold">{formatCurrency(totalDue)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-muted-foreground">Collected</div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-muted-foreground">Outstanding</div>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(totalDue - totalPaid)}</div>
        </div>
      </div>

      {/* Add Finance Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Create Finance Record</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Player</label>
              <select
                value={formData.player_id}
                onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select player</option>
                {players?.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.first_name} {player.last_name} {player.team_name ? `(${player.team_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Season</label>
              <select
                value={formData.season_id}
                onChange={(e) => setFormData({ ...formData, season_id: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Active season</option>
                {seasons?.map((season) => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount Due (R)</label>
              <input
                type="number"
                value={formData.amount_due}
                onChange={(e) => setFormData({ ...formData, amount_due: e.target.value })}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Initial Payment (R)</label>
              <input
                type="number"
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
            >
              <Check className="h-4 w-4" />
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Finance Records */}
      <div className="glass-card overflow-hidden">
        {finances && finances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="standings-table">
              <thead className="border-b border-border">
                <tr>
                  <th>Player</th>
                  <th>Team</th>
                  <th className="text-right">Due</th>
                  <th className="text-right">Paid</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {finances.map((finance) => (
                  <tr key={finance.id}>
                    <td className="font-medium">{finance.first_name} {finance.last_name}</td>
                    <td className="text-muted-foreground">{finance.team_name || '—'}</td>
                    <td className="text-right">{formatCurrency(Number(finance.amount_due))}</td>
                    <td className="text-right text-primary">{formatCurrency(Number(finance.amount_paid))}</td>
                    <td className="text-center">
                      <span className={`status-badge payment-${finance.payment_status}`}>
                        {finance.payment_status}
                      </span>
                    </td>
                    <td className="text-center">
                      {editingId === finance.id ? (
                        <div className="flex items-center gap-2 justify-center">
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-24 px-2 py-1 bg-input border border-border rounded text-sm"
                            placeholder="Amount"
                          />
                          <button
                            onClick={() => handlePaymentUpdate(finance.id)}
                            className="p-1 text-primary hover:bg-primary/10 rounded"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-muted-foreground hover:bg-secondary rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(finance.id)
                            setEditAmount(finance.amount_paid.toString())
                          }}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 rounded-lg mx-auto"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No finance records yet</p>
            <p className="text-sm mt-2">Click &quot;Add Record&quot; to create a payment record</p>
          </div>
        )}
      </div>
    </div>
  )
}
