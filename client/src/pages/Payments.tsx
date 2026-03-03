import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { BadgeCheck, Calendar as CalendarIcon, Wallet, ChevronDown, User, Shield } from 'lucide-react';

export const Payments = () => {
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedOption, setSelectedOption] = useState('');

    // Mock teams for dropdown
    const teams = ['FC Thunder', 'Real Strikers', 'Dynamo Stars', 'Blue Lions', 'Red Devils'];

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}>

                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div className="flex-center" style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-primary)', borderRadius: '1rem', margin: '0 auto 1.5rem auto' }}>
                        <Wallet size={32} color="#050505" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Player Payments</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Settle your league fees securely online.</p>
                </div>

                <div style={{ width: '100%', maxWidth: '800px' }}>

                    {/* Step 1: Player Details */}
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div className="flex-center" style={{ width: '28px', height: '28px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', color: '#050505', fontWeight: 700, fontSize: '0.9rem' }}>1</div>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Player Details</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                    Your Team
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                        <Shield size={18} />
                                    </div>
                                    <select
                                        value={selectedTeam}
                                        onChange={(e) => setSelectedTeam(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: selectedTeam ? 'white' : 'var(--color-text-muted)',
                                            fontSize: '1rem',
                                            appearance: 'none',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="" disabled>Select your team...</option>
                                        {teams.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <ChevronDown size={18} color="var(--color-text-muted)" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                    Player Name
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'white',
                                            fontSize: '1rem',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Payment Options */}
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div className="flex-center" style={{ width: '28px', height: '28px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', color: '#050505', fontWeight: 700, fontSize: '0.9rem' }}>2</div>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Select Payment Plan</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                            {/* Per Game - Clickable */}
                            <div
                                className="glass-card"
                                onClick={() => setSelectedOption('Per Game')}
                                style={{
                                    padding: '1.5rem',
                                    backgroundColor: selectedOption === 'Per Game' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                    borderColor: selectedOption === 'Per Game' ? 'rgba(255, 255, 255, 0.5)' : 'var(--color-border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                            >
                                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    <CalendarIcon size={16} /> Per Game
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>R45</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Pay as you play</div>
                                {selectedOption === 'Per Game' && (
                                    <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                                        <BadgeCheck size={20} color="white" />
                                    </div>
                                )}
                            </div>

                            {/* Half Season */}
                            <div
                                className="glass-card"
                                onClick={() => setSelectedOption('Half Season')}
                                style={{
                                    padding: '1.5rem',
                                    backgroundColor: selectedOption === 'Half Season' ? 'rgba(202, 138, 4, 0.15)' : 'rgba(202, 138, 4, 0.05)',
                                    borderColor: selectedOption === 'Half Season' ? '#ca8a04' : 'rgba(202, 138, 4, 0.2)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                            >
                                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', color: '#ca8a04', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 500 }}>
                                    <span style={{ width: '16px', height: '16px', display: 'flex' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></span> Half Season
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>R311</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>7 games included</div>
                                {selectedOption === 'Half Season' && (
                                    <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                                        <BadgeCheck size={20} color="#ca8a04" />
                                    </div>
                                )}
                            </div>

                            {/* Full Season */}
                            <div
                                className="glass-card"
                                onClick={() => setSelectedOption('Full Season')}
                                style={{
                                    padding: '1.5rem',
                                    backgroundColor: selectedOption === 'Full Season' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.05)',
                                    borderColor: selectedOption === 'Full Season' ? 'var(--color-primary)' : 'rgba(34, 197, 94, 0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'var(--color-primary)', color: '#050505', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '1rem', display: selectedOption === 'Full Season' ? 'none' : 'block' }}>
                                    Best Value
                                </div>
                                {selectedOption === 'Full Season' && (
                                    <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                                        <BadgeCheck size={20} color="var(--color-primary)" />
                                    </div>
                                )}
                                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 500 }}>
                                    <BadgeCheck size={16} /> Full Season
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>R622</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>All 14 games included</div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Section */}
                    <div style={{ textAlign: 'center' }}>
                        <button
                            className="btn btn-primary"
                            disabled={!selectedTeam || !selectedOption}
                            style={{
                                padding: '1rem 3rem',
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                opacity: (!selectedTeam || !selectedOption) ? 0.5 : 1,
                                cursor: (!selectedTeam || !selectedOption) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Proceed to Payment
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};
