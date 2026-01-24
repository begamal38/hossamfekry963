import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Bell, 
  CreditCard, 
  MessageCircle, 
  LogOut, 
  ChevronLeft,
  Shield,
  HelpCircle,
  BookOpen,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GRADE_LABELS, TRACK_LABELS } from '@/lib/gradeLabels';

interface ProfileMenuItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
  badgeColor?: string;
  danger?: boolean;
}

interface ProfileMenuSection {
  title: string;
  items: ProfileMenuItem[];
}

/**
 * Ana Vodafone-style Profile Page
 * Clean, sectioned, arrow-based navigation
 */
export const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { language } = useLanguage();
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  const isArabic = language === 'ar';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Get display name
  const displayName = profile?.full_name?.trim() || user?.email?.split('@')[0] || '';
  const firstName = displayName.split(' ')[0];
  
  // Get grade label
  const getGradeLabel = () => {
    if (!profile?.academic_year || !profile?.language_track) return null;
    const year = GRADE_LABELS[profile.academic_year];
    const track = TRACK_LABELS[profile.language_track];
    if (!year || !track) return null;
    return isArabic ? `${year.ar} - ${track.ar}` : `${year.en} - ${track.en}`;
  };

  const menuSections: ProfileMenuSection[] = [
    {
      title: isArabic ? 'الحساب' : 'Account',
      items: [
        {
          icon: User,
          label: isArabic ? 'معلومات الحساب' : 'Account Info',
          href: '/settings',
        },
        {
          icon: Shield,
          label: isArabic ? 'الأمان والخصوصية' : 'Security & Privacy',
          href: '/settings',
        },
        {
          icon: Smartphone,
          label: isArabic ? 'الأجهزة المتصلة' : 'Connected Devices',
          href: '/settings',
        },
      ],
    },
    {
      title: isArabic ? 'التعلّم' : 'Learning',
      items: [
        {
          icon: BookOpen,
          label: isArabic ? 'كورساتي' : 'My Courses',
          href: '/courses',
        },
        {
          icon: CreditCard,
          label: isArabic ? 'الاشتراكات والدفع' : 'Subscriptions & Payments',
          href: '/courses',
        },
      ],
    },
    {
      title: isArabic ? 'الإعدادات' : 'Settings',
      items: [
        {
          icon: Bell,
          label: isArabic ? 'الإشعارات' : 'Notifications',
          href: '/notifications',
        },
        {
          icon: Settings,
          label: isArabic ? 'إعدادات التطبيق' : 'App Settings',
          href: '/settings',
        },
      ],
    },
    {
      title: isArabic ? 'الدعم' : 'Support',
      items: [
        {
          icon: MessageCircle,
          label: isArabic ? 'تواصل معانا' : 'Contact Us',
          href: '/settings', // Will use messaging when available
        },
        {
          icon: HelpCircle,
          label: isArabic ? 'المساعدة' : 'Help',
          href: '/about',
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const gradeLabel = getGradeLabel();

  return (
    <div className={cn("space-y-6", isArabic && "rtl")} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Profile Header Card */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20 flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-primary" />
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">
              {displayName || (isArabic ? 'مرحباً' : 'Welcome')}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {user?.email}
            </p>
            {gradeLabel && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {gradeLabel}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-3 mt-4">
          <Button variant="default" size="sm" asChild className="flex-1">
            <Link to="/settings">
              {isArabic ? 'تعديل الحساب' : 'Edit Profile'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Menu Sections */}
      {menuSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">
            {section.title}
          </h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              const isLast = itemIndex === section.items.length - 1;
              
              const content = (
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 transition-colors",
                    "hover:bg-muted/50 active:bg-muted",
                    !isLast && "border-b border-border",
                    item.danger && "text-destructive"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    item.danger ? "bg-destructive/10" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      item.danger ? "text-destructive" : "text-muted-foreground"
                    )} />
                  </div>
                  
                  <span className={cn(
                    "flex-1 font-medium",
                    item.danger ? "text-destructive" : "text-foreground"
                  )}>
                    {item.label}
                  </span>
                  
                  {item.badge && (
                    <Badge variant="secondary" className={cn("text-xs", item.badgeColor)}>
                      {item.badge}
                    </Badge>
                  )}
                  
                  {!item.danger && (
                    <ChevronLeft className={cn(
                      "w-5 h-5 text-muted-foreground",
                      !isArabic && "rotate-180"
                    )} />
                  )}
                </div>
              );
              
              if (item.href) {
                return (
                  <Link key={itemIndex} to={item.href}>
                    {content}
                  </Link>
                );
              }
              
              if (item.onClick) {
                return (
                  <button key={itemIndex} onClick={item.onClick} className="w-full text-right">
                    {content}
                  </button>
                );
              }
              
              return <div key={itemIndex}>{content}</div>;
            })}
          </div>
        </div>
      ))}

      {/* Logout Section */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 transition-colors hover:bg-destructive/5 active:bg-destructive/10 text-destructive"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <span className="flex-1 font-medium text-right">
            {isArabic ? 'تسجيل الخروج' : 'Log Out'}
          </span>
        </button>
      </div>

    </div>
  );
};
