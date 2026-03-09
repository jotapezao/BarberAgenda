import { useState, useEffect } from 'react';
import { publicApi, BASE_URL } from '../api';
import { useToast } from '../components/Toast';
import { Calendar, Clock, User, CheckCircle, ChevronRight, Scissors, ArrowLeft, Star } from 'lucide-react';
import { maskPhone, unmask } from '../utils/mask';
import { useNavigate } from 'react-router-dom';

export default function Booking() {
    const [services, setServices] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [siteConfig, setSiteConfig] = useState({});
    const [loading, setLoading] = useState(true);
    const [bookingStep, setBookingStep] = useState(1);
    const [isReturning, setIsReturning] = useState(false);
    const [formData, setFormData] = useState({
        client_name: '',
        client_whatsapp: '',
        client_birth_date: '',
        service_id: '',
        barber_id: '',
        date: new Date().toISOString().split('T')[0],
        time: ''
    });
    const [slots, setSlots] = useState([]);
    const [bookingSuccess, setBookingSuccess] = useState(null);

    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
        loadData();
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
        } catch (err) {
            toast.error('Erro ao carregar dados');
            setLoading(false);
        }
    };

    const handleWhatsAppSubmit = async (e) => {
        e.preventDefault();
        try {
            const cleanPhone = unmask(formData.client_whatsapp);
            const client = await publicApi.checkClient(cleanPhone);
            if (client) {
                setFormData(prev => ({
                    ...prev,
                    client_whatsapp: cleanPhone,
                    client_name: client.name,
                    client_birth_date: client.birth_date || ''
                }));
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

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (bookingStep === 5 && formData.date && formData.service_id) {
            loadSlots(formData.date, formData.service_id, formData.barber_id);
        }
    }, [bookingStep, formData.date, formData.service_id, formData.barber_id]);

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    const useBarbers = siteConfig.use_barbers === '1';

    return (
        <div className="booking-page-wrapper">
            <div className="booking-header">
                <button onClick={() => navigate('/')} className="back-btn">
                    <ArrowLeft size={20} />
                </button>
                <div className="booking-title">
                    <h1>Agendar Horário</h1>
                    <p>{siteConfig.site_name}</p>
                </div>
                <div style={{ width: 40 }}></div>
            </div>

            <div className="booking-container container">
                {!bookingSuccess ? (
                    <div className="booking-card card-glass animate-fade">
                        <div className="booking-steps-scroll">
                            <div className="booking-steps">
                                <div className={`step ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'done' : ''}`}><div className="step-number">1</div><span>WhatsApp</span></div>
                                <div className="step-line"></div>
                                <div className={`step ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'done' : ''}`}><div className="step-number">2</div><span>Dados</span></div>
                                <div className="step-line"></div>
                                <div className={`step ${bookingStep >= 3 ? 'active' : ''} ${bookingStep > 3 ? 'done' : ''}`}><div className="step-number">3</div><span>Serviço</span></div>
                                {useBarbers && (
                                    <>
                                        <div className="step-line"></div>
                                        <div className={`step ${bookingStep >= 4 ? 'active' : ''} ${bookingStep > 4 ? 'done' : ''}`}><div className="step-number">4</div><span>Barbeiro</span></div>
                                    </>
                                )}
                                <div className="step-line"></div>
                                <div className={`step ${bookingStep >= (useBarbers ? 5 : 4) ? 'active' : ''}`}><div className="step-number">{useBarbers ? 5 : 4}</div><span>Escolher</span></div>
                            </div>
                        </div>

                        <div className="booking-form-content">
                            {bookingStep === 1 && (
                                <form onSubmit={handleWhatsAppSubmit} className="animate-fade">
                                    <div className="form-group">
                                        <label className="form-label">📱 Seu WhatsApp</label>
                                        <p className="form-hint">Usaremos para confirmar seu agendamento</p>
                                        <input type="text" className="form-input form-input-lg" placeholder="(00) 00000-0000" value={maskPhone(formData.client_whatsapp)} onChange={e => setFormData({ ...formData, client_whatsapp: e.target.value })} maxLength={15} required inputMode="numeric" autoFocus />
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-lg w-full">Continuar <ChevronRight size={18} /></button>
                                </form>
                            )}

                            {bookingStep === 2 && (
                                <form onSubmit={(e) => { e.preventDefault(); setBookingStep(3); }} className="animate-fade">
                                    <div className="form-group">
                                        <label className="form-label">👤 Seu Nome Completo</label>
                                        <input type="text" className="form-input form-input-lg" placeholder="Como podemos te chamar?" value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} required autoFocus />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">🎂 Data de Nascimento (Opcional)</label>
                                        <input type="date" className="form-input form-input-lg" value={formData.client_birth_date} onChange={e => setFormData({ ...formData, client_birth_date: e.target.value })} />
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="btn btn-secondary btn-lg" onClick={() => setBookingStep(1)}>Voltar</button>
                                        <button type="submit" className="btn btn-primary btn-lg">Próximo</button>
                                    </div>
                                </form>
                            )}

                            {bookingStep === 3 && (
                                <div className="animate-fade">
                                    {isReturning && (
                                        <div className="welcome-back-msg">
                                            <strong>Bem-vindo de volta, {formData.client_name.split(' ')[0]}!</strong>
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label">✂️ Selecione o Serviço</label>
                                        <div className="services-list">
                                            {services.map(s => (
                                                <div key={s.id}
                                                    onClick={() => {
                                                        setFormData({ ...formData, service_id: s.id });
                                                        setBookingStep(useBarbers ? 4 : 5);
                                                    }}
                                                    className={`service-item ${formData.service_id === s.id ? 'selected' : ''}`}>
                                                    <div className="service-info">
                                                        <div className="service-name">{s.name}</div>
                                                        <div className="service-duration"><Clock size={14} /> {s.duration} min</div>
                                                    </div>
                                                    <div className="service-price-tag">{formatPrice(s.price)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button type="button" className="btn btn-secondary btn-lg w-full" onClick={() => setBookingStep(2)}>Voltar</button>
                                </div>
                            )}

                            {bookingStep === 4 && useBarbers && (
                                <div className="animate-fade">
                                    <div className="form-group">
                                        <label className="form-label">💈 Escolha o Barbeiro</label>
                                        <div className="barbers-grid">
                                            {barbers.map(b => (
                                                <div key={b.id}
                                                    onClick={() => {
                                                        setFormData({ ...formData, barber_id: b.id });
                                                        setBookingStep(5);
                                                    }}
                                                    className={`barber-card-option ${formData.barber_id === b.id ? 'selected' : ''}`}>
                                                    <div className="barber-avatar">
                                                        {b.photo_url ? (
                                                            <img src={`${BASE_URL}${b.photo_url}`} alt={b.name} />
                                                        ) : (
                                                            <User size={30} />
                                                        )}
                                                    </div>
                                                    <div className="barber-name">{b.name}</div>
                                                </div>
                                            ))}
                                            <div onClick={() => {
                                                setFormData({ ...formData, barber_id: '' });
                                                setBookingStep(5);
                                            }}
                                                className={`barber-card-option ${formData.barber_id === '' ? 'selected' : ''}`}>
                                                <div className="barber-avatar">
                                                    <Scissors size={24} />
                                                </div>
                                                <div className="barber-name">Qualquer um</div>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" className="btn btn-secondary btn-lg w-full" onClick={() => setBookingStep(3)}>Voltar</button>
                                </div>
                            )}

                            {bookingStep === 5 && (
                                <form onSubmit={handleBookingSubmit} className="animate-fade">
                                    <div className="form-group">
                                        <label className="form-label">📅 Data do Agendamento</label>
                                        <div className="date-options">
                                            <button
                                                type="button"
                                                className={`date-chip ${formData.date === today ? 'active' : ''}`}
                                                onClick={() => {
                                                    setFormData({ ...formData, date: today, time: '' });
                                                }}
                                            >
                                                Hoje
                                            </button>
                                            <div className="date-picker-wrapper">
                                                <input
                                                    type="date"
                                                    className="form-input date-input-field"
                                                    min={today}
                                                    value={formData.date}
                                                    onChange={e => setFormData({ ...formData, date: e.target.value, time: '' })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">⏰ Horários Disponíveis</label>
                                        <div className="time-slots-grid">
                                            {slots.length > 0 ? slots.map(h => (
                                                <div key={h}
                                                    className={`time-chip ${formData.time === h ? 'selected' : ''}`}
                                                    onClick={() => setFormData({ ...formData, time: h })}>
                                                    {h}
                                                </div>
                                            )) : (
                                                <div className="no-slots">
                                                    <Clock size={40} />
                                                    <p>Nenhum horário disponível para esta data</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button type="button" className="btn btn-secondary btn-lg" onClick={() => setBookingStep(useBarbers ? 4 : 3)}>Voltar</button>
                                        <button type="submit" className="btn btn-primary btn-lg" disabled={!formData.time}>Finalizar</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="booking-success-page animate-scale">
                        <div className="success-icon"><CheckCircle size={64} /></div>
                        <h2>Agendamento Confirmado!</h2>
                        <p>Tudo pronto para o seu atendimento.</p>

                        <div className="success-details card">
                            <div className="detail-item">
                                <span className="label">Protocolo</span>
                                <span className="value">#{bookingSuccess.id}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Data</span>
                                <span className="value">{bookingSuccess.date.split('-').reverse().join('/')}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Horário</span>
                                <span className="value">{bookingSuccess.time}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Serviço</span>
                                <span className="value">{bookingSuccess.service_name}</span>
                            </div>
                        </div>

                        <div className="success-actions">
                            {siteConfig.phone && (
                                <a
                                    href={`https://wa.me/55${siteConfig.phone.replace(/\D/g, '')}?text=Olá! Acabei de agendar pelo site. Protocolo %23${bookingSuccess.id} - ${bookingSuccess.date.split('-').reverse().join('/')} às ${bookingSuccess.time}`}
                                    target="_blank" rel="noreferrer"
                                    className="btn btn-success btn-lg w-full"
                                >
                                    Confirmar no WhatsApp
                                </a>
                            )}
                            <button className="btn btn-secondary btn-lg w-full" onClick={() => navigate('/')}>Voltar para Início</button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .booking-page-wrapper {
                    min-height: 100vh;
                    background: var(--color-bg-primary);
                    padding-bottom: 40px;
                }

                .booking-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px;
                    background: rgba(0,0,0,0.2);
                    backdrop-filter: blur(10px);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }

                .back-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                }

                .booking-title {
                    text-align: center;
                }

                .booking-title h1 {
                    font-size: 1.2rem;
                    margin: 0;
                    font-weight: 800;
                }

                .booking-title p {
                    font-size: 0.8rem;
                    margin: 0;
                    color: var(--color-accent);
                    opacity: 0.8;
                }

                .booking-container {
                    padding-top: 30px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .booking-card {
                    padding: 30px;
                    overflow: hidden;
                }

                .booking-steps-scroll {
                    overflow-x: auto;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    scrollbar-width: none;
                }

                .booking-steps-scroll::-webkit-scrollbar {
                    display: none;
                }

                .booking-steps {
                    display: flex;
                    align-items: center;
                    min-width: max-content;
                }

                .step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    opacity: 0.4;
                    transition: all 0.3s;
                }

                .step.active {
                    opacity: 1;
                }

                .step.done {
                    opacity: 0.8;
                }

                .step-number {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--color-bg-secondary);
                    border: 2px solid var(--color-border);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 0.8rem;
                }

                .step.active .step-number {
                    background: var(--color-accent);
                    color: #000;
                    border-color: var(--color-accent);
                    box-shadow: 0 0 15px var(--color-accent-glow);
                }

                .step.done .step-number {
                    background: var(--color-success);
                    color: #fff;
                    border-color: var(--color-success);
                }

                .step span {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .step-line {
                    width: 40px;
                    height: 2px;
                    background: var(--color-border);
                    margin: 0 10px;
                    margin-top: -24px;
                }

                .form-hint {
                    font-size: 0.8rem;
                    color: var(--color-text-secondary);
                    margin-bottom: 12px;
                }

                .form-input-lg {
                    padding: 16px 20px;
                    font-size: 1.1rem;
                }

                .welcome-back-msg {
                    background: var(--color-accent-subtle);
                    color: var(--color-accent);
                    padding: 15px;
                    border-radius: 12px;
                    margin-bottom: 25px;
                    border: 1px solid var(--color-accent-glow);
                    text-align: center;
                }

                .services-list {
                    display: grid;
                    gap: 12px;
                }

                .service-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .service-item:hover {
                    background: rgba(255,255,255,0.06);
                    border-color: var(--color-accent-glow);
                }

                .service-item.selected {
                    background: var(--color-accent);
                    color: #000;
                    border-color: var(--color-accent);
                }

                .service-name {
                    font-weight: 700;
                    font-size: 1.1rem;
                }

                .service-duration {
                    font-size: 0.85rem;
                    opacity: 0.7;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    margin-top: 4px;
                }

                .service-price-tag {
                    font-weight: 800;
                    font-size: 1.2rem;
                }

                .barbers-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 15px;
                }

                .barber-card-option {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 20px;
                    padding: 20px 10px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .barber-card-option.selected {
                    background: var(--color-accent);
                    color: #000;
                }

                .barber-avatar {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: var(--color-bg-secondary);
                    margin: 0 auto 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border: 2px solid var(--color-border);
                }

                .barber-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .barber-name {
                    font-weight: 700;
                    font-size: 0.9rem;
                }

                .date-options {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .date-chip {
                    padding: 14px 24px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--color-border);
                    color: #fff;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .date-chip.active {
                    background: var(--color-accent);
                    color: #000;
                    border-color: var(--color-accent);
                }

                .date-picker-wrapper {
                    flex: 1;
                }

                .time-slots-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                    gap: 10px;
                    margin-top: 15px;
                }

                .time-chip {
                    padding: 12px 5px;
                    text-align: center;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--color-border);
                    border-radius: 10px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .time-chip.selected {
                    background: var(--color-accent);
                    color: #000;
                    border-color: var(--color-accent);
                    box-shadow: 0 0 15px var(--color-accent-glow);
                }

                .no-slots {
                    grid-column: 1/-1;
                    text-align: center;
                    padding: 40px 0;
                    opacity: 0.5;
                }

                .form-actions {
                    display: flex;
                    gap: 15px;
                    margin-top: 30px;
                }

                .form-actions .btn {
                    flex: 1;
                }

                .booking-success-page {
                    text-align: center;
                    padding: 40px 20px;
                }

                .success-icon {
                    color: var(--color-success);
                    margin-bottom: 20px;
                }

                .success-details {
                    background: rgba(255,255,255,0.02);
                    border-radius: 20px;
                    padding: 25px;
                    margin: 30px 0;
                    text-align: left;
                }

                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }

                .detail-item:last-child {
                    border-bottom: none;
                }

                .detail-item .label {
                    color: var(--color-text-secondary);
                    font-size: 0.9rem;
                }

                .detail-item .value {
                    font-weight: 700;
                }

                .success-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                @media (max-width: 768px) {
                    .booking-page-wrapper {
                        padding-bottom: 20px;
                    }
                    .booking-container {
                        padding: 0;
                    }
                    .booking-card {
                        border-radius: 0 !important;
                        border-left: none !important;
                        border-right: none !important;
                        min-height: calc(100vh - 81px);
                        padding: 20px;
                    }
                    .booking-header {
                        padding: 15px;
                    }
                }
            `}</style>
        </div>
    );
}
