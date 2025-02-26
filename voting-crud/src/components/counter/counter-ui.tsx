'use client'

import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { useState, useRef } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useVotingProgram, useVotingProgramAccount } from './counter-data-access'
import toast from 'react-hot-toast'

export function VotingCreate() {
  const { createPoll } = useVotingProgram()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [optionInputs, setOptionInputs] = useState<string[]>(['', '']) // Start with 2 options

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...optionInputs]
    newOptions[index] = value
    setOptionInputs(newOptions)
  }

  const addOptionField = () => {
    if (optionInputs.length < 10) { // Limit to 10 options as per Rust program
      setOptionInputs([...optionInputs, ''])
    } else {
      toast.error('Maximum 10 options allowed')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const options = optionInputs
        .map(opt => opt.trim())
        .filter(opt => opt !== '')

      if (options.length < 2) {
        toast.error('At least 2 options are required')
        return
      }

      if (title.length > 32) {
        toast.error('Title must be less than 32 characters')
        return
      }

      if (description.length > 500) {
        toast.error('Description must be less than 500 characters')
        return
      }

      await createPoll.mutateAsync({
        title,
        description,
        options,
        
      })

      // Clear form on success
      setTitle('')
      setDescription('')
      setOptionInputs(['', ''])
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Poll Title (max 32 chars)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-bordered"
        required
        maxLength={32}
      />
      <textarea
        placeholder="Poll Description (max 500 chars)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="textarea textarea-bordered"
        required
        maxLength={500}
      />
      {optionInputs.map((option, index) => (
        <input
          key={index}
          type="text"
          placeholder={`Option ${index + 1} (required)`}
          value={option}
          onChange={(e) => handleOptionChange(index, e.target.value)}
          className="input input-bordered"
          required
          maxLength={50}
        />
      ))}
      <button
        type="button"
        onClick={addOptionField}
        className="btn btn-outline"
        disabled={optionInputs.length >= 10}
      >
        Add Option
      </button>
      <button
        type="submit"
        className="btn btn-xs lg:btn-md btn-primary"
        disabled={createPoll.isPending}
      >
        Create Poll {createPoll.isPending && '...'}
      </button>
    </form>
  )
}

export function VotingList() {
  const { accounts } = useVotingProgram()

  if (accounts.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account: any) => (
            <CounterCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  )
}

function CounterCard({ account }: { account: PublicKey }) {
  const { accountQuery, updatePollMutation, deletePollMutation } = useVotingProgramAccount({
    account,
  })

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2
            className="card-title justify-center text-3xl cursor-pointer"
            onClick={() => accountQuery.refetch()}
          >
            {account.toString()}
          </h2>
          <div className="card-actions justify-around">
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() =>
                updatePollMutation.mutateAsync({
                  newTitle: 'Updated Poll',
                  newDescription: 'Updated Poll Description',
                })
              }
              disabled={updatePollMutation.isPending}
            >
              updatePoll
            </button>
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => deletePollMutation.mutateAsync()}
              disabled={deletePollMutation.isPending}
            >
              Delete poll
            </button>
          </div>
          <div className="text-center space-y-4">
            <p>
              <ExplorerLink path={`account/${account}`} label={ellipsify(account.toString())} />
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}