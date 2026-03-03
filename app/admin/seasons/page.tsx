"use client"

import { useState } from "react"
import useSWR from "swr"
import { Trophy, Plus, Check, X } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Season } from "@/lib/db"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminSeasonsPage() {
  const { data: seasons, mutate } = useSWR<Season[]>('/api/seasons', fetcher)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      mutate()
      setIsAdding(false)
      setFormData({ name: '', start_date: '', end_date: '', is_active: false })
    } catch (error) {
      console.error('Error creating season:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manage Seasons</h1>
            <p className="text-sm text-muted-foreground">Create and manage league seasons</p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Season
        </button>
      </div>

      {/* Add Season Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Create New Season</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Season Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Winter 2024"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm font-medium">Set as active season</label>
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

      {/* Seasons List */}
      <div className="glass-card overflow-hidden">
        {seasons && seasons.length > 0 ? (
          <table className="standings-table">
            <thead className="border-b border-border">
              <tr>
                <th>Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season) => (
                <tr key={season.id}>
                  <td className="font-medium">{season.name}</td>
                  <td>{formatDate(season.start_date)}</td>
                  <td>{season.end_date ? formatDate(season.end_date) : '—'}</td>
                  <td className="text-center">
                    {season.is_active ? (
                      <span className="status-badge status-in-progress">Active</span>
                    ) : (
                      <span className="status-badge bg-secondary text-secondary-foreground">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No seasons created yet</p>
            <p className="text-sm mt-2">Click &quot;New Season&quot; to create your first season</p>
          </div>
        )}
      </div>
    </div>
  )
}
