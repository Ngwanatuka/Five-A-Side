import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Shield, Users, Trophy, Plus, CheckCircle2 } from 'lucide-react';
import { getStandings, getTeams, addPlayerToTeam, getBackendUrl } from '../services/api';
import { NavLink } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io(getBackendUrl());

export const Teams = () => {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
    const [inlinePlayerNames, setInlinePlayerNames] = useState<Record<number, string>>({});
    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

    const fetchTeams = async () => {
        try {
            const [standingsData, fullTeamsData] = await Promise.all([
                getStandings(1, 1).catch(() => []),
                getTeams().catch(() => [])
            ]);

            // Combine standings data with full team records including players
            const combined = standingsData.map((st: any) => {
                const fullTeam = fullTeamsData.find((t: any) => t.id === st.teamId);
                return {
                    ...st,
                    players: fullTeam?.players || [],
                    managerContact: fullTeam?.managerContact || ''
                };
            });
            setTeams(combined);
        } catch (error) {
            console.error("Failed to fetch teams", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();

        socket.on('scoreUpdate', () => { fetchTeams(); });
        socket.on('teamRegistered', () => { fetchTeams(); });
        socket.on('playerAdded', () => { fetchTeams(); });

        return () => {
            socket.off('scoreUpdate');
            socket.off('teamRegistered');
            socket.off('playerAdded');
        };
    }, []);

    const handleAddPlayer = async (teamId: number) => {
        const rawName = (inlinePlayerNames[teamId] || '').trim();
        if (!rawName) return;

        const parts = rawName.split(' ');
        const firstName = parts[0] || rawName;
        const lastName = parts.slice(1).join(' ') || '-';

        try {
            await addPlayerToTeam({ teamId, firstName, lastName });
            setInlinePlayerNames(prev => ({ ...prev, [teamId]: '' }));
            setExpandedTeamId(teamId);
            setFeedbackMsg(`Player "${rawName}" added successfully!`);
            setTimeout(() => setFeedbackMsg(null), 3000);
            fetchTeams();
        } catch (err: any) {
            alert(err.message || 'Failed to add player.');
        }
    };

    const totalTeams = teams.length;
    const leader = teams.length > 0 ? teams[0].teamName : '-';
    const totalGoals = teams.reduce((sum, t) => sum + (t.goalsFor || 0), 0);
    const mostWins = teams.length > 0 ? Math.max(...teams.map(t => t.won || 0)) : 0;

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content">
                <div className="flex-between" style={{ marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ marginBottom: '0.5rem' }}>Teams & Squads</h1>
                        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                            {totalTeams} teams registered for the 2025/26 season. Manage squad rosters below.
                        </p>
                    </div>
                    <NavLink to="/register" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
                        <Plus size={16} /> Register New Team
                    </NavLink>
                </div>

                {feedbackMsg && (
                    <div style={{
                        padding: '0.75rem 1.25rem',
                        marginBottom: '1.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem'
                    }}>
                        <CheckCircle2 size={16} /> {feedbackMsg}
                    </div>
                )}

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>Loading teams...</div>
                ) : (
                    <div className="grid-responsive-4" style={{ paddingBottom: '2rem' }}>
                        {teams.map((team, index) => {
                            const pos = index + 1;
                            const isLeader = pos === 1;

                            return (
                                <div key={team.teamId} className="glass-card" style={{
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderColor: isLeader ? 'var(--color-primary)' : 'var(--color-border)',
                                    borderWidth: isLeader ? '2px' : '1px'
                                }}>
                                    {/* Card Header Image/Icons */}
                                    <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                                        <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                            <Shield size={20} color="var(--color-primary)" />
                                        </div>
                                        <div className="flex-center" style={{
                                            width: '24px', height: '24px',
                                            backgroundColor: isLeader ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                                            color: isLeader ? '#050505' : 'white',
                                            borderRadius: '50%',
                                            fontWeight: 700,
                                            fontSize: '0.85rem'
                                        }}>
                                            {pos}
                                        </div>
                                    </div>

                                    {/* Team Info */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.teamName}</h3>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                                            {team.managerContact ? `Manager: ${team.managerContact}` : 'Official Club'}
                                        </p>
                                    </div>

                                    {/* Main Stats */}
                                    <div className="grid-responsive-3" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: isLeader ? 'var(--color-primary)' : 'white' }}>{team.points}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Points</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'white' }}>{team.played}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Played</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: team.goalDifference > 0 ? 'var(--color-primary)' : (team.goalDifference < 0 ? '#ef4444' : 'white') }}>
                                                {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>GD</div>
                                        </div>
                                    </div>

                                    {/* Form Stats */}
                                    <div className="grid-responsive-3" style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 500 }}>
                                        <div style={{ color: 'var(--color-primary)' }}>W: {team.won}</div>
                                        <div style={{ color: '#ca8a04' }}>D: {team.drawn}</div>
                                        <div style={{ color: '#ef4444' }}>L: {team.lost}</div>
                                    </div>

                                    {/* Goals */}
                                    <div className="flex-between" style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                                        <span>⚽ GF: {team.goalsFor}</span>
                                        <span>GA: {team.goalsAgainst}</span>
                                    </div>

                                    {/* Squad Roster & Quick Add Player */}
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <div className="flex-between" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                            <span style={{ fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <Users size={13} /> Squad ({team.players?.length || 0}/9)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setExpandedTeamId(expandedTeamId === team.teamId ? null : team.teamId)}
                                                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                            >
                                                {expandedTeamId === team.teamId ? 'Hide' : 'View'}
                                            </button>
                                        </div>

                                        {/* Player List */}
                                        {expandedTeamId === team.teamId && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.6rem', maxHeight: '130px', overflowY: 'auto' }}>
                                                {(!team.players || team.players.length === 0) ? (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '0.25rem 0' }}>
                                                        No players registered yet.
                                                    </div>
                                                ) : (
                                                    team.players.map((p: any) => (
                                                        <div key={p.id} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '0.25rem 0.5rem',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            color: 'white'
                                                        }}>
                                                            <span>👤 {p.firstName} {p.lastName !== '-' ? p.lastName : ''}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}

                                        {/* Inline Add Player Input */}
                                        {(!team.players || team.players.length < 9) ? (
                                            <form onSubmit={(e) => { e.preventDefault(); handleAddPlayer(team.teamId); }} style={{ display: 'flex', gap: '0.35rem' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Add player (e.g. Sipho M.)..."
                                                    value={inlinePlayerNames[team.teamId] || ''}
                                                    onChange={(e) => setInlinePlayerNames(prev => ({ ...prev, [team.teamId]: e.target.value }))}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.35rem 0.5rem',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        color: 'white'
                                                    }}
                                                />
                                                <button
                                                    type="submit"
                                                    className="btn btn-sm btn-primary"
                                                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                                    title="Add player to squad"
                                                >
                                                    <Plus size={13} />
                                                </button>
                                            </form>
                                        ) : (
                                            <div style={{ fontSize: '0.75rem', color: '#f59e0b', textAlign: 'center' }}>
                                                Roster full (9/9)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Team Stat Cards Section */}
                <div className="grid-responsive-4" style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                        <div className="flex-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <Users size={24} color="var(--color-primary)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>{totalTeams}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Teams</div>
                        </div>
                    </div>

                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                        <div className="flex-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <Trophy size={24} color="var(--color-primary)" />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: '0.25rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{leader}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>League Leader</div>
                        </div>
                    </div>

                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                        <div className="flex-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>{totalGoals}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Goals</div>
                        </div>
                    </div>

                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                        <div className="flex-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <Shield size={24} color="var(--color-primary)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>{mostWins}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Most Wins</div>
                        </div>
                    </div>
                </div>

                <footer style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <div className="flex-center gap-2">
                            <div className="nav-logo-icon" style={{ padding: '0.2rem' }}><Trophy size={14} color="#050505" /></div>
                            <strong style={{ color: 'white' }}>5-A-Side League</strong>
                        </div>
                        <NavLink to="/login" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                            Referee Login
                        </NavLink>
                    </div>
                    <div className="flex-center gap-4">
                        <span>Standings</span><span>Fixtures</span><span>Results</span><span>Teams</span>
                    </div>
                    <div>Season 2025/26</div>
                </footer>
            </main>
        </div>
    );
};
