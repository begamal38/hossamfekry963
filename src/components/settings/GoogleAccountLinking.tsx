import React, { useState, useEffect } from 'react';
import { Chrome, Link2, Link2Off, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GoogleLinkingState {
  isLinked: boolean;
  googleEmail: string | null;
  linkedAt: string | null;
  authMethods: string[];
  loading: boolean;
}

export const GoogleAccountLinking: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<GoogleLinkingState>({
    isLinked: false,
    googleEmail: null,
    linkedAt: null,
    authMethods: ['password'],
    loading: true,
  });
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  // Fetch current linking status
  useEffect(() => {
    const fetchLinkingStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('google_id, google_email, google_linked_at, auth_methods')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        
        setState({
          isLinked: !!data?.google_id,
          googleEmail: data?.google_email || null,
          linkedAt: data?.google_linked_at || null,
          authMethods: data?.auth_methods || ['password'],
          loading: false,
        });
      } catch (err) {
        console.error('Error fetching Google linking status:', err);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchLinkingStatus();
  }, [user]);

  // Handle Google account linking
  const handleLinkGoogle = async () => {
    if (!user) return;
    
    setLinking(true);
    
    try {
      // Use Supabase OAuth to get Google identity
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/settings?google_linked=pending`,
        }
      });
      
      if (error) {
        // Check if the error is about email mismatch or already linked
        if (error.message.includes('already linked') || error.message.includes('identity_already_exists')) {
          toast({
            variant: 'destructive',
            title: 'فشل الربط',
            description: 'حساب Google ده مربوط بحساب تاني.',
          });
          console.log('google_link_failed_already_linked', { user_id: user.id, timestamp: Date.now() });
        } else {
          throw error;
        }
        return;
      }
      
      // The user will be redirected to Google OAuth
      // After redirect back, we'll handle the linking in useEffect
    } catch (err: any) {
      console.error('Error linking Google account:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: err.message || 'فشل في ربط حساب Google',
      });
    } finally {
      setLinking(false);
    }
  };

  // Handle Google account unlinking
  const handleUnlinkGoogle = async () => {
    if (!user) return;
    
    // Check if password auth is available
    if (!state.authMethods.includes('password')) {
      toast({
        variant: 'destructive',
        title: 'غير مسموح',
        description: 'لازم يكون عندك طريقة تسجيل دخول بديلة.',
      });
      return;
    }
    
    setUnlinking(true);
    
    try {
      // Get user identities
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const googleIdentity = userData.user?.identities?.find(
        (identity) => identity.provider === 'google'
      );
      
      if (googleIdentity) {
        // Unlink the Google identity
        const { error: unlinkError } = await supabase.auth.unlinkIdentity(googleIdentity);
        
        if (unlinkError) throw unlinkError;
      }
      
      // Update profile to remove Google linking data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          google_id: null,
          google_email: null,
          google_linked_at: null,
          auth_methods: ['password'],
        })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      setState({
        isLinked: false,
        googleEmail: null,
        linkedAt: null,
        authMethods: ['password'],
        loading: false,
      });
      
      toast({
        title: 'تم إلغاء الربط',
        description: 'تم إلغاء ربط حساب Google بنجاح',
      });
      
      console.log('google_account_unlinked', { user_id: user.id, timestamp: Date.now() });
    } catch (err: any) {
      console.error('Error unlinking Google account:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: err.message || 'فشل في إلغاء ربط حساب Google',
      });
    } finally {
      setUnlinking(false);
    }
  };

  // Check for successful linking after OAuth redirect
  useEffect(() => {
    const checkGoogleLinking = async () => {
      if (!user) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const googleLinked = urlParams.get('google_linked');
      
      if (googleLinked === 'pending') {
        // Clean up URL
        window.history.replaceState({}, '', '/settings');
        
        try {
          // Get updated user data with identities
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) throw userError;
          
          const googleIdentity = userData.user?.identities?.find(
            (identity) => identity.provider === 'google'
          );
          
          if (googleIdentity) {
            const googleEmail = googleIdentity.identity_data?.email;
            const googleId = googleIdentity.id;
            
            // Validate email matches
            if (googleEmail && googleEmail !== user.email) {
              // Email mismatch - unlink and show error
              await supabase.auth.unlinkIdentity(googleIdentity);
              
              toast({
                variant: 'destructive',
                title: 'فشل الربط',
                description: 'الإيميل المستخدم في Google مختلف عن إيميل حسابك الحالي.',
              });
              
              console.log('google_link_failed_email_mismatch', { 
                user_id: user.id, 
                timestamp: Date.now(),
                account_email: user.email,
                google_email: googleEmail 
              });
              return;
            }
            
            // Update profile with Google linking data
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                google_id: googleId,
                google_email: googleEmail,
                google_linked_at: new Date().toISOString(),
                auth_methods: ['password', 'google'],
              })
              .eq('user_id', user.id);
            
            if (updateError) throw updateError;
            
            setState({
              isLinked: true,
              googleEmail: googleEmail,
              linkedAt: new Date().toISOString(),
              authMethods: ['password', 'google'],
              loading: false,
            });
            
            toast({
              title: 'تم الربط بنجاح ✔️',
              description: 'تم ربط حسابك مع Google. دلوقتي تقدر تسجل دخول بأي طريقة.',
            });
            
            console.log('google_account_linked', { 
              user_id: user.id, 
              timestamp: Date.now(),
              method: 'oauth_link'
            });
          }
        } catch (err) {
          console.error('Error completing Google linking:', err);
        }
      }
    };

    checkGoogleLinking();
  }, [user, toast]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Chrome className="w-5 h-5 text-primary" />
        تسجيل الدخول
      </h2>

      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl border border-border">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">ربط الحساب مع Google غير متاح حالياً</p>
          <p className="text-sm text-muted-foreground">
            حالياً النظام لا يدعم ربط حساب Google بحساب موجود. لو تحب تستخدم Google، استخدم تسجيل الدخول بـ Google من صفحة الدخول.
          </p>
          {state.isLinked && (
            <p className="text-sm text-muted-foreground">
              ملاحظة: حسابك ظاهر كـ «مربوط» بالفعل{state.googleEmail ? ` (${state.googleEmail})` : ''}.
            </p>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        تم إيقاف زر الربط داخل الإعدادات لتجنب ظهور رسالة الخطأ.
      </div>
    </div>
  );
};
