import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Megaphone, Facebook } from 'lucide-react';

declare global {
  interface Window {
    FB: {
      XFBML: {
        parse: () => void;
      };
    };
  }
}

const Campaigns = () => {
  const { t, isRTL } = useLanguage();

  // Facebook post URLs - يمكنك تغيير هذه الروابط بروابط المنشورات الفعلية
  const facebookPosts = [
    'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fpermalink.php%3Fstory_fbid%3D123456789%26id%3D123456789',
    'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fpermalink.php%3Fstory_fbid%3D123456789%26id%3D123456789',
    'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fpermalink.php%3Fstory_fbid%3D123456789%26id%3D123456789',
  ];

  useEffect(() => {
    // Load Facebook SDK
    const loadFacebookSDK = () => {
      if (document.getElementById('facebook-jssdk')) {
        if (window.FB) {
          window.FB.XFBML.parse();
        }
        return;
      }

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);
    };

    loadFacebookSDK();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Megaphone className="w-5 h-5" />
              <span className="text-sm font-medium">
                {t('campaigns.followUs')}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('campaigns.title')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('campaigns.subtitle')}
            </p>
          </div>

          {/* Facebook Info Banner */}
          <div className="bg-gradient-to-r from-blue-600/10 via-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6 mb-12 flex items-center justify-center gap-4">
            <Facebook className="w-8 h-8 text-blue-600" />
            <p className="text-foreground">
              {t('campaigns.facebookBanner')}
            </p>
          </div>

          {/* Facebook Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facebookPosts.map((postUrl, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
              >
                <iframe
                  src={postUrl}
                  width="100%"
                  height="500"
                  style={{ border: 'none', overflow: 'hidden' }}
                  scrolling="no"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  className="w-full"
                ></iframe>
              </div>
            ))}
          </div>

          {/* Placeholder Message */}
          <div className="mt-12 text-center bg-muted/50 rounded-2xl p-8">
            <p className="text-muted-foreground mb-4">
              {t('campaigns.note')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('campaigns.howToGet')}
            </p>
          </div>

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 md:p-12 text-center text-white">
            <Facebook className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t('campaigns.followTitle')}
            </h2>
            <p className="mb-6 opacity-90 max-w-xl mx-auto">
              {t('campaigns.followDesc')}
            </p>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors"
            >
              <Facebook className="w-5 h-5" />
              {t('campaigns.visitPage')}
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Campaigns;