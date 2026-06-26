import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`} id="medintel-logo-container">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 animate-pulse-slow"
        id="medintel-logo-svg"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#14F195" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Neural Network Nodes & Circuit Lines */}
        <path
          d="M 15,50 L 50,50"
          stroke="url(#logoGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.6"
        />
        <path
          d="M 50,15 L 50,50"
          stroke="url(#logoGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.6"
        />
        <path
          d="M 50,50 L 85,50"
          stroke="url(#logoGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.6"
        />
        <path
          d="M 50,50 L 50,85"
          stroke="url(#logoGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.6"
        />

        {/* DNA-inspired helix curve running behind */}
        <path
          d="M 25,35 Q 37.5,65 50,35 T 75,35"
          stroke="#14F195"
          strokeWidth="2"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M 25,65 Q 37.5,35 50,65 T 75,65"
          stroke="#00E5FF"
          strokeWidth="2"
          fill="none"
          opacity="0.4"
        />

        {/* Central Medical Cross integrated with AI circuitry */}
        <rect
          x="42"
          y="20"
          width="16"
          height="60"
          rx="4"
          fill="url(#logoGrad)"
          filter="url(#glow)"
        />
        <rect
          x="20"
          y="42"
          width="60"
          height="16"
          rx="4"
          fill="url(#logoGrad)"
          filter="url(#glow)"
        />

        {/* Connection nodes (Neural network vertices) */}
        <circle cx="50" cy="15" r="5" fill="#00E5FF" filter="url(#glow)" />
        <circle cx="50" cy="85" r="5" fill="#14F195" filter="url(#glow)" />
        <circle cx="15" cy="50" r="5" fill="#7C3AED" filter="url(#glow)" />
        <circle cx="85" cy="50" r="5" fill="#00E5FF" filter="url(#glow)" />

        {/* Core processor (AI microchip nexus inside the cross) */}
        <rect
          x="44"
          y="44"
          width="12"
          height="12"
          rx="2"
          fill="#07111F"
          stroke="#00E5FF"
          strokeWidth="2"
        />
        <circle cx="50" cy="50" r="3" fill="#14F195" />
      </svg>
      <div className="flex flex-col">
        <span className="font-display font-bold tracking-tight text-xl text-[#F8FAFC]">
          MedIntel <span className="text-[#00E5FF]">AI</span>
        </span>
        <span className="text-[9px] tracking-widest text-[#94A3B8] uppercase font-mono font-semibold">
          Enterprise Medical RAG
        </span>
      </div>
    </div>
  );
}
