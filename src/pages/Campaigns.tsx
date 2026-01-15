import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Megaphone, Play, BookOpen, GraduationCap, Info, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

// Facebook video embeds - ordered newest to oldest
const campaignEmbeds = [
  {
    id: '1',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/1466086481102708/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F1466086481102708%2F&show_text=true&width=560',
  },
  {
    id: '2',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/1645805469670530/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F1645805469670530%2F&show_text=true&width=560',
  },
  {
    id: '3',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/3216287765309530/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F3216287765309530%2F&show_text=true&width=560',
  },
  {
    id: '4',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/946314697237044/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F946314697237044%2F&show_text=true&width=560',
  },
  {
    id: '5',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/740433731779516/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F740433731779516%2F&show_text=true&width=560',
  },
  {
    id: '6',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/684687554336661/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F684687554336661%2F&show_text=true&width=560',
  },
  {
    id: '7',
    postUrl: 'https://www.facebook.com/mr.hossamfekry/videos/1312763949751940/',
    embedUrl:
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F1312763949751940%2F&show_text=true&width=560',
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
      { rootMargin: '200px' }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  if (hasError) {
    return (
      <div
        ref={cardRef}
        className="group relative animate-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 via-primary/30 to-primary/50 rounded-2xl blur-sm opacity-60" />
        <div className="relative bg-card rounded-2xl overflow-hidden border border-primary/20">
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
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 rounded-2xl blur-sm opacity-50 group-hover:opacity-80 transition-opacity duration-300" />

      {/* Card container */}
      <div className="relative bg-card rounded-2xl overflow-hidden border border-primary/20 group-hover:border-primary/40 transition-all duration-300 shadow-lg group-hover:shadow-primary/20">
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
            className="w-full aspect-auto min-h-[400px] md:min-h-[520px]"
          />
        )}
      </div>

      {/* Safe open action */}
      <div className="relative mt-3 flex justify-end">
        <a
          href={embed.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          {t('campaigns.openPost')}
        </a>
      </div>
    </div>
  );
};

const VideoSkeleton = ({ index }: { index: number }) => (
  <div className="relative animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 rounded-2xl blur-sm opacity-40" />
    <div className="relative bg-card rounded-2xl overflow-hidden border border-primary/20">
      <Skeleton className="w-full aspect-video" />
    </div>
  </div>
);

interface EmptyStateProps {
  t: (key: string) => string;
}

const EmptyState = ({ t }: EmptyStateProps) => (
  <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="relative">
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 border border-primary/30">
        <Megaphone className="w-10 h-10 text-primary" />
      </div>
    </div>
    <p className="text-xl font-medium text-foreground mb-2">{t('campaigns.empty')}</p>
    <p className="text-muted-foreground text-sm">{t('campaigns.emptySubtitle')}</p>
  </div>
);

const Campaigns = () => {
  const { t, isRTL, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Much faster initial load - just a frame to let skeleton render
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'} lang={language}>
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <header className="text-center mb-10">
            <div className="relative inline-flex items-center justify-center mb-5">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl scale-150" />
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
                <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground" style={{ marginInlineStart: '2px' }} />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t('campaigns.title')}</h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">{t('campaigns.subtitle')}</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-primary/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
          </header>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => <VideoSkeleton key={index} index={index} />)
            ) : campaignEmbeds.length === 0 ? (
              <EmptyState t={t} />
            ) : (
              campaignEmbeds.map((embed, index) => <VideoCard key={embed.id} embed={embed} index={index} t={t} />)
            )}
          </div>

          {/* Next actions */}
          {!isLoading && campaignEmbeds.length > 0 && (
            <section className="mt-10 animate-fade-in" style={{ animationDelay: '400ms' }} aria-label={t('campaigns.nextTitle')}>
              <div className="relative rounded-2xl border border-primary/15 bg-card overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/25 via-primary/10 to-primary/25 blur-sm opacity-50" />
                <div className="relative p-5 md:p-6">
                  <div className="text-center mb-5">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">{t('campaigns.nextTitle')}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{t('campaigns.nextSubtitle')}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button asChild variant="secondary" className="h-auto py-3 justify-start">
                      <Link to="/free-lessons" className="w-full flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <span className="font-medium text-foreground">{t('nav.freeLessons')}</span>
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" className="h-auto py-3 justify-start">
                      <Link to="/courses" className="w-full flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-primary" />
                        <span className="font-medium text-foreground">{t('nav.courses')}</span>
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" className="h-auto py-3 justify-start">
                      <Link to="/about" className="w-full flex items-center gap-3">
                        <Info className="w-5 h-5 text-primary" />
                        <span className="font-medium text-foreground">{t('nav.about')}</span>
                      </Link>
                    </Button>
                  </div>
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
