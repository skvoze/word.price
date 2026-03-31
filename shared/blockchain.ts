import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { VAULT_ADDRESS, VAULT_ABI } from '../shared/contracts';

const rpcUrl = process.env.RPC_URL;
const privateKey = (process.env.ADMIN_PRIVATE_KEY as `0x${string}`);
const account = privateKeyToAccount(privateKey);

export const publicClient = createPublicClient({
  chain: base,
  transport: http(rpcUrl)
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(rpcUrl)
});


const toUSDC = (cents: number) => BigInt(cents) * BigInt(10000);


export async function lockUserFunds(userAddress: string, amountInCents: number) {
  const { request } = await publicClient.simulateContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'lockFunds',
    args: [userAddress as `0x${string}`, toUSDC(amountInCents)],
    account
  });
  const hash = await walletClient.writeContract(request);
  return await publicClient.waitForTransactionReceipt({ hash });
}

export async function getVaultBalance(userAddress: string): Promise<number> {
  try {
    const balanceRaw = await publicClient.readContract({
      address: VAULT_ADDRESS as `0x${string}`,
      abi: VAULT_ABI,
      functionName: 'availableBalance',
      args: [userAddress as `0x${string}`],
    }) as bigint;
    console.log(`[Blockchain Raw] Address: ${userAddress}, Raw Balance: ${balanceRaw.toString()}`);
    return Number(balanceRaw) / 1_000_000;
  } catch (error) {
    console.error(`[Blockchain Read Error] for ${userAddress}:`, error);
    throw error;
  }
}

export async function unlockUserFunds(userAddress: string, amountInCents: number) {
  const { request } = await publicClient.simulateContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'unlockFunds',
    args: [userAddress as `0x${string}`, toUSDC(amountInCents)],
    account
  });
  const hash = await walletClient.writeContract(request);
  return await publicClient.waitForTransactionReceipt({ hash });
}

export async function slashUserFunds(userAddress: string, amountInCents: number) {
  const { request } = await publicClient.simulateContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'slashFunds',
    args: [userAddress as `0x${string}`, toUSDC(amountInCents)],
    account
  });
  const hash = await walletClient.writeContract(request);
  return await publicClient.waitForTransactionReceipt({ hash });
}