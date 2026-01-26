import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';
import logo from '@/assets/logo.png';
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
      className="relative border-t border-border/30 mt-16 overflow-hidden" 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Brand gradient background - Vodafone-inspired clean gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-primary/[0.04] dark:from-background dark:via-muted/10 dark:to-primary/[0.08]" />
      
      {/* Subtle chemistry-inspired pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20">
        {/* Molecular grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.06) 0%, transparent 50%), 
                           radial-gradient(circle at 80% 20%, hsl(var(--accent) / 0.05) 0%, transparent 50%)`,
        }} />
      </div>
      
      {/* Content container with proper mobile bottom padding for nav clearance */}
      <div className="relative container mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-16 pb-28 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 text-center md:text-right">
          
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
              {/* Phone Numbers - Side by side with official WhatsApp icon */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
                <button 
                  onClick={() => openWhatsApp('01225565645')}
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity text-sm group text-muted-foreground"
                >
                  {/* Official WhatsApp Brand Logo */}
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-5 h-5 group-hover:scale-110 transition-transform fill-[#25D366]"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
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
            {/* Social Media Icons - Facebook & Instagram only (WhatsApp is in Contact section) */}
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

        {/* Bottom Bar - Copyright & Attribution */}
        <div className="mt-12 pt-6 border-t border-border/40 text-center space-y-2">
          {/* Copyright Line */}
          <p className="text-sm text-muted-foreground/70">
            Hossam Fekry © {currentYear} — {t('footer.rights')}
          </p>
          
          {/* Powered By - ONLY ONCE, readable but unobtrusive */}
          <button 
            onClick={() => window.open('https://wa.me/201000788628', '_blank')}
            className="text-[0.65rem] font-normal text-muted-foreground/35 hover:text-muted-foreground/55 transition-colors duration-200 cursor-pointer pb-safe"
            aria-label="Powered by Belal Gamal"
          >
            Powered by Belal Gamal
          </button>
        </div>
      </div>
    </footer>
  );
};