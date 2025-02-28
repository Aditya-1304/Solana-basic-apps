pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
pub use crate::instructions::make_offer::{send_offered_tokens_to_vault, save_offer};
pub use crate::instructions::take_offer::{send_wanted_tokens_to_maker, withdraw_and_close_vault};

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("6rADSywup4RBUicte4barxVpNKqSkbjahfg67oA6QhFV");

#[program]
pub mod swap {
    use super::*;

    pub fn make_offer(ctx: Context<MakeOffer>,id: u64, token_a_offered_amount: u64, token_b_wanted_amount: u64)-> Result<()> {
        send_offered_tokens_to_vault(&ctx, token_a_offered_amount)?;
        save_offer(ctx, id, token_b_wanted_amount)
        
    }

    pub fn take_offer(ctx: Context<TakeOffer>) -> Result<()> {
        instructions::take_offer::send_wanted_tokens_to_maker(&ctx)?;
        instructions::take_offer::withdraw_and_close_vault(ctx)?;
        Ok(())
        
    }
}
