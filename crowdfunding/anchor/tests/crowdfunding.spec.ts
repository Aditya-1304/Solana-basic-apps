import * as anchor from '@coral-xyz/anchor';
import { BN, Program } from "@coral-xyz/anchor";
import { Crowdfunding } from '../target/types/crowdfunding';
import * as assert from "assert";

describe("crowdfunding", ()=> {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();

  const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;

  const campaignAccount = anchor.web3.Keypair.generate();

  it("Initialize the campaign", async ()=> {
    const goal = new BN(1_000_000);
    const deadline = new BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);

    const [escrowPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), campaignAccount.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .initializeCampaign(goal,deadline)
      .accounts({
        campaign: campaignAccount.publicKey,
        escrow: escrowPDA,
        creator: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }as any)
      .signers([campaignAccount])
      .rpc();

    console.log("Initialize an Campaign:", tx);
    const campaign = await program.account.campaign.fetch(campaignAccount.publicKey);

    console.log("Campaign account Data:", campaignAccount);

    // assert.ok(campaign.creator.equals(provider.publicKey!));
    // assert.ok(campaign.goal.eq(goal));
    // assert.ok(campaign.totalAmount.eq(new BN(0)));
    // assert.ok(campaign.deadline.eq(deadline));
    // assert.ok(campaign.isActive === true);

    expect(campaign.creator).toEqual(provider.publicKey);
    expect(campaign.goal).toEqual(goal);
    expect(campaign.totalAmount).toEqual(new BN(0));
    expect(campaign.deadline).toEqual(deadline);
    expect(campaign.isActive).toEqual(true);

  });

  it("Contributes to the campaign", async () => {
    const contributionAmount = new BN(500_000);
    const [escrowPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), campaignAccount.publicKey.toBuffer()],
      program.programId
    )
    
    const escrowBefore = await provider.connection.getAccountInfo(escrowPDA) || {lamports: 0};
    console.log("Escrow account Data Before:", escrowBefore);
    const contributorBefore = await provider.connection.getAccountInfo(provider.publicKey!) || {lamports: 0};
    console.log("Contributor account Data Before:", contributorBefore);

    const tx = await program.methods 
    .contribute(contributionAmount)
    .accounts({
        campaign: campaignAccount.publicKey,
        escrow: escrowPDA,
        contributor: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
    }as any)
    .rpc();

    const campaign = await program.account.campaign.fetch(campaignAccount.publicKey);
    console.log("Campaign account Data:", campaignAccount);

    expect(campaign.totalAmount).toEqual(contributionAmount);

    const escrowAfter = await provider.connection.getAccountInfo(escrowPDA) || {lamports: 0};
    console.log("Escrow account Data After:", escrowAfter);
    expect(escrowAfter.lamports).toEqual(contributionAmount.toNumber());

    const contributorAfter = await provider.connection.getAccountInfo(provider.publicKey!) || {lamports: 0};
    console.log("Contributor account Data After:", contributorAfter);
    expect(contributorAfter.lamports).toEqual(contributorBefore.lamports - contributionAmount.toNumber());
    
  });

  it("Withdraws fund when goal is met", async() => {
    const additionalAmount = new BN(600_000);
    const [escrowPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), campaignAccount.publicKey.toBuffer()],
      program.programId
    );
    const tx = await program.methods
    .contribute(additionalAmount)
    .accounts({
        campaign: campaignAccount.publicKey,
        escrow: escrowPDA,
        creator: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
    }as any)
    .rpc();

    const creatorBefore = await provider.connection.getAccountInfo(provider.publicKey!) || {lamports: 0};
    console.log("Creator account Data Before:", creatorBefore);
    
    const escrowBefore = await provider.connection.getAccountInfo(escrowPDA) || {lamports: 0};
    console.log("Escrow account Data Before:", escrowBefore);

    const tx2 = await program.methods
    .withdraw()
    .accounts({
      campaign: campaignAccount.publicKey,
      escrow: escrowPDA,
      creator: provider.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    } as any)
    .rpc();

    const campaign = await program.account.campaign.fetch(campaignAccount.publicKey);
    console.log("Campaign account Data:", campaignAccount);

    const escrowAfter = await provider.connection.getAccountInfo(escrowPDA) || {lamports: 0};
    console.log("Escrow account Data After:", escrowAfter);
    expect(escrowAfter.lamports).toEqual(0);

    const creatorAfter = await provider.connection.getAccountInfo(provider.publicKey!) || {lamports: 0};
    console.log("Creator account Data After:", creatorAfter);
    expect(creatorAfter.lamports).toEqual(creatorBefore.lamports + campaign.totalAmount.toNumber());
  });

  it("Refunds funds when campaign goal is not met", async() => {
    const refundCampaign = anchor.web3.Keypair.generate();
    const goal = new BN(1_000_000);
    const deadline = 

  }) 
})