"use client"

import { useState } from "react"
import useSWR from "swr"
import { Users, Plus, Check, X } from "lucide-react"
import type { Team, PlayerWithTeam } from "@/lib/db"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminPlayersPage() {
  const { data: players, mutate } = useSWR<PlayerWithTeam[]>('/api/players', fetcher)
  const { data: teams } = useSWR<Team[]>('/api/teams', fetcher)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    team_id: '',
    jersey_number: '',
    position: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          team_id: formData.team_id ? parseInt(formData.team_id) : null,
          jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null
        })
      })
      mutate()
      setIsAdding(false)
      setFormData({ first_name: '', last_name: '', email: '', phone: '', team_id: '', jersey_number: '', position: '' })
    } catch (error) {
      console.error('Error creating player:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manage Players</h1>
            <p className="text-sm text-muted-foreground">Register and manage players</p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Player
        </button>
      </div>

      {/* Add Player Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Register New Player</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Team</label>
              <select
                value={formData.team_id}
                onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No team</option>
                {teams?.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Jersey Number</label>
              <input
                type="number"
                value={formData.jersey_number}
                onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                min="1"
                max="99"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Position</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select position</option>
                <option value="GK">Goalkeeper</option>
                <option value="DEF">Defender</option>
                <option value="MID">Midfielder</option>
                <option value="FWD">Forward</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
            >
              <Check className="h-4 w-4" />
              Register
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

      {/* Players Table */}
      <div className="glass-card overflow-hidden">
        {players && players.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="standings-table">
              <thead className="border-b border-border">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Team</th>
                  <th>Position</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id}>
                    <td>
                      {player.jersey_number ? (
                        <span className="w-8 h-8 inline-flex items-center justify-center rounded bg-secondary font-mono text-sm">
                          {player.jersey_number}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="font-medium">{player.first_name} {player.last_name}</td>
                    <td className="text-muted-foreground">{player.team_name || '—'}</td>
                    <td>
                      {player.position ? (
                        <span className="text-xs uppercase">{player.position}</span>
                      ) : '—'}
                    </td>
                    <td className="text-sm text-muted-foreground">
                      {player.email || player.phone || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No players registered yet</p>
            <p className="text-sm mt-2">Click &quot;New Player&quot; to register your first player</p>
          </div>
        )}
      </div>
    </div>
  )
}
