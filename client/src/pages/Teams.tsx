import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Shield, Users, Trophy, Plus, Lock, Trash2, Crown } from 'lucide-react';
import { getStandings, getTeams, addPlayerToTeam, deletePlayer, setPlayerCaptain, getBackendUrl } from '../services/api';
import { NavLink } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useRole } from '../context/RoleContext';
import { useToast, useConfirm } from '../components/Toast';

const socket = io(getBackendUrl());

export const Teams = () => {
    const { role, captainTeamName, canEditTeam, isPastDeadline, deadlineRemaining, openRoleModal } = useRole();
    const { toast } = useToast();
    const { confirm, ConfirmUI } = useConfirm();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
    const [inlinePlayerNames, setInlinePlayerNames] = useState<Record<number, string>>({});

    const fetchTeams = async () => {
        try {
            const [standingsData, fullTeamsData] = await Promise.all([
                getStandings(1, 1).catch(() => []),
                getTeams().catch(() => [])
            ]);

            // Combine standings data with full team records including players
            let combined: any[] = [];
            if (Array.isArray(standingsData) && standingsData.length > 0) {
                combined = standingsData.map((st: any) => {
                    const fullTeam = fullTeamsData.find((t: any) => t.id === st.teamId);
                    return {
                        ...st,
                        players: fullTeam?.players || [],
                        managerContact: fullTeam?.managerContact || ''
                    };
                });
            } else if (Array.isArray(fullTeamsData) && fullTeamsData.length > 0) {
                combined = fullTeamsData.map((ft: any) => ({
                    teamId: ft.id,
                    teamName: ft.name,
                    played: 0,
                    won: 0,
                    drawn: 0,
                    lost: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    goalDifference: 0,
                    points: 0,
                    players: ft.players || [],
                    managerContact: ft.managerContact || ''
                }));
            }
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
        socket.on('playerDeleted', () => { fetchTeams(); });
        socket.on('playerUpdated', () => { fetchTeams(); });
        socket.on('derbyUpdate', () => { fetchTeams(); });

        return () => {
            socket.off('scoreUpdate');
            socket.off('teamRegistered');
            socket.off('playerAdded');
            socket.off('playerDeleted');
            socket.off('playerUpdated');
            socket.off('derbyUpdate');
        };
    }, []);

    const handleMakeCaptain = async (playerId: number | string, playerName: string, teamName: string) => {
        if (role === 'CAPTAIN' && !canEditTeam(teamName)) {
            toast.warning('Forbidden: As Captain, you can only designate captain for your own team.');
            return;
        }

        try {
            await setPlayerCaptain(playerId);
            toast.success(`👑 "${playerName}" designated as Captain of ${teamName}!`);
            fetchTeams();
        } catch (err: any) {
            toast.error(err.message || 'Failed to designate team captain.');
        }
    };

    const handleDeletePlayer = async (playerId: number | string, teamName: string, playerName: string) => {
        if (role === 'CAPTAIN' && !canEditTeam(teamName)) {
            toast.warning('Forbidden: As Captain, you can only remove players from your own team.');
            return;
        }

        if (!await confirm({
            message: `Are you sure you want to remove "${playerName}" from ${teamName}?`,
            confirmLabel: 'Remove',
            danger: true,
        })) {
            return;
        }

        try {
            await deletePlayer(playerId, { name: playerName });
            toast.success(`Player "${playerName}" removed successfully.`);
            fetchTeams();
        } catch (err: any) {
            toast.error(err.message || 'Failed to remove player.');
        }
    };

    const handleAddPlayer = async (teamId: number) => {
        const rawName = (inlinePlayerNames[teamId] || '').trim();
        if (!rawName) return;

        const team = teams.find(t => t.teamId === teamId);
        if (role === 'CAPTAIN' && team && !canEditTeam(team.teamName)) {
            toast.warning('Forbidden: As Captain, you can only add players to your own team.');
            return;
        }

        const parts = rawName.split(' ');
        const firstName = parts[0] || rawName;
        const lastName = parts.slice(1).join(' ') || '-';

        try {
            await addPlayerToTeam({ teamId, firstName, lastName });
            setInlinePlayerNames(prev => ({ ...prev, [teamId]: '' }));
            setExpandedTeamId(teamId);
            toast.success(`Player "${rawName}" added successfully!`);
            fetchTeams();
        } catch (err: any) {
            toast.error(err.message || 'Failed to add player.');
        }
    };

    const totalTeams = teams.length;
    const leader = teams.length > 0 ? teams[0].teamName : '-';
    const totalGoals = teams.reduce((sum, t) => sum + (t.goalsFor || 0), 0);
    const mostWins = teams.length > 0 ? Math.max(...teams.map(t => t.won || 0)) : 0;

    return (
        <div className="app-container">
            <Navbar />
            <ConfirmUI />

            <main className="main-content">
                {/* ROLE BANNER */}
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '0.85rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    border: '1px solid',
                    ...(role === 'ADMIN' && {
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        borderColor: 'rgba(168, 85, 247, 0.3)',
                        color: '#c084fc'
                    }),
                    ...(role === 'CAPTAIN' && {
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderColor: 'rgba(245, 158, 11, 0.35)',
                        color: '#fbbf24'
                    }),
                    ...(role === 'REFEREE' && {
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        borderColor: 'rgba(6, 182, 212, 0.3)',
                        color: '#22d3ee'
                    }),
                    ...(role === 'SPECTATOR' && {
                        backgroundColor: 'rgba(34, 197, 94, 0.08)',
                        borderColor: 'rgba(34, 197, 94, 0.25)',
                        color: 'var(--color-primary)'
                    })
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {role === 'ADMIN' && <span>👑 <strong>Admin Access:</strong> You can edit any team and add/remove players at any time.</span>}
                        {role === 'CAPTAIN' && (
                            <span>
                                🧢 <strong>Captain Mode:</strong> Managing <strong>{captainTeamName || 'Your Team'}</strong> • ⏰ Roster Window: <strong>{isPastDeadline ? 'Closed (28 Oct 18:30)' : `Open (${deadlineRemaining} remaining)`}</strong>
                            </span>
                        )}
                        {role === 'REFEREE' && <span>⏱️ <strong>Referee Mode:</strong> Match official viewing. You can view all fixtures and squads.</span>}
                        {role === 'SPECTATOR' && <span>⚽ <strong>Participant / Player Mode:</strong> Browsing league teams & squads. (Read-only view).</span>}
                    </div>

                    <button
                        type="button"
                        onClick={openRoleModal}
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: 'white',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Switch Role
                    </button>
                </div>

                <div className="flex-between" style={{ marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ marginBottom: '0.5rem' }}>Teams & Squads</h1>
                        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                            {totalTeams} teams registered for the 2025/26 season. Manage squad rosters below.
                        </p>
                    </div>
                    {role === 'ADMIN' && (
                        <NavLink to="/register" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
                            <Plus size={16} /> Register New Team
                        </NavLink>
                    )}
                </div>

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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <h3 style={{ fontSize: '1.25rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.teamName}</h3>
                                            {role === 'CAPTAIN' && canEditTeam(team.teamName) && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    padding: '0.15rem 0.45rem',
                                                    borderRadius: '999px',
                                                    background: 'rgba(34, 197, 94, 0.2)',
                                                    color: '#22c55e',
                                                    border: '1px solid rgba(34, 197, 94, 0.4)',
                                                    fontWeight: 700
                                                }}>
                                                    👑 YOUR SQUAD
                                                </span>
                                            )}
                                        </div>
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
                                                    team.players.map((p: any) => {
                                                        const pFullName = `${p.firstName} ${p.lastName !== '-' ? p.lastName : ''}`.trim();
                                                        return (
                                                            <div key={p.id} style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                padding: '0.35rem 0.5rem',
                                                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                                                borderRadius: '4px',
                                                                fontSize: '0.75rem',
                                                                color: 'white'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                    <span>👤 {pFullName}</span>
                                                                    {p.isCaptain && (
                                                                        <span style={{
                                                                            fontSize: '0.62rem',
                                                                            backgroundColor: '#f59e0b',
                                                                            color: '#050505',
                                                                            fontWeight: 800,
                                                                            padding: '0.1rem 0.35rem',
                                                                            borderRadius: '3px',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.2rem'
                                                                        }}>
                                                                            <Crown size={10} /> CAPTAIN
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                                    {canEditTeam(team.teamName) && !p.isCaptain && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleMakeCaptain(p.id, pFullName, team.teamName)}
                                                                            style={{
                                                                                background: 'rgba(245, 158, 11, 0.1)',
                                                                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                                                                color: '#f59e0b',
                                                                                cursor: 'pointer',
                                                                                padding: '0.15rem 0.4rem',
                                                                                borderRadius: '3px',
                                                                                fontSize: '0.68rem',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.2rem',
                                                                                fontWeight: 600
                                                                            }}
                                                                            title="Designate as Team Captain"
                                                                        >
                                                                            <Crown size={11} /> Captain
                                                                        </button>
                                                                    )}
                                                                    {canEditTeam(team.teamName) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeletePlayer(p.id, team.teamName, pFullName)}
                                                                            style={{
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                color: '#ef4444',
                                                                                cursor: 'pointer',
                                                                                padding: '0 0.2rem',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                opacity: 0.8
                                                                            }}
                                                                            title="Remove player from squad"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}

                                        {/* Inline Add Player Input (Only if authorized Captain or Admin) */}
                                        {canEditTeam(team.teamName) ? (
                                            (!team.players || team.players.length < 9) ? (
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
                                            )
                                        ) : (
                                            <div style={{ fontSize: '0.75rem', textAlign: 'center', padding: '0.25rem 0', color: 'var(--color-text-muted)' }}>
                                                {role === 'CAPTAIN' && isPastDeadline ? (
                                                    <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                                        <Lock size={12} /> Squad locked (28 Oct 18:30)
                                                    </span>
                                                ) : role === 'CAPTAIN' ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                                        <Lock size={12} /> Locked (Not Your Team)
                                                    </span>
                                                ) : (
                                                    <span>👀 Read-Only Squad Roster</span>
                                                )}
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
