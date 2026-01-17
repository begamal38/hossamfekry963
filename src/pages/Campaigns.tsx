import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Megaphone, Play, BookOpen, GraduationCap, Info, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

// Facebook video embeds - ordered newest to oldest
// Note: Facebook embed automatically shows real engagement (likes, comments, shares)
const campaignEmbeds = [
  {
    id: '1',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/1466086481102708/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F1466086481102708%2F&show_text=false&width=500',
  },
  {
    id: '2',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/1645805469670530/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F1645805469670530%2F&show_text=false&width=500',
  },
  {
    id: '3',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/3216287765309530/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F3216287765309530%2F&show_text=false&width=500',
  },
  {
    id: '4',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/946314697237044/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F946314697237044%2F&show_text=false&width=500',
  },
  {
    id: '5',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/740433731779516/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F740433731779516%2F&show_text=false&width=500',
  },
  {
    id: '6',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/684687554336661/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F684687554336661%2F&show_text=false&width=500',
  },
  {
    id: '7',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/1312763949751940/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F1312763949751940%2F&show_text=false&width=500',
  },
];

interface VideoCardProps {
  embed: (typeof campaignEmbeds)[0];
  index: number;
  t: (key: string) => string;
}

const VideoCard = ({ embed, index, t }: VideoCardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Lazy load: only render iframe when card is in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  if (hasError) {
    return (
      <div
        ref={cardRef}
        className="group relative animate-fade-in"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div className="relative bg-card rounded-xl overflow-hidden border border-border">
          <div className="w-full flex items-center justify-center bg-muted/30 aspect-video">
            <p className="text-muted-foreground text-sm">{t('campaigns.unavailable')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="group relative animate-fade-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Card container - compact design */}
      <div className="relative bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-colors duration-200 shadow-sm hover:shadow-md">
        {/* Show skeleton until iframe is loaded */}
        {(isLoading || !isInView) && (
          <div className="w-full aspect-video">
            <Skeleton className="w-full h-full" />
          </div>
        )}

        {isInView && (
          <iframe
            src={embed.embedUrl}
            width="100%"
            height="280"
            style={{
              border: 'none',
              overflow: 'hidden',
              display: isLoading ? 'none' : 'block',
            }}
            scrolling="no"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}

        {/* Overlay link to open in Facebook */}
        <a
          href={embed.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 end-2 p-2 bg-background/80 backdrop-blur-sm rounded-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background"
          title={t('campaigns.openPost')}
        >
          <ExternalLink className="w-4 h-4 text-foreground" />
        </a>
      </div>
    </div>
  );
};

const VideoSkeleton = ({ index }: { index: number }) => (
  <div className="relative animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
    <div className="relative bg-card rounded-xl overflow-hidden border border-border">
      <Skeleton className="w-full aspect-video" />
    </div>
  </div>
);

interface EmptyStateProps {
  t: (key: string) => string;
}

const EmptyState = ({ t }: EmptyStateProps) => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <Megaphone className="w-8 h-8 text-muted-foreground" />
    </div>
    <p className="text-lg font-medium text-foreground mb-1">{t('campaigns.empty')}</p>
    <p className="text-muted-foreground text-sm">{t('campaigns.emptySubtitle')}</p>
  </div>
);

const Campaigns = () => {
  const { t, isRTL, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fast initial load
    const timer = setTimeout(() => setIsLoading(false), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'} lang={language}>
      <Navbar />

      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header - compact */}
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Play className="w-5 h-5 text-primary" style={{ marginInlineStart: '2px' }} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">{t('campaigns.title')}</h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">{t('campaigns.subtitle')}</p>
          </header>

          {/* Video Grid - 3 columns on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => <VideoSkeleton key={index} index={index} />)
            ) : campaignEmbeds.length === 0 ? (
              <EmptyState t={t} />
            ) : (
              campaignEmbeds.map((embed, index) => <VideoCard key={embed.id} embed={embed} index={index} t={t} />)
            )}
          </div>

          {/* Next actions - compact */}
          {!isLoading && campaignEmbeds.length > 0 && (
            <section className="mt-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                <div className="text-center mb-4">
                  <h2 className="text-base font-semibold text-foreground">{t('campaigns.nextTitle')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Button asChild variant="ghost" size="sm" className="h-10 justify-start">
                    <Link to="/free-lessons" className="w-full flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="text-sm">{t('nav.freeLessons')}</span>
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="h-10 justify-start">
                    <Link to="/courses" className="w-full flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span className="text-sm">{t('nav.courses')}</span>
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="h-10 justify-start">
                    <Link to="/about" className="w-full flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      <span className="text-sm">{t('nav.about')}</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Campaigns;
