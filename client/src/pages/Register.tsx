import { Navbar } from '../components/Navbar';
import { UserPlus } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const Register = () => {
    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}>

                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div className="flex-center" style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-primary)', borderRadius: '1rem', margin: '0 auto 1.5rem auto' }}>
                        <UserPlus size={32} color="#050505" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Register Your Team</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Join the 5-A-Side League for the 2025/26 season.</p>
                </div>

                <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Team Registration</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Fill in your team details below. All fields are required.</p>
                    </div>

                    <form>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                Team Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., FC Thunder"
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

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                Short Name (3-4 letters)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., FCT"
                                maxLength={4}
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
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                                Used for fixtures display (e.g., THU vs RST)
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                Captain Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., John Smith"
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

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                Contact Email
                            </label>
                            <input
                                type="email"
                                placeholder="e.g., captain@team.com"
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
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                                We'll send fixture notifications to this email
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
                                fontWeight: 600
                            }}
                        >
                            Register Team
                        </button>
                    </form>
                </div>

                <div style={{ marginTop: '2.5rem', fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
                    Already registered? <NavLink to="/teams" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, marginLeft: '0.25rem' }}>View all teams</NavLink>
                </div>
            </main>
        </div>
    );
};
