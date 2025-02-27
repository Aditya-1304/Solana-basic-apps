use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked};

pub fn transfer_token<'info>(
  from: &AccountInfo<'info>,
  to: &AccountInfo<'info>,
  amount: &u64,
  mint: &AccountInfo<'info>,
  authority: &Signer<'info>,
  token_program: &Interface<'info, TokenInterface>
)-> Result<()>{

  let transfer_accounts_options = TransferChecked {
    from: from.to_account_info(),
    to: to.to_account_info(),
    mint: mint.to_account_info(),
    authority: authority.to_account_info(),
  };

  let cpi_context = CpiContext::new(
    token_program.to_account_info(),
    transfer_accounts_options,
  );

  // You'll need to get decimals from the mint
  let mint_data = Mint::try_deserialize(&mut &mint.data.borrow()[..])?;
  transfer_checked(cpi_context, *amount, mint_data.decimals)
}