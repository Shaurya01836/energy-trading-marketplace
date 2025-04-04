#![allow(non_snake_case)]
#![no_std]
use soroban_sdk::{contract, contracttype, contractimpl, log, Env, Symbol, String, Address, symbol_short, Vec};


// Energy offer status tracking structure
#[contracttype]
#[derive(Clone)]
pub struct MarketStatus {
    pub active_offers: u64,     // Number of currently active energy offers
    pub completed_trades: u64,  // Number of successfully completed trades
    pub total_energy_traded: u64, // Total energy units traded on the platform
    pub total_offers_created: u64  // Total number of offers ever created
}

// Reference to the MarketStatus struct
const MARKET_STATUS: Symbol = symbol_short!("MKT_STAT");

// Energy types enum
#[contracttype]
#[derive(Clone)]
pub enum EnergyType {
    Solar,
    Wind,
    Hydro,
    Biomass,
    Other
}

// Mapping offer_id to EnergyOffer struct
#[contracttype] 
pub enum OfferBook { 
    EnergyOffer(u64)
}

// For creating unique offer IDs
const OFFER_COUNT: Symbol = symbol_short!("O_COUNT"); 

// Structure for energy offers
#[contracttype]
#[derive(Clone)] 
pub struct EnergyOffer {
    pub offer_id: u64,           // Unique identifier for the offer
    pub seller: Address,         // Address of energy producer
    pub energy_amount: u64,      // Amount of energy offered (in kWh)
    pub price_per_unit: u64,     // Price per kWh (in smallest token unit)
    pub energy_type: EnergyType, // Source of energy
    pub creation_time: u64,      // Timestamp when offer was created
    pub expiration_time: u64,    // Timestamp when offer expires
    pub is_active: bool,         // Whether offer is still active
}

// Mapping trade_id to EnergyTrade struct
#[contracttype] 
pub enum TradeBook { 
    EnergyTrade(u64)
}

// For creating unique trade IDs
const TRADE_COUNT: Symbol = symbol_short!("T_COUNT");

// Structure for completed trades
#[contracttype]
#[derive(Clone)] 
pub struct EnergyTrade {
    pub trade_id: u64,          // Unique identifier for the trade
    pub offer_id: u64,          // Reference to the original offer
    pub seller: Address,        // Address of energy producer
    pub buyer: Address,         // Address of energy consumer
    pub energy_amount: u64,     // Amount of energy traded
    pub total_price: u64,       // Total price paid
    pub energy_type: EnergyType, // Type of energy traded
    pub trade_time: u64,        // Timestamp when trade was completed
}

// Mapping user address to user profile
#[contracttype] 
pub enum UserBook { 
    UserProfile(Address)
}

// Structure for user profiles
#[contracttype]
#[derive(Clone)] 
pub struct UserProfile {
    pub user_address: Address,     // User's address
    pub total_energy_sold: u64,    // Total energy sold by user
    pub total_energy_bought: u64,  // Total energy bought by user
    pub reputation_score: u64,     // User reputation score (0-100)
    pub active_offers: Vec<u64>,   // List of user's active offers
    pub trade_history: Vec<u64>,   // List of user's completed trades
}

#[contract]
pub struct EnergyMarketplaceContract;

#[contractimpl]
impl EnergyMarketplaceContract {

    // Create a new energy offer
    pub fn create_offer(
        env: Env, 
        seller: Address, 
        energy_amount: u64, 
        price_per_unit: u64, 
        energy_type: EnergyType,
        valid_for: u64
    ) -> u64 {
        // Authenticate the seller
        seller.require_auth();
        
        // Get the current offer count and increment it
        let mut offer_count: u64 = env.storage().instance().get(&OFFER_COUNT).unwrap_or(0);
        offer_count += 1;
        
        // Get the current timestamp
        let time = env.ledger().timestamp();
        let expiration_time = time + valid_for;
        
        // Create a new energy offer
        let offer = EnergyOffer {
            offer_id: offer_count,
            seller: seller.clone(),
            energy_amount,
            price_per_unit,
            energy_type: energy_type.clone(),
            creation_time: time,
            expiration_time,
            is_active: true,
        };
        
        // Update market status
        let mut market_status = Self::get_market_status(env.clone());
        market_status.active_offers += 1;
        market_status.total_offers_created += 1;
        
        // Update seller's profile
        let mut seller_profile = Self::get_user_profile(env.clone(), seller.clone());
        seller_profile.active_offers.push_back(offer_count);
        
        // Store the offer, updated market status, and user profile
        env.storage().instance().set(&OfferBook::EnergyOffer(offer_count), &offer);
        env.storage().instance().set(&MARKET_STATUS, &market_status);
        env.storage().instance().set(&UserBook::UserProfile(seller), &seller_profile);
        env.storage().instance().set(&OFFER_COUNT, &offer_count);
        
        env.storage().instance().extend_ttl(5000, 5000);
        
        log!(&env, "Energy offer created with ID: {}", offer_count);
        
        offer_count
    }
    
    // Execute a trade (buy energy)
    pub fn execute_trade(
        env: Env,
        buyer: Address,
        offer_id: u64,
        energy_amount: u64
    ) -> u64 {
        // Authenticate the buyer
        buyer.require_auth();
        
        // Get the offer
        let mut offer = Self::get_offer(env.clone(), offer_id);
        
        // Verify the offer is active
        if !offer.is_active {
            log!(&env, "Offer is no longer active");
            panic!("Offer is no longer active");
        }
        
        // Verify the offer hasn't expired
        let current_time = env.ledger().timestamp();
        if current_time > offer.expiration_time {
            log!(&env, "Offer has expired");
            panic!("Offer has expired");
        }
        
        // Verify the requested energy amount is available
        if energy_amount > offer.energy_amount {
            log!(&env, "Requested energy amount exceeds available amount");
            panic!("Requested energy amount exceeds available amount");
        }
        
        // Calculate the total price
        let total_price = energy_amount * offer.price_per_unit;
        
        // In a real implementation, we would verify payment here
        // For simplicity, we're assuming payment is handled separately or through a token contract
        
        // Update the offer
        if energy_amount == offer.energy_amount {
            offer.is_active = false;
            // Get and update market status
            let mut market_status = Self::get_market_status(env.clone());
            market_status.active_offers -= 1;
            env.storage().instance().set(&MARKET_STATUS, &market_status);
            
            // Update seller's profile to remove the offer from active offers
            let mut seller_profile = Self::get_user_profile(env.clone(), offer.seller.clone());
            let mut updated_active_offers = Vec::new(&env);
            for active_offer_id in seller_profile.active_offers {
                if active_offer_id != offer_id {
                    updated_active_offers.push_back(active_offer_id);
                }
            }
            seller_profile.active_offers = updated_active_offers;
            env.storage().instance().set(&UserBook::UserProfile(offer.seller.clone()), &seller_profile);
        } else {
            offer.energy_amount -= energy_amount;
        }
        
        // Store the updated offer
        env.storage().instance().set(&OfferBook::EnergyOffer(offer_id), &offer);
        
        // Create a new trade record
        let mut trade_count: u64 = env.storage().instance().get(&TRADE_COUNT).unwrap_or(0);
        trade_count += 1;
        
        let trade = EnergyTrade {
            trade_id: trade_count,
            offer_id,
            seller: offer.seller.clone(),
            buyer: buyer.clone(),
            energy_amount,
            total_price,
            energy_type: offer.energy_type.clone(),
            trade_time: current_time,
        };
        
        // Update market status
        let mut market_status = Self::get_market_status(env.clone());
        market_status.completed_trades += 1;
        market_status.total_energy_traded += energy_amount;
        
        // Update seller's profile
        let mut seller_profile = Self::get_user_profile(env.clone(), offer.seller.clone());
        seller_profile.total_energy_sold += energy_amount;
        seller_profile.trade_history.push_back(trade_count);
        
        // Update buyer's profile
        let mut buyer_profile = Self::get_user_profile(env.clone(), buyer.clone());
        buyer_profile.total_energy_bought += energy_amount;
        buyer_profile.trade_history.push_back(trade_count);
        
        // Store everything
        env.storage().instance().set(&TradeBook::EnergyTrade(trade_count), &trade);
        env.storage().instance().set(&MARKET_STATUS, &market_status);
        env.storage().instance().set(&UserBook::UserProfile(offer.seller.clone()), &seller_profile);
        env.storage().instance().set(&UserBook::UserProfile(buyer), &buyer_profile);
        env.storage().instance().set(&TRADE_COUNT, &trade_count);
        
        env.storage().instance().extend_ttl(5000, 5000);
        
        log!(&env, "Trade executed with ID: {}", trade_count);
        
        trade_count
    }
    
    // Cancel an active offer
    pub fn cancel_offer(env: Env, seller: Address, offer_id: u64) {
        // Authenticate the seller
        seller.require_auth();
        
        // Get the offer
        let mut offer = Self::get_offer(env.clone(), offer_id);
        
        // Verify the caller is the seller
        if offer.seller != seller {
            log!(&env, "Only the seller can cancel this offer");
            panic!("Only the seller can cancel this offer");
        }
        
        // Verify the offer is active
        if !offer.is_active {
            log!(&env, "Offer is already inactive");
            panic!("Offer is already inactive");
        }
        
        // Mark the offer as inactive
        offer.is_active = false;
        
        // Update market status
        let mut market_status = Self::get_market_status(env.clone());
        market_status.active_offers -= 1;
        
        // Update seller's profile
        let mut seller_profile = Self::get_user_profile(env.clone(), seller.clone());
        let mut updated_active_offers = Vec::new(&env);
        for active_offer_id in seller_profile.active_offers {
            if active_offer_id != offer_id {
                updated_active_offers.push_back(active_offer_id);
            }
        }
        seller_profile.active_offers = updated_active_offers;
        
        // Store the updated offer, market status, and seller profile
        env.storage().instance().set(&OfferBook::EnergyOffer(offer_id), &offer);
        env.storage().instance().set(&MARKET_STATUS, &market_status);
        env.storage().instance().set(&UserBook::UserProfile(seller), &seller_profile);
        
        env.storage().instance().extend_ttl(5000, 5000);
        
        log!(&env, "Offer {} cancelled", offer_id);
    }
    
    // Update user reputation
    pub fn update_reputation(
        env: Env, 
        admin: Address, 
        user: Address, 
        new_score: u64
    ) {
        // In a real implementation, we would have proper admin verification
        // For simplicity, we're just requiring authentication
        admin.require_auth();
        
        // Ensure reputation score is within bounds
        if new_score > 100 {
            log!(&env, "Reputation score must be between 0 and 100");
            panic!("Reputation score must be between 0 and 100");
        }
        
        // Get and update user profile
        let mut user_profile = Self::get_user_profile(env.clone(), user.clone());
        user_profile.reputation_score = new_score;
        
        // Store updated profile
        env.storage().instance().set(&UserBook::UserProfile(user), &user_profile);
        
        env.storage().instance().extend_ttl(5000, 5000);
        
        log!(&env, "Updated reputation score for user to {}", new_score);
    }
    
    // Get market status
    pub fn get_market_status(env: Env) -> MarketStatus {
        env.storage().instance().get(&MARKET_STATUS).unwrap_or(MarketStatus {
            active_offers: 0,
            completed_trades: 0,
            total_energy_traded: 0,
            total_offers_created: 0
        })
    }
    
    // Get offer by ID
    pub fn get_offer(env: Env, offer_id: u64) -> EnergyOffer {
        let key = OfferBook::EnergyOffer(offer_id);
        env.storage().instance().get(&key).unwrap_or_else(|| {
            log!(&env, "Offer not found");
            panic!("Offer not found");
        })
    }
    
    // Get trade by ID
    pub fn get_trade(env: Env, trade_id: u64) -> EnergyTrade {
        let key = TradeBook::EnergyTrade(trade_id);
        env.storage().instance().get(&key).unwrap_or_else(|| {
            log!(&env, "Trade not found");
            panic!("Trade not found");
        })
    }
    
    // Get user profile
    pub fn get_user_profile(env: Env, user: Address) -> UserProfile {
        let key = UserBook::UserProfile(user.clone());
        env.storage().instance().get(&key).unwrap_or(UserProfile {
            user_address: user,
            total_energy_sold: 0,
            total_energy_bought: 0,
            reputation_score: 50, // Default reputation score
            active_offers: Vec::new(&env),
            trade_history: Vec::new(&env)
        })
    }
    
    // Get all active offers
    pub fn get_active_offers(env: Env) -> Vec<u64> {
        let mut active_offers = Vec::new(&env);
        let offer_count: u64 = env.storage().instance().get(&OFFER_COUNT).unwrap_or(0);
        
        for i in 1..=offer_count {
            let offer = Self::get_offer(env.clone(), i);
            if offer.is_active {
                active_offers.push_back(i);
            }
        }
        
        active_offers
    }
    
    // Get offers by energy type
    pub fn get_offers_by_type(env: Env, energy_type: EnergyType) -> Vec<u64> {
        let mut filtered_offers = Vec::new(&env);
        let offer_count: u64 = env.storage().instance().get(&OFFER_COUNT).unwrap_or(0);
        
        for i in 1..=offer_count {
            match env.storage().instance().get::<OfferBook, EnergyOffer>(&OfferBook::EnergyOffer(i)) {
                Some(offer) => {
                    // Check if energy types match and offer is active
                    if std::mem::discriminant(&offer.energy_type) == std::mem::discriminant(&energy_type) && offer.is_active {
                        filtered_offers.push_back(i);
                    }
                },
                None => continue
            }
        }
        
        filtered_offers
    }
}