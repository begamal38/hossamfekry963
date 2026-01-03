import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';
import logo from '@/assets/logo.webp';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { t, isRTL } = useLanguage();

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/2${cleanPhone}`, '_blank');
  };

  return (
    <footer 
      className="border-t border-border mt-16 bg-muted/50 dark:bg-background/80" 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-6 py-16 md:py-20 2xl:py-24 3xl:py-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 2xl:gap-16 3xl:gap-20 text-center md:text-right">
          
          {/* Brand Section */}
          <div className="space-y-5 2xl:space-y-6 flex flex-col items-center md:items-start">
            <Link to="/" className="inline-block p-2">
              <img 
                src={logo} 
                alt="Hossam Fekry" 
                width={128}
                height={128}
                className="h-20 md:h-24 2xl:h-28 3xl:h-32 w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </Link>
            <p className="text-sm 2xl:text-base 3xl:text-lg leading-relaxed font-medium max-w-xs 2xl:max-w-sm text-muted-foreground">
              {t('footer.description')}
            </p>
          </div>

          {/* Contact Information - Side by Side Phone Numbers */}
          <div className="space-y-5 flex flex-col items-center md:items-start">
            <h4 className="font-bold text-lg text-foreground">
              {t('footer.contact')}
            </h4>
            <div className="space-y-4">
              {/* Phone Numbers - Side by side */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
                <button 
                  onClick={() => openWhatsApp('01225565645')}
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity text-sm group text-muted-foreground"
                >
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform text-green-500" />
                  <span dir="ltr" className="font-medium">+201225565645</span>
                </button>
                <a 
                  href="tel:+201116218299" 
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity text-sm group text-muted-foreground"
                >
                  <Phone className="w-5 h-5 group-hover:scale-110 transition-transform text-primary" />
                  <span dir="ltr" className="font-medium">+201116218299</span>
                </a>
              </div>
              
              <a 
                href="mailto:contact@hossamfekry.com" 
                className="flex items-center justify-center md:justify-start gap-3 hover:opacity-70 transition-opacity text-sm group text-muted-foreground"
              >
                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform text-primary" />
                <span dir="ltr" className="font-medium">contact@hossamfekry.com</span>
              </a>
              <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">{t('footer.location')}</span>
              </div>
            </div>
          </div>

          {/* Social Media & Legal */}
          <div className="space-y-6 flex flex-col items-center md:items-start">
            {/* Social Media Icons */}
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-center md:text-right text-foreground">
                {t('footer.followUs')}
              </h4>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <a 
                  href="https://www.facebook.com/mr.hossamfekry" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md bg-primary/10 text-primary"
                  aria-label="Facebook"
                >
                  <Facebook className="w-6 h-6" />
                </a>
                <a 
                  href="https://www.instagram.com/hossamfekry963" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md bg-primary/10 text-primary"
                  aria-label="Instagram"
                >
                  <Instagram className="w-6 h-6" />
                </a>
                <button
                  onClick={() => openWhatsApp('01225565645')}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md bg-green-500/10 text-green-500"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Legal Links */}
            <div className="space-y-3 text-center md:text-right">
              <Link 
                to="/terms" 
                className="block hover:opacity-70 transition-opacity text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t('footer.terms')}
              </Link>
              <Link 
                to="/privacy" 
                className="block hover:opacity-70 transition-opacity text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t('footer.privacy')}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Hossam Fekry © {currentYear} — {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};