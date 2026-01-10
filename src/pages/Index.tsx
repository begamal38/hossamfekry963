import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { CoursesSection } from '@/components/home/CoursesSection';
import { ProgressPreviewSection } from '@/components/home/ProgressPreviewSection';
import { PressSection } from '@/components/home/PressSection';
import { SocialProofSection } from '@/components/home/SocialProofSection';
import { TechnologySection } from '@/components/home/TechnologySection';
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
        {/* 1. Hero: أنا فين؟ - Clear platform identity */}
        <HeroSection />
        
        {/* 2. Social Proof: ليه مختلفة؟ - Trust through relatability */}
        <SocialProofSection />
        
        {/* 3. Courses: أعمل إيه دلوقتي؟ - Clear next action */}
        <CoursesSection />
        
        {/* 4. Technology: إزاي؟ - System details after trust */}
        <TechnologySection />
        
        {/* 5. Press: External validation */}
        <PressSection />
        
        {/* 6. Progress: What you'll achieve */}
        <ProgressPreviewSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
