"use client"

import { useState } from "react"
import useSWR from "swr"
import { PlayCircle, Plus, Minus, Check, Flag } from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"
import type { MatchWithTeams } from "@/lib/db"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function RefereeConsolePage() {
  const { data: matches, mutate } = useSWR<MatchWithTeams[]>('/api/matches', fetcher, {
    refreshInterval: 10000 // Refresh every 10 seconds for live updates
  })
  const [selectedMatch, setSelectedMatch] = useState<MatchWithTeams | null>(null)
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)

  const scheduledMatches = matches?.filter(m => m.status === 'scheduled') || []
  const inProgressMatches = matches?.filter(m => m.status === 'in_progress') || []

  const selectMatch = (match: MatchWithTeams) => {
    setSelectedMatch(match)
    setHomeScore(match.home_score ?? 0)
    setAwayScore(match.away_score ?? 0)
  }

  const updateMatch = async (status?: string) => {
    if (!selectedMatch) return
    setIsUpdating(true)
    try {
      await fetch(`/api/matches/${selectedMatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_score: homeScore,
          away_score: awayScore,
          status: status || selectedMatch.status
        })
      })
      mutate()
      if (status === 'completed') {
        setSelectedMatch(null)
      } else {
        // Update selected match locally
        setSelectedMatch({
          ...selectedMatch,
          home_score: homeScore,
          away_score: awayScore,
          status: status || selectedMatch.status
        })
      }
    } catch (error) {
      console.error('Error updating match:', error)
    }
    setIsUpdating(false)
  }

  const startMatch = async (match: MatchWithTeams) => {
    setIsUpdating(true)
    try {
      await fetch(`/api/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_score: 0,
          away_score: 0,
          status: 'in_progress'
        })
      })
      mutate()
      selectMatch({
        ...match,
        home_score: 0,
        away_score: 0,
        status: 'in_progress'
      })
    } catch (error) {
      console.error('Error starting match:', error)
    }
    setIsUpdating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <PlayCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Referee Console</h1>
          <p className="text-sm text-muted-foreground">Live match updates and scoring</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Match Selection */}
        <div className="space-y-4">
          {/* In Progress Matches */}
          {inProgressMatches.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-yellow-400">Live Matches</h2>
              {inProgressMatches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => selectMatch(match)}
                  className={`w-full match-card text-left ${selectedMatch?.id === match.id ? 'border-primary' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{match.home_team_name}</div>
                      <div className="text-sm text-muted-foreground">vs {match.away_team_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {match.home_score} - {match.away_score}
                      </div>
                      <span className="status-badge status-in-progress">LIVE</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Scheduled Matches */}
          {scheduledMatches.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Scheduled Matches</h2>
              {scheduledMatches.map((match) => (
                <div key={match.id} className="match-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{match.home_team_name}</div>
                      <div className="text-sm text-muted-foreground">vs {match.away_team_name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(match.match_date)} - {formatTime(match.kick_off_time)}
                      </div>
                    </div>
                    <button
                      onClick={() => startMatch(match)}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                      Start Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {scheduledMatches.length === 0 && inProgressMatches.length === 0 && (
            <div className="glass-card p-8 text-center text-muted-foreground">
              <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No matches to referee</p>
              <p className="text-sm mt-2">Schedule matches from the Matches page</p>
            </div>
          )}
        </div>

        {/* Score Control Panel */}
        {selectedMatch && selectedMatch.status === 'in_progress' && (
          <div className="glass-card p-6 space-y-6">
            <div className="text-center">
              <span className="status-badge status-in-progress">LIVE</span>
              <h3 className="text-xl font-bold mt-2">
                {selectedMatch.home_team_name} vs {selectedMatch.away_team_name}
              </h3>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-center gap-8">
              {/* Home Team Score */}
              <div className="text-center space-y-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ backgroundColor: selectedMatch.home_team_color }}
                >
                  <span className="text-2xl font-bold text-white">
                    {selectedMatch.home_team_name.charAt(0)}
                  </span>
                </div>
                <div className="text-sm font-medium">{selectedMatch.home_team_name}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                    className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="text-5xl font-bold w-16 text-center">{homeScore}</span>
                  <button
                    onClick={() => setHomeScore(homeScore + 1)}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="text-4xl font-bold text-muted-foreground">-</div>

              {/* Away Team Score */}
              <div className="text-center space-y-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ backgroundColor: selectedMatch.away_team_color }}
                >
                  <span className="text-2xl font-bold text-white">
                    {selectedMatch.away_team_name.charAt(0)}
                  </span>
                </div>
                <div className="text-sm font-medium">{selectedMatch.away_team_name}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                    className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="text-5xl font-bold w-16 text-center">{awayScore}</span>
                  <button
                    onClick={() => setAwayScore(awayScore + 1)}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => updateMatch()}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 disabled:opacity-50"
              >
                <Check className="h-5 w-5" />
                Update Score
              </button>
              <button
                onClick={() => updateMatch('completed')}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                <Flag className="h-5 w-5" />
                End Match (Full Time)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
