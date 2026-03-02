import { Phone, Globe, Shield, Cpu, Code, Layers } from 'lucide-react';

export default function DeveloperFooter() {
    const openWhatsApp = () => {
        window.open(`https://wa.me/5565992859585?text=Olá João Paulo, gostaria de iniciar um projeto tecnológico!`, '_blank');
    };

    return (
        <footer className="dev-footer">
            <div className="container">
                <div className="dev-footer-grid">
                    <div className="dev-brand">
                        <h2>Soluções Tecnológicas</h2>
                        <h3>João Paulo Fernandes</h3>
                        <p className="dev-description">
                            Especialista em transformar complexidade em elegância digital. De sistemas Full Stack a infraestruturas de rede avançadas, entrego tecnologia que impulsiona negócios e simplifica processos.
                        </p>
                        <button className="btn btn-primary" onClick={openWhatsApp}>Iniciar Projeto</button>
                    </div>

                    <div className="dev-expertise">
                        <div className="expertise-item">
                            <h4><Code size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Sistemas Full Stack</h4>
                            <p>Desenvolvimento de aplicações web completas, do banco de dados à interface premium.</p>
                        </div>
                        <div className="expertise-item">
                            <h4><Globe size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Criação de Web Sites</h4>
                            <p>Landing pages e sites institucionais com design responsivo e alta performance.</p>
                        </div>
                        <div className="expertise-item">
                            <h4><Layers size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Redes & Infraestrutura</h4>
                            <p>Redes avançadas, configuração de roteadores, switches e cabeamento estruturado.</p>
                        </div>
                        <div className="expertise-item">
                            <h4><Cpu size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Consultoria de T.I.</h4>
                            <p>Diagnóstico completo e implementação de soluções tecnológicas estratégicas.</p>
                        </div>
                        <div className="expertise-item">
                            <h4><Shield size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Segurança Digital</h4>
                            <p>Proteção de dados e auditoria de infraestrutura para garantir continuidade.</p>
                        </div>
                        <div className="expertise-item">
                            <h4><Code size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Automação</h4>
                            <p>Otimização de processos manuais por meio de scripts e sistemas inteligentes.</p>
                        </div>
                    </div>
                </div>

                <div className="dev-cta">
                    <h4>Vamos elevar o nível da sua tecnologia?</h4>
                    <div className="dev-contact">
                        <span>Atendimento exclusivo em Cuiabá e região.</span>
                        <span style={{ cursor: 'pointer', color: 'var(--color-accent)' }} onClick={openWhatsApp}>
                            <Phone size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> (65) 99285-9585
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
