import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOHeadProps {
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  canonical?: string;
  noIndex?: boolean;
}

/**
 * SEOHead Component
 * Manages document head meta tags for SEO optimization.
 * Supports language-aware meta content based on current language setting.
 */
export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  titleAr,
  description,
  descriptionAr,
  ogImage = '/favicon.jpg',
  ogType = 'website',
  canonical,
  noIndex = false,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  // Default SEO content
  const defaultTitle = isArabic
    ? 'منصة حسام فكري – شرح الكيمياء للثانوية العامة عربي ولغات'
    : 'Hossam Fekry Platform – Chemistry for Thanaweya Amma';

  const defaultDescription = isArabic
    ? 'شرح واضح، تطبيق عملي، واختبارات ذكية في الكيمياء للثانوية العامة عربي ولغات. منهج مصري متكامل مع متابعة شخصية.'
    : 'Clear explanations, practical applications, and smart assessments for Thanaweya Amma Chemistry. Complete Egyptian curriculum with personalized tracking.';

  // Resolve final values based on language
  const finalTitle = isArabic ? (titleAr || title || defaultTitle) : (title || titleAr || defaultTitle);
  const finalDescription = isArabic ? (descriptionAr || description || defaultDescription) : (description || descriptionAr || defaultDescription);

  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Helper to update or create meta tag
    const updateMeta = (selector: string, content: string, createAttr?: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (element) {
        element.content = content;
      } else if (createAttr) {
        element = document.createElement('meta');
        const [attrName, attrValue] = createAttr.split('=');
        element.setAttribute(attrName, attrValue);
        element.content = content;
        document.head.appendChild(element);
      }
    };

    // Update meta description
    updateMeta('meta[name="description"]', finalDescription, 'name=description');

    // Update Open Graph tags
    updateMeta('meta[property="og:title"]', finalTitle, 'property=og:title');
    updateMeta('meta[property="og:description"]', finalDescription, 'property=og:description');
    updateMeta('meta[property="og:type"]', ogType, 'property=og:type');
    if (ogImage) {
      updateMeta('meta[property="og:image"]', ogImage, 'property=og:image');
    }

    // Update Twitter tags
    updateMeta('meta[name="twitter:title"]', finalTitle, 'name=twitter:title');
    updateMeta('meta[name="twitter:description"]', finalDescription, 'name=twitter:description');
    if (ogImage) {
      updateMeta('meta[name="twitter:image"]', ogImage, 'name=twitter:image');
    }

    // Handle canonical URL
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (canonicalLink) {
        canonicalLink.href = canonical;
      } else {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        canonicalLink.href = canonical;
        document.head.appendChild(canonicalLink);
      }
    }

    // Handle noIndex
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (noIndex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.name = 'robots';
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.content = 'noindex, nofollow';
    } else if (robotsMeta) {
      robotsMeta.content = 'index, follow';
    }

    // Update lang and dir attributes on html element
    const htmlElement = document.documentElement;
    htmlElement.lang = isArabic ? 'ar' : 'en';
    htmlElement.dir = isArabic ? 'rtl' : 'ltr';

    // Cleanup function (optional - reset to defaults on unmount)
    return () => {
      // Keep meta tags as they are - SPA will update them on route change
    };
  }, [finalTitle, finalDescription, ogImage, ogType, canonical, noIndex, isArabic]);

  return null; // This component only manages document head, doesn't render anything
};

export default SEOHead;

