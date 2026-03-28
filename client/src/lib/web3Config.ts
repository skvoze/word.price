import { http } from 'wagmi';
import { base } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';


if (!import.meta.env.VITE_WC_PROJECT_ID) {
  console.error("Missing VITE_WC_PROJECT_ID in .env file!");
}


export const config = getDefaultConfig({
  appName: 'Word Price',
  projectId: import.meta.env.VITE_WC_PROJECT_ID,
  chains: [base],
  ssr: true, 
  transports: {
    [base.id]: http(),
  },
});