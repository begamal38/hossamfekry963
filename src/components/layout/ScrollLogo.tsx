import React from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

interface ScrollLogoProps {
  className?: string;
}

/**
 * Static header logo - always visible, no animation.
 */
export const ScrollLogo: React.FC<ScrollLogoProps> = ({ className }) => {
  return (
    <Link to="/" className="flex items-center px-2 py-1">
      <img 
        src={logo} 
        alt="Hossam Fekry" 
        width={80}
        height={80}
        className="h-14 2xl:h-16 3xl:h-20 w-auto object-contain"
      />
    </Link>
  );
};
