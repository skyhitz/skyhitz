#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Env};

// Note: With mock_all_auths(), we don't need to actually set admin in tests.
// The SAC will accept mint calls from the core contract with mocked authorization.

// Helper to setup test environment and return contract ready for initialization
fn setup_test_with_contract() -> (Env, Address, Address, Address, Address, Address) {
    let e = Env::default();
    e.mock_all_auths_allowing_non_root_auth();

    let admin = Address::generate(&e);
    let treasury = Address::generate(&e);
    let user = Address::generate(&e);
    let issuer = Address::generate(&e);

    // Use SAC instance for HITZ token
    let hitz_token = e.register_stellar_asset_contract_v2(issuer.clone());

    e.ledger().with_mut(|li| {
        li.protocol_version = 22;
        li.min_persistent_entry_ttl = 4096;
        li.min_temp_entry_ttl = 4096;
        li.max_entry_ttl = 31_536_000;
    });
    
    // Register contract
    let contract_id = e.register(SkyhitzCore, ());
    
    // CRITICAL: Set contract as HITZ token admin (required for minting)
    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_token.address());
    hitz_admin.set_admin(&contract_id);

    (e, admin, treasury, user, hitz_token.address(), contract_id)
}

#[test]
fn test_init() {
    let (e, admin, treasury, _user, hitz_addr, contract_id) = setup_test_with_contract();
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

    // Verify instance keys exist
    assert_eq!(client.get_base_fee(), 1_000_000); // 0.1 HITZ base fee
    
    // Verify oracle initialized
    let (oracle_price, _) = client.get_oracle_data();
    assert_eq!(oracle_price, 1_000_000); // Should be initialized to base_fee
}

#[test]
fn test_create_entry() {
    let (e, admin, treasury, _, hitz_addr, contract_id) = setup_test_with_contract();
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    let entry = client.get_entry(&entry_id).unwrap();
    assert_eq!(entry.tvl, 0);
    assert_eq!(entry.escrow, 0);
}

#[test]
fn test_record_action_stream() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    // Fund user with HITZ
    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Record stream action
    client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);

    // Check entry updated (fee = base_fee * difficulty = 1M * 1 = 1M)
    let entry = client.get_entry(&entry_id).unwrap();
    assert_eq!(entry.escrow, 1_000_000); // 0.1 HITZ fee added to escrow
    assert_eq!(entry.tvl, 0);

    // Check HITZ transferred to treasury
    let treasury_hitz = token::Client::new(&e, &hitz_addr).balance(&treasury);
    assert_eq!(treasury_hitz, 1_000_000);

    // Check HITZ reward: difficulty 1, base=3M, value_adj=10M, final=3M
    let user_hitz = token::Client::new(&e, &hitz_addr).balance(&user);
    // User started with 100M, paid 1M fee, received 3M reward = 100M - 1M + 3M = 102M
    assert_eq!(user_hitz, 102_000_000);
}

#[test]
fn test_record_action_mine_with_stake() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    // Fund user with HITZ
    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128); // 0.01 HITZ base fee

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Record mine action (difficulty 10, requires stake)
    client.record_action(&user, &entry_id, &symbol_short!("mine"), &None);

    // Check entry updated (TVL not escrow)
    // fee = base_fee * difficulty = 100_000 * 10 = 1_000_000
    let entry = client.get_entry(&entry_id).unwrap();
    assert_eq!(entry.tvl, 1_000_000); // 0.1 HITZ fee added to TVL
    assert_eq!(entry.escrow, 0);

    // Check user got reward
    // Log shows: base=3M, value_adj=1M, final=1M, so reward = 1M * difficulty 10 = 10M
    let user_hitz = token::Client::new(&e, &hitz_addr).balance(&user);
    // User started with 100M, paid 1M fee, received 10M reward = 109M
    assert_eq!(user_hitz, 109_000_000);

    // Check stake recorded (market-based: 1M fee / 100K oracle = 10 HITZ = 10M stroops)
    let stake = client.get_stake(&entry_id, &user);
    assert_eq!(stake, 10_000_000); // 1 HITZ in stroops

    let stake_total = client.get_stake_total(&entry_id);
    assert_eq!(stake_total, 10_000_000); // 1 HITZ in stroops
}

#[test]
fn test_halving() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128); // base_fee 1M (0.1 HITZ)

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Epoch 0 (start): unit reward = 3,000,000; stream difficulty = 1 → 3,000,000 reward
    // User: 100M - 1M fee + 3M reward = 102M
    let start_time = e.ledger().timestamp();
    e.ledger().with_mut(|li| li.timestamp = start_time);
    client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
    let r0 = token::Client::new(&e, &hitz_addr).balance(&user);
    assert_eq!(r0, 102_000_000); // 100M - 1M + 3M

    // Advance to next epoch (4 years later) and record another stream
    // Halved reward = 1.5M, fee still 1M → user gains 0.5M net
    e.ledger().with_mut(|li| li.timestamp += 126_144_000);
    client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
    let r1 = token::Client::new(&e, &hitz_addr).balance(&user) - r0;
    assert_eq!(r1, 500_000); // 1.5M reward - 1M fee = 0.5M net gain
}

#[test]
fn test_supply_cap() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    // Fund contract with less than reward
    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &1_000_000i128); // Only 1M

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128); // base_fee 0.01 HITZ

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);

    // With SAC minting, contract mints reward (1M in this case based on value_adj)
    // User: 100M - 100K fee + 1M reward = 100.9M
    let user_hitz = token::Client::new(&e, &hitz_addr).balance(&user);
    assert_eq!(user_hitz, 100_900_000);
}

#[test]
fn test_list_entries() {
    let (e, admin, treasury, _, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    client.create_entry(&String::from_str(&e, "song1"));
    client.create_entry(&String::from_str(&e, "song2"));
    client.create_entry(&String::from_str(&e, "song3"));

    let entries = client.list_entries(&0, &10);
    assert_eq!(entries.len(), 3);
    assert_eq!(entries.get(0).unwrap(), String::from_str(&e, "song1"));
    assert_eq!(entries.get(1).unwrap(), String::from_str(&e, "song2"));
    assert_eq!(entries.get(2).unwrap(), String::from_str(&e, "song3"));

    // Test pagination
    let page = client.list_entries(&1, &2);
    assert_eq!(page.len(), 2);
    assert_eq!(page.get(0).unwrap(), String::from_str(&e, "song2"));
}

#[test]
#[should_panic(expected = "Unknown action kind")]
fn test_unknown_action_panics() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    client.record_action(&user, &entry_id, &symbol_short!("unknown"), &None);
}

#[test]
fn test_multiple_action_kinds() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &1_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);
    hitz_admin.mint(&user, &1_000_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128); // base_fee: 0.1 XLM

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Stream, like, download -> escrow
    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &1_000_000_000i128);
    client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
    client.record_action(&user, &entry_id, &symbol_short!("like"), &None);
    client.record_action(&user, &entry_id, &symbol_short!("download"), &None);

    let entry = client.get_entry(&entry_id).unwrap();
    // 0.1 + 0.2 + 0.3 = 0.6 XLM = 6M stroops
    assert_eq!(entry.escrow, 6_000_000);
    assert_eq!(entry.tvl, 0);

    // Invest -> TVL (default is 3 HITZ min = 30M stroops)
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &None);

    let entry = client.get_entry(&entry_id).unwrap();
    assert_eq!(entry.escrow, 6_000_000);
    assert_eq!(entry.tvl, 30_000_000); // 3 HITZ minimum investment
}

#[test]
fn test_dynamic_investment() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &1_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &1_000_000_000i128); // More funds for multiple investments

    client.init(
        &admin,
        &treasury,
        &hitz_addr,
        &100_000i128 // 0.01 HITZ base fee
    );

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Test 1: Minimum investment (3 HITZ = 30M stroops) at oracle 1M (hardcoded)
    // Market-based stake: 30M / 1M * 10M = 300M stroops
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));
    
    let entry = client.get_entry(&entry_id).unwrap();
    assert_eq!(entry.tvl, 30_000_000); // 3 HITZ
    
    let stake1 = client.get_stake(&entry_id, &user);
    assert_eq!(stake1, 300_000_000); // 30 HITZ stake

    // Test 2: Another investment (6 HITZ = 60M stroops)
    // Market-based stake: 60M / 1M * 10M = 600M stroops
    // Total: 300M + 600M = 900M stroops
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(60_000_000i128));
    
    let entry = client.get_entry(&entry_id).unwrap();
    assert_eq!(entry.tvl, 90_000_000); // 3 + 6 = 9 HITZ
    
    let stake2 = client.get_stake(&entry_id, &user);
    assert_eq!(stake2, 900_000_000); // 90 HITZ stake

    // Test 3: Large investment (30 HITZ = 300M stroops)
    // Market-based stake: 300M / 1M * 10M = 3B stroops
    // Total: 900M + 3B = 3.9B stroops
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(300_000_000i128));
    
    let entry = client.get_entry(&entry_id).unwrap();
    assert_eq!(entry.tvl, 390_000_000); // 9 + 30 = 39 HITZ
    
    let stake3 = client.get_stake(&entry_id, &user);
    assert_eq!(stake3, 3_900_000_000); // 390 HITZ stake

    // Verify proportional stakes
    let total_stake = client.get_stake_total(&entry_id);
    assert_eq!(total_stake, 3_900_000_000); // 390 HITZ
}

#[test]
#[should_panic(expected = "Minimum investment is 3 HITZ")]
fn test_investment_below_minimum() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Should panic: 0.2 XLM is below minimum
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(2_000_000i128));
}

#[test]
fn test_base_fee_modification() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    // No OZ token; rewards minted via SAC by core on actions

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Test 1: Default base fee (0.01 XLM)
    assert_eq!(client.get_base_fee(), 100_000);

    // Record a stream action with default base fee (0.01 XLM * 1 difficulty = 0.01 XLM)
    client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
    let entry = client.get_entry(&entry_id).unwrap();
    assert_eq!(entry.escrow, 100_000); // 0.01 XLM

    // Test 2: Update base fee to 0.02 XLM
    client.set_base_fee(&200_000i128);
    assert_eq!(client.get_base_fee(), 200_000);

    // Record another stream action (0.02 XLM * 1 difficulty = 0.02 XLM)
    client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
    let entry = client.get_entry(&entry_id).unwrap();
    assert_eq!(entry.escrow, 300_000); // 0.01 + 0.02 = 0.03 XLM

    // Test 3: Update base fee to 0.005 XLM
    client.set_base_fee(&50_000i128);
    assert_eq!(client.get_base_fee(), 50_000);

    // Record a like action (0.005 XLM * 2 difficulty = 0.01 XLM)
    client.record_action(&user, &entry_id, &symbol_short!("like"), &None);
    let entry = client.get_entry(&entry_id).unwrap();
    assert_eq!(entry.escrow, 400_000); // 0.03 + 0.01 = 0.04 XLM

    // Verify mine action also respects new base fee (0.005 XLM * 10 difficulty = 0.05 XLM)
    client.record_action(&user, &entry_id, &symbol_short!("mine"), &None);
    let entry = client.get_entry(&entry_id).unwrap();
    assert_eq!(entry.tvl, 500_000); // 0.05 XLM in TVL
}

#[test]
#[should_panic(expected = "Base fee must be non-negative")]
fn test_negative_base_fee() {
    let (e, admin, treasury, _, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

    // Should panic: negative fee
    client.set_base_fee(&-1_000_000i128);
}

#[test]
fn test_allocate_and_claim_rewards() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    // For allocate/claim tests, we can deposit HITZ into contract via SAC mint since core is admin
    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &1_000_000_000i128);
    hitz_admin.mint(&admin, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // User stakes by investing 3 HITZ (30M) at oracle price 1M
    // Market-based stake: 30M / 1M * 10M = 300M stroops
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));

    let user_stake = client.get_stake(&entry_id, &user);
    assert_eq!(user_stake, 300_000_000);

    // Admin allocates 1000 HITZ as rewards
    client.allocate_rewards(&entry_id, &1_000_000_000i128);

    // Check reward pool
    let pool = client.get_reward_pool(&entry_id);
    assert_eq!(pool, 1_000_000_000);

    // Check claimable rewards (should be 100% since user has all stake)
    let claimable = client.get_claimable_rewards(&entry_id, &user);
    assert_eq!(claimable, 1_000_000_000);

    // User claims rewards
    let claimed = client.claim_rewards(&entry_id, &user);
    assert_eq!(claimed, 1_000_000_000);

    // Check claimable is now 0
    let claimable_after = client.get_claimable_rewards(&entry_id, &user);
    assert_eq!(claimable_after, 0);

    // User should have received HITZ (initial - fee + invest reward + claimed rewards)
    // 100M initial - 30M fee + 90M invest reward + 1000M claimed = 1160M
    let user_hitz = token::Client::new(&e, &hitz_addr).balance(&user);
    assert_eq!(user_hitz, 1_160_000_000);
}

#[test]
fn test_batch_allocate_rewards() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&admin, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

    // Create 3 entries
    let entry1 = String::from_str(&e, "song1");
    let entry2 = String::from_str(&e, "song2");
    let entry3 = String::from_str(&e, "song3");
    
    client.create_entry(&entry1);
    client.create_entry(&entry2);
    client.create_entry(&entry3);

    // User stakes in all entries (stake equals minted reward per action)
    client.record_action(&user, &entry1, &symbol_short!("invest"), &Some(30_000_000i128));
    client.record_action(&user, &entry2, &symbol_short!("invest"), &Some(30_000_000i128));
    client.record_action(&user, &entry3, &symbol_short!("invest"), &Some(30_000_000i128));

    // Batch allocate rewards
    let mut entry_ids = Vec::new(&e);
    entry_ids.push_back(entry1.clone());
    entry_ids.push_back(entry2.clone());
    entry_ids.push_back(entry3.clone());

    let mut amounts = Vec::new(&e);
    amounts.push_back(100_000_000i128);
    amounts.push_back(200_000_000i128);
    amounts.push_back(300_000_000i128);

    client.batch_allocate_rewards(&entry_ids, &amounts);

    // Verify reward pools
    assert_eq!(client.get_reward_pool(&entry1), 100_000_000);
    assert_eq!(client.get_reward_pool(&entry2), 200_000_000);
    assert_eq!(client.get_reward_pool(&entry3), 300_000_000);
}

#[test]
fn test_merge_and_remove_entry() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    // Fund
    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &600_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);
    let from_id = String::from_str(&e, "song_old");
    let into_id = String::from_str(&e, "song_new");
    client.create_entry(&from_id);
    client.create_entry(&into_id);

    // Populate source with some values
    client.record_action(&user, &from_id, &symbol_short!("invest"), &Some(30_000_000i128));
    client.allocate_rewards(&from_id, &100_000_000i128);

    // User now has a stake from investing, so we need to include them in stakers list
    let mut stakers = Vec::new(&e);
    stakers.push_back(user.clone());
    client.merge_entries(&from_id, &into_id, &stakers);

    // Verify target has non-zero tvl/pool and source removed
    let into = client.get_entry(&into_id).unwrap();
    assert!(into.tvl > 0 || into.escrow >= 0);
    assert!(client.get_reward_pool(&into_id) >= 100_000_000);
    assert!(client.get_entry(&from_id.clone()).is_none());
    
    // Verify stake was migrated
    // Market-based: 30M / 1M oracle * 10M = 300M stroops
    let stake = client.get_stake(&into_id, &user);
    assert_eq!(stake, 300_000_000);

    // Remove target (user has stake, so provide stakers list)
    let mut stakers = Vec::new(&e);
    stakers.push_back(user.clone());
    client.remove_entry(&into_id, &stakers);
    assert!(client.get_entry(&into_id.clone()).is_none());
}

#[test]
fn test_apr_calculation() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&user, &10_000_000_000i128);
    hitz_admin.mint(&admin, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    // Set ledger time to day 0
    e.ledger().with_mut(|li| li.timestamp = 0);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // User invests 10 HITZ (100M stroops) at oracle 1M
    // Market-based stake: 100M / 1M * 10M = 1B stroops
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(100_000_000i128));

    let stake = client.get_stake(&entry_id, &user);
    assert_eq!(stake, 1_000_000_000); // 100 HITZ stake

    // Admin allocates 500M HITZ rewards on day 30
    e.ledger().with_mut(|li| li.timestamp = 30 * 86_400);
    client.allocate_rewards(&entry_id, &500_000_000i128);

    // Calculate APR (allow off-by-one rounding)
    // APR = (500M / 1B / 30 days) × 365 × 10000 = 60,833 basis points
    let apr = client.calculate_apr(&entry_id);
    assert!(apr >= 60_800 && apr <= 60_900);

    // Test with more rewards on day 60
    e.ledger().with_mut(|li| li.timestamp = 60 * 86_400);
    client.allocate_rewards(&entry_id, &500_000_000i128);

    // Total rewards: 1000M over 60 days
    // APR = (1000M / 1B / 60 days) × 365 × 10000 = 60,833 basis points
    let apr2 = client.calculate_apr(&entry_id);
    assert!(apr2 >= 60_800 && apr2 <= 60_900);
}

#[test]
fn test_get_entry_stats() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&user, &10_000_000_000i128);
    hitz_admin.mint(&admin, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &200_000_000i128); // Need more XLM for invest (10M) + stream (50M) + like (100M)

    e.ledger().with_mut(|li| li.timestamp = 0);

    client.init(&admin, &treasury, &hitz_addr, &50_000_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // User invests (adds to TVL)
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));

    // Simulate user actions that add to escrow
    client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
    client.record_action(&user, &entry_id, &symbol_short!("like"), &None);

    // Allocate rewards
    e.ledger().with_mut(|li| li.timestamp = 30 * 86_400);
    client.allocate_rewards(&entry_id, &100_000_000i128);

    // Get stats
    let (tvl, escrow, stake, pool, apr) = client.get_entry_stats(&entry_id);

    assert_eq!(tvl, 30_000_000); // 3 HITZ invested (min investment)
    assert_eq!(escrow, 150_000_000); // stream (50M) + like (100M) = 150M stroops
    // Market-based stake: 30M / 1M (oracle) * 10M = 300M stroops
    assert_eq!(stake, 300_000_000); // 30 HITZ staked
    assert_eq!(pool, 100_000_000); // 100M HITZ allocated
    
    // APR = (pool / stake / days) × 365 × 10000
    // Just verify it's positive and reasonable
    assert!(apr > 0);
}

#[test]
#[should_panic(expected = "No stake in this entry")]
fn test_claim_without_stake() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    client.allocate_rewards(&entry_id, &100_000_000i128);

    // Should panic: user has no stake
    client.claim_rewards(&entry_id, &user);
}

#[test]
#[should_panic(expected = "No rewards to claim")]
fn test_double_claim() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&user, &10_000_000_000i128);
    hitz_admin.mint(&admin, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &50_000_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));
    client.allocate_rewards(&entry_id, &100_000_000i128);

    // First claim succeeds
    client.claim_rewards(&entry_id, &user);

    // Second claim should panic
    client.claim_rewards(&entry_id, &user);
}

#[test]
fn test_unstake_partial() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&user, &10_000_000_000i128);

    let hitz_balance_client = token::Client::new(&e, &hitz_addr);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(
        &admin,
        &treasury,
        &hitz_addr,
        &100_000i128,
    );

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // User invests 3 HITZ at oracle price 1M = 300M stroops stake
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));

    let user_stake_before = client.get_stake(&entry_id, &user);
    let total_stake_before = client.get_stake_total(&entry_id);
    assert_eq!(user_stake_before, 300_000_000);
    assert_eq!(total_stake_before, 300_000_000);

    let user_balance_before = hitz_balance_client.balance(&user);

    // Unstake 100M stroops (1/3 of 300M stake)
    let unstaked = client.unstake(&entry_id, &user, &100_000_000i128);
    assert_eq!(unstaked, 100_000_000);

    // Verify stake updated
    let user_stake_after = client.get_stake(&entry_id, &user);
    let total_stake_after = client.get_stake_total(&entry_id);
    assert_eq!(user_stake_after, 200_000_000); // 200M remaining
    assert_eq!(total_stake_after, 200_000_000);

    // Verify HITZ returned to user
    let user_balance_after = hitz_balance_client.balance(&user);
    assert_eq!(user_balance_after, user_balance_before + 100_000_000);
}

#[test]
fn test_unstake_full() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&user, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(
        &admin,
        &treasury,
        &hitz_addr,
        &100_000i128,
    );

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // User invests 3 HITZ (min) at oracle price 1M (0.1 HITZ/HITZ)
    // Market-based stake: 30M / 1M = 30 -> scaled by 10M = 300M stroops
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));

    let user_stake_before = client.get_stake(&entry_id, &user);
    assert_eq!(user_stake_before, 300_000_000);

    // Unstake ALL HITZ
    let unstaked = client.unstake(&entry_id, &user, &300_000_000i128);
    assert_eq!(unstaked, 300_000_000);

    // Verify stake removed
    let user_stake_after = client.get_stake(&entry_id, &user);
    let total_stake_after = client.get_stake_total(&entry_id);
    assert_eq!(user_stake_after, 0);
    assert_eq!(total_stake_after, 0);
}

#[test]
#[should_panic(expected = "No stake in this entry")]
fn test_unstake_no_stake() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(
        &admin,
        &treasury,
        &hitz_addr,
        &100_000i128,
    );

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Try to unstake without any stake
    client.unstake(&entry_id, &user, &100_000_000i128);
}

#[test]
#[should_panic(expected = "Amount exceeds stake")]
fn test_unstake_exceeds_stake() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&user, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(
        &admin,
        &treasury,
        &hitz_addr,
        &100_000i128,
    );

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // User invests 1 XLM → gets 100 HITZ stake (1B stroops)
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));

    // Try to unstake MORE than staked (trying 2B stroops when only 1B staked)
    client.unstake(&entry_id, &user, &2_000_000_000i128);
}

#[test]
#[should_panic(expected = "Amount must be positive")]
fn test_unstake_zero_amount() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&user, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(
        &admin,
        &treasury,
        &hitz_addr,
        &100_000i128,
    );

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));

    // Try to unstake 0
    client.unstake(&entry_id, &user, &0i128);
}

#[test]
fn test_unstake_multiple_users() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let user2 = Address::generate(&e);

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&user, &10_000_000_000i128);
    hitz_admin.mint(&user2, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);
    hitz_admin.mint(&user2, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &50_000_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Both users invest (oracle price = 1M hardcoded in init)
    // User1: 50M / 1M * 10M = 500M stroops stake
    // User2: 100M / 1M * 10M = 1000M stroops stake
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(50_000_000i128));
    client.record_action(&user2, &entry_id, &symbol_short!("invest"), &Some(100_000_000i128));

    // Total stake = 500M + 1000M = 1500M stroops
    let total_stake_before = client.get_stake_total(&entry_id);
    assert_eq!(total_stake_before, 1_500_000_000);

    // User1 unstakes half of their stake (250M stroops)
    client.unstake(&entry_id, &user, &250_000_000i128);

    // Verify individual stakes
    let user1_stake = client.get_stake(&entry_id, &user);
    let user2_stake = client.get_stake(&entry_id, &user2);
    assert_eq!(user1_stake, 250_000_000); // 500M - 250M = 250M
    assert_eq!(user2_stake, 1_000_000_000); // unchanged

    // Verify total stake
    let total_stake_after = client.get_stake_total(&entry_id);
    assert_eq!(total_stake_after, 1_250_000_000); // 250M + 1000M
}

#[test]
fn test_unstake_then_reinvest() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&user, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &50_000_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // User invests 3 HITZ (30M stroops) at oracle price 1M (hardcoded in init)
    // Market-based stake: 30M / 1M * 10M = 300M stroops
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));
    assert_eq!(client.get_stake(&entry_id, &user), 300_000_000);

    // User unstakes all
    client.unstake(&entry_id, &user, &300_000_000i128);
    assert_eq!(client.get_stake(&entry_id, &user), 0);

    // User reinvests same amount
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));
    assert_eq!(client.get_stake(&entry_id, &user), 300_000_000);
}

#[test]
fn test_oracle_initialization() {
    let (e, admin, treasury, _, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

    // Oracle price should be initialized to base_fee value
    let (price, last_update) = client.get_oracle_data();
    assert_eq!(price, 1_000_000); // 0.1 HITZ per HITZ (base_fee)
    assert_eq!(last_update, e.ledger().timestamp());
}

#[test]
fn test_oracle_update() {
    let (e, admin, treasury, _, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

    // Get initial price
    let (initial_price, initial_update) = client.get_oracle_data();
    assert_eq!(initial_price, 1_000_000); // base_fee

    // Advance time
    e.ledger().with_mut(|li| li.timestamp += 3600);

    // Update oracle price (treasury is the oracle updater)
    client.update_oracle_price(&treasury, &500_000i128); // 0.05 XLM per HITZ

    // Verify update
    let (new_price, new_update) = client.get_oracle_data();
    assert_eq!(new_price, 500_000);
    assert!(new_update > initial_update);
}

#[test]
#[should_panic(expected = "Only Treasury can update oracle price")]
fn test_oracle_update_non_treasury() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

    // User (not treasury) tries to update oracle price
    client.update_oracle_price(&user, &500_000i128);
}

#[test]
#[should_panic(expected = "Price must be positive")]
fn test_oracle_update_zero_price() {
    let (e, admin, treasury, _, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

    // Try to set zero price
    client.update_oracle_price(&treasury, &0i128);
}

#[test]
fn test_dynamic_emission_with_oracle() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    // Initialize with base_fee = 0.01 XLM, oracle_price = 0.01 XLM per HITZ
    client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Test 1: Default oracle price = 1M (hardcoded in init)
    // Stream: difficulty 1, pays 1M fee
    // base_reward = 3M, value_adjusted = 10M, final = min(3M, 10M) = 3M
    // User: 100M - 1M fee + 3M reward = 102M
    client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
    let user_hitz_1 = token::Client::new(&e, &hitz_addr).balance(&user);
    assert_eq!(user_hitz_1, 102_000_000);

    // Test 2: Update oracle to higher price (500K - lower than default)
    // This should reduce rewards due to value adjustment
    client.update_oracle_price(&treasury, &500_000i128);
    client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
    let user_hitz_2 = token::Client::new(&e, &hitz_addr).balance(&user) - user_hitz_1;
    // At 500K price: base=3M, value_adj=(1M×10M)/500K=20M, final=min(3M,20M)=3M
    // Net = 3M reward - 1M fee = 2M
    assert_eq!(user_hitz_2, 2_000_000);

    // Test 3: Update oracle to lower price (10K)
    // Reward would increase but capped by halving schedule
    client.update_oracle_price(&treasury, &10_000i128);
    let balance_before = token::Client::new(&e, &hitz_addr).balance(&user);
    client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
    let user_hitz_3 = token::Client::new(&e, &hitz_addr).balance(&user) - balance_before;
    // value_adj = (1M×10M)/10K = 1B, but capped at base_reward 3M
    // Net = 3M - 1M = 2M
    assert_eq!(user_hitz_3, 2_000_000);
}

#[test]
fn test_merge_entries() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(
        &admin,
        &treasury,
        &hitz_addr,
        &1_000_000i128,
    );

    let entry1 = String::from_str(&e, "song1");
    let entry2 = String::from_str(&e, "song2");
    let entry3 = String::from_str(&e, "song3");
    
    client.create_entry(&entry1);
    client.create_entry(&entry2);
    client.create_entry(&entry3);

    // User stakes in all entries (stake equals minted reward per action)
    client.record_action(&user, &entry1, &symbol_short!("invest"), &Some(30_000_000i128));
    client.record_action(&user, &entry2, &symbol_short!("invest"), &Some(30_000_000i128));
    client.record_action(&user, &entry3, &symbol_short!("invest"), &Some(30_000_000i128));

    // Merge entries
    // Add reward pool to source then merge into target
    client.allocate_rewards(&entry2, &100_000_000i128);
    
    // Note: These entries have stakes from invest actions
    // In real use, admin would provide list of stakers from off-chain indexing
    // For this test, we provide the user who staked
    let mut stakers = Vec::new(&e);
    stakers.push_back(user.clone());
    
    client.merge_entries(&entry2, &entry1, &stakers);

    let merged_entry = client.get_entry(&entry1).unwrap();
    assert!(merged_entry.tvl >= 30_000_000); // Minimum 3 HITZ investment
    assert!(client.get_reward_pool(&entry1) >= 100_000_000);
    assert!(client.get_entry(&entry2).is_none());
    
    // Verify user's stake was migrated to entry1
    let user_stake_in_entry1 = client.get_stake(&entry1, &user);
    assert!(user_stake_in_entry1 > 0);
}

#[test]
fn test_remove_entry() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(
        &admin,
        &treasury,
        &hitz_addr,
        &1_000_000i128,
    );

    let entry1 = String::from_str(&e, "song1");
    let entry2 = String::from_str(&e, "song2");
    let entry3 = String::from_str(&e, "song3");
    
    client.create_entry(&entry1);
    client.create_entry(&entry2);
    client.create_entry(&entry3);

    // Remove entry with no stakes (empty stakers list)
    let stakers = Vec::new(&e);
    client.remove_entry(&entry2, &stakers);
    assert!(client.get_entry(&entry2).is_none());
}

// NOTE: test_withdraw_xlm_to_treasury removed - function no longer exists in HITZ-only economy

#[test]
fn test_reset_instance() {
    let (e, admin, treasury, _user, hitz_addr, contract_id) = setup_test_with_contract();

    let client = SkyhitzCoreClient::new(&e, &contract_id);

    // Initialize contract
    client.init(
        &admin,
        &treasury,
        &hitz_addr,
        &100_000i128,
    );

    // Verify initialized values
    assert_eq!(client.get_base_fee(), 100_000);

    // Reset instance (clears all instance storage)
    client.reset_instance();

    // Verify instance storage is cleared - get_base_fee should return default or panic
    // Since we removed the keys, get_base_fee will return the default (100_000)
    // But init should allow re-initialization now
    
    // Re-initialize with new values
    let new_base_fee = 200_000i128;
    client.init(
        &admin,
        &treasury,
        &hitz_addr,
        &new_base_fee,
    );

    // Verify new values are set
    assert_eq!(client.get_base_fee(), new_base_fee);
}

// ========================================================================
// Artist Equity Tests
// ========================================================================

#[test]
fn test_set_artist_equity() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Set 10% artist equity (1000 bps)
    client.set_artist_equity(&entry_id, &user, &1000u32);

    // Verify equity was set
    let (equity_bps, claimed, claimable) = client.get_artist_equity(&entry_id, &user);
    assert_eq!(equity_bps, 1000);
    assert_eq!(claimed, 0);
    assert_eq!(claimable, 0); // No rewards yet

    // Verify total equity
    let total = client.get_total_artist_equity(&entry_id);
    assert_eq!(total, 1000);
}

#[test]
fn test_artist_equity_claim() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&admin, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // User invests to create stake
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));

    // Set 10% artist equity for user
    client.set_artist_equity(&entry_id, &user, &1000u32);

    // Admin allocates 1000 HITZ rewards
    client.allocate_rewards(&entry_id, &1_000_000_000i128);

    // Check claimable artist equity (10% of 1000 HITZ = 100 HITZ = 100M stroops)
    let (_, _, claimable) = client.get_artist_equity(&entry_id, &user);
    assert_eq!(claimable, 100_000_000);

    // User claims artist equity
    let hitz_balance_before = token::Client::new(&e, &hitz_addr).balance(&user);
    let claimed = client.claim_artist_equity(&entry_id, &user);
    assert_eq!(claimed, 100_000_000);

    // Verify HITZ transferred
    let hitz_balance_after = token::Client::new(&e, &hitz_addr).balance(&user);
    assert_eq!(hitz_balance_after, hitz_balance_before + 100_000_000);

    // Verify claimed amount updated
    let (_, claimed_amount, new_claimable) = client.get_artist_equity(&entry_id, &user);
    assert_eq!(claimed_amount, 100_000_000);
    assert_eq!(new_claimable, 0);
}

#[test]
fn test_staker_rewards_with_artist_equity() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let artist = Address::generate(&e);
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&admin, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&user, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // User invests
    client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));

    // Set 10% artist equity (NOT for the staker)
    client.set_artist_equity(&entry_id, &artist, &1000u32);

    // Allocate 1000 HITZ rewards
    client.allocate_rewards(&entry_id, &1_000_000_000i128);

    // Staker should only get 90% of rewards (artist gets 10%)
    let staker_claimable = client.get_claimable_rewards(&entry_id, &user);
    // 1000 HITZ * 90% = 900 HITZ = 900M stroops
    assert_eq!(staker_claimable, 900_000_000);

    // Staker claims
    let claimed = client.claim_rewards(&entry_id, &user);
    assert_eq!(claimed, 900_000_000);
}

#[test]
fn test_collaboration_multiple_artists() {
    let (e, admin, treasury, _user, hitz_addr, contract_id) = setup_test_with_contract();
    let artist1 = Address::generate(&e);
    let artist2 = Address::generate(&e);
    let staker = Address::generate(&e);
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&admin, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&staker, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "collab_song");
    client.create_entry(&entry_id);

    // Staker invests
    client.record_action(&staker, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));

    // Set 5% equity for each artist (10% total)
    client.set_artist_equity(&entry_id, &artist1, &500u32);
    client.set_artist_equity(&entry_id, &artist2, &500u32);

    // Verify total equity
    assert_eq!(client.get_total_artist_equity(&entry_id), 1000);

    // Allocate 1000 HITZ
    client.allocate_rewards(&entry_id, &1_000_000_000i128);

    // Each artist should get 5% = 50 HITZ = 50M stroops
    let (_, _, claimable1) = client.get_artist_equity(&entry_id, &artist1);
    let (_, _, claimable2) = client.get_artist_equity(&entry_id, &artist2);
    assert_eq!(claimable1, 50_000_000);
    assert_eq!(claimable2, 50_000_000);

    // Staker gets 90%
    let staker_claimable = client.get_claimable_rewards(&entry_id, &staker);
    assert_eq!(staker_claimable, 900_000_000);

    // Both artists claim
    let claimed1 = client.claim_artist_equity(&entry_id, &artist1);
    let claimed2 = client.claim_artist_equity(&entry_id, &artist2);
    assert_eq!(claimed1, 50_000_000);
    assert_eq!(claimed2, 50_000_000);
}

#[test]
fn test_max_artist_equity_999() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Set 99.9% artist equity (9990 bps) - maximum allowed
    client.set_artist_equity(&entry_id, &user, &9990u32);

    let (equity_bps, _, _) = client.get_artist_equity(&entry_id, &user);
    assert_eq!(equity_bps, 9990);
    assert_eq!(client.get_total_artist_equity(&entry_id), 9990);
}

#[test]
#[should_panic(expected = "Total artist equity would exceed 99.9%")]
fn test_artist_equity_exceeds_max() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let artist2 = Address::generate(&e);
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Set 50% for first artist
    client.set_artist_equity(&entry_id, &user, &5000u32);

    // Try to set 51% for second artist - should fail (total would be 101%)
    client.set_artist_equity(&entry_id, &artist2, &5100u32);
}

#[test]
#[should_panic(expected = "Artist already has equity on this entry")]
fn test_duplicate_artist_equity() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Set equity once
    client.set_artist_equity(&entry_id, &user, &1000u32);

    // Try to set again - should fail
    client.set_artist_equity(&entry_id, &user, &500u32);
}

#[test]
#[should_panic(expected = "Entry not found")]
fn test_artist_equity_nonexistent_entry() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "nonexistent");
    client.set_artist_equity(&entry_id, &user, &1000u32);
}

#[test]
#[should_panic(expected = "Equity must be greater than 0")]
fn test_artist_equity_zero() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    client.set_artist_equity(&entry_id, &user, &0u32);
}

#[test]
#[should_panic(expected = "Single artist equity cannot exceed 99.9%")]
fn test_single_artist_equity_over_max() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Try 100% - should fail
    client.set_artist_equity(&entry_id, &user, &10000u32);
}

#[test]
#[should_panic(expected = "No equity for this artist on this entry")]
fn test_claim_nonexistent_equity() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Try to claim without having equity
    client.claim_artist_equity(&entry_id, &user);
}

#[test]
fn test_incremental_artist_claims() {
    let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
    let staker = Address::generate(&e);
    let client = SkyhitzCoreClient::new(&e, &contract_id);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&contract_id, &10_000_000_000i128);
    hitz_admin.mint(&admin, &10_000_000_000i128);

    let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
    hitz_admin.mint(&staker, &100_000_000i128);

    client.init(&admin, &treasury, &hitz_addr, &100_000i128);

    let entry_id = String::from_str(&e, "song123");
    client.create_entry(&entry_id);

    // Staker invests to enable rewards
    client.record_action(&staker, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));

    // Set 10% artist equity
    client.set_artist_equity(&entry_id, &user, &1000u32);

    // First allocation: 500 HITZ
    client.allocate_rewards(&entry_id, &500_000_000i128);

    // Artist claims 10% of 500 = 50 HITZ
    let claimed1 = client.claim_artist_equity(&entry_id, &user);
    assert_eq!(claimed1, 50_000_000);

    // Second allocation: 500 more HITZ (total 1000)
    client.allocate_rewards(&entry_id, &500_000_000i128);

    // Artist claims 10% of NEW 500 = 50 HITZ more
    let claimed2 = client.claim_artist_equity(&entry_id, &user);
    assert_eq!(claimed2, 50_000_000);

    // Verify total claimed
    let (_, total_claimed, _) = client.get_artist_equity(&entry_id, &user);
    assert_eq!(total_claimed, 100_000_000);
}

