import { useState, useEffect } from 'react';
import { publicApi, BASE_URL } from '../api';
import { useToast } from '../components/Toast';
import { Calendar, Clock, User, Phone, CheckCircle, Instagram, MapPin, ChevronRight, Menu, X, Scissors, Star, Trash2 } from 'lucide-react';
import WhatsAppButton from '../components/WhatsAppButton';


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
        } catch (err) { toast.error('Erro ao carregar dados'); }
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
            const client = await publicApi.checkClient(formData.client_whatsapp);
            if (client) {
                setFormData(prev => ({ ...prev, client_name: client.name, client_birth_date: client.birth_date || '' }));
                setIsReturning(true);
                setBookingStep(3);
                toast.success(`Olá ${client.name}, seja bem-vindo de volta!`);
            } else {
                setIsReturning(false);
                setBookingStep(2);
            }
        } catch (err) { toast.error('Erro ao verificar cliente'); }
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await publicApi.createAppointment(formData);
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

                        <ul className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
                            <li><a href="#services" onClick={() => setIsMenuOpen(false)}>Serviços</a></li>
                            <li><a href="#booking" onClick={() => setIsMenuOpen(false)}>Agendar</a></li>
                            <li><a href="#about" onClick={() => setIsMenuOpen(false)}>Nossa História</a></li>
                            <li><a href="#location" onClick={() => setIsMenuOpen(false)}>Onde Estamos</a></li>
                            <li className="mobile-only"><button className="btn btn-outline btn-sm" onClick={() => setShowCancelModal(true)} style={{ width: '100%' }}>Cancelar Agendamento</button></li>
                            <li className="mobile-only"><a href="/admin" className="btn btn-primary btn-sm" style={{ width: '100%' }}>Acesso Restrito</a></li>
                        </ul>

                        <div className="navbar-actions desk-only">
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowCancelModal(true)}>Cancelar</button>
                            <a href="/admin" className="btn btn-primary btn-sm">Painel Barber</a>
                        </div>

                        <button className="navbar-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </nav>
            </header>

            <header className="hero">
                {banners.map((banner, i) => {
                    const btnText = siteConfig[`banner_btn_text_${i + 1}`] || 'Agendar Agora';
                    const btnAction = siteConfig[`banner_action_${i + 1}`] || 'booking';

                    let actionHref = "#booking";
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
                                    <a href={actionHref} target={target} className="btn btn-primary btn-lg">{btnText}</a>
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
            </section>

            <section id="booking" className="section bg-secondary">
                <div className="container">
                    <div className="section-header">
                        <h2>Agende seu <span>Horário</span></h2>
                        <p>Selecione os dados abaixo para reservar sua vaga</p>
                    </div>

                    <div className="booking-form-container card card-glass">
                        {!bookingSuccess ? (
                            <>
                                <div className="booking-steps">
                                    <div className={`step ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'done' : ''}`}><div className="step-number">1</div><span>WhatsApp</span></div>
                                    <div className="step-line"></div>
                                    <div className={`step ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'done' : ''}`}><div className="step-number">2</div><span>Dados</span></div>
                                    <div className="step-line"></div>
                                    <div className={`step ${bookingStep >= 3 ? 'active' : ''} ${bookingStep > 3 ? 'done' : ''}`}><div className="step-number">3</div><span>Serviço</span></div>
                                    {siteConfig.use_barbers === '1' && (
                                        <>
                                            <div className="step-line"></div>
                                            <div className={`step ${bookingStep >= 4 ? 'active' : ''} ${bookingStep > 4 ? 'done' : ''}`}><div className="step-number">4</div><span>Barbeiro</span></div>
                                        </>
                                    )}
                                    <div className="step-line"></div>
                                    <div className={`step ${bookingStep >= (siteConfig.use_barbers === '1' ? 5 : 4) ? 'active' : ''}`}><div className="step-number">{siteConfig.use_barbers === '1' ? 5 : 4}</div><span>Escolher</span></div>
                                </div>

                                {bookingStep === 1 && (
                                    <form onSubmit={handleWhatsAppSubmit} className="animate-fade">
                                        <div className="form-group">
                                            <label className="form-label">📱 Seu WhatsApp</label>
                                            <input type="text" className="form-input" placeholder="(00) 00000-0000" value={formData.client_whatsapp} onChange={e => setFormData({ ...formData, client_whatsapp: e.target.value })} required />
                                        </div>
                                        <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }}>Próximo Passo <ChevronRight size={18} /></button>
                                    </form>
                                )}

                                {bookingStep === 2 && (
                                    <form onSubmit={(e) => { e.preventDefault(); setBookingStep(3); }} className="animate-fade">
                                        <div className="form-group">
                                            <label className="form-label">👤 Seu Nome Completo</label>
                                            <input type="text" className="form-input" placeholder="Como podemos te chamar?" value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} required autoFocus />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">🎂 Data de Nascimento (Opcional)</label>
                                            <input type="date" className="form-input" value={formData.client_birth_date} onChange={e => setFormData({ ...formData, client_birth_date: e.target.value })} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button type="button" className="btn btn-secondary" onClick={() => setBookingStep(1)} style={{ flex: 1 }}>Voltar</button>
                                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirmar</button>
                                        </div>
                                    </form>
                                )}

                                {bookingStep === 3 && (
                                    <form onSubmit={(e) => { e.preventDefault(); setBookingStep(siteConfig.use_barbers === '1' ? 4 : (siteConfig.use_barbers === '1' ? 5 : 4)); }} className="animate-fade">
                                        {isReturning && (
                                            <div className="welcome-back-msg" style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: '0.9rem', border: '1px solid var(--color-accent-glow)' }}>
                                                <strong>Olá, {formData.client_name.split(' ')[0]}!</strong> Seja bem-vindo(a) de volta.
                                            </div>
                                        )}
                                        <div className="form-group">
                                            <label className="form-label">✂️ Selecione o Serviço</label>
                                            <div className="services-selection-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                                {services.map(s => (
                                                    <div key={s.id}
                                                        onClick={() => setFormData({ ...formData, service_id: s.id })}
                                                        className={`service-option-card ${formData.service_id === s.id ? 'selected' : ''}`}
                                                        style={{
                                                            padding: '16px',
                                                            borderRadius: '12px',
                                                            background: formData.service_id === s.id ? 'var(--color-accent)' : 'rgba(255,255,255,0.03)',
                                                            color: formData.service_id === s.id ? '#000' : '#fff',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            transition: 'all 0.2s ease'
                                                        }}>
                                                        <div>
                                                            <div style={{ fontWeight: 700 }}>{s.name}</div>
                                                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{s.duration} min</div>
                                                        </div>
                                                        <div style={{ fontWeight: 800 }}>{formatPrice(s.price)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                                            <button type="button" className="btn btn-secondary" onClick={() => setBookingStep(2)} style={{ flex: 1 }}>Voltar</button>
                                            <button type="button" className="btn btn-primary" onClick={() => setBookingStep(siteConfig.use_barbers === '1' ? 4 : 5)} style={{ flex: 2 }} disabled={!formData.service_id}>Continuar</button>
                                        </div>
                                    </form>
                                )}

                                {bookingStep === 4 && siteConfig.use_barbers === '1' && (
                                    <form onSubmit={(e) => { e.preventDefault(); setBookingStep(5); }} className="animate-fade">
                                        <div className="form-group">
                                            <label className="form-label">💈 Escolha o Barbeiro</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                                {barbers.map(b => (
                                                    <div key={b.id}
                                                        onClick={() => setFormData({ ...formData, barber_id: b.id })}
                                                        style={{
                                                            padding: '20px 10px',
                                                            borderRadius: '16px',
                                                            background: formData.barber_id === b.id ? 'var(--color-accent)' : 'rgba(255,255,255,0.03)',
                                                            color: formData.barber_id === b.id ? '#000' : '#fff',
                                                            cursor: 'pointer',
                                                            textAlign: 'center',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            transition: 'all 0.2s ease',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                        <div style={{
                                                            width: 60,
                                                            height: 60,
                                                            borderRadius: '50%',
                                                            background: formData.barber_id === b.id ? 'rgba(0,0,0,0.1)' : 'var(--color-bg-secondary)',
                                                            margin: '0 auto',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            overflow: 'hidden',
                                                            border: `2px solid ${formData.barber_id === b.id ? 'rgba(0,0,0,0.2)' : 'var(--color-accent-subtle)'}`
                                                        }}>
                                                            {b.photo_url ? (
                                                                <img src={`${BASE_URL}${b.photo_url}`} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <User size={28} />
                                                            )}
                                                        </div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.name}</div>
                                                    </div>
                                                ))}
                                                <div onClick={() => setFormData({ ...formData, barber_id: '' })}
                                                    style={{
                                                        padding: '20px 10px',
                                                        borderRadius: '16px',
                                                        background: formData.barber_id === '' ? 'var(--color-accent)' : 'rgba(255,255,255,0.03)',
                                                        color: formData.barber_id === '' ? '#000' : '#fff',
                                                        cursor: 'pointer',
                                                        textAlign: 'center',
                                                        border: '1px solid rgba(255,255,255,0.1)'
                                                    }}>
                                                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Scissors size={24} />
                                                    </div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Qualquer um</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                                            <button type="button" className="btn btn-secondary" onClick={() => setBookingStep(3)} style={{ flex: 1 }}>Voltar</button>
                                            <button type="button" className="btn btn-primary" onClick={() => setBookingStep(5)} style={{ flex: 2 }}>Próximo Passo</button>
                                        </div>
                                    </form>
                                )}

                                {bookingStep === 5 && (
                                    <form onSubmit={handleBookingSubmit} className="animate-fade">
                                        <div className="form-group">
                                            <label className="form-label">📅 Data do Agendamento</label>
                                            <input type="date" className="form-input" min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={e => { setFormData({ ...formData, date: e.target.value, time: '' }); loadSlots(e.target.value, formData.service_id, formData.barber_id); }} required />
                                        </div>
                                        {formData.date && (
                                            <div className="form-group">
                                                <label className="form-label">⏰ Horários Disponíveis</label>
                                                <div className="time-slots">
                                                    {slots.length > 0 ? slots.map(h => (
                                                        <div key={h} className={`time-slot ${formData.time === h ? 'selected' : ''}`} onClick={() => setFormData({ ...formData, time: h })}>{h}</div>
                                                    )) : <p className="text-secondary" style={{ gridColumn: '1/-1', textAlign: 'center' }}>Nenhum horário disponível para esta data</p>}
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                                            <button type="button" className="btn btn-secondary" onClick={() => setBookingStep(siteConfig.use_barbers === '1' ? 4 : 3)} style={{ flex: 1 }}>Voltar</button>
                                            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={!formData.time}>Finalizar Agendamento</button>
                                        </div>
                                    </form>
                                )}
                            </>
                        ) : (
                            <div className="booking-success animate-scale">
                                <div className="booking-success-icon"><CheckCircle size={48} /></div>
                                <h3>Agendamento Confirmado!</h3>
                                <p className="text-secondary" style={{ marginBottom: 12 }}>Tudo certo! Recebemos seu pedido.</p>
                                <div className="card" style={{ textAlign: 'left', marginBottom: 24, background: 'var(--color-bg-secondary)' }}>
                                    <p><strong>Protocolo ID:</strong> {bookingSuccess.id}</p>
                                    <p><strong>Data:</strong> {bookingSuccess.date.split('-').reverse().join('/')}</p>
                                    <p><strong>Horário:</strong> {bookingSuccess.time}</p>
                                    <p><strong>Serviço:</strong> {bookingSuccess.service_name}</p>
                                </div>
                                <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: 24 }}>Anote o ID caso precise cancelar depois.</p>
                                <button className="btn btn-primary" onClick={() => { setBookingSuccess(null); setBookingStep(1); setFormData({ client_name: '', client_whatsapp: '', service_id: '', date: '', time: '' }); }}>Fazer Outro Agendamento</button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section id="about" className="section container" style={{ paddingTop: 60, paddingBottom: 60 }}>
                <div className="card card-glass animate-fade" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: 800, margin: '0 auto', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', borderRadius: '24px' }}>
                    <h2 style={{ fontSize: '2.5rem', margin: '0 auto 20px', fontFamily: 'var(--font-display)', fontWeight: 800, textAlign: 'center' }}>{siteConfig.about_title || 'Sobre Nós'}</h2>
                    <p className="text-secondary" style={{ fontSize: '1.15rem', lineHeight: 1.8, margin: '0 auto' }}>
                        {siteConfig.about_text || 'Somos uma barbearia moderna focada em oferecer a melhor experiência. Com profissionais qualificados e ambiente premium, garantimos estilo e atitude em cada corte.'}
                    </p>
                </div>
            </section>

            <section id="location" className="section">
                <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className="card card-glass animate-fade" style={{ padding: '50px 40px', maxWidth: 700, margin: '0 auto', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', borderRadius: '24px' }}>
                        <h3 style={{ fontSize: '2rem', marginBottom: 30, fontFamily: 'var(--font-display)', fontWeight: 800, textAlign: 'center' }}>Contato e Localização</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 30, textAlign: 'left' }}>
                            <div className="contact-info-item" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div className="service-icon" style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-secondary)' }}><MapPin size={22} className="text-accent" /></div>
                                <div>
                                    <strong style={{ display: 'block', marginBottom: 4, fontSize: '1.1rem' }}>Endereço</strong>
                                    <p className="text-secondary" style={{ fontSize: '0.95rem' }}>{siteConfig.address || 'Rua Exemplo, 123'}<br />{siteConfig.city || 'Sua Cidade - SP'}</p>
                                </div>
                            </div>
                            <div className="contact-info-item" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div className="service-icon" style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-secondary)' }}><Phone size={22} className="text-accent" /></div>
                                <div>
                                    <strong style={{ display: 'block', marginBottom: 4, fontSize: '1.1rem' }}>WhatsApp</strong>
                                    <p className="text-secondary" style={{ fontSize: '0.95rem' }}>{siteConfig.phone || '(00) 00000-0000'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="footer-simple">
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                    <div className="footer-brand">
                        <h4>{siteConfig.site_name || 'BarberPro'}</h4>
                        <p>© 2026 Todos os direitos reservados.</p>
                    </div>
                    <div className="footer-dev">
                        <p style={{ fontSize: '0.85rem' }}>Desenvolvido por <a href="/developer" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', fontWeight: 700, textDecoration: 'underline' }}>João Paulo Fernandes</a></p>
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
                                    <input type="number" className="form-input" placeholder="Ex: 12" value={cancelData.id} onChange={e => setCancelData({ ...cancelData, id: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Seu WhatsApp</label>
                                    <input type="text" className="form-input" placeholder="(00) 00000-0000" value={cancelData.whatsapp} onChange={e => setCancelData({ ...cancelData, whatsapp: e.target.value })} required />
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

            <WhatsAppButton number={siteConfig.whatsapp_number} />
        </div>
    );
}
