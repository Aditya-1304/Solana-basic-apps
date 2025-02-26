// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import CrowdfundingIDL from '../target/idl/crowdfunding.json'
import type { Crowdfunding } from '../target/types/crowdfunding'

// Re-export the generated IDL and type
export { Crowdfunding, CrowdfundingIDL }

// The programId is imported from the program IDL.
export const CROWDFUNDING_PROGRAM_ID = new PublicKey(CrowdfundingIDL.address)

// This is a helper function to get the Crowdfunding Anchor program.
export function getCrowdfundingProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...CrowdfundingIDL, address: address ? address.toBase58() : CrowdfundingIDL.address } as Crowdfunding, provider)
}

// This is a helper function to get the program ID for the Crowdfunding program depending on the cluster.
export function getCrowdfundingProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Crowdfunding program on devnet and testnet.
      return new PublicKey('8dRkUZyAq7TqAGAHResBz9kVFWuTEGNFykWHWJiAuk11')
    case 'mainnet-beta':
    default:
      return CROWDFUNDING_PROGRAM_ID
  }
}
