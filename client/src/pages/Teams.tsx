import { Navbar } from '../components/Navbar';
import { Shield, Users, Trophy } from 'lucide-react';

export const Teams = () => {
    // Mock Data based on wireframe
    const teams = [
        { id: 1, pos: 1, name: 'FC Thunder', cap: 'Marcus Johnson', pts: 13, p: 5, gd: '+10', w: 4, d: 1, l: 0, gf: 14, ga: 4 },
        { id: 2, pos: 2, name: 'Real Strikers', cap: 'David Silva', pts: 10, p: 5, gd: '+5', w: 3, d: 1, l: 1, gf: 11, ga: 6 },
        { id: 3, pos: 3, name: 'United FC', cap: 'James Wright', pts: 9, p: 5, gd: '+2', w: 3, d: 0, l: 2, gf: 9, ga: 7 },
        { id: 4, pos: 4, name: 'City Warriors', cap: 'Carlos Rodriguez', pts: 8, p: 5, gd: '+2', w: 2, d: 2, l: 1, gf: 8, ga: 6 },
        { id: 5, pos: 5, name: 'Phoenix Rising', cap: 'Alex Turner', pts: 7, p: 5, gd: '-1', w: 2, d: 1, l: 2, gf: 7, ga: 8 },
        { id: 6, pos: 6, name: 'Dynamo Stars', cap: 'Mike Chen', pts: 5, p: 5, gd: '-3', w: 1, d: 2, l: 2, gf: 6, ga: 9 },
        { id: 7, pos: 7, name: 'Blue Lions', cap: 'Tom Anderson', pts: 4, p: 5, gd: '-5', w: 1, d: 1, l: 3, gf: 5, ga: 10 },
        { id: 8, pos: 8, name: 'Red Devils', cap: 'Ryan Murphy', pts: 2, p: 5, gd: '-10', w: 0, d: 2, l: 3, gf: 4, ga: 14 },
    ];

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content">
                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Teams</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>8 teams registered for the 2025/26 season.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', paddingBottom: '2rem' }}>
                    {teams.map(team => {
                        const isLeader = team.pos === 1;

                        return (
                            <div key={team.id} className="glass-card" style={{
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                borderColor: isLeader ? 'var(--color-primary)' : 'var(--color-border)',
                                borderWidth: isLeader ? '2px' : '1px'
                            }}>
                                {/* Card Header Image/Icons */}
                                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
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
                                        {team.pos}
                                    </div>
                                </div>

                                {/* Team Info */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{team.name}</h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Captain: {team.cap}</p>
                                </div>

                                {/* Main Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: isLeader ? 'var(--color-primary)' : 'white' }}>{team.pts}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Points</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{team.p}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Played</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: team.gd.startsWith('+') ? 'var(--color-primary)' : '#ef4444' }}>{team.gd}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>GD</div>
                                    </div>
                                </div>

                                {/* Form Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                                    <div style={{ color: 'var(--color-primary)' }}>W: {team.w}</div>
                                    <div style={{ color: '#ca8a04' }}>D: {team.d}</div>
                                    <div style={{ color: '#ef4444' }}>L: {team.l}</div>
                                </div>

                                {/* Goals */}
                                <div className="flex-between" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: 'auto' }}>
                                    <span>⚽ GF: {team.gf}</span>
                                    <span>GA: {team.ga}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Team Stat Cards Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '2rem', paddingBottom: '3rem' }}>
                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                        <div className="flex-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <Users size={24} color="var(--color-primary)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>8</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Teams</div>
                        </div>
                    </div>

                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                        <div className="flex-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <Trophy size={24} color="var(--color-primary)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: '0.25rem' }}>FC Thunder</div>
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
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>64</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Goals</div>
                        </div>
                    </div>

                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                        <div className="flex-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <Shield size={24} color="var(--color-primary)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>4</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Most Wins</div>
                        </div>
                    </div>
                </div>

                <footer style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    <div className="flex-center gap-2">
                        <div className="nav-logo-icon" style={{ padding: '0.2rem' }}><Trophy size={14} color="#050505" /></div>
                        <strong style={{ color: 'white' }}>5-A-Side League</strong>
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
