import { Trophy } from "lucide-react"
import { getDb } from "@/lib/db"
import type { StandingRow } from "@/lib/db"

async function getStandings(): Promise<StandingRow[]> {
  try {
    const sql = getDb()
    const standings = await sql`
      SELECT 
        tsr.*,
        t.name as team_name,
        t.logo_url,
        t.primary_color,
        (tsr.goals_for - tsr.goals_against) as goal_difference
      FROM team_season_registrations tsr
      JOIN teams t ON tsr.team_id = t.id
      JOIN seasons s ON tsr.season_id = s.id
      WHERE s.is_active = true
      ORDER BY tsr.points DESC, goal_difference DESC, tsr.goals_for DESC
    `
    return standings as StandingRow[]
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

export default async function StandingsPage() {
  const [standings, season] = await Promise.all([getStandings(), getActiveSeason()])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">League Standings</h1>
          {season && <p className="text-sm text-muted-foreground">{season.name}</p>}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {standings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="standings-table">
              <thead className="border-b border-border">
                <tr>
                  <th className="w-12">Pos</th>
                  <th>Team</th>
                  <th className="text-center">P</th>
                  <th className="text-center">W</th>
                  <th className="text-center">D</th>
                  <th className="text-center">L</th>
                  <th className="text-center">GF</th>
                  <th className="text-center">GA</th>
                  <th className="text-center">GD</th>
                  <th className="text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => (
                  <tr key={team.id} className={index < 1 ? "bg-primary/5" : index > standings.length - 2 ? "bg-destructive/5" : ""}>
                    <td className="font-medium">
                      <span className={index < 1 ? "text-primary" : index > standings.length - 2 ? "text-destructive" : ""}>
                        {index + 1}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: team.primary_color }}
                        />
                        <span className="font-medium">{team.team_name}</span>
                      </div>
                    </td>
                    <td className="text-center">{team.played}</td>
                    <td className="text-center text-green-400">{team.won}</td>
                    <td className="text-center text-yellow-400">{team.drawn}</td>
                    <td className="text-center text-red-400">{team.lost}</td>
                    <td className="text-center">{team.goals_for}</td>
                    <td className="text-center">{team.goals_against}</td>
                    <td className="text-center">
                      <span className={team.goal_difference > 0 ? "text-green-400" : team.goal_difference < 0 ? "text-red-400" : ""}>
                        {team.goal_difference > 0 ? "+" : ""}{team.goal_difference}
                      </span>
                    </td>
                    <td className="text-center font-bold text-primary">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No standings data available</p>
            <p className="text-sm mt-2">Register teams for the current season to see standings</p>
          </div>
        )}
      </div>

      {standings.length > 0 && (
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/50" />
            <span>Promotion zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive/50" />
            <span>Relegation zone</span>
          </div>
        </div>
      )}
    </div>
  )
}
