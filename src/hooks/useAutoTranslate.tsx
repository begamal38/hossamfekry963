import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TranslationResult {
  translatedText: string;
  error?: string;
}

export const useAutoTranslate = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const translateText = async (
    text: string, 
    targetLanguage: 'en' | 'ar' = 'en'
  ): Promise<string> => {
    if (!text || text.trim() === '') {
      return '';
    }

    setIsTranslating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke<TranslationResult>('translate-content', {
        body: { text, targetLanguage }
      });

      if (error) {
        console.error('Translation error:', error);
        toast({
          title: targetLanguage === 'en' ? 'Translation failed' : 'فشلت الترجمة',
          description: error.message,
          variant: 'destructive',
        });
        return '';
      }

      if (data?.error) {
        toast({
          title: targetLanguage === 'en' ? 'Translation failed' : 'فشلت الترجمة',
          description: data.error,
          variant: 'destructive',
        });
        return '';
      }

      return data?.translatedText || '';
    } catch (err) {
      console.error('Translation error:', err);
      return '';
    } finally {
      setIsTranslating(false);
    }
  };

  const translateMultiple = async (
    texts: Record<string, string>,
    targetLanguage: 'en' | 'ar' = 'en'
  ): Promise<Record<string, string>> => {
    const results: Record<string, string> = {};
    
    setIsTranslating(true);
    
    try {
      const translations = await Promise.all(
        Object.entries(texts).map(async ([key, value]) => {
          if (!value || value.trim() === '') {
            return { key, translated: '' };
          }
          const translated = await translateText(value, targetLanguage);
          return { key, translated };
        })
      );
      
      translations.forEach(({ key, translated }) => {
        results[key] = translated;
      });
    } finally {
      setIsTranslating(false);
    }
    
    return results;
  };

  return {
    translateText,
    translateMultiple,
    isTranslating
  };
};
