import { useEffect } from 'react';
import { publicApi, BASE_URL } from '../api';

export function ThemeProvider({ children }) {
    useEffect(() => {
        publicApi.getSiteConfig().then(config => {
            // 1. Aplicar Tema e Nome
            const validThemes = [
                'theme-dark-gold', 'theme-dark-purple', 'theme-dark-grey', 'theme-light-clean',
                'theme-sophisticated-blue', 'theme-wine-elegance', 'theme-emerald-luxury',
                'theme-coffee-classic', 'theme-midnight-ocean',
                'theme-dark-ocean', 'theme-dark-emerald', 'theme-dark-purple-new',
                'theme-light-ocean', 'theme-light-emerald', 'theme-light-purple', 'theme-light-gold'
            ];
            document.body.classList.remove(...validThemes);
            if (config.site_theme && validThemes.includes(config.site_theme)) {
                document.body.classList.add(config.site_theme);
            } else {
                document.body.classList.add('theme-dark-gold');
            }

            const validFonts = ['font-default', 'font-modern', 'font-classic', 'font-bold'];
            document.body.classList.remove(...validFonts);
            if (config.site_font && validFonts.includes(config.site_font)) {
                document.body.classList.add(config.site_font);
            } else {
                document.body.classList.add('font-default');
            }

            const siteName = config.site_name || 'BarberPro';
            document.title = `${siteName} | Barbearia Premium`;

            // 2. Favicon e Meta Imagem Dinâmicos
            if (config.site_logo) {
                const logoUrl = `${BASE_URL}${config.site_logo}`;
                const favicon = document.getElementById('favicon');
                if (favicon) favicon.href = logoUrl;

                const ogImage = document.getElementById('og-image');
                if (ogImage) ogImage.setAttribute('content', logoUrl);
            }

            // 3. Aplicar Background Fixo
            if (config.site_background) {
                document.body.style.backgroundImage = `url(${BASE_URL}${config.site_background})`;
                document.body.style.backgroundAttachment = 'fixed';
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
            } else {
                document.body.style.backgroundImage = 'none';
            }
        }).catch(console.error);
    }, []);

    return <>{children}</>;
}
