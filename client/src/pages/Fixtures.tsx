import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from 'lucide-react';

export const Fixtures = () => {
    // Mock State for UI
    const matchweeks = ['All', 'MW 5', 'MW 6', 'MW 7'];
    const [activeMW, setActiveMW] = useState('MW 6');

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Upcoming Fixtures</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>View scheduled matches and live games. Auto-updates every 30 seconds.</p>
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
                        <CalendarIcon size={18} /> Sunday, 1 March 2026
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {/* Match Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 150px', alignItems: 'center', backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.1rem' }}>FC Thunder</div>
                            <div className="flex-center" style={{ flexDirection: 'column', backgroundColor: 'var(--color-bg-panel)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', margin: '0 2rem', minWidth: '100px' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>18:00</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Matchweek 6</span>
                            </div>
                            <div style={{ textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>Real Strikers</div>
                            <div className="flex-center gap-2" style={{ justifyContent: 'flex-end', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                <MapPin size={14} /> Central Arena
                            </div>
                        </div>

                        {/* Match Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 150px', alignItems: 'center', backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.1rem' }}>United FC</div>
                            <div className="flex-center" style={{ flexDirection: 'column', backgroundColor: 'var(--color-bg-panel)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', margin: '0 2rem', minWidth: '100px' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>19:30</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Matchweek 6</span>
                            </div>
                            <div style={{ textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>City Warriors</div>
                            <div className="flex-center gap-2" style={{ justifyContent: 'flex-end', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                <MapPin size={14} /> City Stadium
                            </div>
                        </div>
                    </div>
                </div>

                {/* Date Group 2 */}
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '1.5rem' }}>
                        <CalendarIcon size={18} /> Monday, 2 March 2026
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {/* Match Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 150px', alignItems: 'center', backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.1rem' }}>Phoenix Rising</div>
                            <div className="flex-center" style={{ flexDirection: 'column', backgroundColor: 'var(--color-bg-panel)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', margin: '0 2rem', minWidth: '100px' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>17:00</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Matchweek 6</span>
                            </div>
                            <div style={{ textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>Dynamo Stars</div>
                            <div className="flex-center gap-2" style={{ justifyContent: 'flex-end', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                <MapPin size={14} /> Phoenix Park
                            </div>
                        </div>

                        {/* Match Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 150px', alignItems: 'center', backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.1rem' }}>Blue Lions</div>
                            <div className="flex-center" style={{ flexDirection: 'column', backgroundColor: 'var(--color-bg-panel)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', margin: '0 2rem', minWidth: '100px' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>18:30</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Matchweek 6</span>
                            </div>
                            <div style={{ textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>Red Devils</div>
                            <div className="flex-center gap-2" style={{ justifyContent: 'flex-end', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                <MapPin size={14} /> Lions Den
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};
