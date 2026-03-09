import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Instagram, Globe, ArrowLeft, Zap, Shield, Cpu, Network, CheckCircle2 } from 'lucide-react';

export default function Developer() {
    const navigate = useNavigate();

    return (
        <div className="dev-page" style={{
            background: '#030303',
            minHeight: '100vh',
            color: '#fff',
            fontFamily: "'Outfit', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            {/* Ambient background effect */}
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'radial-gradient(circle at 50% 0%, rgba(212, 165, 72, 0.1) 0%, transparent 50%)',
                zIndex: 0,
                pointerEvents: 'none'
            }}></div>

            <nav style={{ width: '100%', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '10px 15px', borderRadius: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <ArrowLeft size={18} /> Voltar
                </button>
                <div style={{ fontWeight: 800, letterSpacing: '2px', color: '#D4AF37' }}>JP SOLUTIONS</div>
            </nav>

            <main style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '800px', padding: '40px 20px', textAlign: 'center' }}>
                {/* Simplified Hero */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '30px' }}>
                        <div style={{
                            position: 'absolute',
                            inset: '-15px',
                            background: 'rgba(212, 165, 72, 0.15)',
                            borderRadius: '50%',
                            filter: 'blur(20px)',
                            animation: 'pulse 4s infinite'
                        }}></div>
                        <img
                            src="/assets/perfil-dev.png"
                            alt="João Paulo Fernandes"
                            style={{
                                width: '180px',
                                height: '180px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '4px solid #D4AF37',
                                position: 'relative',
                                zIndex: 2,
                                background: '#111'
                            }}
                            onError={(e) => {
                                e.target.src = "https://ui-avatars.com/api/?name=Joao+Paulo&background=D4AF37&color=000&size=180&bold=true";
                            }}
                        />
                    </div>

                    <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '10px', letterSpacing: '-2px' }}>João Paulo Fernandes</h1>
                    <div style={{ color: '#D4AF37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', marginBottom: '20px' }}>
                        Especialista em T.I. & Infraestrutura
                    </div>

                    <p style={{ color: '#94a3b8', fontSize: '1.2rem', lineHeight: 1.6, marginBottom: '40px' }}>
                        Soluções tecnológicas completas para sua empresa. Do suporte especializado à infraestrutura de rede e segurança eletrônica.
                    </p>

                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
                        <a href="https://wa.me/5565992859585" target="_blank" rel="noreferrer" style={{ background: '#D4AF37', color: '#000', padding: '15px 30px', borderRadius: '14px', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Phone size={20} /> WhatsApp
                        </a>
                        <a href="mailto:jpffs@outlook.com" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '15px 30px', borderRadius: '14px', fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Mail size={20} /> Email
                        </a>
                    </div>
                </div>

                {/* Summarized Services */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', textAlign: 'left' }}>
                    {[
                        { icon: <Cpu color="#D4AF37" />, title: "Suporte Técnico", desc: "Manutenção de hardware e sistemas." },
                        { icon: <Network color="#D4AF37" />, title: "Redes & Wi-Fi", desc: "Infraestrutura robusta e segura." },
                        { icon: <Shield color="#D4AF37" />, title: "Segurança & CFTV", desc: "Monitoramento e proteção total." }
                    ].map((s, i) => (
                        <div key={i} style={{ padding: '30px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ marginBottom: '15px' }}>{s.icon}</div>
                            <h3 style={{ marginBottom: '10px' }}>{s.title}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            <footer style={{ marginTop: 'auto', padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '15px' }}>
                    <a href="https://instagram.com/jpzaoo" target="_blank" rel="noreferrer" style={{ color: '#fff' }}><Instagram size={20} /></a>
                    <a href="#" style={{ color: '#fff' }}><Globe size={20} /></a>
                </div>
                <p style={{ fontSize: '0.8rem' }}>© 2026 JP Solutions • Todos os direitos reservados</p>
            </footer>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}

