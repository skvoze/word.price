import { createWalletClient, createPublicClient, http, defineChain, Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { 
  BASE_CHAIN_ID, 
  ARC_CHAIN_ID, 
  getChainConfig, 
  VAULT_ABI 
} from '../shared/contracts';

export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID, 
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, 
  rpcUrls: {
    default: { http: [process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network'] },
  },
  legacyGasValues: true 
});

const VIEM_CHAINS: Record<number, Chain> = {
  [BASE_CHAIN_ID]: base,
  [ARC_CHAIN_ID]: arcTestnet,
};

const privateKey = (process.env.ADMIN_PRIVATE_KEY as `0x${string}`);
const account = privateKeyToAccount(privateKey);

function getClientsForChain(chainId: number) {
  const config = getChainConfig(chainId);
  const targetChain = VIEM_CHAINS[chainId] || base;

  return {
    publicClient: createPublicClient({ chain: targetChain, transport: http(config.rpcUrl) }),
    walletClient: createWalletClient({ account, chain: targetChain, transport: http(config.rpcUrl) })
  };
}

const toUSDC = (cents: number) => BigInt(cents) * BigInt(10000);

async function executeVaultWrite(
  chainId: number,
  functionName: 'lockFunds' | 'unlockFunds' | 'slashFunds',
  userAddress: string,
  amountInCents: number
): Promise<`0x${string}`> {
  const { publicClient, walletClient } = getClientsForChain(chainId);
  const config = getChainConfig(chainId);
  const args = [userAddress as `0x${string}`, toUSDC(amountInCents)] as const;

  if (config.simulateBeforeWrite) {
    const { request } = await publicClient.simulateContract({
      address: config.vault,
      abi: VAULT_ABI,
      functionName,
      args,
      account
    });
    return await walletClient.writeContract(request);
  }

  return await walletClient.writeContract({
    address: config.vault,
    abi: VAULT_ABI,
    functionName,
    args,
    account
  });
}

export async function lockUserFunds(userAddress: string, amountInCents: number, chainId: number = BASE_CHAIN_ID) {
  const { publicClient } = getClientsForChain(chainId);
  const hash = await executeVaultWrite(chainId, 'lockFunds', userAddress, amountInCents);
  return await publicClient.waitForTransactionReceipt({ hash });
}

export async function unlockUserFunds(userAddress: string, amountInCents: number, chainId: number = BASE_CHAIN_ID) {
  const { publicClient } = getClientsForChain(chainId);
  const hash = await executeVaultWrite(chainId, 'unlockFunds', userAddress, amountInCents);
  return await publicClient.waitForTransactionReceipt({ hash });
}

export async function slashUserFunds(userAddress: string, amountInCents: number, chainId: number = BASE_CHAIN_ID) {
  const { publicClient } = getClientsForChain(chainId);
  const hash = await executeVaultWrite(chainId, 'slashFunds', userAddress, amountInCents);
  return await publicClient.waitForTransactionReceipt({ hash });
}

export async function getVaultBalance(userAddress: string, chainId: number = BASE_CHAIN_ID): Promise<number> {
  const { publicClient } = getClientsForChain(chainId);
  const config = getChainConfig(chainId);

  try {
    const balanceRaw = await publicClient.readContract({
      address: config.vault,
      abi: VAULT_ABI,
      functionName: 'availableBalance',
      args: [userAddress as `0x${string}`],
    }) as bigint;
    
    console.log(`[Blockchain Raw] Chain: ${chainId}, Address: ${userAddress}, Raw Balance: ${balanceRaw.toString()}`);
    return Number(balanceRaw) / (10 ** config.usdcDecimals);
  } catch (error) {
    console.error(`[Blockchain Read Error] on chain ${chainId} for ${userAddress}:`, error);
    throw error;
  }
}