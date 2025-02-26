'use client'

import { getVotingProgram, getVotingProgramId } from '@project/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useVotingProgram() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getVotingProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getVotingProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['voting', 'all', { cluster }],
    queryFn: () => program.account.poll.all(),
    enabled: !!publicKey, // Only fetch when wallet is connected
  })

  const createPoll = useMutation({
    mutationKey: ['voting', 'create', { cluster }],
    mutationFn: async (data: { title: string; description: string; options: string[]; }) => {
      try {
        const pollKeypair = Keypair.generate();
        const signature = await program.methods
          .createPoll(data.title, data.description, data.options)
          .accounts({
            poll: pollKeypair.publicKey,
            creator: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([pollKeypair])
          .rpc();
        
        return { signature, pollKeypair };
      } catch (error) {
        console.error('Create poll error:', error);
        throw error;
      }
    },
    onSuccess: ({ signature }) => {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      console.error('Create poll error:', error);
      toast.error('Failed to create poll');
    },
  })

  return {
    program,
    programId,
    accounts,
    createPoll,
  }
}

export function useVotingProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useVotingProgram()
  const provider = useAnchorProvider()

  const accountQuery = useQuery({
    queryKey: ['voting', 'fetch', { cluster, account }],
    queryFn: () => program.account.poll.fetch(account),
  })

  const updatePollMutation = useMutation({
    mutationKey: ['voting', 'update', { cluster, account }],
    mutationFn: (data: {newTitle: string; newDescription : string}) => 
      program.methods
      .updatePoll(data.newTitle, data.newDescription)
      .accounts({
        poll: account,
        creator: provider.wallet.publicKey,
      }as any)
      .rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const deletePollMutation = useMutation({
    mutationKey: ['voting', 'delete', { cluster, account }],
    mutationFn: () => 
      program.methods
        .deletePoll()
        .accounts({ 
          poll : account,
          creator: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId, 
        }as any)
        .rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch(); // Refetch all accounts
    },
  })
  
  return {
    accountQuery,
    updatePollMutation,
    deletePollMutation,
  }
}