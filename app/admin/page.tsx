import Link from "next/link"
import { Settings, Users, Calendar, Trophy, CreditCard, Plus, PlayCircle } from "lucide-react"
import { getDb } from "@/lib/db"

async function getStats() {
  try {
    const sql = getDb()
    const [teamsResult, playersResult, scheduledResult, seasonsResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM teams`,
      sql`SELECT COUNT(*) as count FROM players`,
      sql`SELECT COUNT(*) as count FROM matches WHERE status = 'scheduled'`,
      sql`SELECT * FROM seasons WHERE is_active = true LIMIT 1`
    ])
    
    return {
      teams: Number(teamsResult[0]?.count || 0),
      players: Number(playersResult[0]?.count || 0),
      scheduledMatches: Number(scheduledResult[0]?.count || 0),
      activeSeason: seasonsResult[0] || null
    }
  } catch {
    return { teams: 0, players: 0, scheduledMatches: 0, activeSeason: null }
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const adminLinks = [
    { 
      href: "/admin/seasons", 
      label: "Manage Seasons", 
      icon: Trophy, 
      description: "Create and manage league seasons",
      color: "bg-amber-500/20 text-amber-400"
    },
    { 
      href: "/admin/teams", 
      label: "Manage Teams", 
      icon: Users, 
      description: "Add, edit, and remove teams",
      color: "bg-blue-500/20 text-blue-400"
    },
    { 
      href: "/admin/players", 
      label: "Manage Players", 
      icon: Users, 
      description: "Register and manage players",
      color: "bg-green-500/20 text-green-400"
    },
    { 
      href: "/admin/matches", 
      label: "Manage Matches", 
      icon: Calendar, 
      description: "Schedule and manage fixtures",
      color: "bg-purple-500/20 text-purple-400"
    },
    { 
      href: "/admin/referee", 
      label: "Referee Console", 
      icon: PlayCircle, 
      description: "Live match updates and scoring",
      color: "bg-red-500/20 text-red-400"
    },
    { 
      href: "/admin/finances", 
      label: "Manage Finances", 
      icon: CreditCard, 
      description: "Track player payments",
      color: "bg-emerald-500/20 text-emerald-400"
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your league</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-muted-foreground">Active Season</div>
          <div className="text-xl font-bold text-primary truncate">
            {stats.activeSeason?.name || "None"}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-muted-foreground">Teams</div>
          <div className="text-xl font-bold">{stats.teams}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-muted-foreground">Players</div>
          <div className="text-xl font-bold">{stats.players}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-muted-foreground">Upcoming Matches</div>
          <div className="text-xl font-bold">{stats.scheduledMatches}</div>
        </div>
      </div>

      {/* Admin Links */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="glass-card p-6 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${link.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {link.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {link.description}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      {!stats.activeSeason && (
        <div className="glass-card p-6 border-dashed border-2 border-primary/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/20">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Get Started</h3>
              <p className="text-sm text-muted-foreground">
                Create a season to start managing your league
              </p>
            </div>
            <Link
              href="/admin/seasons"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Create Season
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
