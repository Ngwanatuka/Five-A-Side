import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Shield, Lock, LogOut, ChevronDown } from 'lucide-react';

export const AdminDashboard = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeTab, setActiveTab] = useState('Update Scores');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock login
        setIsLoggedIn(true);
    };

    if (!isLoggedIn) {
        return (
            <div className="app-container">
                <Navbar />

                <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}>

                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <div className="flex-center" style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-primary)', borderRadius: '1rem', margin: '0 auto 1.5rem auto' }}>
                            <Shield size={32} color="#050505" />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Admin Panel</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Enter the admin password to manage the league.</p>
                    </div>

                    <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                <Lock size={20} /> Login Required
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>This area is restricted to league administrators.</p>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter admin password"
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 1rem',
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'white',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '0.85rem',
                                    fontSize: '1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    fontWeight: 600
                                }}
                            >
                                Login
                            </button>
                        </form>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Demo password: admin123
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Logged In State
    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content" style={{ padding: '2rem 2rem' }}>

                {/* Header section with Logout */}
                <div className="flex-between" style={{ marginBottom: '2rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Shield size={32} color="var(--color-primary)" />
                        <div>
                            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Admin Panel</h1>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>Manage fixtures, update scores, and control match status.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsLoggedIn(false)}
                        className="glass-card flex-center"
                        style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', gap: '0.5rem', cursor: 'pointer', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--color-border)' }}
                    >
                        <LogOut size={16} /> <span style={{ color: 'white', fontWeight: 500 }}>Logout</span>
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', padding: '0.25rem', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {['Update Scores', 'Match Status', 'Add Fixture'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                backgroundColor: activeTab === tab ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                color: activeTab === tab ? 'white' : 'var(--color-text-muted)',
                                fontWeight: activeTab === tab ? 600 : 500,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                borderTop: activeTab === tab ? '2px solid rgba(255, 255, 255, 0.1)' : '2px solid transparent'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Active Tab Content */}
                {activeTab === 'Update Scores' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Update Match Scores</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Select a match and enter the final or current score.</p>
                        </div>

                        <form style={{ maxWidth: '600px' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                    Select Match
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'var(--color-text-muted)',
                                            fontSize: '0.95rem',
                                            appearance: 'none',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Choose a fixture...</option>
                                        <option value="1">FC Thunder vs Real Strikers (19:00)</option>
                                        <option value="2">Dynamo Stars vs Blue Lions (20:00)</option>
                                    </select>
                                    <ChevronDown size={18} color="var(--color-text-muted)" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '0.85rem',
                                    fontSize: '1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    fontWeight: 600,
                                    backgroundColor: 'rgba(21, 128, 61, 0.8)' // slightly darker/semi transparent green per wireframe
                                }}
                            >
                                Update Score
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'Match Status' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <p style={{ color: 'var(--color-text-muted)' }}>Match status controls will appear here.</p>
                    </div>
                )}

                {activeTab === 'Add Fixture' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <p style={{ color: 'var(--color-text-muted)' }}>Fixture addition form will appear here.</p>
                    </div>
                )}
            </main>
        </div>
    );
};
