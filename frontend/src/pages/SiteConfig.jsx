import { useState, useEffect } from 'react';
import { adminApi, BASE_URL } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import { Save, Upload, Info, Image as ImageIcon, Layout, Palette, Mail, MapPin, Globe, Shield, Trash2, Settings, Gift } from 'lucide-react';
import { maskPhone, maskCNPJ, validateCNPJ, unmask } from '../utils/mask';


// Stable Input Component to fix focus bug
const FormField = ({ label, value, onChange, type = 'text', placeholder, info }) => {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            {type === 'textarea' ? (
                <textarea className="form-input" rows="3" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}></textarea>
            ) : (
                <input
                    type={type}
                    className="form-input"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    inputMode={type === 'number' || label.toLowerCase().includes('whatsapp') || label.toLowerCase().includes('telefone') || label.toLowerCase().includes('phone') || label.toLowerCase().includes('cnpj') ? 'numeric' : undefined}
                />
            )}
            {info && <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}><Info size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {info}</p>}
        </div>
    );
};

export default function SiteConfig() {
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('branding');
    const toast = useToast();

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            // Load both site config and system settings
            const [siteData, settingsData] = await Promise.all([
                adminApi.getSiteConfig(),
                adminApi.getSettings()
            ]);

            const flatConfig = { ...settingsData };
            Object.keys(siteData).forEach(key => flatConfig[key] = siteData[key].value);

            setConfig(flatConfig);
            setLoading(false);
        } catch (err) { toast.error('Erro ao carregar configurações'); }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Basic validation
        if (config.site_cnpj && unmask(config.site_cnpj).length > 0 && !validateCNPJ(config.site_cnpj)) {
            return toast.error('CNPJ inválido!');
        }

        try {
            // Split config into site_config and settings
            const siteConfigKeys = [
                'site_name', 'site_slogan', 'site_theme', 'site_font', 'site_logo', 'site_background',
                'banner_title_1', 'banner_subtitle_1', 'banner_image_1',
                'banner_title_2', 'banner_subtitle_2', 'banner_image_2',
                'banner_title_3', 'banner_subtitle_3', 'banner_image_3',
                'promotion_active', 'promotion_title', 'promotion_text', 'promotion_badge',
                'about_title', 'about_text', 'address', 'city', 'cep', 'map_embed_url',
                'birthday_reward_active', 'birthday_reward_value', 'appointment_notifications'
            ];

            const sitePayload = {};
            const settingsPayload = {};

            Object.keys(config).forEach(key => {
                // Ensure values are strings and unmask specific fields if needed
                let val = String(config[key] || '');
                if (key === 'site_cnpj' || key === 'phone' || key === 'whatsapp' || key === 'client_whatsapp') {
                    val = unmask(val);
                }

                if (siteConfigKeys.includes(key)) sitePayload[key] = val;
                else settingsPayload[key] = val;
            });

            await Promise.all([
                adminApi.updateSiteConfig(sitePayload),
                adminApi.updateSettings(settingsPayload)
            ]);

            // Auto-refresh theme variables and background globally
            const validThemes = [
                'theme-dark-gold', 'theme-dark-purple', 'theme-dark-grey', 'theme-light-clean',
                'theme-sophisticated-blue', 'theme-ruby-red', 'theme-emerald-green', 'theme-neon-cyberpunk',
                'theme-wine-elegance', 'theme-emerald-luxury', 'theme-coffee-classic', 'theme-midnight-ocean',
                'theme-dark-ocean', 'theme-dark-emerald', 'theme-dark-purple-new',
                'theme-light-ocean', 'theme-light-emerald', 'theme-light-purple', 'theme-light-gold'
            ];
            document.body.classList.remove(...validThemes);
            if (config.site_theme) document.body.classList.add(config.site_theme);

            const validFonts = ['font-default', 'font-modern', 'font-classic', 'font-bold'];
            document.body.classList.remove(...validFonts);
            if (config.site_font) document.body.classList.add(config.site_font);

            if (config.site_background) {
                document.body.style.backgroundImage = `url(${BASE_URL}${config.site_background})`;
                document.body.style.backgroundAttachment = 'fixed';
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
            } else {
                document.body.style.backgroundImage = 'none';
            }

            toast.success('Configurações salvas com sucesso');
        } catch (err) { toast.error('Erro ao salvar'); }
    };

    const handleFileUpload = async (file, configKey) => {
        try {
            const { url } = await adminApi.uploadImage(file);
            setConfig(prev => ({ ...prev, [configKey]: url }));
            toast.success('Imagem carregada!');
        } catch (err) { toast.error('Erro no upload'); }
    };

    const updateField = (key, value) => {
        setConfig(prev => {
            const next = { ...prev, [key]: value };

            // Auto-convert Google Maps links to Embed format
            if (key === 'map_embed_url' && value) {
                // If it's a standard maps search/place link
                if (value.includes('google.com/maps') && !value.includes('embed')) {
                    const encoded = encodeURIComponent(value);
                    next.map_embed_url = `https://maps.google.com/maps?q=${encoded}&hl=pt&z=15&output=embed`;
                }
                // If it's a short link maps.app.goo.gl, we still need to suggest the user manually gets the embed or we try a simple search
                else if (value.includes('maps.app.goo.gl')) {
                    // Short links are hard to convert without fetching, so we'll suggest a search approach
                    const searchBase = "https://maps.google.com/maps?q=";
                    next.map_embed_url = `${searchBase}${encodeURIComponent(prev.address || '')}&hl=pt&z=15&output=embed`;
                }
            }

            if (key === 'address' && value && (!prev.map_embed_url || !prev.map_embed_url.includes('google.com'))) {
                const encoded = encodeURIComponent(value);
                next.map_embed_url = `https://maps.google.com/maps?q=${encoded}&hl=pt&z=15&output=embed`;
            }
            return next;
        });
    };

    if (loading) return <AdminLayout><div className="loading-spinner"><div className="spinner"></div></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="animate-fade">
                <div className="section-header-admin">
                    <div>
                        <h1>Personalizar Site</h1>
                        <p>Altere a aparência e informações do seu site principal</p>
                    </div>
                    <button onClick={handleSave} className="btn btn-primary"><Save size={20} /> Salvar Alterações</button>
                </div>

                <div className="admin-tabs">
                    <button className={`tab-btn ${activeTab === 'branding' ? 'active' : ''}`} onClick={() => setActiveTab('branding')}><Palette size={18} /> Identidade</button>
                    <button className={`tab-btn ${activeTab === 'banners' ? 'active' : ''}`} onClick={() => setActiveTab('banners')}><ImageIcon size={18} /> Banners</button>
                    <button className={`tab-btn ${activeTab === 'promotion' ? 'active' : ''}`} onClick={() => setActiveTab('promotion')}><Info size={18} /> Promoção</button>
                    <button className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}><Layout size={18} /> Sobre & Local</button>
                    <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings size={18} /> Sistema</button>
                </div>

                <div className="card">
                    {activeTab === 'branding' && (
                        <div className="animate-fade">
                            <h3 style={{ marginBottom: 20 }}>Identidade Visual</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <div>
                                    <FormField label="Nome da Barbearia" value={config.site_name} onChange={v => updateField('site_name', v)} />
                                    <FormField label="Slogan Principal" value={config.site_slogan} onChange={v => updateField('site_slogan', v)} />
                                    <div className="form-group">
                                        <label className="form-label">Tema do Site</label>
                                        <select className="form-select" value={config.site_theme} onChange={e => updateField('site_theme', e.target.value)}>
                                            <option value="theme-dark-gold">🟡 Dark Gold — Laranja/Dourado (Padrão)</option>
                                            <option value="theme-dark-ocean">🌊 Dark Oceano — Azul/Ciano</option>
                                            <option value="theme-dark-emerald">🌲 Dark Esmeralda — Verde Vibrante</option>
                                            <option value="theme-dark-purple-new">💜 Dark Púrpura — Lilás/Roxo</option>

                                            <option value="theme-dark-grey">⚪ Carvão Refinado — Prata sutil</option>
                                            <option value="theme-sophisticated-blue">🔵 Azul Aço — Ciano Refinado</option>
                                            <option value="theme-coffee-classic">🟤 Café & Couro — Âmbar Vintage</option>
                                            <option value="theme-midnight-ocean">🩵 Oceano Ardósia — Verde-Água</option>
                                            <option value="theme-wine-elegance">🖤 Obsidian Platinum — Prata Gelada</option>
                                            <option value="theme-emerald-luxury">🟢 Esmeralda Premium — Verde Floresta</option>

                                            <option value="theme-light-clean">☀️ Claro Clean — Branco/Azul Fosco</option>
                                            <option value="theme-light-ocean">🏖️ Claro Oceano — Azul Turquesa</option>
                                            <option value="theme-light-emerald">🍃 Claro Esmeralda — Verde Suave</option>
                                            <option value="theme-light-purple">🌸 Claro Púrpura — Lilás Pastel</option>
                                            <option value="theme-light-gold">🌅 Claro Gold — Dourado Fino</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tipografia (Fontes do Site)</label>
                                        <select className="form-select" value={config.site_font} onChange={e => updateField('site_font', e.target.value)}>
                                            <option value="font-default">Inter & Playfair Display (Padrão - Equilibrada)</option>
                                            <option value="font-modern">Montserrat & Outfit (Moderna - Limpa)</option>
                                            <option value="font-classic">Lora & Cinzel (Clássica - Elegante)</option>
                                            <option value="font-bold">Poppins & Oswald (Ousada - Marcante)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <div className="form-group">
                                        <label className="form-label">Logotipo da Empresa</label>
                                        <div className="logo-upload-preview" style={{ marginBottom: 12, border: '1.5px dashed var(--color-border)', borderRadius: 8, padding: 20, textAlign: 'center', background: 'var(--color-bg-secondary)' }}>
                                            {config.site_logo ? (
                                                <img src={`${BASE_URL}${config.site_logo}`} alt="Logo Preview" style={{ maxHeight: 80, marginBottom: 16 }} />
                                            ) : (
                                                <div className="text-muted" style={{ marginBottom: 16 }}>Nenhum logo carregado</div>
                                            )}
                                            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                                                <Upload size={14} /> Alterar Logo
                                                <input type="file" hidden accept="image/*" onChange={e => handleFileUpload(e.target.files[0], 'site_logo')} />
                                            </label>
                                        </div>
                                        <div className="info-box" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: 12, borderRadius: 6, fontSize: '0.8rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            <strong>Recomendações:</strong>
                                            <ul style={{ marginLeft: 16, marginTop: 4 }}>
                                                <li>Resolução ideal: 400x120px</li>
                                                <li>Formato: PNG com fundo transparente ou SVG</li>
                                                <li>Tamanho máximo: 2MB</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Imagem de Fundo do Site (Background)</label>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                                            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                                                <Upload size={14} /> Carregar Background
                                                <input type="file" hidden accept="image/*" onChange={e => handleFileUpload(e.target.files[0], 'site_background')} />
                                            </label>
                                            {config.site_background && <button className="btn btn-danger btn-sm" onClick={() => updateField('site_background', '')}>Remover</button>}
                                        </div>
                                        <div className="info-box" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: 12, borderRadius: 6, fontSize: '0.8rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            <strong>Recomendações para Background:</strong>
                                            <ul style={{ marginLeft: 16, marginTop: 4 }}>
                                                <li>Resolução ideal: 1920x1080px (Full HD)</li>
                                                <li>Formatos: JPG ou WEBP (para melhor performance)</li>
                                                <li>Tamanho máximo: 3MB</li>
                                                <li>Use imagens escuras ou com desfoque para não atrapalhar a leitura.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'banners' && (
                        <div className="animate-fade">
                            <h3 style={{ marginBottom: 20 }}>Banners Rotativos</h3>
                            <p className="text-secondary" style={{ marginBottom: 24 }}>Configure até 3 banners para a página inicial. O ideal é usar imagens escuras para melhor leitura do texto.</p>
                            {[1, 2, 3].map(num => (
                                <div key={num} className="banner-config-item" style={{ padding: 20, background: 'var(--color-bg-secondary)', borderRadius: 10, marginBottom: 20, border: '1px solid var(--color-border)' }}>
                                    <h4 style={{ marginBottom: 16, color: 'var(--color-accent)' }}>Banner #{num}</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
                                        <div>
                                            <FormField label="Título do Banner" value={config[`banner_title_${num}`]} onChange={v => updateField(`banner_title_${num}`, v)} />
                                            <FormField label="Subtítulo / Descrição" value={config[`banner_subtitle_${num}`]} onChange={v => updateField(`banner_subtitle_${num}`, v)} />
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                <FormField label="Texto do Botão" value={config[`banner_btn_text_${num}`] || 'Agendar Agora'} onChange={v => updateField(`banner_btn_text_${num}`, v)} />
                                                <div className="form-group">
                                                    <label className="form-label">Comportamento do Botão</label>
                                                    <select className="form-select" value={config[`banner_action_${num}`] || 'booking'} onChange={e => updateField(`banner_action_${num}`, e.target.value)}>
                                                        <option value="booking">Agendar Agora (Abre formulário)</option>
                                                        <option value="whatsapp">Fale Comigo (Abre WhatsApp)</option>
                                                        <option value="location">Localização (Desce a página)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ height: 120, background: '#000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' }}>
                                                {config[`banner_image_${num}`] ? (
                                                    <img src={`${BASE_URL}${config[`banner_image_${num}`]}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <ImageIcon size={32} className="text-muted" />
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                                                    <Upload size={14} /> Substituir
                                                    <input type="file" hidden accept="image/*" onChange={e => handleFileUpload(e.target.files[0], `banner_image_${num}`)} />
                                                </label>
                                                {config[`banner_image_${num}`] && (
                                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => updateField(`banner_image_${num}`, '')} title="Remover imagem">
                                                        <Trash2 size={14} /> Remover
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'promotion' && (
                        <div className="animate-fade" style={{ maxWidth: 600 }}>
                            <h3 style={{ marginBottom: 20 }}>Barra de Promoção</h3>
                            <div className="form-group" style={{ marginBottom: 24 }}>
                                <label className="flex-center" style={{ gap: 12, cursor: 'pointer', justifyContent: 'flex-start' }}>
                                    <input type="checkbox" checked={config.promotion_active === 'true'} onChange={e => updateField('promotion_active', e.target.checked ? 'true' : 'false')} style={{ width: 20, height: 20 }} />
                                    <span>Ativar Barra de Promoção no topo do site</span>
                                </label>
                            </div>
                            <FormField label="Texto do Badge (Ex: 🔥 OFERTA)" value={config.promotion_badge} onChange={v => updateField('promotion_badge', v)} />
                            <FormField label="Título da Promoção" value={config.promotion_title} onChange={v => updateField('promotion_title', v)} />
                            <FormField label="Texto/Descrição" type="textarea" value={config.promotion_text} onChange={v => updateField('promotion_text', v)} />
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="animate-fade">
                            <h3 style={{ marginBottom: 20 }}>Seção Sobre Nós</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40, paddingBottom: 40, borderBottom: '1px solid var(--color-border)' }}>
                                <div>
                                    <FormField label="Título da Seção" value={config.about_title} onChange={v => updateField('about_title', v)} />
                                    <FormField label="Texto Completo" type="textarea" value={config.about_text} onChange={v => updateField('about_text', v)} />
                                </div>
                                <div className="card" style={{ background: 'var(--color-bg-secondary)', padding: '24px' }}>
                                    <h4 style={{ marginBottom: 20 }}>Mídia & Redes Sociais</h4>
                                    <FormField label="Instagram (apenas o @)" value={config.instagram} onChange={v => updateField('instagram', v)} />
                                    <FormField label="Facebook (Link URL completa)" value={config.facebook} onChange={v => updateField('facebook', v)} />
                                </div>
                            </div>

                            <h3 style={{ marginBottom: 20 }}>Localização e Contato</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                                <div className="card" style={{ background: 'var(--color-bg-secondary)', padding: '24px' }}>
                                    <h4 style={{ marginBottom: 20 }}>Dados de Contato</h4>
                                    <FormField label="Telefone / WhatsApp de Contato" value={maskPhone(config.phone || '')} onChange={v => updateField('phone', v)} placeholder="(00) 00000-0000" />
                                    <FormField label="CNPJ" value={maskCNPJ(config.site_cnpj || '')} onChange={v => updateField('site_cnpj', v)} placeholder="00.000.000/0000-00" />

                                    <h4 style={{ margin: '20px 0', borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>Endereço Completo</h4>
                                    <FormField label="Rua / Avenida" value={config.address} onChange={v => updateField('address', v)} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <FormField label="Cidade / Estado" value={config.city} onChange={v => updateField('city', v)} />
                                        <FormField label="CEP" value={config.cep} onChange={v => updateField('cep', v)} />
                                    </div>
                                </div>
                                <div className="card" style={{ background: 'var(--color-bg-secondary)', padding: '24px' }}>
                                    <h4 style={{ marginBottom: 20 }}>Embed do Google Maps</h4>
                                    <FormField
                                        label="Código iFrame do Mapa"
                                        value={config.map_embed_url}
                                        onChange={v => updateField('map_embed_url', v)}
                                        type="textarea"
                                        info="Ao digitar o 'Endereço Completo' ao lado, este campo será preenchido automaticamente com um mapa em tempo real."
                                    />
                                    {config.map_embed_url && (
                                        <div style={{ marginTop: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                                            <iframe src={config.map_embed_url} width="100%" height="200" style={{ border: 0 }} allowFullScreen="" loading="lazy"></iframe>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'settings' && (
                        <div className="animate-fade" style={{ maxWidth: 600 }}>
                            <h3 style={{ marginBottom: 20 }}>Configurações do Sistema</h3>

                            <div className="card" style={{ background: 'rgba(212, 165, 72, 0.05)', border: '1px solid rgba(212, 165, 72, 0.2)', marginBottom: 24 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="flex-center" style={{ gap: 12, cursor: 'pointer', justifyContent: 'flex-start' }}>
                                        <input
                                            type="checkbox"
                                            checked={config.use_barbers === '1'}
                                            onChange={e => updateField('use_barbers', e.target.checked ? '1' : '0')}
                                            style={{ width: 22, height: 22 }}
                                        />
                                        <div>
                                            <span style={{ fontWeight: 700, display: 'block' }}>Habilitar Multi-Barbeiros</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                Permite cadastrar barbeiros e habilita o cliente a escolher quem deseja no agendamento.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <FormField
                                label="Número do WhatsApp (Botão Flutuante)"
                                value={config.whatsapp_number}
                                onChange={v => updateField('whatsapp_number', v)}
                                info="Ex: 5511999999999 (Código do país + DDD + Número)"
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                                <FormField
                                    label="Antecedência Mínima (Minutos)"
                                    type="number"
                                    value={config.min_booking_notice}
                                    onChange={v => updateField('min_booking_notice', v)}
                                    info="Bloqueia horários muito próximos da hora atual. (Ex: 15 min)"
                                />
                                <FormField
                                    label="Antecedência Máxima (Dias)"
                                    type="number"
                                    value={config.max_booking_advance}
                                    onChange={v => updateField('max_booking_advance', v)}
                                    info="Limite para agendar no futuro. (Ex: 30 dias)"
                                />
                            </div>

                            {/* Notificações de Novos Agendamentos */}
                            <div className="card" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: 24, marginTop: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <span style={{ fontSize: '1.2rem' }}>🔔</span>
                                    <h4 style={{ margin: 0 }}>Notificações de Novos Agendamentos</h4>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 12, marginLeft: 34 }}>Quando ativado, o sistema emite um alerta sonoro e visual sempre que um cliente fizer um novo agendamento.</p>
                                <div className="form-group" style={{ marginBottom: 0, marginLeft: 34 }}>
                                    <label className="flex-center" style={{ gap: 12, cursor: 'pointer', justifyContent: 'flex-start' }}>
                                        <input
                                            type="checkbox"
                                            checked={config.appointment_notifications !== 'false' && config.appointment_notifications !== '0'}
                                            onChange={e => updateField('appointment_notifications', e.target.checked ? 'true' : 'false')}
                                            style={{ width: 22, height: 22 }}
                                        />
                                        <span style={{ fontWeight: 700 }}>Ativar notificações de novos agendamentos</span>
                                    </label>
                                </div>
                            </div>

                            <div className="card" style={{ background: 'rgba(212, 165, 72, 0.05)', border: '1px solid rgba(212, 165, 72, 0.2)', marginBottom: 24, marginTop: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15, color: 'var(--color-accent)' }}>
                                    <Gift size={20} />
                                    <h4 style={{ margin: 0 }}>Recompensa de Aniversário</h4>
                                </div>
                                <div className="form-group">
                                    <label className="flex-center" style={{ gap: 12, cursor: 'pointer', justifyContent: 'flex-start' }}>
                                        <input
                                            type="checkbox"
                                            checked={config.birthday_reward_active === 'true'}
                                            onChange={e => updateField('birthday_reward_active', e.target.checked ? 'true' : 'false')}
                                            style={{ width: 22, height: 22 }}
                                        />
                                        <div>
                                            <span style={{ fontWeight: 700, display: 'block' }}>Habilitar Desconto de Aniversário</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                Permite enviar uma cortesia para clientes no mês de aniversário.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                                {config.birthday_reward_active === 'true' && (
                                    <FormField
                                        label="Valor da Cortesia (R$)"
                                        type="number"
                                        value={config.birthday_reward_value}
                                        onChange={v => updateField('birthday_reward_value', v)}
                                        placeholder="50.00"
                                        info="Este valor será sugerido ao enviar a mensagem de parabéns."
                                    />
                                )}
                            </div>

                            <div className="info-box" style={{ marginTop: 20, background: 'rgba(59, 130, 246, 0.05)', padding: 12, borderRadius: 6, fontSize: '0.8rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <p><Info size={14} style={{ marginRight: 6 }} /> Ao ativar o sistema de barbeiros, certifique-se de que todos os barbeiros ativos tenham um percentual de comissão definido.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
