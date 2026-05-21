import { http } from 'wagmi';
import { base } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem'; 

if (!import.meta.env.VITE_WC_PROJECT_ID) {
  console.error("Missing VITE_WC_PROJECT_ID in .env file!");
}


export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC', 
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'], 
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://explorer.arc-testnet.io', 
    },
  },
  testnet: true,
});


export const config = getDefaultConfig({
  appName: 'Word Price',
  projectId: import.meta.env.VITE_WC_PROJECT_ID,
  chains: [base, arcTestnet], 
  ssr: true, 
  transports: {
    [base.id]: http(),
    [arcTestnet.id]: http(), 
  },
});