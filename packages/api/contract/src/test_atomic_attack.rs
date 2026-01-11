use super::*;
use soroban_sdk::{Env, Address, String, symbol_short, token, testutils::{Address as _, Ledger}};
use core::panic;

// We need std for catch_unwind in tests
extern crate std; 

#[test]
fn test_atomic_arbitrage_protection() {
    let e = Env::default();
    e.mock_all_auths_allowing_non_root_auth();

    // Setup Phase (Self-contained setup logic)
    // Timelock is 86400 seconds.
    // Atomic attack tries to enter and exit in the same ledger (0 elapsed time).

    let admin = Address::generate(&e);
    let treasury = Address::generate(&e);
    let issuer = Address::generate(&e);

    // Use SAC instances for both HITZ and XLM
    let hitz_token = e.register_stellar_asset_contract_v2(issuer.clone());
    let xlm_token = e.register_stellar_asset_contract_v2(issuer.clone());

    e.ledger().with_mut(|li| {
        li.protocol_version = 22;
        li.min_persistent_entry_ttl = 4096;
        li.min_temp_entry_ttl = 4096;
        li.max_entry_ttl = 31_536_000;
    });
    
    // Register contract
    let contract_id = e.register(SkyhitzCore, ());
    let client = SkyhitzCoreClient::new(&e, &contract_id);
    
    // Give HITZ to contract for staking and to attacker for fees
    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_token.address());
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    
    // CRITICAL: Set contract as HITZ token admin (required for the contract to work)
    hitz_admin.set_admin(&contract_id);

    // Initialize contract
    client.init(
        &admin, 
        &treasury, 
        &hitz_token.address(), 
        &1_000_000i128 // base fee in HITZ stroops
    );

    let attacker = Address::generate(&e);
    let attack_amount = 1_000_000_000_000i128; // Large capital

    // Give attacker HITZ for staking (post-exhaustion model takes HITZ fees)
    hitz_admin.mint(&attacker, &attack_amount);

    // The "Atomic" Transaction Simulation

    let entry_id = String::from_str(&e, "entry_1");
    client.create_entry(&entry_id); // Admin creates entry

    // TIME = T (1000)
    e.ledger().with_mut(|li| li.timestamp = 1000); 

    // OPERATION 1: Invest Large Amount (Stake)
    // This calls record_action -> takes HITZ fee -> sets 24h lock
    client.record_action(
        &attacker,
        &entry_id,
        &symbol_short!("invest"), 
        &Some(attack_amount) // investing in HITZ
    );
    
    // Check stake exists
    let stake = client.get_stake(&entry_id, &attacker);
    assert!(stake > 0, "Stake should exist");

    // OPERATION 2: Unstake Immediately (Exploit Attempt)
    // Time is STILL T (1000)
    // logic: "unstake" checks if (now < unlock_time). 
    // record_action set unlock_time = 1000 + 86400 = 87400.
    // check: 1000 < 87400? YES. Should Panic.

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.unstake(&entry_id, &attacker, &stake);
    }));

    match result {
        Ok(_) => panic!("TEST FAILED: Atomic arbitrage was ALLOWED! Timelock did not activate."),
        Err(_) => {
            // Panic caught successfully - timelock is working
        }
    }
}
