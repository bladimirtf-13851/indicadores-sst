import React from 'react';

export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-baseline text-3xl font-extrabold tracking-tighter" style={{ fontFamily: 'Arial, sans-serif' }}>
        <span style={{ color: '#004aad' }}>edu</span>
        <span style={{ color: '#5b6cf9' }}>flex</span>
      </div>
      <div className="relative flex items-center justify-center w-10 h-10 -ml-1 mt-1">
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: '#8dc63f' }} fill="currentColor">
          <path d="M 50 0 L 59.8 13.3 L 75 6.7 L 76.9 23.1 L 93.3 25 L 86.7 40.2 L 100 50 L 86.7 59.8 L 93.3 75 L 76.9 76.9 L 75 93.3 L 59.8 86.7 L 50 100 L 40.2 86.7 L 25 93.3 L 23.1 76.9 L 6.7 75 L 13.3 59.8 L 0 50 L 13.3 40.2 L 6.7 25 L 23.1 23.1 L 25 6.7 L 40.2 13.3 Z" />
        </svg>
        <svg viewBox="0 0 24 24" className="absolute w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </div>
  );
}
