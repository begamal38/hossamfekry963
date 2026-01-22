/**
 * Mini Footer for Assistant Dashboard Pages
 * 
 * A compact footer for admin/assistant pages showing only the "Powered by" credit.
 */

import React from 'react';

export const MiniFooter: React.FC = () => {
  return (
    <footer className="py-4 text-center border-t border-border/50 bg-background/50">
      <button 
        onClick={() => window.open('https://wa.me/201000788628', '_blank')}
        className="text-[0.7rem] text-muted-foreground/60 hover:text-muted-foreground/80 transition-opacity cursor-pointer"
      >
        Powered by Belal Gamal
      </button>
    </footer>
  );
};
