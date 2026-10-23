import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { API_BASE_URL } from '../services/api';
import { useRole, type UserRole } from '../context/RoleContext';
import { Sparkles } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { role, setAuthSession, openRoleModal } = useRole();

    useEffect(() => {
        if (role === 'REFEREE') navigate('/referee');
        else if (role === 'ADMIN') navigate('/admin');
        else if (role === 'CAPTAIN') navigate('/dench-derby');
    }, [role, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            setAuthSession(data.token, data.user.role as UserRole, { email: data.user.email });

            if (data.user.role === 'REFEREE') navigate('/referee');
            else if (data.user.role === 'ADMIN') navigate('/admin');
            else navigate('/');

        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDemoLogin = (demoEmail: string) => {
        setEmail(demoEmail);
        setPassword('password123');
    };

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content flex-center animate-fade-in" style={{ flex: 1, flexDirection: 'column', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Portal Sign In</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Access League Admin or Referee Match Console</p>
                </div>

                <div className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: '440px' }}>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Email address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@5aside.com or referee@5aside.com"
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', outline: 'none' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="password123"
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', outline: 'none' }}
                            />
                        </div>

                        {error && (
                            <div className="animate-fade-in" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.25rem' }}>
                            Sign In ➔
                        </button>
                    </form>

                    {/* Quick Role Switcher Button */}
                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={openRoleModal}
                            style={{
                                background: 'none',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: 'white',
                                width: '100%',
                                padding: '0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            <Sparkles size={14} color="var(--color-primary)" />
                            Choose Role (Player, Captain, Referee, Admin)
                        </button>
                    </div>

                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                        <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'white' }}>Quick Demo Accounts:</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('admin@5aside.com')}
                                style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #a855f7', color: '#c084fc', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                                Admin (admin@5aside.com)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('referee@5aside.com')}
                                style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid #06b6d4', color: '#22d3ee', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                                Referee (referee@5aside.com)
                            </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', margin: 0 }}>
                            Password for all: <code style={{ color: 'var(--color-primary)' }}>password123</code>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
