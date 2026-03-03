import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useToast } from '../components/Toast';
import { Lock, User } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState(localStorage.getItem('saved_username') || '');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('saved_username'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await authApi.login({ username, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user)); // Save user data for role checks

            if (rememberMe) {
                localStorage.setItem('saved_username', username);
            } else {
                localStorage.removeItem('saved_username');
            }

            toast.success(`Bem-vindo, ${data.user.name}!`);
            navigate('/admin');
        } catch (err) {
            setError(err.message || 'Credenciais inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top right, #1a1a1a, #050505)',
            position: 'relative',
            overflow: 'hidden',
            padding: '20px'
        }}>
            {/* Background Decorations */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-5%',
                width: '400px',
                height: '400px',
                background: 'var(--color-accent-subtle)',
                filter: 'blur(100px)',
                borderRadius: '50%',
                zIndex: 0,
                opacity: 0.5
            }}></div>
            <div style={{
                position: 'absolute',
                bottom: '10%',
                left: '-5%',
                width: '300px',
                height: '300px',
                background: 'rgba(212, 165, 72, 0.05)',
                filter: 'blur(80px)',
                borderRadius: '50%',
                zIndex: 0
            }}></div>

            <div className="card login-card" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '40px',
                background: 'rgba(26, 26, 26, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                zIndex: 1,
                borderRadius: '24px',
                animation: 'fadeInUp 0.6s ease-out'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '24px',
                        background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px', color: 'var(--color-bg-primary)',
                        boxShadow: '0 10px 20px rgba(212, 165, 72, 0.2)',
                        transform: 'rotate(-5deg)'
                    }}>
                        <Lock size={32} />
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '2rem',
                        fontWeight: 800,
                        marginBottom: '8px',
                        background: 'linear-gradient(to bottom, #fff, #aaa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>Área Restrita</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Identifique-se para continuar</p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '12px',
                        color: '#ef4444',
                        fontSize: '0.85rem',
                        marginBottom: '24px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ marginBottom: '8px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Usuário</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                                style={{
                                    paddingLeft: '48px',
                                    height: '52px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '14px',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                            <User size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent)' }} />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ marginBottom: '8px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Senha</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    paddingLeft: '48px',
                                    height: '52px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '14px',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                            <Lock size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent)' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent)' }}
                            />
                            Salvar credenciais
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{
                        height: '52px',
                        width: '100%',
                        marginTop: '10px',
                        borderRadius: '14px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        boxShadow: '0 8px 20px rgba(212, 165, 72, 0.25)'
                    }} disabled={loading}>
                        {loading ? 'Validando...' : 'Acessar Painel'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <a href="/" style={{
                        color: 'var(--color-text-muted)',
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'color 0.2s ease'
                    }} onMouseOver={(e) => e.target.style.color = 'var(--color-accent)'} onMouseOut={(e) => e.target.style.color = 'var(--color-text-muted)'}>
                        <span>←</span> Voltar para o site
                    </a>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .form-input:focus {
                    background: rgba(255, 255, 255, 0.05) !important;
                    border-color: var(--color-accent) !important;
                    box-shadow: 0 0 0 4px rgba(212, 165, 72, 0.1) !important;
                }
            `}</style>
        </div>
    );
}
