import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Megaphone, Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Facebook video embeds - ordered newest to oldest (using show_text=0 like hossamfikry.com)
const campaignEmbeds = [
  {
    id: '1',
    embedUrl: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F1466086481102708%2F&show_text=0&width=560',
    height: 315,
  },
  {
    id: '2',
    embedUrl: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F1645805469670530%2F&show_text=0&width=560',
    height: 315,
  },
  {
    id: '3',
    embedUrl: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F3216287765309530%2F&show_text=0&width=560',
    height: 315,
  },
  {
    id: '4',
    embedUrl: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F946314697237044%2F&show_text=0&width=560',
    height: 315,
  },
  {
    id: '5',
    embedUrl: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F740433731779516%2F&show_text=0&width=560',
    height: 315,
  },
  {
    id: '6',
    embedUrl: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F684687554336661%2F&show_text=0&width=560',
    height: 315,
  },
  {
    id: '7',
    embedUrl: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F1312763949751940%2F&show_text=0&width=560',
    height: 301,
  },
];

interface VideoCardProps {
  embed: typeof campaignEmbeds[0];
  index: number;
}

const VideoCard = ({ embed, index }: VideoCardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div 
        className="group relative animate-fade-in"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 via-primary/30 to-primary/50 rounded-2xl blur-sm opacity-60" />
        
        <div className="relative bg-card rounded-2xl overflow-hidden border border-primary/20">
          <div 
            className="w-full flex items-center justify-center bg-muted/30 aspect-video"
          >
            <p className="text-muted-foreground text-sm">
              هذا المحتوى غير متاح حاليًا
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group relative animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glow effect - subtle by default, stronger on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 rounded-2xl blur-sm opacity-50 group-hover:opacity-80 transition-opacity duration-300" />
      
      {/* Card container */}
      <div className="relative bg-card rounded-2xl overflow-hidden border border-primary/20 group-hover:border-primary/40 transition-all duration-300 shadow-lg group-hover:shadow-primary/20">
        {isLoading && (
          <div className="w-full aspect-video">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        <iframe
          src={embed.embedUrl}
          width="100%"
          height={embed.height}
          style={{ 
            border: 'none', 
            overflow: 'hidden',
            display: isLoading ? 'none' : 'block'
          }}
          scrolling="no"
          frameBorder="0"
          allowFullScreen={true}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className="w-full"
        />
      </div>
    </div>
  );
};

const VideoSkeleton = ({ index }: { index: number }) => (
  <div 
    className="relative animate-fade-in"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    {/* Glow effect */}
    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 rounded-2xl blur-sm opacity-40" />
    
    <div className="relative bg-card rounded-2xl overflow-hidden border border-primary/20">
      <Skeleton className="w-full aspect-video" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="relative">
      {/* Glow behind icon */}
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 border border-primary/30">
        <Megaphone className="w-10 h-10 text-primary" />
      </div>
    </div>
    <p className="text-xl font-medium text-foreground mb-2">
      سيتم إضافة الحملات قريبًا
    </p>
    <p className="text-muted-foreground text-sm">
      تابعنا على فيسبوك لمشاهدة أحدث الحملات
    </p>
  </div>
);

const Campaigns = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir="rtl">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header with brand styling */}
          <header className="text-center mb-12">
            {/* Icon with glow */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl scale-150" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
                <Play className="w-7 h-7 text-primary-foreground fill-primary-foreground mr-[-2px]" />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              حملاتنا الإعلانية
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
              شوف إعلاناتنا اللي الطلبة شافوها وتفاعلوا معاها
            </p>
            
            {/* Decorative line */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
              <div className="w-2 h-2 rounded-full bg-primary/60" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
          </header>

          {/* Video Grid - 2 columns on desktop, 1 on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => (
                <VideoSkeleton key={index} index={index} />
              ))
            ) : campaignEmbeds.length === 0 ? (
              // Empty state
              <EmptyState />
            ) : (
              // Video cards with staggered animation
              campaignEmbeds.map((embed, index) => (
                <VideoCard key={embed.id} embed={embed} index={index} />
              ))
            )}
          </div>
          
          {/* Footer text */}
          {!isLoading && campaignEmbeds.length > 0 && (
            <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '700ms' }}>
              <p className="text-muted-foreground text-sm">
                تابعنا على{' '}
                <a 
                  href="https://www.facebook.com/mr.hossamfekry" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  فيسبوك
                </a>
                {' '}لمشاهدة المزيد
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Campaigns;
