import { Users } from "lucide-react"
import type { Team, Player } from "@/lib/db"

type TeamWithPlayers = Team & {
  players: Player[]
}

export function TeamCard({ team }: { team: TeamWithPlayers }) {
  return (
    <div className="glass-card overflow-hidden">
      {/* Team Header */}
      <div 
        className="p-4 flex items-center gap-4"
        style={{ 
          background: `linear-gradient(135deg, ${team.primary_color}20 0%, ${team.secondary_color}20 100%)`,
          borderBottom: `2px solid ${team.primary_color}50`
        }}
      >
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ 
            backgroundColor: team.primary_color,
            color: '#fff'
          }}
        >
          {team.name.charAt(0)}
        </div>
        <div>
          <h3 className="font-bold text-lg">{team.name}</h3>
          <p className="text-sm text-muted-foreground">{team.players.length} players</p>
        </div>
      </div>

      {/* Player List */}
      <div className="p-4">
        {team.players.length > 0 ? (
          <div className="space-y-2">
            {team.players.slice(0, 5).map((player) => (
              <div key={player.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {player.jersey_number && (
                    <span className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-xs font-mono">
                      {player.jersey_number}
                    </span>
                  )}
                  <span>{player.first_name} {player.last_name}</span>
                </div>
                {player.position && (
                  <span className="text-xs text-muted-foreground uppercase">{player.position}</span>
                )}
              </div>
            ))}
            {team.players.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{team.players.length - 5} more players
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
            <Users className="h-4 w-4" />
            <span>No players registered</span>
          </div>
        )}
      </div>
    </div>
  )
}
