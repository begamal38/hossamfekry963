import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import logo from '@/assets/logo.png';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t border-border" dir="rtl">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img 
                src={logo} 
                alt="Hossam Fekry" 
                className="h-14 w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
              منصتك الكاملة لفهم الكيمياء بشكل حقيقي،
              <br />
              مُصممة لطلاب الثانوية العامة.
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-base">تواصل معنا</h4>
            <div className="space-y-3">
              <a 
                href="tel:+201225565645" 
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm group"
              >
                <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span dir="ltr">01225565645</span>
              </a>
              <a 
                href="tel:+201116218299" 
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm group"
              >
                <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span dir="ltr">01116218299</span>
              </a>
              <a 
                href="mailto:contact@hossamfekry.com" 
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm group"
              >
                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span dir="ltr">contact@hossamfekry.com</span>
              </a>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4" />
                <span>القاهرة – مصر</span>
              </div>
            </div>
          </div>

          {/* Social Media & Legal */}
          <div className="space-y-6">
            {/* Social Media Icons */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground text-base">تابعنا</h4>
              <div className="flex items-center gap-4">
                <a 
                  href="https://www.facebook.com/mr.hossamfekry" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href="https://www.instagram.com/hossamfekry963" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Legal Links */}
            <div className="space-y-2">
              <Link 
                to="/terms" 
                className="block text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                شروط الخدمة
              </Link>
              <Link 
                to="/privacy" 
                className="block text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                سياسة الخصوصية
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-center text-muted-foreground text-xs">
            © {currentYear} Hossam Fekry. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};
