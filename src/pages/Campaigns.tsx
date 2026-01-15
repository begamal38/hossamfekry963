import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Megaphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Campaign data with metadata - sorted newest to oldest by publishDate
interface Campaign {
  id: string;
  videoUrl: string;
  publishDate: string; // ISO date string for sorting
  campaignType: 'traffic' | 'awareness' | 'free_trial';
  targetGrade: 'second_secondary_languages' | 'third_secondary_languages';
  status: 'active' | 'ended';
}

const campaignsData: Campaign[] = [
  {
    id: '1',
    videoUrl: 'https://www.facebook.com/share/v/1GEZxLGqjC/',
    publishDate: '2025-01-15',
    campaignType: 'awareness' as const,
    targetGrade: 'third_secondary_languages' as const,
    status: 'active' as const,
  },
  {
    id: '2',
    videoUrl: 'https://www.facebook.com/share/v/1EyXUbUz6b/',
    publishDate: '2025-01-12',
    campaignType: 'traffic' as const,
    targetGrade: 'third_secondary_languages' as const,
    status: 'active' as const,
  },
  {
    id: '3',
    videoUrl: 'https://www.facebook.com/share/v/17vsujXPGJ/',
    publishDate: '2025-01-10',
    campaignType: 'free_trial' as const,
    targetGrade: 'second_secondary_languages' as const,
    status: 'active' as const,
  },
  {
    id: '4',
    videoUrl: 'https://www.facebook.com/share/v/1CaEUm7BRk/',
    publishDate: '2025-01-08',
    campaignType: 'awareness' as const,
    targetGrade: 'third_secondary_languages' as const,
    status: 'ended' as const,
  },
  {
    id: '5',
    videoUrl: 'https://www.facebook.com/share/v/1A8wThsHhU/',
    publishDate: '2025-01-05',
    campaignType: 'traffic' as const,
    targetGrade: 'second_secondary_languages' as const,
    status: 'ended' as const,
  },
  {
    id: '6',
    videoUrl: 'https://www.facebook.com/share/v/1AQ1Xb7Upi/',
    publishDate: '2025-01-03',
    campaignType: 'free_trial' as const,
    targetGrade: 'third_secondary_languages' as const,
    status: 'ended' as const,
  },
  {
    id: '7',
    videoUrl: 'https://www.facebook.com/share/v/17y6ePUgzv/',
    publishDate: '2025-01-01',
    campaignType: 'awareness' as const,
    targetGrade: 'second_secondary_languages' as const,
    status: 'ended' as const,
  },
];

// Sort campaigns newest to oldest
const campaigns = [...campaignsData].sort(
  (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
);

const getCampaignTypeLabel = (type: Campaign['campaignType']): string => {
  const labels: Record<Campaign['campaignType'], string> = {
    traffic: 'Traffic',
    awareness: 'Awareness',
    free_trial: 'Free Trial',
  };
  return labels[type];
};

const getTargetGradeLabel = (grade: Campaign['targetGrade']): string => {
  const labels: Record<Campaign['targetGrade'], string> = {
    second_secondary_languages: 'تانية ثانوي لغات',
    third_secondary_languages: 'تالتة ثانوي لغات',
  };
  return labels[grade];
};

const getStatusLabel = (status: Campaign['status']): string => {
  return status === 'active' ? 'نشطة' : 'منتهية';
};

const getStatusColor = (status: Campaign['status']): string => {
  return status === 'active' 
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
    : 'bg-muted text-muted-foreground';
};

// Convert Facebook share URL to embed URL
const getEmbedUrl = (shareUrl: string): string => {
  const encodedUrl = encodeURIComponent(shareUrl);
  return `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=560`;
};

interface CampaignCardProps {
  campaign: Campaign;
}

const CampaignCard = ({ campaign }: CampaignCardProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Video Embed Container */}
      <div className="relative w-full aspect-video bg-muted">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        <iframe
          src={getEmbedUrl(campaign.videoUrl)}
          width="100%"
          height="100%"
          style={{ border: 'none', overflow: 'hidden' }}
          scrolling="no"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          className="absolute inset-0 w-full h-full"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Campaign Metadata */}
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {/* Campaign Type */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {getCampaignTypeLabel(campaign.campaignType)}
          </span>
          
          {/* Target Grade */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
            {getTargetGradeLabel(campaign.targetGrade)}
          </span>
          
          {/* Status */}
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
            {getStatusLabel(campaign.status)}
          </span>
        </div>
      </div>
    </div>
  );
};

const CampaignSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden">
    <Skeleton className="w-full aspect-video" />
    <div className="p-4">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <Megaphone className="w-8 h-8 text-muted-foreground" />
    </div>
    <p className="text-lg text-muted-foreground">
      سيتم إضافة الحملات قريبًا
    </p>
  </div>
);

const Campaigns = () => {
  const { isRTL } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Page Header - Simple & Clean */}
          <header className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              حملاتنا الإعلانية
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              شوف إعلاناتنا اللي الطلبة شافوها وتفاعلوا معاها
            </p>
          </header>

          {/* Campaign Feed */}
          <div className="space-y-6">
            {isLoading ? (
              // Loading Skeletons
              <>
                <CampaignSkeleton />
                <CampaignSkeleton />
                <CampaignSkeleton />
              </>
            ) : campaigns.length === 0 ? (
              // Empty State
              <EmptyState />
            ) : (
              // Campaign Cards - Sorted newest to oldest
              campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
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
