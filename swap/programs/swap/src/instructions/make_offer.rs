use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use crate::{ANCHOR_DISTRIMINATOR, Offer};

use super::transfer_token;

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct MakeOffer<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    /// CHECK: This is a token mint
    pub token_mint_a: AccountInfo<'info>,

    /// CHECK: This is a token mint
    pub token_mint_b: AccountInfo<'info>,

    /// CHECK: This is a token account
    #[account(mut)]
    pub maker_token_account_a: AccountInfo<'info>,

    #[account(
        init,
        payer = maker,
        space = ANCHOR_DISTRIMINATOR + Offer::INIT_SPACE,
        seeds = [b"offer", maker.key().as_ref(), id.to_le_bytes().as_ref()],
        bump,
    )]
    pub offer: Account<'info, Offer>,

    /// CHECK: This is a token account
    #[account(mut)]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn send_offered_tokens_to_vault(ctx: &Context<MakeOffer>, token_a_offered_amount:u64) -> Result<()> {
    transfer_token(
        &ctx.accounts.maker_token_account_a,
        &ctx.accounts.vault,
        &token_a_offered_amount,
        &ctx.accounts.token_mint_a,
        &ctx.accounts.maker,
        &ctx.accounts.token_program,
    )
}

pub fn save_offer(ctx: Context<MakeOffer>, id: u64, token_b_wanted_amount: u64) -> Result<()> {
    ctx.accounts.offer.set_inner(Offer {
        id,
        maker: ctx.accounts.maker.key(),
        token_mint_a: ctx.accounts.token_mint_a.key(),
        token_mint_b: ctx.accounts.token_mint_b.key(),
        token_b_wanted_amount,
        bump: ctx.bumps.offer, 
    });
    Ok(())
}