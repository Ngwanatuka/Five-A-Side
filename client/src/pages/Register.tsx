import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { UserPlus } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { createTeam, registerTeamToSeason } from '../services/api';

export const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        shortName: '',
        managerName: '',
        managerContact: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            // 1. Create team
            // Using managerName + managerContact for the single managerContact field in DB for now
            const teamResp = await createTeam({
                name: formData.name,
                managerContact: `${formData.managerName} (${formData.managerContact})`
            });

            // 2. Register team to current season (assuming season ID 1 for now)
            await registerTeamToSeason({ teamId: teamResp.id, seasonId: 1 });

            setSuccess(true);
            setTimeout(() => {
                navigate('/teams');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to register team. Please try again.');
        } finally {
            setLoading(false);
        }
    };
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

                    {error && (
                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                            <p style={{ color: '#ef4444', margin: 0, fontSize: '0.9rem' }}>{error}</p>
                        </div>
                    )}

                    {success && (
                        <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderLeft: '4px solid #22c55e', padding: '1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                            <p style={{ color: '#22c55e', margin: 0, fontSize: '0.9rem' }}>Registration successful! Redirecting to teams...</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                Team Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., FC Thunder"
                                required
                                disabled={loading || success}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem',
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    opacity: (loading || success) ? 0.6 : 1
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                Short Name (3-4 letters)
                            </label>
                            <input
                                type="text"
                                name="shortName"
                                value={formData.shortName}
                                onChange={handleChange}
                                placeholder="e.g., FCT"
                                maxLength={4}
                                required
                                disabled={loading || success}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem',
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    opacity: (loading || success) ? 0.6 : 1
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
                                name="managerName"
                                value={formData.managerName}
                                onChange={handleChange}
                                placeholder="e.g., John Smith"
                                required
                                disabled={loading || success}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem',
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    opacity: (loading || success) ? 0.6 : 1
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                Contact Email
                            </label>
                            <input
                                type="email"
                                name="managerContact"
                                value={formData.managerContact}
                                onChange={handleChange}
                                placeholder="e.g., captain@team.com"
                                required
                                disabled={loading || success}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem',
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    opacity: (loading || success) ? 0.6 : 1
                                }}
                            />
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                                We'll send fixture notifications to this email
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || success}
                            style={{
                                width: '100%',
                                padding: '0.85rem',
                                fontSize: '1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                fontWeight: 600,
                                opacity: (loading || success) ? 0.6 : 1,
                                cursor: (loading || success) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            {loading ? 'Registering...' : 'Register Team'}
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
