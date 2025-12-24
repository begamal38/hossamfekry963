import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                <span className="text-primary-foreground font-bold text-lg">HF</span>
              </div>
              <span className="font-bold text-xl text-foreground">Hossam Fekry</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your complete platform to truly understand Chemistry. Built for Thanaweya Amma students.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('footer.contact')}</h4>
            <div className="space-y-3">
              <a href="mailto:contact@hossamfekry.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm">
                <Mail className="w-4 h-4" />
                contact@hossamfekry.com
              </a>
              <a href="tel:+201234567890" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm">
                <Phone className="w-4 h-4" />
                +20 123 456 7890
              </a>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4" />
                Cairo, Egypt
              </div>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <div className="space-y-3">
              <Link to="/terms" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                {t('footer.terms')}
              </Link>
              <Link to="/privacy" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                {t('footer.privacy')}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-center text-muted-foreground text-sm">
            © {currentYear} Hossam Fekry. {t('footer.rights')}.
          </p>
        </div>
      </div>
    </footer>
  );
};
