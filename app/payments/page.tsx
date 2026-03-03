"use client"

import { useState, useEffect } from "react"
import { CreditCard, Users, ChevronRight, CheckCircle, AlertCircle, Clock, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Season, TeamFinanceSummary } from "@/lib/db"

type PlayerFinance = {
  id: number
  first_name: string
  last_name: string
  jersey_number: number | null
  position: string | null
  finance_id: number
  amount_due: number
  amount_paid: number
  payment_status: string
  last_payment_date: string | null
}

export default function PaymentsPage() {
  const [season, setSeason] = useState<Season | null>(null)
  const [teams, setTeams] = useState<TeamFinanceSummary[]>([])
  const [selectedTeam, setSelectedTeam] = useState<TeamFinanceSummary | null>(null)
  const [players, setPlayers] = useState<PlayerFinance[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerFinance | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    fetchActiveSeason()
  }, [])

  useEffect(() => {
    if (season) {
      fetchTeamFinances()
    }
  }, [season])

  useEffect(() => {
    if (selectedTeam && season) {
      fetchTeamPlayers()
    }
  }, [selectedTeam, season])

  async function fetchActiveSeason() {
    try {
      const res = await fetch('/api/seasons/active')
      const data = await res.json()
      if (data && !data.error) {
        setSeason(data)
      }
    } catch (error) {
      console.error('Error fetching season:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTeamFinances() {
    if (!season) return
    try {
      const res = await fetch(`/api/finances/teams?seasonId=${season.id}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setTeams(data)
      }
    } catch (error) {
      console.error('Error fetching team finances:', error)
    }
  }

  async function fetchTeamPlayers() {
    if (!selectedTeam || !season) return
    setLoadingPlayers(true)
    try {
      const res = await fetch(`/api/finances/teams/${selectedTeam.team_id}?seasonId=${season.id}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setPlayers(data)
      }
    } catch (error) {
      console.error('Error fetching team players:', error)
    } finally {
      setLoadingPlayers(false)
    }
  }

  async function handlePayment() {
    if (!selectedPlayer || !season || !paymentAmount) return
    
    setProcessing(true)
    try {
      const res = await fetch('/api/finances/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: selectedPlayer.id,
          season_id: season.id,
          amount: parseFloat(paymentAmount)
        })
      })

      if (res.ok) {
        await fetchTeamFinances()
        await fetchTeamPlayers()
        setShowPaymentModal(false)
        setSelectedPlayer(null)
        setPaymentAmount("")
      }
    } catch (error) {
      console.error('Error processing payment:', error)
    } finally {
      setProcessing(false)
    }
  }

  function openPaymentModal(player: PlayerFinance) {
    setSelectedPlayer(player)
    const balance = Number(player.amount_due) - Number(player.amount_paid)
    setPaymentAmount(balance > 0 ? balance.toString() : "")
    setShowPaymentModal(true)
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'partial':
        return <Clock className="w-4 h-4 text-amber-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-card rounded w-1/4"></div>
            <div className="h-64 bg-card rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  if (!season) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card p-8 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Active Season</h2>
            <p className="text-muted-foreground">
              There is no active season to display payments for.
            </p>
          </div>
        </div>
      </main>
    )
  }

  const totalBalance = teams.reduce((sum, t) => sum + Number(t.balance), 0)
  const totalPaid = teams.reduce((sum, t) => sum + Number(t.total_paid), 0)
  const totalDue = teams.reduce((sum, t) => sum + Number(t.total_due), 0)

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-primary" />
            Team Payments
          </h1>
          <p className="text-muted-foreground">
            {season.name} - Select your team and make a payment
          </p>
        </div>

        {/* Overall Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Due</p>
            <p className="text-2xl font-bold">{formatCurrency(totalDue)}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Outstanding Balance</p>
            <p className="text-2xl font-bold text-amber-500">{formatCurrency(totalBalance)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Teams List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Your Team</h2>
            <div className="space-y-3">
              {teams.length === 0 ? (
                <div className="glass-card p-6 text-center">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No teams registered yet</p>
                </div>
              ) : (
                teams.map((team) => (
                  <button
                    key={team.team_id}
                    onClick={() => setSelectedTeam(team)}
                    className={`w-full glass-card p-4 flex items-center justify-between transition-all hover:scale-[1.02] ${
                      selectedTeam?.team_id === team.team_id 
                        ? 'ring-2 ring-primary' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: team.primary_color }}
                      >
                        {team.team_name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{team.team_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {team.total_players} player{Number(team.total_players) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-semibold ${Number(team.balance) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {Number(team.balance) > 0 ? formatCurrency(Number(team.balance)) : 'Paid'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(Number(team.total_paid))} / {formatCurrency(Number(team.total_due))}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Players List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {selectedTeam ? `${selectedTeam.team_name} Players` : 'Select a Team'}
            </h2>
            
            {!selectedTeam ? (
              <div className="glass-card p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select your team to view players and make payments
                </p>
              </div>
            ) : loadingPlayers ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : players.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No players in this team</p>
              </div>
            ) : (
              <div className="space-y-3">
                {players.map((player) => {
                  const balance = Number(player.amount_due) - Number(player.amount_paid)
                  return (
                    <div
                      key={player.id}
                      className="glass-card p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(player.payment_status)}
                        <div>
                          <p className="font-medium">
                            {player.first_name} {player.last_name}
                            {player.jersey_number && (
                              <span className="text-muted-foreground ml-2">#{player.jersey_number}</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(Number(player.amount_paid))} paid
                            {Number(player.amount_due) > 0 && (
                              <span> of {formatCurrency(Number(player.amount_due))}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {balance > 0 && (
                          <span className="text-amber-500 font-medium">
                            {formatCurrency(balance)} due
                          </span>
                        )}
                        <button
                          onClick={() => openPaymentModal(player)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                          Pay
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedPlayer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Make Payment</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedPlayer(null)
                    setPaymentAmount("")
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-muted-foreground mb-1">Paying for</p>
                <p className="text-lg font-semibold">
                  {selectedPlayer.first_name} {selectedPlayer.last_name}
                </p>
                {selectedTeam && (
                  <p className="text-sm text-muted-foreground">{selectedTeam.team_name}</p>
                )}
              </div>

              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Amount Due</span>
                  <span>{formatCurrency(Number(selectedPlayer.amount_due))}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="text-emerald-500">{formatCurrency(Number(selectedPlayer.amount_paid))}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-medium">Balance</span>
                  <span className={`font-semibold ${Number(selectedPlayer.amount_due) - Number(selectedPlayer.amount_paid) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {formatCurrency(Math.max(0, Number(selectedPlayer.amount_due) - Number(selectedPlayer.amount_paid)))}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Payment Amount (R)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedPlayer(null)
                    setPaymentAmount("")
                  }}
                  className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || processing}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {processing ? 'Processing...' : `Pay ${paymentAmount ? formatCurrency(parseFloat(paymentAmount)) : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
