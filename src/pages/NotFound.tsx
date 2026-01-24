import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-background px-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="text-center space-y-4">
        <div className="text-8xl font-bold text-primary/20">404</div>
        <h1 className="text-2xl font-bold text-foreground">
          {isArabic ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          {isArabic 
            ? 'الصفحة اللي بتدور عليها مش موجودة أو تم نقلها'
            : "The page you're looking for doesn't exist or has been moved"
          }
        </p>
        <Button asChild className="mt-4 gap-2">
          <Link to="/">
            <Home className="w-4 h-4" />
            {isArabic ? 'الرجوع للرئيسية' : 'Back to Home'}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
