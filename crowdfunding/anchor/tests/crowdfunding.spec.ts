import * as anchor from '@coral-xyz/anchor';
import { BN, Program } from "@coral-xyz/anchor";
import { Crowdfunding } from '../target/types/crowdfunding';
import * as assert from "assert";

describe("crowdfunding", () => {
  // Setup the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;

  // Generate a new keypair for the campaign account
  const campaignAccount = anchor.web3.Keypair.generate();

  it("Initialize the campaign", async () => {
    const goal = new BN(1_000_000);
    const deadline = new BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);

    const [escrowPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("campaign"), campaignAccount.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .initializeCampaign(goal, deadline)
      .accounts({
        campaign: campaignAccount.publicKey,
        escrow: escrowPDA,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }as any)
      .signers([campaignAccount])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignAccount.publicKey);
    
    assert.ok(campaign.creator.equals(provider.wallet.publicKey));
    assert.ok(campaign.goal.eq(goal));
    assert.ok(campaign.totalAmount.eq(new BN(0)));
    assert.ok(campaign.deadline.eq(deadline));
    assert.strictEqual(campaign.isActive, true);
  });

  it("Contributes to the campaign", async () => {
    const contributionAmount = new BN(500_000);
    const [escrowPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("campaign"), campaignAccount.publicKey.toBuffer()],
      program.programId
    );
    const escrowBefore = await provider.connection.getBalance(escrowPDA);
    const contributorBefore = await provider.connection.getBalance(provider.wallet.publicKey);

    await program.methods
      .contribute(contributionAmount)
      .accounts({
        campaign: campaignAccount.publicKey,
        escrow: escrowPDA,
        contributor: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }as any)
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignAccount.publicKey);
    // const escrowBalance = await provider.connection.getBalance(escrowPDA);
    const contributorAfter = await provider.connection.getBalance(provider.wallet.publicKey);
    const escrowAfter = await provider.connection.getBalance(escrowPDA);

    assert.ok(campaign.totalAmount.eq(contributionAmount));
    assert.strictEqual(escrowAfter - escrowBefore, contributionAmount.toNumber());
    assert.ok(contributorAfter < contributorBefore);
  });

  it("Withdraws fund when goal is met", async () => {
    const additionalAmount = new BN(600_000);
    const [escrowPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("campaign"), campaignAccount.publicKey.toBuffer()],
      program.programId
    );

    // First contribute additional amount to meet goal
    await program.methods
      .contribute(additionalAmount)
      .accounts({
        campaign: campaignAccount.publicKey,
        escrow: escrowPDA,
        contributor: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }as any)
      .rpc();

    const creatorBefore = await provider.connection.getBalance(provider.wallet.publicKey);

    // Then withdraw
    await program.methods
      .withdraw()
      .accounts({
        campaign: campaignAccount.publicKey,
        escrow: escrowPDA,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }as any)
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignAccount.publicKey);
    const escrowBalance = await provider.connection.getBalance(escrowPDA);
    const creatorAfter = await provider.connection.getBalance(provider.wallet.publicKey);

    assert.strictEqual(escrowBalance, 0);
    assert.ok(creatorAfter > creatorBefore);
    assert.strictEqual(campaign.isActive, false);
  });

  it("Refunds funds when campaign goal is not met", async () => {
    const refundCampaign = anchor.web3.Keypair.generate();
    const goal = new BN(1_000_000);
    const deadline = new BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);

    const [escrowPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("campaign"), refundCampaign.publicKey.toBuffer()],
      program.programId
    );

    // Initialize campaign
    await program.methods
      .initializeCampaign(goal, deadline)
      .accounts({
        campaign: refundCampaign.publicKey,
        escrow: escrowPDA,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }as any)
      .signers([refundCampaign])
      .rpc();

    // Contribute
    const contributionAmount = new BN(300_000);
    await program.methods
      .contribute(contributionAmount)
      .accounts({
        campaign: refundCampaign.publicKey,
        escrow: escrowPDA,
        contributor: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }as any)
      .rpc();

    const contributorBefore = await provider.connection.getBalance(provider.wallet.publicKey);

    // Refund
    await program.methods
      .refund(contributionAmount)
      .accounts({
        campaign: refundCampaign.publicKey,
        escrow: escrowPDA,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }as any)
      .rpc();

    const campaign = await program.account.campaign.fetch(refundCampaign.publicKey);
    const escrowBalance = await provider.connection.getBalance(escrowPDA);
    const contributorAfter = await provider.connection.getBalance(provider.wallet.publicKey);

    assert.ok(campaign.totalAmount.eq(new BN(0)));
    assert.strictEqual(escrowBalance, 0);
    assert.ok(contributorAfter > contributorBefore);
  });
});