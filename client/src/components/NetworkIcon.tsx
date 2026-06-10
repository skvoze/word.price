import React from "react";

function BaseLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#0052FF"/>
      <path d="M12 6V18M6 12H18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ); 
}

function ArcLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#A855F7"/>
      <path d="M12 7L7 17H17L12 7Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}

const NETWORK_CONFIGS: Record<number, React.ComponentType<{ className?: string }>> = {
  8453: BaseLogo,
  5042002: ArcLogo,
};

export function ChainIcon({ chainId, className = "w-4 h-4" }: { chainId: number; className?: string }) {
  const IconComponent = NETWORK_CONFIGS[chainId];
  
  if (!IconComponent) {
    return <div className={`${className} rounded-full bg-muted-foreground/20`} />;
  }
  
  return <IconComponent className={className} />;
}