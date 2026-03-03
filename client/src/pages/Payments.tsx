import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { BadgeCheck, Calendar as CalendarIcon, Wallet, ChevronDown, User, Shield } from 'lucide-react';
import { getTeams, processPublicPayment } from '../services/api';

export const Payments = () => {
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedOption, setSelectedOption] = useState('');
    const [playerName, setPlayerName] = useState('');

    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const data = await getTeams();
                setTeams(data);
            } catch (error) {
                console.error("Failed to fetch teams", error);
            }
        };
        fetchTeams();
    }, []);

    const handlePayment = async () => {
        if (!selectedTeam || !selectedOption || !playerName) return;

        setLoading(true);
        setError('');
        setSuccess(false);

        let amountPaid = 0;
        if (selectedOption === 'Per Game') amountPaid = 45;
        if (selectedOption === 'Half Season') amountPaid = 311;
        if (selectedOption === 'Full Season') amountPaid = 622;

        try {
            await processPublicPayment({
                teamName: selectedTeam,
                playerName: playerName,
                seasonId: 1, // Assuming season 1
                paymentTier: selectedOption,
                amountPaid: amountPaid
            });

            setSuccess(true);
            // Reset form
            setSelectedTeam('');
            setSelectedOption('');
            setPlayerName('');
        } catch (err: any) {
            setError(err.message || 'Failed to process payment');
        } finally {
            setLoading(false);
        }
    };

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

                    {error && (
                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                            <p style={{ color: '#ef4444', margin: 0, fontSize: '0.9rem' }}>{error}</p>
                        </div>
                    )}

                    {success && (
                        <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderLeft: '4px solid #22c55e', padding: '1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                            <p style={{ color: '#22c55e', margin: 0, fontSize: '0.9rem' }}>Payment successfully processed!</p>
                        </div>
                    )}

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
                                    <div
                                        onClick={() => { if (!loading && !success) setIsTeamDropdownOpen(!isTeamDropdownOpen); }}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            border: isTeamDropdownOpen ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: selectedTeam ? 'white' : 'var(--color-text-muted)',
                                            fontSize: '1rem',
                                            cursor: (loading || success) ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            opacity: (loading || success) ? 0.6 : 1,
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <span>{selectedTeam || 'Select your team...'}</span>
                                        <ChevronDown size={18} color="var(--color-text-muted)" style={{ transform: isTeamDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                                    </div>

                                    {isTeamDropdownOpen && (
                                        <div className="animate-fade-in" style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            marginTop: '0.5rem',
                                            backgroundColor: 'var(--color-bg-card)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                            zIndex: 50,
                                            maxHeight: '250px',
                                            overflowY: 'auto'
                                        }}>
                                            {teams.length === 0 ? (
                                                <div style={{ padding: '1rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>No teams available</div>
                                            ) : (
                                                teams.map(t => (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => {
                                                            setSelectedTeam(t.name);
                                                            setIsTeamDropdownOpen(false);
                                                        }}
                                                        style={{
                                                            padding: '0.9rem 1rem',
                                                            cursor: 'pointer',
                                                            color: 'white',
                                                            borderBottom: '1px solid rgba(255,255,255,0.02)',
                                                            transition: 'background-color 0.2s ease, color 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                                            e.currentTarget.style.color = 'var(--color-primary)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.color = 'white';
                                                        }}
                                                    >
                                                        {t.name}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
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
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        placeholder="Enter your full name"
                                        disabled={loading || success}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'white',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            opacity: (loading || success) ? 0.6 : 1
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
                                onClick={() => { if (!loading && !success) setSelectedOption('Per Game'); }}
                                style={{
                                    padding: '1.5rem',
                                    backgroundColor: selectedOption === 'Per Game' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                    borderColor: selectedOption === 'Per Game' ? 'rgba(255, 255, 255, 0.5)' : 'var(--color-border)',
                                    cursor: (loading || success) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    opacity: (loading || success) ? 0.6 : 1
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
                                onClick={() => { if (!loading && !success) setSelectedOption('Half Season'); }}
                                style={{
                                    padding: '1.5rem',
                                    backgroundColor: selectedOption === 'Half Season' ? 'rgba(202, 138, 4, 0.15)' : 'rgba(202, 138, 4, 0.05)',
                                    borderColor: selectedOption === 'Half Season' ? '#ca8a04' : 'rgba(202, 138, 4, 0.2)',
                                    cursor: (loading || success) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    opacity: (loading || success) ? 0.6 : 1
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
                                onClick={() => { if (!loading && !success) setSelectedOption('Full Season'); }}
                                style={{
                                    padding: '1.5rem',
                                    backgroundColor: selectedOption === 'Full Season' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.05)',
                                    borderColor: selectedOption === 'Full Season' ? 'var(--color-primary)' : 'rgba(34, 197, 94, 0.3)',
                                    cursor: (loading || success) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    opacity: (loading || success) ? 0.6 : 1
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
                            onClick={handlePayment}
                            disabled={!selectedTeam || !selectedOption || !playerName || loading || success}
                            style={{
                                padding: '1rem 3rem',
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                opacity: (!selectedTeam || !selectedOption || !playerName || loading || success) ? 0.5 : 1,
                                cursor: (!selectedTeam || !selectedOption || !playerName || loading || success) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};
