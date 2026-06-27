import { Address } from "viem";

export const BASE_CHAIN_ID = 8453;
export const ARC_CHAIN_ID = 5042002;

export interface ChainConfig {
  chainId: number;
  vault: Address;
  usdc: Address;
  usdcDecimals: number;         
  simulateBeforeWrite: boolean;   
  rpcUrl: string;
}

export const CHAIN_REGISTRY: Record<number, ChainConfig> = {
  [BASE_CHAIN_ID]: {
    chainId: BASE_CHAIN_ID,
    vault: "0x09AC8b9A30f3b16cfC1228c98a51384F4218353a",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913",
    usdcDecimals: 6,
    simulateBeforeWrite: true,
    rpcUrl: process.env.RPC_URL || 'https://mainnet.base.org',
  },
  [ARC_CHAIN_ID]: {
    chainId: ARC_CHAIN_ID,
    vault: "0xE56502f182024F3EE24c99521E8F11eF4149319B",
    usdc: "0x3600000000000000000000000000000000000000",
    usdcDecimals: 6,
    simulateBeforeWrite: false, 
    rpcUrl: process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network',
  }
};


export function getChainConfig(chainId: number): ChainConfig {
  return CHAIN_REGISTRY[chainId] || CHAIN_REGISTRY[BASE_CHAIN_ID];
}

export function getContractAddresses(chainId: number) {
  const config = getChainConfig(chainId);
  return { vault: config.vault, usdc: config.usdc };
}

export const VAULT_ABI = [
  { name: "deposit", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "withdraw", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "lockFunds", type: "function", stateMutability: "nonpayable", inputs: [{ name: "user", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { name: "unlockFunds", type: "function", stateMutability: "nonpayable", inputs: [{ name: "user", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { name: "slashFunds", type: "function", stateMutability: "nonpayable", inputs: [{ name: "user", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { name: "availableBalance", type: "function", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "reserveBalance", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "releaseReserve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] }
] as const;

export const USDC_ABI = [
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] }
] as const;