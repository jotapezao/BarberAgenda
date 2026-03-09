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
                <section style={{ padding: '100px 20px 60px', textAlign: 'center', position: 'relative' }}>
                    <div className="container" style={{ maxWidth: '900px' }}>
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '40px' }}>
                            <div style={{
                                position: 'absolute',
                                inset: '-20px',
                                background: 'linear-gradient(45deg, #D4AF37, #8b5cf6)',
                                borderRadius: '50%',
                                filter: 'blur(30px)',
                                opacity: 0.2,
                                animation: 'pulse 4s infinite'
                            }}></div>
                            <img
                                src="/assets/perfil-dev.png"
                                alt="João Paulo Fernandes"
                                style={{
                                    width: '200px',
                                    height: '200px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    position: 'relative',
                                    border: '4px solid rgba(212, 165, 72, 0.4)',
                                    boxShadow: '0 30px 60px -12px rgba(0,0,0,0.8)',
                                    zIndex: 2
                                }}
                                onError={(e) => {
                                    e.target.src = "https://ui-avatars.com/api/?name=Joao+Paulo&background=D4AF37&color=000&size=200";
                                }}
                            />
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', background: 'rgba(212, 165, 72, 0.08)', border: '1px solid rgba(212, 165, 72, 0.2)', borderRadius: '100px', marginBottom: '32px', backdropFilter: 'blur(10px)' }}>
                            <Zap size={14} style={{ color: '#D4AF37' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: '#D4AF37' }}>Especialista em Soluções de T.I. & Infraestrutura</span>
                        </div>

                        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', fontWeight: 900, marginBottom: '24px', lineHeight: 0.9, letterSpacing: '-3px' }}>
                            João Paulo <br />
                            <span style={{
                                background: 'linear-gradient(to right, #D4AF37, #FFDF73, #D4AF37)',
                                backgroundSize: '200% auto',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'shimmer 4s linear infinite'
                            }}>Fernandes</span>
                        </h1>

                        <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '700px', margin: '0 auto 48px', lineHeight: 1.6, fontWeight: 400 }}>
                            Soluções em T.I., suporte técnico especializado, projetos de rede e infraestrutura robusta. Tudo que sua empresa necessita para crescer com segurança e tecnologia.
                        </p>

                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a href="https://wa.me/5565992859585" target="_blank" rel="noreferrer" className="dev-btn-neon" style={{ borderRadius: '16px', padding: '18px 40px', fontWeight: 700, fontSize: '1rem' }}>
                                <Phone size={20} /> (65) 99285-9585
                            </a>
                            <a href="mailto:jpffs@outlook.com" className="dev-btn-outline" style={{ borderRadius: '16px', padding: '18px 40px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, fontSize: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                                <Mail size={20} /> jpffs@outlook.com
                            </a>
                            <a href="https://instagram.com/jpzaoo" target="_blank" rel="noreferrer" className="dev-btn-outline" style={{ borderRadius: '16px', padding: '18px 40px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, fontSize: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                                <Instagram size={20} /> @jpzaoo
                            </a>
                        </div>
                    </div>
                </section>


                {/* Specialties */}
                <section className="container" style={{ padding: '60px 20px', maxWidth: '1100px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                        {[
                            { icon: <Cpu size={28} />, title: "Soluções em T.I. & Suporte", desc: "Suporte especializado, manutenção preventiva e corretiva, e gestão de sistemas para sua empresa." },
                            { icon: <Network size={28} />, title: "Redes & Infraestrutura", desc: "Projetos de cabeamento, Wi-Fi corporativo de alta performance e configuração de Firewall." },
                            { icon: <Shield size={28} />, title: "Segurança & CFTV", desc: "Projetos completos de monitoramento por câmeras, controle de acesso e segurança eletrônica." }
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
                @keyframes shimmer {
                    0% { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
                .dev-glass-card:hover {
                    background: rgba(255,255,255,0.04) !important;
                    border-color: rgba(212, 165, 72, 0.3) !important;
                    transform: translateY(-8px);
                }
                .dev-btn-neon {
                    display: inline-flex; align-items: center; gap: 10px;
                    background: linear-gradient(135deg, #D4AF37, #B8941F);
                    color: #000; font-weight: 700; text-decoration: none;
                    transition: all 0.3s ease; cursor: pointer; border: none;
                }
                .dev-btn-neon:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 30px rgba(212, 165, 72, 0.3);
                }
                .dev-btn-outline {
                    display: inline-flex; align-items: center; gap: 10px;
                    text-decoration: none; transition: all 0.3s ease; cursor: pointer;
                }
                .dev-btn-outline:hover {
                    background: rgba(255,255,255,0.08) !important;
                    border-color: rgba(212, 165, 72, 0.4) !important;
                    transform: translateY(-3px);
                }
            `}</style>
        </div>
    );
}
