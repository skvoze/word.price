export const VAULT_ADDRESS = "0x09AC8b9A30f3b16cfC1228c98a51384F4218353a";
export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export const VAULT_ABI = [
  { name: "deposit", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }],outputs: [] },
  { name: "withdraw", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }],outputs: [] },
  { name: "lockFunds", type: "function", stateMutability: "nonpayable", inputs: [{ name: "user", type: "address" }, { name: "amount", type: "uint256" }],outputs: [] },
  { name: "unlockFunds", type: "function", stateMutability: "nonpayable", inputs: [{ name: "user", type: "address" }, { name: "amount", type: "uint256" }],outputs: [] },
  { name: "slashFunds", type: "function", stateMutability: "nonpayable", inputs: [{ name: "user", type: "address" }, { name: "amount", type: "uint256" }],outputs: [] },
  { name: "availableBalance", type: "function", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "reserveBalance", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "releaseReserve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] }
] as const;

export const USDC_ABI = [
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] }
] as const;