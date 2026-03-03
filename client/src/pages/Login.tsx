import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and role
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.user.role);

            // Redirect based on role
            if (data.user.role === 'REFEREE') navigate('/referee');
            else if (data.user.role === 'CASHIER') navigate('/payments');
            else if (data.user.role === 'ADMIN') navigate('/admin');
            else navigate('/');

        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content flex-center animate-fade-in" style={{ flex: 1, flexDirection: 'column' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Sign In</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Access the 5-a-Side Management Portal</p>
                </div>

                <div className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: '420px' }}>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Email address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </div>

                        {error && (
                            <div className="animate-fade-in" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}>
                            Secure Login
                        </button>
                    </form>

                    <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                        <p style={{ marginBottom: '0.75rem', fontWeight: 600, color: 'white' }}>Demo Accounts Available:</p>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <li>admin@5aside.com</li>
                            <li>referee@5aside.com</li>
                            <li>cashier@5aside.com</li>
                        </ul>
                        <p style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>
                            Password: password123
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
