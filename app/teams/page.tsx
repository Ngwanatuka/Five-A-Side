import { Users } from "lucide-react"
import { getDb } from "@/lib/db"
import type { Team, Player } from "@/lib/db"
import { TeamCard } from "@/components/team-card"

type TeamWithPlayers = Team & {
  players: Player[]
}

async function getTeamsWithPlayers(): Promise<TeamWithPlayers[]> {
  try {
    const sql = getDb()
    const teams = await sql`SELECT * FROM teams ORDER BY name ASC`
    const players = await sql`SELECT * FROM players ORDER BY last_name ASC, first_name ASC`
    
    // Group players by team
    const teamsWithPlayers = teams.map(team => ({
      ...team,
      players: players.filter(p => p.team_id === team.id)
    })) as TeamWithPlayers[]
    
    return teamsWithPlayers
  } catch {
    return []
  }
}

export default async function TeamsPage() {
  const teams = await getTeamsWithPlayers()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-sm text-muted-foreground">{teams.length} registered teams</p>
        </div>
      </div>

      {teams.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No teams registered</p>
          <p className="text-sm mt-2">Teams will appear here once added</p>
        </div>
      )}
    </div>
  )
}
