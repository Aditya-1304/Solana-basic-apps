import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { 
  createMint, 
  createAssociatedTokenAccount, 
  mintTo, 
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token";

// Confirm a transaction has been confirmed
export async function confirmTransaction(
  connection: Connection,
  txSignature: string
): Promise<void> {
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: txSignature,
    ...latestBlockhash,
  });
}

// Create multiple keypairs
export function makeKeypairs(n: number): Keypair[] {
  return Array.from({ length: n }, () => Keypair.generate());
}

// Create accounts, mints and token accounts
export async function createAccountsMintsAndTokenAccounts(
  userTokenBalances: number[][],
  lamports: number,
  connection: Connection,
  payer: Keypair
): Promise<{
  users: Keypair[];
  mints: Keypair[];
  tokenAccounts: PublicKey[][];
}> {
  // Create users
  const users = makeKeypairs(userTokenBalances.length);
  
  // Fund users
  for (const user of users) {
    const tx = await connection.requestAirdrop(user.publicKey, lamports);
    await confirmTransaction(connection, tx);
  }
  
  // Create mints
  const numMints = userTokenBalances[0].length;
  const mints = makeKeypairs(numMints);
  
  for (const mint of mints) {
    await createMint(
      connection,
      payer,
      payer.publicKey,
      null,
      9,
      mint,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
  }
  
  // Create token accounts and mint tokens to users
  const tokenAccounts: PublicKey[][] = [];
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userTokenAccounts: PublicKey[] = [];
    
    for (let j = 0; j < mints.length; j++) {
      const mint = mints[j];
      const balance = userTokenBalances[i][j];
      
      // Create token account
      const tokenAccount = await createAssociatedTokenAccount(
        connection,
        payer,
        mint.publicKey,
        user.publicKey,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      
      userTokenAccounts.push(tokenAccount);
      
      // Mint tokens if balance > 0
      if (balance > 0) {
        await mintTo(
          connection,
          payer,
          mint.publicKey,
          tokenAccount,
          payer,
          balance,
          undefined,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
      }
    }
    
    tokenAccounts.push(userTokenAccounts);
  }
  
  return {
    users,
    mints,
    tokenAccounts,
  };
}