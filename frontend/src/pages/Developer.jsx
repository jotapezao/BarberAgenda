import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Instagram, Shield, Cpu, Code, Network, ArrowLeft, ExternalLink, Zap, Github, Globe, Server, CheckCircle2, Star, Target } from 'lucide-react';

export default function Developer() {
    const navigate = useNavigate();

    return (
        <div className="dev-page-dark" style={{
            background: '#030303',
            minHeight: '100vh',
            color: '#fff',
            fontFamily: "'Outfit', sans-serif",
            overflowX: 'hidden'
        }}>
            {/* Ultra Premium Animated Background */}
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: `#030303`,
                zIndex: 0,
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-10%', left: '-10%', width: '40%', height: '40%',
                    background: 'radial-gradient(circle, rgba(212, 165, 72, 0.08) 0%, transparent 70%)',
                    filter: 'blur(100px)',
                    animation: 'floatBG 20s infinite alternate'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '-10%', right: '-10%', width: '40%', height: '40%',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
                    filter: 'blur(100px)',
                    animation: 'floatBG 15s infinite alternate-reverse'
                }}></div>
            </div>

            <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(3, 3, 3, 0.8)', backdropFilter: 'blur(25px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="container" style={{ height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => navigate(-1)} className="dev-btn-outline" style={{ border: 'none', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ArrowLeft size={18} /> <span style={{ fontWeight: 500 }}>Voltar ao Site</span>
                    </button>
                    <div style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 35, height: 35, background: 'var(--color-accent, #D4AF37)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900 }}>JP</div>
                        JOÃO<span style={{ color: '#D4AF37' }}>PAULO</span>
                    </div>
                </div>
            </nav>

            <main style={{ position: 'relative', zIndex: 1 }}>
                {/* Hero Section */}
                <section style={{ padding: '120px 20px 80px', textAlign: 'center' }}>
                    <div className="container" style={{ maxWidth: '1000px' }}>
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '40px' }}>
                            <div className="profile-glow"></div>
                            <img
                                src="/assets/perfil-dev.png"
                                alt="João Paulo Fernandes"
                                style={{
                                    width: '220px',
                                    height: '220px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    position: 'relative',
                                    border: '6px solid rgba(212, 165, 72, 0.3)',
                                    boxShadow: '0 40px 80px -20px rgba(0,0,0,0.9)',
                                    zIndex: 2,
                                    background: '#111'
                                }}
                                onError={(e) => {
                                    e.target.src = "https://ui-avatars.com/api/?name=Joao+Paulo&background=D4AF37&color=000&size=220&bold=true";
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: '15px', right: '15px',
                                width: '45px', height: '45px',
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '4px solid #030303',
                                zIndex: 3,
                                boxShadow: '0 10px 20px rgba(34, 197, 94, 0.3)'
                            }}>
                                <Zap size={22} fill="white" color="white" />
                            </div>
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'rgba(212, 165, 72, 0.05)', border: '1px solid rgba(212, 165, 72, 0.15)', borderRadius: '100px', marginBottom: '40px', backdropFilter: 'blur(10px)' }}>
                            <div className="status-dot"></div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#D4AF37' }}>Disponível para Projetos de T.I.</span>
                        </div>

                        <h1 style={{ fontSize: 'clamp(3.5rem, 12vw, 6rem)', fontWeight: 900, marginBottom: '24px', lineHeight: 0.85, letterSpacing: '-4px' }}>
                            Soluções que <br />
                            <span style={{
                                background: 'linear-gradient(to right, #D4AF37, #FFD700, #B8860B)',
                                backgroundSize: '200% auto',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'shimmer 4s linear infinite'
                            }}>Impulsionam.</span>
                        </h1>

                        <p style={{ fontSize: '1.4rem', color: '#94a3b8', maxWidth: '800px', margin: '0 auto 56px', lineHeight: 1.5, fontWeight: 400 }}>
                            Olá, eu sou <strong>João Paulo Fernandes</strong>. Entrego infraestrutura de elite e suporte técnico especializado para elevar o nível tecnológico da sua empresa.
                        </p>

                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a href="https://wa.me/5565992859585" target="_blank" rel="noreferrer" className="dev-btn-neon" style={{ borderRadius: '18px', padding: '20px 45px', fontWeight: 800, fontSize: '1.1rem' }}>
                                <Phone size={22} /> Contato via WhatsApp
                            </a>
                            <a href="mailto:jpffs@outlook.com" className="dev-btn-outline" style={{ borderRadius: '18px', padding: '20px 45px', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 700, fontSize: '1.1rem', background: 'rgba(255,255,255,0.02)' }}>
                                <Mail size={22} /> jpffs@outlook.com
                            </a>
                        </div>
                    </div>
                </section>

                {/* Specialties - High End Cards */}
                <section className="container" style={{ padding: '60px 20px 100px', maxWidth: '1200px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                        {[
                            {
                                icon: <Cpu size={32} />,
                                title: "Infraestrutura & Redes",
                                desc: "Desenho e execução de redes corporativas estáveis. Wi-Fi 6, cabeamento estruturado e otimização de largura de banda.",
                                list: ["Roteadores & Switches", "Firewalls de Rede", "VPN Corporativa"]
                            },
                            {
                                icon: <Shield size={32} />,
                                title: "Segurança & CFTV",
                                desc: "Monitoramento inteligente e segurança eletrônica completa para proteção patrimonial e de dados.",
                                list: ["Câmeras IP 4K", "Backup em Nuvem", "Controle de Acesso"]
                            },
                            {
                                icon: <Globe size={32} />,
                                title: "Desenvolvimento Web",
                                desc: "Criação de sistemas web sob medida, landing pages de alta conversão e soluções de gestão digital.",
                                list: ["React & Node.js", "Integração via APIs", "UX/UI Design"]
                            }
                        ].map((item, i) => (
                            <div key={i} className="dev-premium-card" style={{
                                padding: '50px 40px',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                                borderRadius: '32px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}>
                                <div style={{ color: '#D4AF37', marginBottom: '30px', background: 'rgba(212, 165, 72, 0.1)', width: '70px', height: '70px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {item.icon}
                                </div>
                                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '20px', color: '#fff' }}>{item.title}</h3>
                                <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '30px' }}>{item.desc}</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {item.list.map((tag, j) => (
                                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#64748b' }}>
                                            <CheckCircle2 size={16} color="#D4AF37" /> <span>{tag}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Experience & Trust */}
                <section style={{ padding: '100px 20px', background: 'rgba(212, 165, 72, 0.02)', position: 'relative' }}>
                    <div className="container" style={{ maxWidth: '1000px', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '60px' }}>Qualidade que gera <span>Confiança</span></h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
                            <div className="stat-item">
                                <div className="stat-value">50+</div>
                                <div className="stat-label">Projetos Entregues</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">100%</div>
                                <div className="stat-label">Satisfação Clientes</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">24/7</div>
                                <div className="stat-label">Monitoramento Ativo</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final Call to Action */}
                <section style={{ padding: '120px 20px', textAlign: 'center' }}>
                    <div className="container" style={{ maxWidth: '800px' }}>
                        <div className="cta-box" style={{
                            padding: '80px 40px',
                            background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
                            borderRadius: '40px',
                            border: '1px solid rgba(212, 165, 72, 0.2)',
                            boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)'
                        }}>
                            <h2 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '20px' }}>Precisa de <span style={{ color: '#D4AF37' }}>Soluções Reais</span>?</h2>
                            <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '40px' }}>Vamos conversar sobre como a tecnologia pode otimizar seu negócio.</p>
                            <a href="https://wa.me/5565992859585" target="_blank" rel="noreferrer" className="dev-btn-neon" style={{ borderRadius: '18px', padding: '22px 60px', fontWeight: 900 }}>
                                <ExternalLink size={20} /> Iniciar Conversa
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <footer style={{ padding: '80px 20px', textAlign: 'center', background: '#030303' }}>
                <div style={{ opacity: 0.4, fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <a href="https://instagram.com/jpzaoo" target="_blank" rel="noreferrer" style={{ color: '#fff' }}><Instagram size={22} /></a>
                        <a href="mailto:jpffs@outlook.com" style={{ color: '#fff' }}><Mail size={22} /></a>
                    </div>
                    <p>© 2026 João Paulo Fernandes • IT Solutions Specialist</p>
                </div>
            </footer>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap');
                
                @keyframes floatBG {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(5%, 5%) scale(1.1); }
                }
                @keyframes shimmer {
                    0% { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
                .profile-glow {
                    position: absolute; inset: -30px;
                    background: radial-gradient(circle, rgba(212, 165, 72, 0.2) 0%, transparent 70%);
                    border-radius: 50%; z-index: 1; animation: pulse 6s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 0.5; }
                }
                .status-dot {
                    width: 10px; height: 10px; background: #22c55e; border-radius: 50%;
                    box-shadow: 0 0 10px #22c55e; animation: blink 2s infinite;
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                .dev-premium-card:hover {
                    background: rgba(255,255,255,0.06) !important;
                    border-color: rgba(212, 165, 72, 0.4) !important;
                    transform: translateY(-12px);
                    box-shadow: 0 30px 60px -15px rgba(0,0,0,0.5);
                }
                .dev-btn-neon {
                    display: inline-flex; align-items: center; gap: 12px;
                    background: linear-gradient(135deg, #D4AF37, #B8941F);
                    color: #000; font-weight: 800; text-decoration: none;
                    box-shadow: 0 10px 20px rgba(212, 165, 72, 0.2);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .dev-btn-neon:hover {
                    transform: scale(1.05) translateY(-5px);
                    box-shadow: 0 20px 40px rgba(212, 165, 72, 0.4);
                }
                .dev-btn-outline {
                    display: inline-flex; align-items: center; gap: 12px;
                    text-decoration: none; transition: all 0.3s ease;
                }
                .stat-value { font-size: 3rem; font-weight: 900; color: #D4AF37; margin-bottom: 10px; }
                .stat-label { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; color: #64748b; }
                
                @media (max-width: 768px) {
                    h1 { font-size: 3.5rem !important; }
                    .cta-box { border-radius: 0; padding: 60px 20px; }
                }
            `}</style>
        </div>
    );
}

