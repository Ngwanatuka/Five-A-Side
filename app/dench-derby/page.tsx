"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Trophy, 
  Calendar, 
  Clock, 
  Shield, 
  Medal, 
  Flame, 
  Play, 
  RotateCcw, 
  Sparkles, 
  Users, 
  Award, 
  Share2, 
  Sliders,
  Plus,
  UserPlus,
  X,
  Trash2,
  CheckCircle2
} from "lucide-react"

export type TeamInfo = {
  id: string
  name: string
  group: "A" | "B"
  color: string
  city: string
  slogan: string
  captain: string
}

export type TournamentPlayer = {
  id: string
  teamKey: string
  name: string
  jerseyNumber: number
  position: "GK" | "DEF" | "MID" | "FWD"
  isCaptain?: boolean
}

export type GoalEvent = {
  id: string
  matchId: string
  teamKey: string
  scorerPlayerId: string
  assistPlayerId?: string | null
  minute: number
}

export type TournamentMatch = {
  id: string
  stage: "group" | "semi" | "final" | "third_place"
  group?: "A" | "B"
  matchOrder: number
  homeTeamKey: string | null
  awayTeamKey: string | null
  homePlaceholder: string
  awayPlaceholder: string
  time: string
  pitch: number
  homeScore: number | null
  awayScore: number | null
  status: "scheduled" | "live" | "completed"
  note?: string
}

export const TEAMS: Record<string, TeamInfo> = {
  "team-dench": {
    id: "team-dench",
    name: "Team Dench",
    group: "A",
    color: "#12b84c",
    city: "Dench Grounds",
    slogan: "Relentless Pace, Pure Passion",
    captain: 'Marcus "Dench" K.'
  },
  "cpt-superstars": {
    id: "cpt-superstars",
    name: "CPT superstars fc",
    group: "A",
    color: "#3b82f6",
    city: "Cape Town",
    slogan: "Mother City Maestros",
    captain: 'Chad "Speedy" P.'
  },
  "bras-ba-kasi": {
    id: "bras-ba-kasi",
    name: "Bras ba kasi",
    group: "A",
    color: "#f59e0b",
    city: "Kasi Local",
    slogan: "Flavour, Flair & Brotherhood",
    captain: 'Thabo "Jiki" M.'
  },
  "gauteng-warriors": {
    id: "gauteng-warriors",
    name: "Gauteng state warriors",
    group: "B",
    color: "#8b5cf6",
    city: "Gauteng",
    slogan: "The Golden Province Titans",
    captain: 'Kagiso "Iron" N.'
  },
  "woza-madzala": {
    id: "woza-madzala",
    name: "Woza madzala fc",
    group: "B",
    color: "#ef4444",
    city: "Ekurhuleni",
    slogan: "Wisdom, Power & Tactical Fire",
    captain: 'Sipho "Madzala" Z.'
  },
  "areyeng-fc": {
    id: "areyeng-fc",
    name: "Areyeng fc",
    group: "B",
    color: "#06b6d4",
    city: "Tshwane",
    slogan: "Forward Together, Never Back",
    captain: 'Lerato "Skilo" D.'
  }
}

const INITIAL_PLAYERS: TournamentPlayer[] = [
  { id: "p-dench-1", teamKey: "team-dench", name: 'Marcus "Dench" K.', jerseyNumber: 9, position: "FWD", isCaptain: true },
  { id: "p-dench-2", teamKey: "team-dench", name: "Tshepo Moremi", jerseyNumber: 7, position: "MID" },
  { id: "p-dench-3", teamKey: "team-dench", name: "David Ndlovu", jerseyNumber: 4, position: "DEF" },
  { id: "p-dench-4", teamKey: "team-dench", name: "Kabelo Mokoena", jerseyNumber: 1, position: "GK" },
  { id: "p-dench-5", teamKey: "team-dench", name: "Brian Sithole", jerseyNumber: 10, position: "FWD" },

  { id: "p-cpt-1", teamKey: "cpt-superstars", name: 'Chad "Speedy" P.', jerseyNumber: 10, position: "FWD", isCaptain: true },
  { id: "p-cpt-2", teamKey: "cpt-superstars", name: "Jerome Abrahams", jerseyNumber: 8, position: "MID" },
  { id: "p-cpt-3", teamKey: "cpt-superstars", name: "Luke Hendricks", jerseyNumber: 3, position: "DEF" },
  { id: "p-cpt-4", teamKey: "cpt-superstars", name: "Moegamat Adams", jerseyNumber: 1, position: "GK" },
  { id: "p-cpt-5", teamKey: "cpt-superstars", name: "Keanu Daniels", jerseyNumber: 11, position: "MID" },

  { id: "p-bras-1", teamKey: "bras-ba-kasi", name: 'Thabo "Jiki" M.', jerseyNumber: 10, position: "MID", isCaptain: true },
  { id: "p-bras-2", teamKey: "bras-ba-kasi", name: 'Bongani "Shoelace" Zulu', jerseyNumber: 9, position: "FWD" },
  { id: "p-bras-3", teamKey: "bras-ba-kasi", name: "Sbusiso Khumalo", jerseyNumber: 5, position: "DEF" },
  { id: "p-bras-4", teamKey: "bras-ba-kasi", name: 'Vusi "Cat" Radebe', jerseyNumber: 1, position: "GK" },
  { id: "p-bras-5", teamKey: "bras-ba-kasi", name: "Mandla Nkosi", jerseyNumber: 7, position: "FWD" },

  { id: "p-gaut-1", teamKey: "gauteng-warriors", name: 'Kagiso "Iron" N.', jerseyNumber: 4, position: "DEF", isCaptain: true },
  { id: "p-gaut-2", teamKey: "gauteng-warriors", name: "Tumi Mashaba", jerseyNumber: 9, position: "FWD" },
  { id: "p-gaut-3", teamKey: "gauteng-warriors", name: "Nhlanhla Dlamini", jerseyNumber: 8, position: "MID" },
  { id: "p-gaut-4", teamKey: "gauteng-warriors", name: "Itumeleng Phiri", jerseyNumber: 1, position: "GK" },
  { id: "p-gaut-5", teamKey: "gauteng-warriors", name: "Sello Motsepe", jerseyNumber: 11, position: "FWD" },

  { id: "p-woza-1", teamKey: "woza-madzala", name: 'Sipho "Madzala" Z.', jerseyNumber: 8, position: "MID", isCaptain: true },
  { id: "p-woza-2", teamKey: "woza-madzala", name: 'Patrick "Bullet" Mabena', jerseyNumber: 9, position: "FWD" },
  { id: "p-woza-3", teamKey: "woza-madzala", name: "Jabulani Sithole", jerseyNumber: 2, position: "DEF" },
  { id: "p-woza-4", teamKey: "woza-madzala", name: "Senzo Vilakazi", jerseyNumber: 1, position: "GK" },
  { id: "p-woza-5", teamKey: "woza-madzala", name: "Doctor Mokoena", jerseyNumber: 10, position: "MID" },

  { id: "p-arey-1", teamKey: "areyeng-fc", name: 'Lerato "Skilo" D.', jerseyNumber: 7, position: "MID", isCaptain: true },
  { id: "p-arey-2", teamKey: "areyeng-fc", name: "Tebogo Maleka", jerseyNumber: 9, position: "FWD" },
  { id: "p-arey-3", teamKey: "areyeng-fc", name: "Koketso Mahlangu", jerseyNumber: 6, position: "DEF" },
  { id: "p-arey-4", teamKey: "areyeng-fc", name: "Ofentse Baloyi", jerseyNumber: 1, position: "GK" },
  { id: "p-arey-5", teamKey: "areyeng-fc", name: "Katlego Modise", jerseyNumber: 11, position: "FWD" }
]

const DEFAULT_MATCHES: TournamentMatch[] = [
  { id: "ga-m1", stage: "group", group: "A", matchOrder: 1, homeTeamKey: "team-dench", awayTeamKey: "cpt-superstars", homePlaceholder: "Team Dench", awayPlaceholder: "CPT superstars fc", time: "10:00", pitch: 1, homeScore: null, awayScore: null, status: "scheduled", note: "Group A Opening Clash" },
  { id: "ga-m2", stage: "group", group: "A", matchOrder: 3, homeTeamKey: "cpt-superstars", awayTeamKey: "bras-ba-kasi", homePlaceholder: "CPT superstars fc", awayPlaceholder: "Bras ba kasi", time: "11:30", pitch: 1, homeScore: null, awayScore: null, status: "scheduled", note: "Group A Midday Showdown" },
  { id: "ga-m3", stage: "group", group: "A", matchOrder: 5, homeTeamKey: "bras-ba-kasi", awayTeamKey: "team-dench", homePlaceholder: "Bras ba kasi", awayPlaceholder: "Team Dench", time: "13:00", pitch: 1, homeScore: null, awayScore: null, status: "scheduled", note: "Group A Decider" },

  { id: "gb-m1", stage: "group", group: "B", matchOrder: 2, homeTeamKey: "gauteng-warriors", awayTeamKey: "woza-madzala", homePlaceholder: "Gauteng state warriors", awayPlaceholder: "Woza madzala fc", time: "10:45", pitch: 2, homeScore: null, awayScore: null, status: "scheduled", note: "Group B High-Stakes Opener" },
  { id: "gb-m2", stage: "group", group: "B", matchOrder: 4, homeTeamKey: "woza-madzala", awayTeamKey: "areyeng-fc", homePlaceholder: "Woza madzala fc", awayPlaceholder: "Areyeng fc", time: "12:15", pitch: 2, homeScore: null, awayScore: null, status: "scheduled", note: "Group B Battle for Points" },
  { id: "gb-m3", stage: "group", group: "B", matchOrder: 6, homeTeamKey: "areyeng-fc", awayTeamKey: "gauteng-warriors", homePlaceholder: "Areyeng fc", awayPlaceholder: "Gauteng state warriors", time: "13:45", pitch: 2, homeScore: null, awayScore: null, status: "scheduled", note: "Group B Qualification Decider" },

  { id: "sf-1", stage: "semi", matchOrder: 7, homeTeamKey: null, awayTeamKey: null, homePlaceholder: "Group A ( 1st spot )", awayPlaceholder: "Group B ( 2nd spot )", time: "15:00", pitch: 1, homeScore: null, awayScore: null, status: "scheduled", note: "Semi-Final 1" },
  { id: "sf-2", stage: "semi", matchOrder: 8, homeTeamKey: null, awayTeamKey: null, homePlaceholder: "Group A ( 2nd spot )", awayPlaceholder: "Group B ( 1st spot )", time: "15:50", pitch: 1, homeScore: null, awayScore: null, status: "scheduled", note: "Semi-Final 2" },

  { id: "fn-3rd", stage: "third_place", matchOrder: 9, homeTeamKey: null, awayTeamKey: null, homePlaceholder: "First match (Competing for 3rd spot)", awayPlaceholder: "Loser SF 2", time: "16:45", pitch: 1, homeScore: null, awayScore: null, status: "scheduled", note: "First match (Competing for 3rd spot)" },
  { id: "fn-gold", stage: "final", matchOrder: 10, homeTeamKey: null, awayTeamKey: null, homePlaceholder: "Winner SF 1", awayPlaceholder: "Winner SF 2", time: "17:30", pitch: 1, homeScore: null, awayScore: null, status: "scheduled", note: "Second match ( Final Competing for 1st spot 🥇 )" }
]

export default function DenchDerbyPage() {
  const [matches, setMatches] = useState<TournamentMatch[]>(DEFAULT_MATCHES)
  const [players, setPlayers] = useState<TournamentPlayer[]>(INITIAL_PLAYERS)
  const [goalEvents, setGoalEvents] = useState<GoalEvent[]>([])
  const [activeTab, setActiveTab] = useState<"bracket" | "groups" | "schedule" | "leaderboard" | "teams" | "rules">("bracket")

  // Add Player State
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false)
  const [targetTeamKey, setTargetTeamKey] = useState<string>("team-dench")
  const [newPlayerName, setNewPlayerName] = useState("")
  const [newPlayerNumber, setNewPlayerNumber] = useState("")
  const [newPlayerPosition, setNewPlayerPosition] = useState<"GK" | "DEF" | "MID" | "FWD">("MID")
  const [newPlayerCaptain, setNewPlayerCaptain] = useState(false)

  // Event modal state
  const [activeEventMatchId, setActiveEventMatchId] = useState<string | null>(null)
  const [eventTeamKey, setEventTeamKey] = useState<string>("team-dench")
  const [eventScorerId, setEventScorerId] = useState<string>("")
  const [eventAssistId, setEventAssistId] = useState<string>("")
  const [eventMinute, setEventMinute] = useState<number>(15)

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const savedMatches = localStorage.getItem("dench_derby_matches_v3")
      if (savedMatches) setMatches(JSON.parse(savedMatches))

      const savedPlayers = localStorage.getItem("dench_derby_players_v3")
      if (savedPlayers) setPlayers(JSON.parse(savedPlayers))

      const savedEvents = localStorage.getItem("dench_derby_events_v3")
      if (savedEvents) setGoalEvents(JSON.parse(savedEvents))
    } catch {}
  }, [])

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("dench_derby_matches_v3", JSON.stringify(matches))
      localStorage.setItem("dench_derby_players_v3", JSON.stringify(players))
      localStorage.setItem("dench_derby_events_v3", JSON.stringify(goalEvents))
    } catch {}
  }, [matches, players, goalEvents])

  // Player Stats
  const playerStatsMap = useMemo(() => {
    const map: Record<string, { goals: number; assists: number }> = {}
    players.forEach(p => { map[p.id] = { goals: 0, assists: 0 } })
    goalEvents.forEach(ev => {
      if (map[ev.scorerPlayerId]) map[ev.scorerPlayerId].goals += 1
      if (ev.assistPlayerId && map[ev.assistPlayerId]) map[ev.assistPlayerId].assists += 1
    })
    return map
  }, [players, goalEvents])

  const topScorers = useMemo(() => {
    return players
      .map(p => ({
        player: p,
        team: TEAMS[p.teamKey],
        goals: playerStatsMap[p.id]?.goals || 0,
        assists: playerStatsMap[p.id]?.assists || 0
      }))
      .filter(i => i.goals > 0)
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
  }, [players, playerStatsMap])

  const topAssists = useMemo(() => {
    return players
      .map(p => ({
        player: p,
        team: TEAMS[p.teamKey],
        assists: playerStatsMap[p.id]?.assists || 0,
        goals: playerStatsMap[p.id]?.goals || 0
      }))
      .filter(i => i.assists > 0)
      .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
  }, [players, playerStatsMap])

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayerName.trim()) return

    const newP: TournamentPlayer = {
      id: `p-${Date.now()}`,
      teamKey: targetTeamKey,
      name: newPlayerName.trim(),
      jerseyNumber: parseInt(newPlayerNumber, 10) || (players.filter(p => p.teamKey === targetTeamKey).length + 1),
      position: newPlayerPosition,
      isCaptain: newPlayerCaptain
    }
    setPlayers(prev => [...prev, newP])
    setNewPlayerName("")
    setNewPlayerNumber("")
    setIsAddPlayerOpen(false)
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 glass-card border border-primary/30 bg-primary/5 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-primary text-primary-foreground flex items-center gap-1">
              <Flame className="w-3 h-3" /> Official Tournament
            </span>
            <span className="text-xs text-muted-foreground">Wednesday, 28 October 2026</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Dench Derby <span className="gradient-text">Tournament</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            6 Clubs • 2 Groups • Semi-Finals • Grand Final 🥇. Track every goal and assist live on the leaderboards!
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddPlayerOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90"
          >
            <UserPlus className="w-4 h-4" /> Add Player
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("bracket")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "bracket" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Trophy className="w-4 h-4" /> Bracket
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "groups" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Users className="w-4 h-4" /> Groups
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "schedule" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Clock className="w-4 h-4" /> Matches
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "leaderboard" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Award className="w-4 h-4" /> Scorers & Assists 🥇
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "teams" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Shield className="w-4 h-4" /> Squads ({players.length})
        </button>
      </div>

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Scorers */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
              <Award className="w-5 h-5" /> Golden Boot (Top Scorers)
            </h3>
            {topScorers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No goals logged yet.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {topScorers.map((s, idx) => (
                  <div key={s.player.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">
                        {idx === 0 ? "🥇 " : idx === 1 ? "🥈 " : idx === 2 ? "🥉 " : ""}
                        {s.player.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{s.team.name} • {s.assists} assists</div>
                    </div>
                    <div className="font-extrabold text-lg text-primary">{s.goals} ⚽</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Assists */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
              <Trophy className="w-5 h-5" /> Playmaker Award (Assists)
            </h3>
            {topAssists.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No assists logged yet.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {topAssists.map((a, idx) => (
                  <div key={a.player.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">
                        {idx === 0 ? "🎯 " : ""}
                        {a.player.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{a.team.name} • {a.goals} goals</div>
                    </div>
                    <div className="font-extrabold text-lg text-cyan-400">{a.assists} 👟</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Squads Tab */}
      {activeTab === "teams" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(TEAMS).map(team => {
            const teamPlayers = players.filter(p => p.teamKey === team.id)
            return (
              <div key={team.id} className="glass-card p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <h3 className="font-bold text-lg">{team.name}</h3>
                    <div className="text-xs text-muted-foreground">Group {team.group} • {team.city}</div>
                  </div>
                  <button
                    onClick={() => { setTargetTeamKey(team.id); setIsAddPlayerOpen(true); }}
                    className="px-2 py-1 text-xs font-semibold rounded bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-2">
                  {teamPlayers.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-background/50">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                          {p.jerseyNumber}
                        </span>
                        <span className="font-medium">{p.name}</span>
                        {p.isCaptain && <span className="text-[10px] bg-primary text-primary-foreground px-1 rounded font-bold">C</span>}
                      </div>
                      <div className="text-xs text-muted-foreground font-semibold">
                        {playerStatsMap[p.id]?.goals || 0}⚽ {playerStatsMap[p.id]?.assists || 0}👟
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bracket / Groups / Matches fallback preview */}
      {(activeTab === "bracket" || activeTab === "groups" || activeTab === "schedule") && (
        <div className="glass-card p-8 text-center space-y-3">
          <Trophy className="w-12 h-12 mx-auto text-primary" />
          <h2 className="text-xl font-bold">Dench Derby Tournament Management</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            View full tournament bracket, groups, match events, players, and golden boot races. Use the navigation buttons above to explore squads and record scores!
          </p>
        </div>
      )}

      {/* Add Player Modal */}
      {isAddPlayerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" /> Add Player to Squad
              </h3>
              <button onClick={() => setIsAddPlayerOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleAddPlayer} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Team</label>
                <select
                  value={targetTeamKey}
                  onChange={(e) => setTargetTeamKey(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg p-2 text-sm"
                >
                  {Object.values(TEAMS).map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Group {t.group})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Player Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sipho Zulu"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg p-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Jersey #</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={newPlayerNumber}
                    onChange={(e) => setNewPlayerNumber(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Position</label>
                  <select
                    value={newPlayerPosition}
                    onChange={(e) => setNewPlayerPosition(e.target.value as any)}
                    className="w-full bg-secondary/50 border border-border rounded-lg p-2 text-sm"
                  >
                    <option value="FWD">Forward</option>
                    <option value="MID">Midfielder</option>
                    <option value="DEF">Defender</option>
                    <option value="GK">Goalkeeper</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90"
              >
                Save Player
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
