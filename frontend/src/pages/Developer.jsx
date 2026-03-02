import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Instagram, Shield, Cpu, Code, Network, ArrowLeft, ExternalLink, Zap } from 'lucide-react';

export default function Developer() {
    const navigate = useNavigate();

    return (
        <div className="dev-page-dark animate-fade">
            <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '20px 0' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => navigate(-1)} className="dev-btn-outline" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: 1 }}>
                        JP<span className="dev-highlight">Solutions</span>
                    </div>
                </div>
            </nav>

            <main>
                <section className="dev-hero-glow">
                    <div className="container" style={{ maxWidth: 800 }}>
                        <img
                            src="https://via.placeholder.com/400"
                            /* TODO: Substitua pelo caminho real de sua imagem, ex: /assets/joao-perfil.png */
                            alt="João Paulo Fernandes"
                            className="dev-profile-img"
                        />
                        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Zap size={18} color="#8b5cf6" />
                            <span style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 600 }}>Desenvolvedor Full Stack</span>
                            <Zap size={18} color="#3b82f6" />
                        </div>
                        <h1 style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-1px' }}>
                            João Paulo <span className="dev-text-gradient">Fernandes</span>
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '40px', maxWidth: '650px', margin: '0 auto 40px' }}>
                            Transformando complexidade em produtos incrivelmente simples e responsivos através de tecnologias modernas.
                        </p>
                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a href="https://wa.me/5500000000000" target="_blank" rel="noreferrer" className="dev-btn-neon">
                                Iniciar Projeto <ExternalLink size={18} />
                            </a>
                        </div>
                    </div>
                </section>

                <section className="container" style={{ padding: '80px 20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Minhas <span className="dev-text-gradient">Especialidades</span></h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30 }}>

                        <div className="dev-glass-card">
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <Code color="#60a5fa" size={26} />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: 12, fontWeight: 700 }}>Full Stack Web</h3>
                            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>Aplicações dinâmicas e escaláveis utilizando React, Node.js e bancos de dados modernos de alta performance.</p>
                        </div>

                        <div className="dev-glass-card">
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                <Cpu color="#a78bfa" size={26} />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: 12, fontWeight: 700 }}>Sistemas Sob Medida</h3>
                            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>Painéis administrativos robustos, dashboards intuitivos e integrações via API perfeitamente projetadas.</p>
                        </div>

                        <div className="dev-glass-card">
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <Network color="#60a5fa" size={26} />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: 12, fontWeight: 700 }}>Infraestrutura e Redes</h3>
                            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>Configuração otimizada de servidores em nuvem, manutenção de redes e deploy profissional.</p>
                        </div>

                        <div className="dev-glass-card">
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                <Shield color="#a78bfa" size={26} />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: 12, fontWeight: 700 }}>Segurança da Informação</h3>
                            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>Implementação de boas práticas de segurança defensiva, autenticação JWT e rotinas sólidas.</p>
                        </div>
                    </div>
                </section>

                <section id="contato" style={{ padding: '60px 20px 100px', textAlign: 'center' }}>
                    <div className="container" style={{ maxWidth: 900 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 50, letterSpacing: '-0.5px' }}>Vamos Construir Algo?</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
                            <div className="dev-glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 35 }}>
                                <Phone size={32} color="#60a5fa" style={{ marginBottom: 8 }} />
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>WhatsApp</h3>
                                <p style={{ color: '#94a3b8' }}>(00) 00000-0000</p>
                            </div>
                            <div className="dev-glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 35 }}>
                                <Mail size={32} color="#a78bfa" style={{ marginBottom: 8 }} />
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>E-mail</h3>
                                <p style={{ color: '#94a3b8' }}>contato@jpsolutions.com</p>
                            </div>
                            <div className="dev-glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 35 }}>
                                <Instagram size={32} color="#60a5fa" style={{ marginBottom: 8 }} />
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Instagram</h3>
                                <p style={{ color: '#94a3b8' }}>@joaopaulo.dev</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>© 2026 JP Solutions - João Paulo Fernandes. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}
