import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Megaphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Facebook video embeds - ordered newest to oldest
const campaignEmbeds = [
  {
    id: '1',
    embedUrl: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F1466086481102708%2F&show_text=true&width=560&t=0',
    height: 429,
  },
  {
    id: '2',
    embedUrl: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F1645805469670530%2F&show_text=true&width=560&t=0',
    height: 429,
  },
  {
    id: '3',
    embedUrl: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F3216287765309530%2F&show_text=true&width=560&t=0',
    height: 429,
  },
  {
    id: '4',
    embedUrl: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F946314697237044%2F&show_text=true&width=560&t=0',
    height: 429,
  },
  {
    id: '5',
    embedUrl: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F740433731779516%2F&show_text=true&width=560&t=0',
    height: 429,
  },
  {
    id: '6',
    embedUrl: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F684687554336661%2F&show_text=true&width=560&t=0',
    height: 429,
  },
  {
    id: '7',
    embedUrl: 'https://www.facebook.com/plugins/video.php?height=300&href=https%3A%2F%2Fwww.facebook.com%2Fmr.hossamfekry%2Fvideos%2F1312763949751940%2F&show_text=true&width=560&t=0',
    height: 415,
  },
];

interface VideoCardProps {
  embed: typeof campaignEmbeds[0];
}

const VideoCard = ({ embed }: VideoCardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
        <div 
          className="w-full flex items-center justify-center bg-muted/30"
          style={{ minHeight: '300px' }}
        >
          <p className="text-muted-foreground text-sm">
            هذا المحتوى غير متاح حاليًا
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
      {isLoading && (
        <div className="w-full" style={{ minHeight: `${embed.height}px` }}>
          <Skeleton className="w-full h-full min-h-[300px]" />
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
      />
    </div>
  );
};

const VideoSkeleton = () => (
  <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
    <Skeleton className="w-full h-[400px]" />
  </div>
);

const EmptyState = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <Megaphone className="w-8 h-8 text-muted-foreground" />
    </div>
    <p className="text-lg text-muted-foreground">
      سيتم إضافة الحملات قريبًا
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
          {/* Simple Header */}
          <header className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              حملاتنا الإعلانية
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              شوف إعلاناتنا اللي الطلبة شافوها وتفاعلوا معاها
            </p>
          </header>

          {/* Video Grid - 2 columns on desktop, 1 on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => (
                <VideoSkeleton key={index} />
              ))
            ) : campaignEmbeds.length === 0 ? (
              // Empty state
              <EmptyState />
            ) : (
              // Video cards
              campaignEmbeds.map((embed) => (
                <VideoCard key={embed.id} embed={embed} />
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Campaigns;
