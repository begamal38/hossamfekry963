import { useState, useEffect } from 'react';
import { Smartphone, Monitor, Tablet, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface Device {
  id: string;
  device_name: string;
  browser_info: string;
  is_primary: boolean;
  first_seen_at: string;
  last_seen_at: string;
}

export const DeviceManagement = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [user]);

  const removeDevice = async (deviceId: string) => {
    try {
      // First end any sessions on this device
      await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          ended_reason: 'device_removed'
        })
        .eq('device_id', deviceId);

      // Then delete the device
      const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      toast({
        title: isRTL ? 'تم الحذف' : 'Removed',
        description: isRTL ? 'تم حذف الجهاز بنجاح' : 'Device removed successfully',
      });

      fetchDevices();
    } catch (error) {
      console.error('Error removing device:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل في حذف الجهاز' : 'Failed to remove device',
        variant: 'destructive',
      });
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.toLowerCase().includes('mobile')) {
      return <Smartphone className="h-5 w-5" />;
    } else if (deviceName.toLowerCase().includes('tablet')) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-muted rounded-lg"></div>
        <div className="h-20 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">
          {isRTL ? 'الأجهزة المسجلة' : 'Registered Devices'}
        </h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {isRTL 
          ? 'هذه قائمة بالأجهزة التي سجلت دخولك منها. يمكنك حذف الأجهزة التي لا تستخدمها.'
          : 'These are the devices you\'ve logged in from. You can remove devices you no longer use.'
        }
      </p>

      {devices.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {isRTL ? 'لا توجد أجهزة مسجلة' : 'No registered devices'}
        </p>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {getDeviceIcon(device.device_name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{device.device_name}</p>
                    {device.is_primary && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {isRTL ? 'الجهاز الأساسي' : 'Primary'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{device.browser_info}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'آخر نشاط: ' : 'Last active: '}
                    {formatDate(device.last_seen_at)}
                  </p>
                </div>
              </div>

              {!device.is_primary && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDevice(device.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        {isRTL 
          ? 'ملاحظة: لأسباب أمنية، يُسمح بجلسة واحدة نشطة فقط في كل مرة. إذا سجلت دخولك من جهاز آخر، ستنتهي الجلسة الحالية تلقائياً.'
          : 'Note: For security reasons, only one active session is allowed at a time. If you log in from another device, your current session will automatically end.'
        }
      </p>
    </div>
  );
};