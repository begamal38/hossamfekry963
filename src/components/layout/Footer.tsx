import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import logo from '@/assets/logo.png';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="border-t mt-16" 
      dir="rtl"
      style={{ 
        backgroundColor: 'hsl(210, 100%, 95%)',
        borderTopColor: 'hsl(206, 60%, 79%)'
      }}
    >
      <div className="container mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 text-center md:text-right">
          
          {/* Brand Section */}
          <div className="space-y-5 flex flex-col items-center md:items-start">
            <Link to="/" className="inline-block">
              <img 
                src={logo} 
                alt="Hossam Fekry" 
                className="h-16 w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </Link>
            <p 
              className="text-sm leading-relaxed font-medium max-w-xs"
              style={{ color: 'hsl(210, 26%, 43%)' }}
            >
              منصتك الكاملة لفهم الكيمياء بشكل حقيقي
              <br />
              مصممة لطلاب الثانوية العامة.
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-5 flex flex-col items-center md:items-start">
            <h4 
              className="font-bold text-lg"
              style={{ color: 'hsl(212, 52%, 25%)' }}
            >
              تواصل معنا
            </h4>
            <div className="space-y-4">
              <a 
                href="tel:+201225565645" 
                className="flex items-center justify-center md:justify-start gap-3 hover:opacity-70 transition-opacity text-sm group"
                style={{ color: 'hsl(210, 26%, 43%)' }}
              >
                <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: 'hsl(212, 52%, 25%)' }} />
                <span dir="ltr" className="font-medium">01225565645</span>
              </a>
              <a 
                href="tel:+201116218299" 
                className="flex items-center justify-center md:justify-start gap-3 hover:opacity-70 transition-opacity text-sm group"
                style={{ color: 'hsl(210, 26%, 43%)' }}
              >
                <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: 'hsl(212, 52%, 25%)' }} />
                <span dir="ltr" className="font-medium">01116218299</span>
              </a>
              <a 
                href="mailto:contact@hossamfekry.com" 
                className="flex items-center justify-center md:justify-start gap-3 hover:opacity-70 transition-opacity text-sm group"
                style={{ color: 'hsl(210, 26%, 43%)' }}
              >
                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: 'hsl(212, 52%, 25%)' }} />
                <span dir="ltr" className="font-medium">contact@hossamfekry.com</span>
              </a>
              <div 
                className="flex items-center justify-center md:justify-start gap-3 text-sm"
                style={{ color: 'hsl(210, 26%, 43%)' }}
              >
                <MapPin className="w-5 h-5" style={{ color: 'hsl(212, 52%, 25%)' }} />
                <span className="font-medium">القاهرة – مصر</span>
              </div>
            </div>
          </div>

          {/* Social Media & Legal */}
          <div className="space-y-6 flex flex-col items-center md:items-start">
            {/* Social Media Icons */}
            <div className="space-y-4">
              <h4 
                className="font-bold text-lg text-center md:text-right"
                style={{ color: 'hsl(212, 52%, 25%)' }}
              >
                تابعنا
              </h4>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <a 
                  href="https://www.facebook.com/mr.hossamfekry" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md"
                  style={{ 
                    backgroundColor: 'hsl(210, 100%, 91%)',
                    color: 'hsl(212, 52%, 25%)'
                  }}
                  aria-label="Facebook"
                >
                  <Facebook className="w-6 h-6" />
                </a>
                <a 
                  href="https://www.instagram.com/hossamfekry963" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md"
                  style={{ 
                    backgroundColor: 'hsl(210, 100%, 91%)',
                    color: 'hsl(212, 52%, 25%)'
                  }}
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
                className="block hover:opacity-70 transition-opacity text-sm font-medium"
                style={{ color: 'hsl(210, 26%, 43%)' }}
              >
                شروط الخدمة
              </Link>
              <Link 
                to="/privacy" 
                className="block hover:opacity-70 transition-opacity text-sm font-medium"
                style={{ color: 'hsl(210, 26%, 43%)' }}
              >
                سياسة الخصوصية
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="mt-12 pt-6 border-t text-center"
          style={{ borderTopColor: 'hsl(206, 60%, 79%)' }}
        >
          <p 
            className="text-sm"
            style={{ color: 'hsl(210, 26%, 43%)' }}
          >
            Hossam Fekry © {currentYear} — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  );
};
