import React from "react";

export function BaseLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#0052FF"/>
      <path d="M12 6V18M6 12H18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ); 
}

export function ArcLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#A855F7"/>
      <path d="M12 7L7 17H17L12 7Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}


export const NETWORK_CONFIGS: Record<number, { name: string; icon: React.ComponentType<{ className?: string }> }> = {
  8453: { 
    name: "Base",
    icon: BaseLogo,
  },
  5042002: { 
    name: "Arc Testnet",
    icon: ArcLogo,
  }
};

export function NetworkIcon({ chainId, className = "w-4 h-4" }: { chainId: number; className?: string }) {
  const config = NETWORK_CONFIGS[chainId];
  if (!config) {
    return <div className={`${className} rounded-full bg-muted-foreground/30`} />;
  }
  const IconComponent = config.icon;
  return <IconComponent className={className} />;
}