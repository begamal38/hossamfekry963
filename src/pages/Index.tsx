import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { CoursesSection } from '@/components/home/CoursesSection';
import { ProgressPreviewSection } from '@/components/home/ProgressPreviewSection';
import { PressSection } from '@/components/home/PressSection';
import { SocialProofSection } from '@/components/home/SocialProofSection';
import { TechnologySection } from '@/components/home/TechnologySection';
import { TopStudentsStrip } from '@/components/home/TopStudentsStrip';
import { IndigoAccentStrip } from '@/components/home/IndigoAccentStrip';
import { SEOHead } from '@/components/seo/SEOHead';
import { WelcomeOnboarding } from '@/components/onboarding/WelcomeOnboarding';
import { AppPromotionBanner } from '@/components/promotion/AppPromotionBanner';

const Index: React.FC = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen bg-background pb-mobile-nav">
      <SEOHead 
        title="Hossam Fekry Platform – Chemistry for Thanaweya Amma"
        titleAr="منصة حسام فكري – شرح الكيمياء للثانوية العامة عربي ولغات"
        description="Clear explanations, practical applications, and smart assessments for Thanaweya Amma Chemistry. Complete Egyptian curriculum with personalized tracking."
        descriptionAr="شرح واضح، تطبيق عملي، واختبارات ذكية في الكيمياء للثانوية العامة عربي ولغات. منهج مصري متكامل مع متابعة شخصية."
        canonical="https://hossamfekry.com"
      />
      <Navbar />
      
      {/* Light PWA promotion - non-intrusive, frequency-controlled */}
      <AppPromotionBanner variant="inline" />
      
      <main className="content-appear">
        {/* 1. Hero: أنا فين؟ - Single message + Single CTA */}
        <HeroSection />
        
        {/* 2. Social Proof: Story-based trust (scroll reveal) */}
        <SocialProofSection />
        
        {/* Indigo accent for visual interest */}
        <IndigoAccentStrip variant="glow" />
        
        {/* Top Students Strip - Social proof between sections */}
        <TopStudentsStrip />
        
        {/* 3. Technology: Platform strength - Focus Mode, structure */}
        <TechnologySection />
        
        {/* Indigo wave accent */}
        <IndigoAccentStrip variant="wave" />
        
        {/* 4. Courses: أعمل إيه دلوقتي؟ - Clear next action */}
        <CoursesSection />
        
        {/* Top Students Strip - Repeat for visibility */}
        <TopStudentsStrip />
        
        {/* Subtle gradient accent */}
        <IndigoAccentStrip variant="gradient" />
        
        {/* 5. Progress: What you'll achieve (depth on scroll) */}
        <ProgressPreviewSection />
        
        {/* 6. Press: External validation (depth on scroll) */}
        <PressSection />
      </main>
      <Footer />
      
      {/* First-time user welcome onboarding (shows only once after signup) */}
      <WelcomeOnboarding />
    </div>
  );
};

export default Index;
