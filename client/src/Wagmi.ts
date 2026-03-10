import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, Chain } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains'; 


const activeChain = baseSepolia; 

export const config = getDefaultConfig({
  appName: 'Word Price',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID, 
  chains: [activeChain],
  ssr: false, 
});