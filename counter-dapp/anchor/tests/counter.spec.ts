import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair} from '@solana/web3.js'
import {Counterdapp} from '../target/types/counterdappdappdapp'

describe('counterdappdappdapp', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Counterdapp as Program<Counterdapp>

  const counterdappdappdappKeypair = Keypair.generate()

  it('Initialize Counterdapp', async () => {
    await program.methods
      .initialize()
      .accounts({
        counterdappdappdapp: counterdappdappdappKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([counterdappdappdappKeypair])
      .rpc()

    const currentCount = await program.account.counterdappdappdapp.fetch(counterdappdappdappKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Counterdapp', async () => {
    await program.methods.increment().accounts({ counterdappdappdapp: counterdappdappdappKeypair.publicKey }).rpc()

    const currentCount = await program.account.counterdappdappdapp.fetch(counterdappdappdappKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Counterdapp Again', async () => {
    await program.methods.increment().accounts({ counterdappdappdapp: counterdappdappdappKeypair.publicKey }).rpc()

    const currentCount = await program.account.counterdappdappdapp.fetch(counterdappdappdappKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Counterdapp', async () => {
    await program.methods.decrement().accounts({ counterdappdappdapp: counterdappdappdappKeypair.publicKey }).rpc()

    const currentCount = await program.account.counterdappdappdapp.fetch(counterdappdappdappKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set counterdappdappdapp value', async () => {
    await program.methods.set(42).accounts({ counterdappdappdapp: counterdappdappdappKeypair.publicKey }).rpc()

    const currentCount = await program.account.counterdappdappdapp.fetch(counterdappdappdappKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the counterdappdappdapp account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        counterdappdappdapp: counterdappdappdappKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.counterdappdappdapp.fetchNullable(counterdappdappdappKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
