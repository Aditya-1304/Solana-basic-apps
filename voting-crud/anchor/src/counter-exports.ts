// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import IDL from '../target/idl/voting.json'
import type { Voting } from '../target/types/voting'

// Re-export the generated IDL and type
export { Voting, IDL }

// The programId is imported from the program IDL.
export const COUNTER_PROGRAM_ID = new PublicKey(IDL.address)

// This is a helper function to get the Counter Anchor program.
export function getVotingProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...IDL, address: address ? address.toBase58() : IDL.address } as Voting, provider)
}

// This is a helper function to get the program ID for the Counter program depending on the cluster.
export function getVotingProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Counter program on devnet and testnet.
      return new PublicKey('GinpHRVoJ35418tUBPyyRS3mptqTttHZ4BiQ5kB3h1g9')
    case 'mainnet-beta':
    default:
      return COUNTER_PROGRAM_ID
  }
}
