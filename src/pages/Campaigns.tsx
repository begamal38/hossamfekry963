import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Megaphone, Users, TrendingUp, Award, Play, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Campaigns = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const campaigns = [
    {
      id: 1,
      title: isArabic ? 'عرض بداية العام الدراسي' : 'Back to School Offer',
      description: isArabic 
        ? 'خصم 30% على جميع الكورسات عند التسجيل في أول أسبوعين من العام الدراسي'
        : '30% off all courses when enrolling in the first two weeks of the school year',
      discount: '30%',
      status: isArabic ? 'نشط' : 'Active',
      endDate: '2025-09-30',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop',
    },
    {
      id: 2,
      title: isArabic ? 'باقة التفوق' : 'Excellence Package',
      description: isArabic 
        ? 'اشترك في 3 كورسات واحصل على الرابع مجاناً - عرض لفترة محدودة'
        : 'Subscribe to 3 courses and get the 4th one free - Limited time offer',
      discount: isArabic ? 'كورس مجاني' : 'Free Course',
      status: isArabic ? 'نشط' : 'Active',
      endDate: '2025-12-31',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop',
    },
    {
      id: 3,
      title: isArabic ? 'مكافأة الإحالة' : 'Referral Reward',
      description: isArabic 
        ? 'احصل على خصم 20% لك ولصديقك عند دعوته للتسجيل معنا'
        : 'Get 20% off for you and your friend when you invite them to join',
      discount: '20%',
      status: isArabic ? 'دائم' : 'Ongoing',
      endDate: null,
      image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop',
    },
  ];

  const stats = [
    {
      icon: Users,
      value: '5000+',
      label: isArabic ? 'طالب مستفيد' : 'Students Benefited',
    },
    {
      icon: TrendingUp,
      value: '85%',
      label: isArabic ? 'نسبة النجاح' : 'Success Rate',
    },
    {
      icon: Award,
      value: '50+',
      label: isArabic ? 'حملة ناجحة' : 'Successful Campaigns',
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Megaphone className="w-5 h-5" />
              <span className="text-sm font-medium">
                {isArabic ? 'عروض حصرية' : 'Exclusive Offers'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {isArabic ? 'حملاتنا الإعلانية' : 'Our Campaigns'}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {isArabic 
                ? 'استفد من عروضنا الحصرية وابدأ رحلة التفوق في الكيمياء بأسعار مميزة'
                : 'Take advantage of our exclusive offers and start your chemistry excellence journey at special prices'}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground mb-2">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Campaigns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign) => (
              <div 
                key={campaign.id}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={campaign.image} 
                    alt={campaign.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-primary-foreground text-lg px-3 py-1">
                      {campaign.discount}
                    </Badge>
                  </div>
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-green-500/90 text-white">
                      {campaign.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {campaign.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {campaign.description}
                  </p>
                  
                  {campaign.endDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {isArabic ? 'ينتهي في: ' : 'Ends: '}
                        {new Date(campaign.endDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                  )}
                  
                  <Button className="w-full gap-2">
                    <Play className="w-4 h-4" />
                    {isArabic ? 'استفد من العرض' : 'Claim Offer'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {isArabic ? 'لا تفوت عروضنا القادمة!' : "Don't Miss Our Upcoming Offers!"}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              {isArabic 
                ? 'سجل معنا الآن لتصلك إشعارات بأحدث العروض والخصومات الحصرية'
                : 'Sign up now to receive notifications about our latest offers and exclusive discounts'}
            </p>
            <Button size="lg" asChild>
              <a href="/auth">
                {isArabic ? 'سجل الآن' : 'Sign Up Now'}
              </a>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Campaigns;
