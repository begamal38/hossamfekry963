 /**
  * Platform Store Icons Component
  * 
  * Provides consistent, recognizable platform icons for PWA download sections.
  * Follows official platform guidelines for visual representation.
  */
 
 import React from 'react';
 import { cn } from '@/lib/utils';
 
 interface PlatformIconProps {
   className?: string;
 }
 
 /**
  * Google Play Store Icon - Official Android branding
  */
 export const GooglePlayIcon: React.FC<PlatformIconProps> = ({ className }) => (
   <svg 
     viewBox="0 0 24 24" 
     className={cn("fill-current", className)}
     aria-label="Google Play"
   >
     <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
   </svg>
 );
 
 /**
  * Apple Icon - For iOS App Store style
  */
 export const AppleIcon: React.FC<PlatformIconProps> = ({ className }) => (
   <svg 
     viewBox="0 0 24 24" 
     className={cn("fill-current", className)}
     aria-label="Apple"
   >
     <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
   </svg>
 );
 
 /**
  * Windows Icon - For Desktop/Windows Store
  */
 export const WindowsIcon: React.FC<PlatformIconProps> = ({ className }) => (
   <svg 
     viewBox="0 0 24 24" 
     className={cn("fill-current", className)}
     aria-label="Windows"
   >
     <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
   </svg>
 );
 
 /**
  * Desktop/PWA Icon - Generic for all desktop platforms
  */
 export const DesktopIcon: React.FC<PlatformIconProps> = ({ className }) => (
   <svg 
     viewBox="0 0 24 24" 
     className={cn("fill-none stroke-current", className)}
     strokeWidth="2"
     strokeLinecap="round"
     strokeLinejoin="round"
     aria-label="Desktop"
   >
     <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
     <line x1="8" y1="21" x2="16" y2="21"/>
     <line x1="12" y1="17" x2="12" y2="21"/>
   </svg>
 );
 
 interface PlatformIconsRowProps {
   className?: string;
   iconSize?: 'sm' | 'md' | 'lg';
   showLabels?: boolean;
 }
 
 /**
  * Row of platform icons for download sections
  * Shows Android (Play Store), iOS (Apple), and Desktop icons
  */
 export const PlatformIconsRow: React.FC<PlatformIconsRowProps> = ({ 
   className,
   iconSize = 'md',
 }) => {
   const sizeClasses = {
     sm: 'w-4 h-4',
     md: 'w-5 h-5',
     lg: 'w-6 h-6',
   };
   
   const iconClass = sizeClasses[iconSize];
   
   return (
     <div className={cn("flex items-center gap-2", className)}>
       {/* Google Play - Android */}
       <div className="flex items-center justify-center" title="Android">
         <GooglePlayIcon className={cn(iconClass, "text-[#00C853]")} />
       </div>
       
       {/* Apple - iOS */}
       <div className="flex items-center justify-center" title="iOS">
         <AppleIcon className={cn(iconClass, "text-gray-800 dark:text-gray-200")} />
       </div>
       
       {/* Windows - Desktop */}
       <div className="flex items-center justify-center" title="Desktop">
         <WindowsIcon className={cn(
           iconSize === 'lg' ? 'w-5 h-5' : iconSize === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5',
           "text-[#0078D4]"
         )} />
       </div>
     </div>
   );
 };
 
 export default PlatformIconsRow;