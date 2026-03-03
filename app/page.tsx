import Link from "next/link"
import { Trophy, Calendar, CheckCircle2, Users, CreditCard, ArrowRight } from "lucide-react"
import { sql } from "@/lib/db"

async function getStats() {
  try {
    const [teamsResult, playersResult, matchesResult, seasonsResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM teams`,
      sql`SELECT COUNT(*) as count FROM players`,
      sql`SELECT COUNT(*) as count FROM matches WHERE status = 'completed'`,
      sql`SELECT * FROM seasons WHERE is_active = true LIMIT 1`
    ])
    
    return {
      teams: Number(teamsResult[0]?.count || 0),
      players: Number(playersResult[0]?.count || 0),
      matches: Number(matchesResult[0]?.count || 0),
      activeSeason: seasonsResult[0] || null
    }
  } catch {
    return { teams: 0, players: 0, matches: 0, activeSeason: null }
  }
}

async function getUpcomingMatches() {
  try {
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
      WHERE m.status = 'scheduled'
      ORDER BY m.match_date ASC, m.kick_off_time ASC
      LIMIT 5
    `
    return matches
  } catch {
    return []
  }
}

async function getRecentResults() {
  try {
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
      LIMIT 5
    `
    return matches
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [stats, upcomingMatches, recentResults] = await Promise.all([
    getStats(),
    getUpcomingMatches(),
    getRecentResults()
  ])

  const quickLinks = [
    { href: "/standings", label: "Standings", icon: Trophy, description: "View league table" },
    { href: "/fixtures", label: "Fixtures", icon: Calendar, description: "Upcoming matches" },
    { href: "/results", label: "Results", icon: CheckCircle2, description: "Match results" },
    { href: "/teams", label: "Teams", icon: Users, description: "Team profiles" },
    { href: "/payments", label: "Payments", icon: CreditCard, description: "Player finances" },
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="gradient-text">Five-A-Side</span> League
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-balance">
          {stats.activeSeason 
            ? `Currently in ${stats.activeSeason.name}` 
            : "Your complete league management system"}
        </p>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-primary">{stats.teams}</div>
          <div className="text-sm text-muted-foreground">Teams</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-primary">{stats.players}</div>
          <div className="text-sm text-muted-foreground">Players</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-primary">{stats.matches}</div>
          <div className="text-sm text-muted-foreground">Matches Played</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-primary">
            {stats.activeSeason ? "Active" : "—"}
          </div>
          <div className="text-sm text-muted-foreground">Season</div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="glass-card p-4 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors group"
            >
              <Icon className="h-8 w-8 text-primary" />
              <span className="font-medium">{link.label}</span>
              <span className="text-xs text-muted-foreground">{link.description}</span>
            </Link>
          )
        })}
      </section>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Fixtures */}
        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Fixtures
            </h2>
            <Link href="/fixtures" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{match.home_team_name}</div>
                    <div className="text-xs text-muted-foreground">vs {match.away_team_name}</div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {new Date(match.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No upcoming fixtures scheduled</p>
          )}
        </section>

        {/* Recent Results */}
        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Recent Results
            </h2>
            <Link href="/results" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentResults.length > 0 ? (
            <div className="space-y-3">
              {recentResults.map((match) => (
                <div key={match.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{match.home_team_name}</div>
                    <div className="text-xs text-muted-foreground">vs {match.away_team_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">
                      {match.home_score} - {match.away_score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No results yet</p>
          )}
        </section>
      </div>
    </div>
  )
}
