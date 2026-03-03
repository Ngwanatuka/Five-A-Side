import { CheckCircle2, MapPin } from "lucide-react"
import { getDb } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import type { MatchWithTeams } from "@/lib/db"

async function getResults(): Promise<MatchWithTeams[]> {
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
      WHERE m.status = 'completed'
      ORDER BY m.match_date DESC
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

export default async function ResultsPage() {
  const [results, season] = await Promise.all([getResults(), getActiveSeason()])

  // Group results by date
  const resultsByDate = results.reduce((acc, match) => {
    const date = match.match_date
    if (!acc[date]) acc[date] = []
    acc[date].push(match)
    return acc
  }, {} as Record<string, MatchWithTeams[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Results</h1>
          {season && <p className="text-sm text-muted-foreground">{season.name}</p>}
        </div>
      </div>

      {Object.keys(resultsByDate).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(resultsByDate).map(([date, matches]) => (
            <div key={date} className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">
                {formatDate(date)}
              </h2>
              <div className="grid gap-3">
                {matches.map((match) => {
                  const homeWin = (match.home_score ?? 0) > (match.away_score ?? 0)
                  const awayWin = (match.away_score ?? 0) > (match.home_score ?? 0)
                  
                  return (
                    <div key={match.id} className="match-card">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className={`flex items-center gap-3 mb-2 ${homeWin ? 'font-bold' : ''}`}>
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: match.home_team_color }}
                            />
                            <span>{match.home_team_name}</span>
                          </div>
                          <div className={`flex items-center gap-3 ${awayWin ? 'font-bold' : ''}`}>
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: match.away_team_color }}
                            />
                            <span>{match.away_team_name}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className={`text-2xl font-bold ${homeWin ? 'text-primary' : ''}`}>
                            {match.home_score}
                          </div>
                          <div className={`text-2xl font-bold ${awayWin ? 'text-primary' : ''}`}>
                            {match.away_score}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                        {match.venue && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.venue}
                          </div>
                        )}
                        {match.matchday && (
                          <span>Matchday {match.matchday}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No results yet</p>
          <p className="text-sm mt-2">Completed matches will appear here</p>
        </div>
      )}
    </div>
  )
}
