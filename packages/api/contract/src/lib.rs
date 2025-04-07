#![no_std]

use soroban_sdk::{contract, contracttype, Map, contractimpl, Env, BytesN, String, Address, token, log, Vec, vec };

#[contracttype]
pub enum DataKey {
    Index,
    Entries(String),
    Network,
    Admin
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Entry {
    pub id: String,
    pub apr: i128,
    pub tvl: i128,
    pub escrow: i128,
    pub shares: Map<Address, i128>,
    pub withdrawn_earnings: Map<Address, i128>,
}

 // Use scale factor of 1_000_000 for 6 decimal precision
 const SCALE: i128 = 1_000_000;

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn set_entry(e: Env, entry: Entry) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let key = DataKey::Entries(entry.id.clone());
        e.storage().persistent().set(&key, &entry);

        let mut index: Vec<String> = e.storage().persistent().get(&DataKey::Index).unwrap_or(vec![&e]);
        index.push_back(entry.id.clone());
        e.storage().persistent().set(&DataKey::Index, &index);
    }

    pub fn remove_entry(e: Env, id: String) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let key = DataKey::Entries(id.clone());
        if !e.storage().persistent().has(&key) {
            panic!("Entry not found");
        }
        e.storage().persistent().remove(&key);

        let index: Vec<String> = e.storage().persistent().get(&DataKey::Index).unwrap_or(vec![&e]);
    
        let mut new_index = Vec::new(&e);
        for i in index.iter() {
            if i != id {
                new_index.push_back(i.clone());
            }
        }

        e.storage().persistent().set(&DataKey::Index, &new_index);
    }

    pub fn get_entry(e: &Env, id: String) -> Entry {
        let key = DataKey::Entries(id.clone());
        if !e.storage().persistent().has(&key) {
            panic!("Entry not found");
        }
        e.storage().persistent().get(&key).unwrap()
    }

    pub fn version() -> u32 {
        19
    }

    pub fn init(e: Env, admin: Address, network: String, ids: Vec<String>) {
        if e.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        e.storage().instance().set(&DataKey::Admin, &admin);

        if network == String::from_str(&e, "public") || network == String::from_str(&e, "testnet") {
            e.storage().instance().set(&DataKey::Network, &network);
        } else {
            panic!("Invalid network");
        }

        let mut index: Vec<String> = e.storage().persistent().get(&DataKey::Index).unwrap_or(vec![&e]);
        
        for id in ids {
            if !index.contains(&id) {
                // Entry does not exist, create it with default values
                let entry = Entry {
                    id: id.clone(),
                    apr: 0,
                    tvl: 0,
                    escrow: 0,
                    shares: Map::new(&e),
                    withdrawn_earnings: Map::new(&e),
                };
                
                // Add the new entry to storage
                let key = DataKey::Entries(id.clone());
                e.storage().persistent().set(&key, &entry);
                
                // Append the new entry's ID to the index
                index.push_back(id);
            }
        }
        
        // Update the index in storage
        e.storage().persistent().set(&DataKey::Index, &index);
    }

    pub fn upgrade(e: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        e.deployer().update_current_contract_wasm(new_wasm_hash);
    }
     
    pub fn invest(e: Env, user: Address, id: String, amount: i128) {
        user.require_auth();
        let download_amount = 3000000; 
        let key = DataKey::Entries(id.clone());

        // Check if entry exists, create if not
        let mut entry: Entry = if !e.storage().persistent().has(&key) {
            log!(&e, "Entry not found, creating default: {}", id);
            // Entry does not exist, create it with default values
            let new_entry = Entry {
                id: id.clone(),
                apr: 0,
                tvl: 0,
                escrow: 0,
                shares: Map::new(&e),
                withdrawn_earnings: Map::new(&e), // Ensure new field is initialized
            };

            // Add the new entry to storage
            e.storage().persistent().set(&key, &new_entry);

            // Add the new entry's ID to the index
            // Fetch index, add ID if not present, save index
            let mut index: Vec<String> = e.storage().persistent().get(&DataKey::Index).unwrap_or(vec![&e]);
            if !index.contains(&id) { 
                 index.push_back(id.clone());
                 e.storage().persistent().set(&DataKey::Index, &index);
            }
            // Use the newly created entry for the subsequent investment logic
            new_entry 
        } else {
            // Entry exists, fetch it
            e.storage().persistent().get(&key).unwrap() // Safe to unwrap now
        };

        // Update equity share
        let past_user_equity = entry.shares.get(user.clone()).unwrap_or(0);

        if amount > download_amount {
            entry.shares.set(user.clone(), past_user_equity + amount);
             log!(&e, "Got equity!");
            entry.tvl += amount;
        } 
        
        entry.escrow += amount;
        entry.apr = get_apr(&e, entry.clone());

        // Save updated entry
        e.storage().persistent().set(&key, &entry);
        transfer(&e, &user, &e.current_contract_address(), amount);
    }

    pub fn claim_earnings(e: Env, user: Address, id: String) -> i128 {
        user.require_auth();

        let key = DataKey::Entries(id.clone());
        let mut entry: Entry = e.storage().persistent().get(&key).unwrap_or_else(|| panic!("Entry not found"));

        let user_share = entry.shares.get(user.clone()).unwrap_or(0);
        if user_share == 0 {
            panic!("User has no shares in this entry");
        }

        // Total earnings accumulated in the escrow beyond the initial TVL
        let total_earnings = if entry.escrow > entry.tvl {
            entry.escrow - entry.tvl
        } else {
            0 // No earnings if escrow hasn't surpassed TVL
        };

        if total_earnings == 0 {
             log!(&e, "No earnings available to claim yet.");
            return 0; // Nothing to claim
        }

        // Calculate user's proportional share of total earnings
        // Scale up share before division to maintain precision
        let scaled_user_earning_share: i128 = if entry.tvl > 0 {
            (user_share * SCALE) / entry.tvl
        } else {
            0 // Handle the case where TVL is zero
        };
        let user_total_earned = (total_earnings * scaled_user_earning_share) / SCALE;


        let previously_withdrawn = entry.withdrawn_earnings.get(user.clone()).unwrap_or(0);
        let claimable_amount = user_total_earned - previously_withdrawn;

        if claimable_amount <= 0 {
             log!(&e, "No claimable amount for user or already withdrawn.");
            return 0; // Nothing to claim or already withdrawn
        }

        // Update withdrawn earnings for the user
        entry.withdrawn_earnings.set(user.clone(), previously_withdrawn + claimable_amount);

        // Decrease total escrow by the claimed amount
        // Note: We don't touch TVL here, only the earnings portion (escrow)
        entry.escrow -= claimable_amount;

        // Recalculate APR after claim (optional, but good practice)
        entry.apr = get_apr(&e, entry.clone());

        // Save updated entry state
        e.storage().persistent().set(&key, &entry);

        // Transfer the claimed amount to the user
        log!(&e, "Claiming {} for user {}", claimable_amount, user.clone());
        transfer(&e, &e.current_contract_address(), &user, claimable_amount);
        
        // Return the claimed amount
        claimable_amount
    }
}

fn get_network(e: &Env) -> String {
    e.storage()
        .instance()
        .get(&DataKey::Network)
        .unwrap_or_else(|| String::from_str(e, "testnet")) 
}

fn get_apr(_: &Env, entry: Entry) -> i128 {
    if entry.tvl == 0 || entry.escrow <= entry.tvl {
        return 0;
    }
    ((entry.escrow - entry.tvl) * SCALE * 100) / (entry.tvl * SCALE)
}

fn transfer(e: &Env, from: &Address, to: &Address, amount: i128) {
    let token_contract_id = &get_xlm_address(e);
    let client = token::Client::new(e, token_contract_id);
    client.transfer(from, to, &amount)
}

fn get_xlm_address(e: &Env) -> Address {
    let network = get_network(e);
    let testnet = String::from_str(e, "testnet");
    let public = String::from_str(e, "public");
    
    let address_str = if network == testnet {
        "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"  // testnet
    } else if network == public {
        "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA"  // mainnet
    } else {
        panic!("Unknown network");  // Add futurenet or other networks if needed
    };

    // Return the corresponding Address
    Address::from_string(&String::from_str(e, address_str))
}
