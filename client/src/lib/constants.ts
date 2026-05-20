export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",  
  5042002: "0x3600000000000000000000000000000000000000",  
};

export const getUsdcAddress = (chainId: number): `0x${string}` => {
  return USDC_ADDRESSES[chainId] || USDC_ADDRESSES[8453]; 
};

export const USDC_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;