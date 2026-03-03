import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export const Results = () => {
    // Mock State for UI
    const matchweeks = ['All', 'MW 5', 'MW 4'];
    const [activeMW, setActiveMW] = useState('MW 5');

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Match Results</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>View completed matches and final scores.</p>
                </div>

                {/* Matchweek Pagination */}
                <div className="flex-center gap-4" style={{ marginBottom: '3rem' }}>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '0.5rem' }}><ChevronLeft size={16} /></button>
                    <div className="flex-center gap-2">
                        {matchweeks.map(mw => (
                            <button
                                key={mw}
                                className={`btn btn-sm ${activeMW === mw ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setActiveMW(mw)}
                                style={{ border: activeMW === mw ? 'none' : '' }}
                            >
                                {mw}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '0.5rem' }}><ChevronRight size={16} /></button>
                </div>

                {/* Date Group 1 */}
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '1.5rem' }}>
                        <CalendarIcon size={18} /> Mon 23 Feb
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {/* Match Row (Win/Loss) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 150px', alignItems: 'center', backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.1rem' }}>Phoenix Rising</div>

                            <div className="flex-center" style={{ margin: '0 2rem', gap: '0.5rem' }}>
                                <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: '#16a34a', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '1.2rem' }}>2</div>
                                <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                                <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: 'var(--color-bg-panel)', color: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontWeight: 800, fontSize: '1.2rem' }}>1</div>
                            </div>

                            <div style={{ textAlign: 'left', fontWeight: 500, fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>Blue Lions</div>

                            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                <div>Phoenix Park</div>
                                <div>MW 5</div>
                            </div>
                        </div>

                        {/* Match Row (Draw) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 150px', alignItems: 'center', backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.1rem' }}>Dynamo Stars</div>

                            <div className="flex-center" style={{ margin: '0 2rem', gap: '0.5rem' }}>
                                <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: '#ca8a04', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '1.2rem' }}>1</div>
                                <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                                <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: '#ca8a04', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '1.2rem' }}>1</div>
                            </div>

                            <div style={{ textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>Red Devils</div>

                            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                <div>Dynamo Complex</div>
                                <div>MW 5</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Date Group 2 */}
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '1.5rem' }}>
                        <CalendarIcon size={18} /> Sun 22 Feb
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {/* Match Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 150px', alignItems: 'center', backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.1rem' }}>FC Thunder</div>

                            <div className="flex-center" style={{ margin: '0 2rem', gap: '0.5rem' }}>
                                <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: '#16a34a', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '1.2rem' }}>3</div>
                                <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                                <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: 'var(--color-bg-panel)', color: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontWeight: 800, fontSize: '1.2rem' }}>1</div>
                            </div>

                            <div style={{ textAlign: 'left', fontWeight: 500, fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>United FC</div>

                            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                <div>Central Arena</div>
                                <div>MW 5</div>
                            </div>
                        </div>

                        {/* Match Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 150px', alignItems: 'center', backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.1rem' }}>Real Strikers</div>

                            <div className="flex-center" style={{ margin: '0 2rem', gap: '0.5rem' }}>
                                <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: '#ca8a04', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '1.2rem' }}>2</div>
                                <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                                <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: '#ca8a04', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '1.2rem' }}>2</div>
                            </div>

                            <div style={{ textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>City Warriors</div>

                            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                <div>Strikers Field</div>
                                <div>MW 5</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Season Stats Summary */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Season Stats</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>26</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Total Goals</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>8</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Matches Played</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>3.3</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Avg Goals/Match</div>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', color: '#4b5563', fontSize: '0.85rem', marginTop: '2rem' }}>
                    Last updated: 15:18:44
                </div>

            </main>
        </div>
    );
};
