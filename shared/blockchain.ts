import { createWalletClient, createPublicClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { 
  BASE_CHAIN_ID, 
  ARC_CHAIN_ID, 
  getContractAddresses, 
  VAULT_ABI 
} from '../shared/contracts';

export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID, 
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, 
  rpcUrls: {
    default: { http: [process.env.ARC_RPC_URL || 'https://rpc-testnet.arc.network'] },
  },
});

const privateKey = (process.env.ADMIN_PRIVATE_KEY as `0x${string}`);
const account = privateKeyToAccount(privateKey);

function getClientsForChain(chainId: number) {
  if (chainId === ARC_CHAIN_ID) {
    const rpc = process.env.ARC_RPC_URL || 'https://rpc-testnet.arc.network';
    return {
      publicClient: createPublicClient({ chain: arcTestnet, transport: http(rpc) }),
      walletClient: createWalletClient({ account, chain: arcTestnet, transport: http(rpc) })
    };
  }
  const rpc = process.env.RPC_URL || 'https://mainnet.base.org';
  return {
    publicClient: createPublicClient({ chain: base, transport: http(rpc) }),
    walletClient: createWalletClient({ account, chain: base, transport: http(rpc) })
  };
}
const toUSDC = (cents: number) => BigInt(cents) * BigInt(10000);
export async function lockUserFunds(userAddress: string, amountInCents: number, chainId: number = BASE_CHAIN_ID) {
  const { publicClient, walletClient } = getClientsForChain(chainId);
  const addresses = getContractAddresses(chainId);

  const { request } = await publicClient.simulateContract({
    address: addresses.vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'lockFunds',
    args: [userAddress as `0x${string}`, toUSDC(amountInCents)],
    account
  });
  
  const hash = await walletClient.writeContract(request);
  return await publicClient.waitForTransactionReceipt({ hash });
}

export async function getVaultBalance(userAddress: string, chainId: number = BASE_CHAIN_ID): Promise<number> {
  const { publicClient } = getClientsForChain(chainId);
  const addresses = getContractAddresses(chainId);

  try {
    const balanceRaw = await publicClient.readContract({
      address: addresses.vault as `0x${string}`,
      abi: VAULT_ABI,
      functionName: 'availableBalance',
      args: [userAddress as `0x${string}`],
    }) as bigint;
    
    console.log(`[Blockchain Raw] Chain: ${chainId}, Address: ${userAddress}, Raw Balance: ${balanceRaw.toString()}`);
    return Number(balanceRaw) / 1_000_000;
  } catch (error) {
    console.error(`[Blockchain Read Error] on chain ${chainId} for ${userAddress}:`, error);
    throw error;
  }
}

export async function unlockUserFunds(userAddress: string, amountInCents: number, chainId: number = BASE_CHAIN_ID) {
  const { publicClient, walletClient } = getClientsForChain(chainId);
  const addresses = getContractAddresses(chainId);

  const { request } = await publicClient.simulateContract({
    address: addresses.vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'unlockFunds',
    args: [userAddress as `0x${string}`, toUSDC(amountInCents)],
    account
  });
  
  const hash = await walletClient.writeContract(request);
  return await publicClient.waitForTransactionReceipt({ hash });
}

export async function slashUserFunds(userAddress: string, amountInCents: number, chainId: number = BASE_CHAIN_ID) {
  const { publicClient, walletClient } = getClientsForChain(chainId);
  const addresses = getContractAddresses(chainId);

  const { request } = await publicClient.simulateContract({
    address: addresses.vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'slashFunds',
    args: [userAddress as `0x${string}`, toUSDC(amountInCents)],
    account
  });
  
  const hash = await walletClient.writeContract(request);
  return await publicClient.waitForTransactionReceipt({ hash });
}