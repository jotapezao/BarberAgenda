import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Instagram, Shield, Cpu, Code, Network, ArrowLeft, ExternalLink, Zap, Github, Globe } from 'lucide-react';

export default function Developer() {
    const navigate = useNavigate();

    return (
        <div className="dev-page-dark" style={{
            background: '#030303',
            minHeight: '100vh',
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            overflowX: 'hidden'
        }}>
            {/* Ambient Background */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                    radial-gradient(circle at 20% 30%, rgba(212, 165, 72, 0.05) 0%, transparent 40%),
                    radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.03) 0%, transparent 40%)
                `,
                zIndex: 0,
                pointerEvents: 'none'
            }}></div>

            <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(3, 3, 3, 0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="container" style={{ height: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => navigate(-1)} className="dev-btn-outline" style={{ border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <ArrowLeft size={18} /> <span>Voltar</span>
                    </button>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '1px' }}>
                        JOÃO<span style={{ color: '#D4AF37' }}>PAULO</span>
                    </div>
                </div>
            </nav>

            <main style={{ position: 'relative', zIndex: 1 }}>
                {/* Hero Section */}
                <section style={{ padding: '80px 20px 40px', textAlign: 'center' }}>
                    <div className="container" style={{ maxWidth: '900px' }}>
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '40px' }}>
                            <div style={{
                                position: 'absolute',
                                inset: '-10px',
                                background: 'linear-gradient(45deg, #D4AF37, #8b5cf6)',
                                borderRadius: '50%',
                                filter: 'blur(15px)',
                                opacity: 0.3,
                                animation: 'pulse 3s infinite'
                            }}></div>
                            <img
                                src="/assets/perfil-dev.png" /* O usuário deve colocar a foto aqui */
                                alt="João Paulo Fernandes"
                                style={{
                                    width: '180px',
                                    height: '180px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    position: 'relative',
                                    border: '3px solid #D4AF37',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                                }}
                                onError={(e) => {
                                    e.target.src = "https://ui-avatars.com/api/?name=Joao+Paulo&background=D4AF37&color=000&size=200";
                                }}
                            />
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(212, 165, 72, 0.1)', border: '1px solid rgba(212, 165, 72, 0.2)', borderRadius: '100px', marginBottom: '24px' }}>
                            <Zap size={14} style={{ color: '#D4AF37' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#D4AF37' }}>Full Stack Engineer</span>
                        </div>

                        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900, marginBottom: '24px', lineHeight: 1, letterSpacing: '-2px' }}>
                            João Paulo <span style={{
                                background: 'linear-gradient(to right, #D4AF37, #FFDF73)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>Fernandes</span>
                        </h1>

                        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '650px', margin: '0 auto 40px', lineHeight: 1.6 }}>
                            Desenvolvedor focado em criar experiências digitais de alto impacto, unindo design premium a uma infraestrutura robusta e escalável.
                        </p>

                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a href="https://wa.me/5500000000000" target="_blank" rel="noreferrer" className="dev-btn-neon" style={{ borderRadius: '12px', padding: '16px 32px' }}>
                                <Globe size={20} /> Solicitar Orçamento
                            </a>
                            <a href="#" className="dev-btn-outline" style={{ borderRadius: '12px', padding: '16px 32px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Instagram size={20} /> Instagram
                            </a>
                        </div>
                    </div>
                </section>

                {/* Specialties */}
                <section className="container" style={{ padding: '60px 20px', maxWidth: '1100px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                        {[
                            { icon: <Code size={28} />, title: "Desenvolvimento Web", desc: "Sistemas modernos, rápidos e focados em conversão, utilizando as melhores tecnologias do mercado." },
                            { icon: <Cpu size={28} />, title: "Backend & APIs", desc: "Arquiteturas escaláveis e APIs seguras para integrar seu negócio a qualquer plataforma." },
                            { icon: <Shield size={28} />, title: "Segurança & Cloud", desc: "Deploy profissional em nuvem (Railway/AWS) com as melhores práticas de proteção de dados." }
                        ].map((item, i) => (
                            <div key={i} className="dev-glass-card" style={{
                                padding: '40px',
                                textAlign: 'left',
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(255,255,255,0.02)',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{ color: '#D4AF37', marginBottom: '20px' }}>{item.icon}</div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px' }}>{item.title}</h3>
                                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Status Section */}
                <section style={{ padding: '60px 20px', background: 'rgba(212, 165, 72, 0.02)' }}>
                    <div className="container" style={{ textAlign: 'center' }}>
                        <div style={{
                            display: 'inline-flex',
                            padding: '30px 60px',
                            background: 'rgba(3, 3, 3, 0.4)',
                            border: '1px solid rgba(212, 165, 72, 0.15)',
                            borderRadius: '24px',
                            gap: '40px',
                            flexWrap: 'wrap',
                            justifyContent: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D4AF37' }}>50+</div>
                                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b' }}>Projetos</div>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D4AF37' }}>4+</div>
                                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b' }}>Anos Exp.</div>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D4AF37' }}>100%</div>
                                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b' }}>Foco</div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer style={{ padding: '60px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>© 2026 João Paulo Fernandes. Todos os direitos reservados.</p>
            </footer>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.05); opacity: 0.4; }
                    100% { transform: scale(1); opacity: 0.3; }
                }
                .dev-glass-card:hover {
                    background: rgba(255,255,255,0.04) !important;
                    border-color: rgba(212, 165, 72, 0.3) !important;
                    transform: translateY(-8px);
                }
            `}</style>
        </div>
    );
}
