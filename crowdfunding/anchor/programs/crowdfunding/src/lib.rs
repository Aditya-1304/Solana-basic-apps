#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("8dRkUZyAq7TqAGAHResBz9kVFWuTEGNFykWHWJiAuk11");

#[program]
pub mod crowdfunding {
    use super::*;

  pub fn initialize_campaign(ctx: Context<InitializeCampaign>,goal: u64, deadline: i64) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    campaign.creator = *ctx.accounts.creator.key;
    campaign.goal = goal;
    campaign.deadline = deadline;
    campaign.total_amount = 0;
    campaign.is_active = true;
    Ok(())

  }
  pub fn contribute(ctx:Context<Contribute>,amount: u64) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    **ctx.accounts.contributor.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? += amount;

    campaign.total_amount = campaign.total_amount.checked_add(amount).unwrap();
    Ok(())
  }

  pub fn withdraw(ctx:Context<Withdraw>) -> Result<()>{
    let campaign = &mut ctx.accounts.campaign;

    require!(campaign.total_amount >= campaign.goal, CustomError::GoalNotMet);

    let amount = campaign.total_amount;

    **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += amount;

    campaign.is_active = false;
    Ok(())
  }
}

pub fn refund(ctx: Context<Refund>,amount: u64) -> Result<()>{
  let campaign = &mut ctx.accounts.campaign;

  require!(campaign.total_amount < campaign.goal, CustomError::GoalMet);

  **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
  **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += amount;

  campaign.total_amount = campaign.total_amount.checked_sub(amount).unwrap();
  Ok(())
}

#[derive(Accounts)]
pub struct InitializeCampaign<'info>{
  /// CHECK: This is the escrow PDA that will hold the campaign's funds.
  /// No checks are necessary as this account is derived using a known seed and is controlled by the program.
  #[account(
    init,
    payer = creator,
    space = 8,
    seeds = [b"campaign".as_ref(), campaign.key().as_ref()],
    bump,
  )]
  pub escrow: AccountInfo<'info>,

  #[account(
    init,
    payer = creator,
    space = 8 + Campaign::SIZE,
  )]
  pub campaign: Account<'info, Campaign>,

  #[account(mut)]
  pub creator: Signer<'info>,

  pub system_program : Program<'info, System>,
}



#[derive(Accounts)]
pub struct Contribute<'info>{
  /// CHECK: This is the escrow PDA holding funds for the campaign.
  /// Its address is deterministically derived from the campaign key.
  #[account(
    mut,
    seeds = [b"campaign".as_ref(), campaign.key().as_ref()],
    bump,
  )]
  pub escrow: AccountInfo<'info>,

  #[account(mut)]
  pub campaign: Account<'info, Campaign>,

  #[account(mut)]
  pub contributor: Signer<'info>,

  pub system_program : Program<'info, System>,
}




#[derive(Accounts)]
pub struct Withdraw<'info>{
  /// CHECK: This is the escrow PDA holding funds for the campaign.
  /// Its address is deterministically derived from the campaign key.
  #[account(
    mut,
    seeds = [b"campaign".as_ref(), campaign.key().as_ref()],
    bump,
  )]
  pub escrow: AccountInfo<'info>,


  #[account(
    mut,
    has_one = creator,
  )]
  pub campaign: Account<'info, Campaign>,

  #[account(mut)]
  pub creator: Signer<'info>,

  pub system_program : Program<'info, System>,
}



#[derive(Accounts)]
pub struct Refund<'info>{
  /// CHECK: This is the escrow PDA holding funds for the campaign.
  /// Its address is deterministically derived from the campaign key.
  #[account(
    mut,
    seeds = [b"campaign".as_ref(), campaign.key().as_ref()],
    bump,
  )]
  pub escrow: AccountInfo<'info>,

  #[account(mut)]
  pub campaign: Account<'info, Campaign>,

  #[account(mut)]
  pub creator : Signer<'info>,

  pub system_program: Program<'info, System>
}


#[account]
pub struct Campaign {
  pub creator: Pubkey,
  pub goal: u64,
  pub total_amount: u64,
  pub deadline: i64,
  pub is_active: bool,
}

impl Campaign {
  const SIZE : usize = 32 + 8 + 8 + 8 + 1;
}

#[error_code]
pub enum CustomError {
  #[msg("Campaign goal not met, withdrawal not permitted.")]
  GoalNotMet,

  #[msg("Campaign goal has been met, refund not available")]
  GoalMet
}