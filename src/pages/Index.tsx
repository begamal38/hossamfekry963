import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { CoursesSection } from '@/components/home/CoursesSection';
import { ProgressPreviewSection } from '@/components/home/ProgressPreviewSection';
import { PressSection } from '@/components/home/PressSection';
import { SocialProofSection } from '@/components/home/SocialProofSection';
import { SEOHead } from '@/components/seo/SEOHead';

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
      <main>
        <HeroSection />
        <FeaturesSection />
        <CoursesSection />
        <SocialProofSection />
        <PressSection />
        <ProgressPreviewSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
