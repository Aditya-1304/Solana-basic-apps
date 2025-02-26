#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("674ovc85MP52LbwXYBjk7GWQTfNrbByLujp9z5ou3icW");

#[program]
pub mod counterdappdappdapp {
    use super::*;
    pub fn initialize_counter(ctx : Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        Ok(())
    }
    
    pub fn increment_counter(ctx : Context<Increment>) -> Result<()> {
      let counter = &mut ctx.accounts.counter;
      counter.count += 1;
      Ok(())
    }

    pub fn decrement_counter(ctx : Context<Increment>) -> Result<()> {
      let counter = &mut ctx.accounts.counter;
      if counter.count > 0 {
        counter.count -= 1;
      }
      Ok(())
    }

    pub fn reset_counter(ctx : Context<Increment>) -> Result<()> {
      let counter = &mut ctx.accounts.counter;
      counter.count = 0;
      Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
  #[account(
    init,
    payer = signer,
    space = 8 + 8,
  )]
  pub counter: Account<'info, Counter>,

  #[account(mut)]
  pub signer: Signer<'info>,

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
  #[account(mut)]
  pub counter: Account<'info, Counter>,

  pub system_program: Program<'info, System>,
}

#[account]
pub struct Counter {
  pub count: u64,
}

