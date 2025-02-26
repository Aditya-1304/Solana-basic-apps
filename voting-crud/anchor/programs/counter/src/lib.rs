#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("GinpHRVoJ35418tUBPyyRS3mptqTttHZ4BiQ5kB3h1g9");

#[program]
pub mod voting {
    use super::*;

    pub fn create_poll(ctx: Context<CreatePoll>, title : String, description : String, options: Vec<String>) -> Result<()> {
      let poll = &mut ctx.accounts.poll;
      poll.title = title;
      poll.description = description;
      poll.options = options;
      poll.creator = *ctx.accounts.creator.key;

      //Initialize votes value to zero
      poll.votes = vec![0; poll.options.len()];
      Ok(())
    }

    pub fn update_poll(ctx:Context<UpdatePoll>, new_title: String, new_description: String) -> Result<()> {
      let poll = &mut ctx.accounts.poll;
      require!(poll.creator == *ctx.accounts.creator.key, PollError::Unauthorized);
      poll.title = new_title;
      poll.description = new_description;
      Ok(())

    }

    pub fn delete_poll(_ctx:Context<DeletePoll>) -> Result<()> {
      Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePoll<'info> {
  #[account(
    init,
    payer = creator,
    space = 8 + Poll::INIT_SPACE,
  )]
  pub poll: Account<'info, Poll>,

  #[account(mut)]
  pub creator: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePoll<'info> {
  #[account(
    mut,
    has_one = creator,
  )]
  pub poll: Account<'info, Poll>,
  pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeletePoll<'info> {
  #[account(
    mut,
    has_one = creator,
    close = creator,
  )]
  pub poll: Account<'info, Poll>,
  pub creator: Signer<'info>,
  pub system_program: Program<'info, System>,
}


#[account]
#[derive(InitSpace)]
pub struct Poll{
  #[max_len(32)]
  pub title: String,

  #[max_len(500)]
  pub description: String,

  #[max_len(10, 50)]
  pub options: Vec<String>,

  #[max_len(10)]
  pub votes: Vec<u64>,

  pub creator: Pubkey,
}

#[error_code]
pub enum PollError{
  #[msg("Only the creator of the poll can perform this operation.")]
  Unauthorized
}