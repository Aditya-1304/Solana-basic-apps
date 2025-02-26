import * as anchor from "@coral-xyz/anchor"; // Import the Anchor framework
import { Program, web3 } from "@coral-xyz/anchor"; // Import the Program type and web3 utilities
// Removed: import { assert } from "chai";
import { Voting } from "../target/types/voting";

describe("voting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Voting as Program<Voting>;
  let pollKeypair = web3.Keypair.generate();

  it("Creates a new poll", async () => {
    const title = "Test Poll";
    const description = "This is a test poll";
    const options = ["Option A", "Option B"];

    const tx = await program.methods
      .createPoll(title, description, options)
      .accounts({
        poll: pollKeypair.publicKey,
        creator: provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      } as any)
      .signers([pollKeypair])
      .rpc();

    console.log("CreatePoll tx signature:", tx);

    const pollAccount = await program.account.poll.fetch(pollKeypair.publicKey);
    console.log("Poll Account Data:", pollAccount);

    // Using Jest expect assertions instead of chai
    expect(pollAccount.title).toEqual(title);
    expect(pollAccount.description).toEqual(description);
    expect(pollAccount.options).toEqual(options);
    expect(pollAccount.votes.map((vote: any) => vote.toNumber())).toEqual(new Array(options.length).fill(0));
    expect(pollAccount.creator.equals(provider.wallet.publicKey)).toBeTruthy();
  });

  it("Updates the poll", async () => {
    const newTitle = "Updated Test Poll";
    const newDescription = "Updated description";

    const tx = await program.methods
      .updatePoll(newTitle, newDescription)
      .accounts({
        poll: pollKeypair.publicKey,
        creator: provider.wallet.publicKey,
      } as any)
      .rpc();

    console.log("UpdatePoll tx signature:", tx);

    const updatedPoll = await program.account.poll.fetch(pollKeypair.publicKey);
    console.log("Updated Poll Account Data:", updatedPoll);
    expect(updatedPoll.title).toEqual(newTitle);
    expect(updatedPoll.description).toEqual(newDescription);
  });

  it("Deletes the poll", async () => {
    const tx = await program.methods
      .deletePoll()
      .accounts({
        poll: pollKeypair.publicKey,
        creator: provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      } as any)
      .rpc();

    console.log("DeletePoll tx signature:", tx);

    // Attempt to fetch the poll account; if found, fail the test
    try {
      await program.account.poll.fetch(pollKeypair.publicKey);
      // If no error, the poll account still exists
      fail("Poll account still exists after deletion");
    } catch (err) {
      console.log("Poll account not found after deletion (expected):", err);
    }
  });
});