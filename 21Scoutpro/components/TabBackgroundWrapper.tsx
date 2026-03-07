import React from 'react';

interface TabBackgroundWrapperProps {
  children: React.ReactNode;
}

export const TabBackgroundWrapper: React.FC<TabBackgroundWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full relative bg-black overflow-hidden font-sans text-white">
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

