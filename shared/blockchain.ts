import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { VAULT_ADDRESS, VAULT_ABI } from '../shared/contracts';

const account = privateKeyToAccount(process.env.ADMIN_PRIVATE_KEY as `0x${string}`);

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http()
});

export async function lockUserFunds(userAddress: string, amountInCents: number) {

  const amount = BigInt(amountInCents) * BigInt(10000);

  const { request } = await publicClient.simulateContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'lockFunds',
    args: [userAddress as `0x${string}`, amount],
    account
  });

  const hash = await walletClient.writeContract(request);
  return await publicClient.waitForTransactionReceipt({ hash });
}