import React from 'react';

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  glow?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 36,
  showText = true,
  className = '',
  glow = true,
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Circuit G Logo matching the user's uploaded asset */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-black p-1.5 transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          boxShadow: glow ? '0 0 14px rgba(0, 240, 255, 0.24)' : undefined,
          border: '1px solid rgba(0, 240, 255, 0.3)',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id={`brand-glow-${size}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Circuit background subtle trace */}
          <path
            d="M 10 50 H 90 M 50 10 V 90"
            stroke="#00f0ff"
            strokeWidth="0.5"
            strokeOpacity="0.15"
            strokeDasharray="2 4"
          />

          {/* Main G Circuit Trace */}
          <g
            stroke="#00f0ff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="miter"
            filter={`url(#brand-glow-${size})`}
          >
            {/* Outer perimeter of G */}
            <path d="M 72 26 L 50 26 L 40 26 L 24 42 L 24 64 L 40 80 L 60 80 L 60 70" />
            {/* Middle channel */}
            <path d="M 24 50 L 14 50 L 14 36 L 36 14 L 72 14 L 72 26" />
            <path d="M 14 50 L 14 68 L 36 90 L 68 90 L 68 70" />
            {/* Inner spur and crossbar */}
            <path d="M 50 42 L 74 42 L 74 56 L 62 56 L 62 48 L 44 48 L 44 64 L 56 64" />
            <path d="M 62 56 L 62 76 L 74 76 L 74 52" />
          </g>

          {/* Circuit nodes (connection dots) */}
          <g fill="#00f0ff" filter={`url(#brand-glow-${size})`}>
            <circle cx="72" cy="14" r="2.8" />
            <circle cx="50" cy="26" r="2.8" />
            <circle cx="14" cy="50" r="2.8" />
            <circle cx="50" cy="42" r="2.8" />
            <circle cx="74" cy="42" r="2.8" />
            <circle cx="50" cy="72" r="2.8" />
            <circle cx="50" cy="80" r="2.8" />
          </g>
          <g fill="#ffffff">
            <circle cx="72" cy="14" r="1.2" />
            <circle cx="50" cy="26" r="1.2" />
            <circle cx="14" cy="50" r="1.2" />
            <circle cx="50" cy="42" r="1.2" />
            <circle cx="74" cy="42" r="1.2" />
            <circle cx="50" cy="72" r="1.2" />
            <circle cx="50" cy="80" r="1.2" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-base sm:text-lg tracking-wider text-[#00f0ff]">
              GRID &amp; LOGIC
            </span>
            <span className="rounded-md bg-[#00f0ff]/15 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#00f0ff] border border-[#00f0ff]/30 tracking-widest uppercase hidden sm:inline-block">
              MODULAR
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-mono tracking-wider text-slate-400 uppercase font-medium">
            CONTAINER DESIGN STUDIO
          </span>
        </div>
      )}
    </div>
  );
};
