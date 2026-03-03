"use client"

import { useState } from "react"
import useSWR from "swr"
import { Calendar, Plus, Check, X } from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"
import type { Team, Season, MatchWithTeams } from "@/lib/db"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminMatchesPage() {
  const { data: matches, mutate } = useSWR<MatchWithTeams[]>('/api/matches', fetcher)
  const { data: teams } = useSWR<Team[]>('/api/teams', fetcher)
  const { data: seasons } = useSWR<Season[]>('/api/seasons', fetcher)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    season_id: '',
    division_id: '1',
    home_team_id: '',
    away_team_id: '',
    match_date: '',
    kick_off_time: '',
    venue: '',
    matchday: ''
  })

  const activeSeason = seasons?.find(s => s.is_active)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          season_id: parseInt(formData.season_id || activeSeason?.id?.toString() || '0'),
          division_id: parseInt(formData.division_id),
          home_team_id: parseInt(formData.home_team_id),
          away_team_id: parseInt(formData.away_team_id),
          matchday: formData.matchday ? parseInt(formData.matchday) : null
        })
      })
      mutate()
      setIsAdding(false)
      setFormData({ season_id: '', division_id: '1', home_team_id: '', away_team_id: '', match_date: '', kick_off_time: '', venue: '', matchday: '' })
    } catch (error) {
      console.error('Error creating match:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      scheduled: 'status-scheduled',
      in_progress: 'status-in-progress',
      completed: 'status-completed',
      postponed: 'status-postponed',
      cancelled: 'status-cancelled'
    }
    return `status-badge ${classes[status] || 'bg-secondary text-secondary-foreground'}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manage Matches</h1>
            <p className="text-sm text-muted-foreground">Schedule and manage fixtures</p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Match
        </button>
      </div>

      {/* Add Match Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Schedule New Match</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Home Team</label>
              <select
                value={formData.home_team_id}
                onChange={(e) => setFormData({ ...formData, home_team_id: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select home team</option>
                {teams?.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Away Team</label>
              <select
                value={formData.away_team_id}
                onChange={(e) => setFormData({ ...formData, away_team_id: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select away team</option>
                {teams?.filter(t => t.id.toString() !== formData.home_team_id).map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Match Date</label>
              <input
                type="date"
                value={formData.match_date}
                onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kick-off Time</label>
              <input
                type="time"
                value={formData.kick_off_time}
                onChange={(e) => setFormData({ ...formData, kick_off_time: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Venue</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g., Main Field"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Matchday</label>
              <input
                type="number"
                value={formData.matchday}
                onChange={(e) => setFormData({ ...formData, matchday: e.target.value })}
                min="1"
                placeholder="e.g., 1"
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
              Schedule
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

      {/* Matches Table */}
      <div className="glass-card overflow-hidden">
        {matches && matches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="standings-table">
              <thead className="border-b border-border">
                <tr>
                  <th>Date</th>
                  <th>Home</th>
                  <th className="text-center">Score</th>
                  <th>Away</th>
                  <th>Time</th>
                  <th>Venue</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td className="text-sm">{formatDate(match.match_date)}</td>
                    <td className="font-medium">{match.home_team_name}</td>
                    <td className="text-center font-bold">
                      {match.status === 'completed' || match.status === 'in_progress' 
                        ? `${match.home_score ?? 0} - ${match.away_score ?? 0}`
                        : 'vs'}
                    </td>
                    <td className="font-medium">{match.away_team_name}</td>
                    <td className="text-sm text-muted-foreground">{formatTime(match.kick_off_time)}</td>
                    <td className="text-sm text-muted-foreground">{match.venue || '—'}</td>
                    <td className="text-center">
                      <span className={getStatusBadge(match.status)}>
                        {match.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No matches scheduled yet</p>
            <p className="text-sm mt-2">Click &quot;New Match&quot; to schedule your first match</p>
          </div>
        )}
      </div>
    </div>
  )
}
