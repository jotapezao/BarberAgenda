import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { publicApi, BASE_URL } from '../api';
import { useToast } from '../components/Toast';
import { Calendar, Clock, User, Phone, CheckCircle, Instagram, MapPin, ChevronRight, Menu, X, Scissors, Star, Trash2 } from 'lucide-react';
import WhatsAppButton from '../components/WhatsAppButton';
import { maskPhone, unmask } from '../utils/mask';


export default function Home() {
    const [services, setServices] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [siteConfig, setSiteConfig] = useState({});
    const [loading, setLoading] = useState(true);
    const [bookingStep, setBookingStep] = useState(1);
    const [isReturning, setIsReturning] = useState(false);
    const [formData, setFormData] = useState({ client_name: '', client_whatsapp: '', client_birth_date: '', service_id: '', barber_id: '', date: '', time: '' });
    const [slots, setSlots] = useState([]);
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeBanner, setActiveBanner] = useState(0);
    const [scrolled, setScrolled] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelData, setCancelData] = useState({ id: '', whatsapp: '' });
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewStep, setReviewStep] = useState(1);
    const [reviewWhatsApp, setReviewWhatsApp] = useState('');
    const [lastVisit, setLastVisit] = useState(null);
    const [reviewRating, setReviewRating] = useState(10);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [publicReviews, setPublicReviews] = useState([]);

    const toast = useToast();

    useEffect(() => {
        loadData();
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const loadData = async () => {
        try {
            const [svcData, bbrData, config] = await Promise.all([
                publicApi.getServices(),
                publicApi.getBarbers(),
                publicApi.getSiteConfig()
            ]);
            setServices(svcData);
            setBarbers(bbrData);
            setSiteConfig(config);
            setLoading(false);
            loadPublicReviews();
        } catch (err) { toast.error('Erro ao carregar dados'); }
    };

    const loadPublicReviews = async () => {
        try {
            const data = await publicApi.getPublicReviews();
            setPublicReviews(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveBanner(prev => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleWhatsAppSubmit = async (e) => {
        e.preventDefault();
        try {
            const cleanPhone = unmask(formData.client_whatsapp);
            const client = await publicApi.checkClient(cleanPhone);
            if (client) {
                setFormData(prev => ({ ...prev, client_whatsapp: cleanPhone, client_name: client.name, client_birth_date: client.birth_date || '' }));
                setIsReturning(true);
                setBookingStep(3);
                toast.success(`Olá ${client.name}, seja bem-vindo de volta!`);
            } else {
                setFormData(prev => ({ ...prev, client_whatsapp: cleanPhone }));
                setIsReturning(false);
                setBookingStep(2);
            }
        } catch (err) { toast.error('Erro ao verificar cliente'); }
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, client_whatsapp: unmask(formData.client_whatsapp) };
            const result = await publicApi.createAppointment(payload);
            setBookingSuccess(result);
            toast.success('Agendamento realizado! 🎉');
        } catch (err) { toast.error(err.message); }
    };

    const handleCancelAppointment = async (e) => {
        e.preventDefault();
        try {
            if (!cancelData.id || !cancelData.whatsapp) return toast.error('Preencha todos os campos');
            await publicApi.cancelAppointment(cancelData.id, cancelData.whatsapp);
            toast.success('Agendamento cancelado com sucesso');
            setShowCancelModal(false);
            setCancelData({ id: '', whatsapp: '' });
        } catch (err) { toast.error(err.message); }
    };

    const handleSearchVisit = async (e) => {
        e.preventDefault();
        try {
            const cleanPhone = unmask(reviewWhatsApp);
            const visit = await publicApi.getLastVisit(cleanPhone);
            if (visit) {
                setLastVisit(visit);
                setReviewStep(2);
            } else {
                toast.error('Nenhum atendimento finalizado encontrado para este número.');
            }
        } catch (err) { toast.error('Erro ao buscar atendimento'); }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            await publicApi.submitReview({
                appointment_id: lastVisit.id,
                rating: reviewRating,
                comment: reviewComment
            });
            setReviewSuccess(true);
            setReviewStep(3);
        } catch (err) { toast.error('Erro ao enviar avaliação'); }
    };

    const loadSlots = async (date, svcId, barbId) => {
        if (!date || !svcId) return;
        try {
            const result = await publicApi.getAvailableSlots(date, svcId, barbId);
            setSlots(result.slots || []);
            if (result.message && (!result.slots || result.slots.length === 0)) {
                toast.info(result.message);
            }
        } catch (err) { toast.error('Erro ao carregar horários'); }
    };

    const formatPrice = (p) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p || 0);

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    const banners = [
        { title: siteConfig.banner_title_1 || 'Estilo e Atitude', subtitle: siteConfig.banner_subtitle_1 || 'Sua melhor versão começa aqui.', image: siteConfig.banner_image_1 },
        { title: siteConfig.banner_title_2 || 'Agendamento Online', subtitle: siteConfig.banner_subtitle_2 || 'Prático, rápido e seguro.', image: siteConfig.banner_image_2 },
        { title: siteConfig.banner_title_3 || 'Qualidade Premium', subtitle: siteConfig.banner_subtitle_3 || 'Os melhores profissionais da região.', image: siteConfig.banner_image_3 },
    ].filter(b => b.title || b.image);

    const isPromoActive = siteConfig.promotion_active === 'true';

    return (
        <div className="home-wrapper">
            {isPromoActive && (
                <div className="promotion-bar">
                    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15 }}>
                        <span className="promo-badge">{siteConfig.promotion_badge}</span>
                        <span>{siteConfig.promotion_title}: <strong>{siteConfig.promotion_text}</strong></span>
                        <a href="#booking" style={{ fontWeight: 800, textDecoration: 'underline' }}>Aproveitar 🔥</a>
                    </div>
                </div>
            )}
            <header className={`site-header ${scrolled ? 'fixed-top' : ''}`} style={{ top: isPromoActive && !scrolled ? 'auto' : 0 }}>
                <nav className="navbar">
                    <div className="container navbar-inner">
                        <div className="navbar-logo" onClick={() => window.scrollTo(0, 0)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 15 }}>
                            {siteConfig.site_logo && (
                                <img src={`${BASE_URL}${siteConfig.site_logo}`} alt={siteConfig.site_name} style={{ height: scrolled ? 52 : 70, width: scrolled ? 52 : 70, borderRadius: '50%', objectFit: 'cover', transition: 'all 0.3s ease' }} />
                            )}
                            <div className="logo-text" style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: scrolled ? '1.2rem' : '1.5rem', fontWeight: 900, lineHeight: 1, letterSpacing: '0.5px', textTransform: 'uppercase', transition: 'all 0.3s ease' }}>
                                    {siteConfig.site_name || 'Magno Barber'}
                                </span>
                                {siteConfig.site_slogan && !scrolled && (
                                    <span style={{ fontSize: '0.65rem', color: 'var(--color-accent)', opacity: 0.9, marginTop: 2, letterSpacing: '1px' }}>
                                        {siteConfig.site_slogan}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className={`navbar-overlay ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)} />
                        <ul className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
                            <li><a href="#services" onClick={() => setIsMenuOpen(false)}>Serviços</a></li>
                            <li><Link to="/booking" onClick={() => setIsMenuOpen(false)}>Agendar</Link></li>

                            <li><a href="#about" onClick={() => setIsMenuOpen(false)}>Nossa História</a></li>
                            <li><a href="#location" onClick={() => setIsMenuOpen(false)}>Onde Estamos</a></li>
                            <li className="mobile-only"><button className="btn btn-outline btn-sm" onClick={() => { setShowCancelModal(true); setIsMenuOpen(false); }} style={{ width: '100%', marginTop: 10 }}>Cancelar Agendamento</button></li>
                            <li className="mobile-only"><a href="/admin" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 8, textAlign: 'center' }}>Acesso Restrito</a></li>
                        </ul>

                        <div className="navbar-actions desk-only">
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowCancelModal(true)}>Cancelar</button>
                            <a href="/admin" className="btn btn-primary btn-sm">Painel Barber</a>
                        </div>

                        <button className="navbar-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}>
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </nav>
            </header>

            <header className="hero">
                {banners.map((banner, i) => {
                    const btnText = siteConfig[`banner_btn_text_${i + 1}`] || 'Agendar Agora';
                    const btnAction = siteConfig[`banner_action_${i + 1}`] || 'booking';

                    let actionHref = "/booking";

                    let target = "_self";
                    if (btnAction === 'whatsapp') {
                        const cleanPhone = (siteConfig.phone || '').replace(/\D/g, '');
                        const phoneFull = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                        actionHref = `https://wa.me/${phoneFull}?text=Olá! Vim pelo site e gostaria de conversar.`;
                        target = "_blank";
                    } else if (btnAction === 'location') {
                        actionHref = "#location";
                    }

                    return (
                        <div key={i} className={`hero-slide ${activeBanner === i ? 'active' : ''}`} style={banner.image ? { backgroundImage: `url(${BASE_URL}${banner.image})` } : {}}>
                            <div className={`container hero-content ${activeBanner === i ? 'animate-fade' : ''}`}>
                                <span className="hero-badge">{siteConfig.site_slogan || 'Estilo e atitude em cada corte'}</span>
                                <h1>{banner.title}</h1>
                                <p>{banner.subtitle}</p>
                                <div className="hero-buttons">
                                    {btnAction === 'booking' ? (
                                        <Link to="/booking" className="btn btn-primary btn-lg" style={{ fontSize: '1.25rem', padding: '18px 42px', transform: 'scale(1.15)', transition: 'all 0.3s ease' }}>{btnText}</Link>
                                    ) : (
                                        <a href={actionHref} target={target} className="btn btn-primary btn-lg" style={{ fontSize: '1.25rem', padding: '18px 42px', transform: 'scale(1.15)', transition: 'all 0.3s ease' }}>{btnText}</a>
                                    )}

                                </div>
                            </div>
                        </div>
                    );
                })}
                <div className="banner-dots">
                    {banners.map((_, i) => (
                        <button key={i} className={`dot ${activeBanner === i ? 'active' : ''}`} onClick={() => setActiveBanner(i)} />
                    ))}
                </div>
            </header>

            <section id="services" className="section container">
                <div className="section-header">
                    <h2>Nossos <span>Serviços</span></h2>
                    <p>Profissionalismo e técnica em todos os detalhes</p>
                </div>
                <div className="services-grid">
                    {services.map(svc => (
                        <div key={svc.id} className="card card-glass service-card fade-up" style={{ padding: 0, overflow: 'hidden' }}>
                            {svc.image_url ? (
                                <div style={{ height: 200, overflow: 'hidden' }}>
                                    <img src={`${BASE_URL}${svc.image_url}`} alt={svc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ) : (
                                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-secondary)' }}>
                                    <Scissors size={40} className="text-accent" style={{ opacity: 0.3 }} />
                                </div>
                            )}
                            <div style={{ padding: 24 }}>
                                <h3 style={{ marginBottom: 8 }}>{svc.name}</h3>
                                <p className="text-secondary" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Clock size={14} /> {svc.duration} minutos
                                </p>
                                <div className="service-price" style={{ marginTop: 16 }}>{formatPrice(svc.price)}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 50 }}>
                    <button className="btn btn-primary btn-lg fade-up"
                        onClick={() => setShowReviewModal(true)}
                        style={{
                            boxShadow: '0 0 20px var(--color-accent-glow)',
                            border: '2px solid var(--color-accent)',
                            fontWeight: 800
                        }}
                    >
                        <Star size={20} style={{ marginRight: 10 }} /> Críticas ou Elogios? Avalie-nos
                    </button>
                </div>
            </section>

            <section id="booking-cta" className="section bg-secondary">
                <div className="container" style={{ textAlign: 'center' }}>
                    <div className="card card-glass" style={{ padding: '60px 40px', maxWidth: 800, margin: '0 auto', border: '1px solid var(--color-accent-glow)' }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: 20 }}>Pronto para seu <span>Novo Visual?</span></h2>
                        <p className="text-secondary" style={{ fontSize: '1.2rem', marginBottom: 40 }}>Agende agora mesmo seu horário de forma rápida e prática.</p>
                        <Link to="/booking" className="btn btn-primary btn-lg" style={{ padding: '20px 50px', fontSize: '1.3rem' }}>
                            Agendar Agora <ChevronRight size={24} style={{ marginLeft: 10 }} />
                        </Link>
                    </div>
                </div>
            </section>


            <section id="about" className="section container" style={{ paddingBottom: 80 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
                    <div className="card card-glass animate-fade" style={{ padding: '50px 40px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', borderRadius: '24px' }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: 20, fontFamily: 'var(--font-display)', fontWeight: 800 }}>{siteConfig.about_title || 'Nossa História'}</h2>
                        <p className="text-secondary" style={{ fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 25 }}>
                            {siteConfig.about_text || 'Fundada com o propósito de elevating a autoestima masculina, nossa barbearia combina tradição e modernidade. Cada detalhe foi pensado para proporcionar conforto e resultados impecáveis.'}
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}><CheckCircle size={16} className="text-accent" /> Profissionais Elite</li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}><CheckCircle size={16} className="text-accent" /> Ambiente Premium</li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}><CheckCircle size={16} className="text-accent" /> Café & Drinks</li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}><CheckCircle size={16} className="text-accent" /> Agendamento Online</li>
                        </ul>
                    </div>
                    <div className="about-visual" style={{ position: 'relative' }}>
                        <div className="card-glass" style={{ width: '100%', aspectRatio: '1/1', borderRadius: '30px', overflow: 'hidden', transform: 'rotate(3deg)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
                            {siteConfig.banner_image_1 ? (
                                <img src={`${BASE_URL}${siteConfig.banner_image_1}`} alt="Sobre" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, var(--color-bg-secondary), var(--color-accent-subtle))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Scissors size={80} className="text-accent" style={{ opacity: 0.2 }} />
                                </div>
                            )}
                        </div>
                        <div className="card" style={{ position: 'absolute', bottom: -20, left: -20, padding: '20px', background: 'var(--color-accent)', color: '#000', borderRadius: '15px', transform: 'rotate(-5deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', fontWeight: 800 }}>
                            <Star size={24} style={{ marginBottom: 5 }} />
                            <div style={{ fontSize: '1.2rem' }}>10+ Anos</div>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>De Excelência</div>
                        </div>
                    </div>
                </div>
            </section>

            {publicReviews.length > 0 && (
                <section className="section bg-secondary" style={{ overflow: 'hidden' }}>
                    <div className="container">
                        <div className="section-header">
                            <h2>O que nossos <span>Clientes dizem</span></h2>
                            <p>A opinião de quem confia no nosso trabalho</p>
                        </div>
                        <div className="testimonials-grid" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '20px 5px 40px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                            {publicReviews.map(rev => (
                                <div key={rev.id} className="card card-glass testimonial-card" style={{
                                    minWidth: 320,
                                    flex: 1,
                                    scrollSnapAlign: 'start',
                                    padding: '30px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80, background: 'var(--color-accent-subtle)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.3 }}></div>
                                    <div style={{ display: 'flex', gap: 3, marginBottom: 15 }}>
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} fill={i < (rev.rating / 2) ? "var(--color-accent)" : "none"} stroke="var(--color-accent)" />
                                        ))}
                                    </div>
                                    <p style={{ fontStyle: 'italic', marginBottom: 25, fontSize: '1.05rem', lineHeight: 1.6, color: '#fff' }}>"{rev.comment}"</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 15, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 15 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>{rev.client_name.charAt(0)}</div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-accent)' }}>{rev.client_name}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>{rev.service_info}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section id="location" className="section bg-secondary">
                <div className="container">
                    <div className="section-header" style={{ marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem' }}>Onde nos <span>Encontrar</span></h2>
                        <p>Visite nossa unidade ou entre em contato pelos nossos canais oficiais</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 30 }}>
                        <div className="card card-glass fade-up" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: 30 }}>
                            <div className="contact-item" style={{ display: 'flex', gap: 20 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                                    <MapPin size={28} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.2rem', marginBottom: 5 }}>Endereço VIP</h4>
                                    <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                                        {siteConfig.address || 'Rua Exemplo, 123'}<br />
                                        {siteConfig.city || 'Barra do Garças - MT'}
                                    </p>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.address + ', ' + siteConfig.city)}`} target="_blank" rel="noreferrer" className="text-accent" style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 10, display: 'inline-block' }}>Ver no Google Maps →</a>
                                </div>
                            </div>

                            <div className="contact-item" style={{ display: 'flex', gap: 20 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                                    <Phone size={28} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.2rem', marginBottom: 5 }}>Canais de Atendimento</h4>
                                    <p className="text-secondary">Fale conosco pelo WhatsApp:</p>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '8px 0', color: '#fff' }}>65 99285-9585</div>
                                    <a href={`https://wa.me/5565992859585`} target="_blank" rel="noreferrer" className="btn btn-success btn-sm" style={{ marginTop: 10 }}>
                                        <Phone size={16} /> Abrir Chat Agora
                                    </a>

                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <h5 style={{ marginBottom: 15, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-muted)' }}>Horário de Funcionamento</h5>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span className="text-secondary">Segunda - Sábado</span>
                                    <span style={{ fontWeight: 700 }}>{siteConfig.open_time || '08:00'} - {siteConfig.close_time || '19:00'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.5 }}>
                                    <span className="text-secondary">Domingo</span>
                                    <span style={{ fontWeight: 700 }}>Fechado</span>
                                </div>
                            </div>
                        </div>

                        <div className="card card-glass fade-up" style={{ padding: 10, minHeight: 400, overflow: 'hidden' }}>
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3844.463138356942!2d-52.26189912411926!3d-15.88478472535032!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x937072cc2193e25b%3A0x6b6e4e5e4e5e4e5e!2zQmFycmEgZG8gR2Fyw6dhcyAtIE1U!5e0!3m2!1spt-BR!2sbr!4v1709999999999!5m2!1spt-BR!2sbr"
                                width="100%"
                                height="100%"
                                style={{ border: 0, borderRadius: 15, filter: 'grayscale(0.3) contrast(1.1) invert(0.9) hue-rotate(180deg)' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </section>


            <footer className="site-footer" style={{ background: 'var(--color-bg-primary)', borderTop: '1px solid var(--color-border)', padding: '80px 0 40px' }}>
                <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 60, marginBottom: 60 }}>
                    <div className="footer-brand">
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 15, textTransform: 'uppercase' }}>{siteConfig.site_name || 'BarberPro'}</h2>
                        <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 25 }}>Sua barbearia de confiança para um visual impecável e atendimento diferenciado.</p>
                        <div className="social-links" style={{ display: 'flex', gap: 15 }}>
                            <a href={`https://instagram.com/${siteConfig.instagram || '#'}`} target="_blank" rel="noreferrer" style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'all 0.3s' }} className="social-icon">
                                <Instagram size={22} />
                            </a>
                        </div>
                    </div>
                    <div className="footer-links">
                        <h4 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Explorar</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <li><a href="#services" className="text-secondary hover-accent">Serviços</a></li>
                            <li><a href="#booking" className="text-secondary hover-accent">Agendamento</a></li>
                            <li><a href="#location" className="text-secondary hover-accent">Localização</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); setShowCancelModal(true); }} className="text-secondary hover-accent">Cancelar Agendamento</a></li>
                        </ul>
                    </div>
                    <div className="footer-links">
                        <h4 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Atendimento</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <li className="text-secondary" style={{ fontSize: '0.9rem' }}>Segunda a Sábado</li>
                            <li className="text-secondary" style={{ fontSize: '0.9rem' }}>{siteConfig.open_time || '08:00'} às {siteConfig.close_time || '19:00'}</li>
                            <li className="text-secondary" style={{ fontSize: '0.9rem', marginTop: 10 }}>{siteConfig.city || 'Brasil'}</li>
                        </ul>
                    </div>
                </div>
                <div className="container" style={{ paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                    <p className="text-secondary" style={{ fontSize: '0.85rem' }}>© 2026 {siteConfig.site_name}. Todos os direitos reservados.</p>
                    <div className="footer-dev">
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                            Feito com ❤️ por <a href="/developer" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>João Paulo Fernandes</a>
                        </p>
                    </div>
                </div>
            </footer>

            {showCancelModal && (
                <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
                    <div className="modal animate-scale" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h2>Cancelar Agendamento</h2>
                            <button className="btn-icon" onClick={() => setShowCancelModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCancelAppointment}>
                            <div className="modal-body">
                                <p className="text-secondary" style={{ marginBottom: 24, fontSize: '0.9rem' }}>Informe o ID do agendamento e seu WhatsApp para confirmar.</p>
                                <div className="form-group">
                                    <label className="form-label">ID do Agendamento</label>
                                    <input type="text" className="form-input" placeholder="Ex: 12" value={cancelData.id} onChange={e => setCancelData({ ...cancelData, id: e.target.value })} required inputMode="numeric" pattern="[0-9]*" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Seu WhatsApp</label>
                                    <input type="text" className="form-input" placeholder="(00) 00000-0000" value={cancelData.whatsapp} onChange={e => setCancelData({ ...cancelData, whatsapp: e.target.value })} required inputMode="numeric" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>Fechar</button>
                                <button type="submit" className="btn btn-danger">Confirmar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showReviewModal && (
                <div className="modal-overlay" onClick={() => { setShowReviewModal(false); setReviewStep(1); setReviewSuccess(false); }}>
                    <div className="modal animate-scale" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h2>{reviewStep === 3 ? 'Obrigado!' : 'Sua Avaliação'}</h2>
                            <button className="btn-icon" onClick={() => { setShowReviewModal(false); setReviewStep(1); setReviewSuccess(false); }}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            {reviewStep === 1 && (
                                <form onSubmit={handleSearchVisit}>
                                    <p className="text-secondary" style={{ marginBottom: 20 }}>Insira seu WhatsApp para localizarmos seu último atendimento.</p>
                                    <div className="form-group">
                                        <label className="form-label">📱 Seu WhatsApp</label>
                                        <input type="text" className="form-input" placeholder="(00) 00000-0000" value={maskPhone(reviewWhatsApp)} onChange={e => setReviewWhatsApp(e.target.value)} required inputMode="numeric" />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-full">Buscar Atendimento <ChevronRight size={18} /></button>
                                </form>
                            )}

                            {reviewStep === 2 && lastVisit && (
                                <form onSubmit={handleReviewSubmit}>
                                    <div className="welcome-back-msg" style={{ background: 'var(--color-bg-secondary)', padding: '15px', borderRadius: 10, marginBottom: 20, fontSize: '0.9rem', border: '1px solid var(--color-border)' }}>
                                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Olá, {lastVisit.client_name}!</div>
                                        Vimos que você realizou <strong>{lastVisit.service_name}</strong> dia {lastVisit.date.split('-').reverse().join('/')} com o barbeiro <strong>{lastVisit.barber_name || 'Profissional'}</strong>.
                                    </div>

                                    <div className="form-group" style={{ textAlign: 'center' }}>
                                        <label className="form-label">Como você avalia nosso atendimento? (0 a 10)</label>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
                                            {[...Array(11)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setReviewRating(i)}
                                                    style={{
                                                        width: 32, height: 32, borderRadius: 6,
                                                        background: reviewRating === i ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)',
                                                        color: reviewRating === i ? '#000' : '#fff',
                                                        border: '1px solid var(--color-border)',
                                                        fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {i}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Deixe um comentário (opcional)</label>
                                        <textarea className="form-input" rows="3" value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Conte-nos o que achou..."></textarea>
                                    </div>

                                    <button type="submit" className="btn btn-primary w-full">Enviar Avaliação</button>
                                </form>
                            )}

                            {reviewStep === 3 && (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--color-success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 style={{ marginBottom: 10 }}>Avaliação Enviada!</h3>
                                    <p className="text-secondary" style={{ marginBottom: 25 }}>
                                        {reviewRating >= 8 ? 'Ficamos muito felizes que gostou! Esperamos vê-lo em breve.' :
                                            reviewRating >= 5 ? 'Agradecemos pelo seu feedback, vamos trabalhar para melhorar cada vez mais!' :
                                                'Lamentamos que sua experiência não tenha sido ideal. Iremos analisar seu comentário atentamente.'}
                                    </p>
                                    <button className="btn btn-secondary w-full" onClick={() => { setShowReviewModal(false); setReviewStep(1); setReviewSuccess(false); }}>Fechar</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <WhatsAppButton number={siteConfig.whatsapp_number} />
        </div>
    );
}
