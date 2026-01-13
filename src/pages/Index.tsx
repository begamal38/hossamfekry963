import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { CoursesSection } from '@/components/home/CoursesSection';
import { ProgressPreviewSection } from '@/components/home/ProgressPreviewSection';
import { PressSection } from '@/components/home/PressSection';
import { SocialProofSection } from '@/components/home/SocialProofSection';
import { TechnologySection } from '@/components/home/TechnologySection';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading: roleLoading, hasAttemptedFetch, canAccessDashboard } = useUserRole();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Staff must land on assistant platform only.
  // IMPORTANT: do NOT redirect while roles are still loading.
  useEffect(() => {
    if (!user) return;
    if (roleLoading || !hasAttemptedFetch) return;

    if (canAccessDashboard()) {
      navigate('/assistant-transition', { replace: true });
    }
  }, [user, roleLoading, hasAttemptedFetch, canAccessDashboard, navigate]);

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
        {/* 1. Hero: أنا فين؟ - Single message + Single CTA */}
        <HeroSection />
        
        {/* 2. Social Proof: Story-based trust (scroll reveal) */}
        <SocialProofSection />
        
        {/* 3. Technology: Platform strength - Focus Mode, structure */}
        <TechnologySection />
        
        {/* 4. Courses: أعمل إيه دلوقتي؟ - Clear next action */}
        <CoursesSection />
        
        {/* 5. Progress: What you'll achieve (depth on scroll) */}
        <ProgressPreviewSection />
        
        {/* 6. Press: External validation (depth on scroll) */}
        <PressSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
