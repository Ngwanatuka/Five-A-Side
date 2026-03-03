import { Calendar, MapPin, Clock } from "lucide-react"
import { getDb } from "@/lib/db"
import { formatDate, formatTime } from "@/lib/utils"
import type { MatchWithTeams } from "@/lib/db"

async function getFixtures(): Promise<MatchWithTeams[]> {
  try {
    const sql = getDb()
    const matches = await sql`
      SELECT 
        m.*,
        ht.name as home_team_name,
        at.name as away_team_name,
        ht.primary_color as home_team_color,
        at.primary_color as away_team_color
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.status IN ('scheduled', 'postponed')
      ORDER BY m.match_date ASC, m.kick_off_time ASC
    `
    return matches as MatchWithTeams[]
  } catch {
    return []
  }
}

async function getActiveSeason() {
  try {
    const sql = getDb()
    const seasons = await sql`SELECT * FROM seasons WHERE is_active = true LIMIT 1`
    return seasons[0] || null
  } catch {
    return null
  }
}

export default async function FixturesPage() {
  const [fixtures, season] = await Promise.all([getFixtures(), getActiveSeason()])

  // Group fixtures by date
  const fixturesByDate = fixtures.reduce((acc, match) => {
    const date = match.match_date
    if (!acc[date]) acc[date] = []
    acc[date].push(match)
    return acc
  }, {} as Record<string, MatchWithTeams[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Fixtures</h1>
          {season && <p className="text-sm text-muted-foreground">{season.name}</p>}
        </div>
      </div>

      {Object.keys(fixturesByDate).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(fixturesByDate).map(([date, matches]) => (
            <div key={date} className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">
                {formatDate(date)}
              </h2>
              <div className="grid gap-3">
                {matches.map((match) => (
                  <div key={match.id} className="match-card">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: match.home_team_color }}
                          />
                          <span className="font-medium">{match.home_team_name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: match.away_team_color }}
                          />
                          <span className="font-medium">{match.away_team_name}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(match.kick_off_time)}
                        </div>
                        {match.venue && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {match.venue}
                          </div>
                        )}
                        {match.status === 'postponed' && (
                          <span className="status-badge status-postponed">Postponed</span>
                        )}
                      </div>
                    </div>
                    {match.matchday && (
                      <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                        Matchday {match.matchday}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No upcoming fixtures</p>
          <p className="text-sm mt-2">Check back later for scheduled matches</p>
        </div>
      )}
    </div>
  )
}
