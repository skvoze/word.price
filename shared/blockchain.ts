import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { VAULT_ADDRESS, VAULT_ABI } from '../shared/contracts';


const privateKey = (process.env.ADMIN_PRIVATE_KEY as `0x${string}`);
const account = privateKeyToAccount(privateKey);

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http()
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