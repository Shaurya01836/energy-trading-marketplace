import {
  Server,
  BASE_FEE,
  TransactionBuilder,
  Keypair,
  Networks,
  Contract,
  SorobanRpc, // 👈 ADD THIS LINE
} from 'soroban-client';


const server = new Server('https://rpc-futurenet.stellar.org');
const networkPassphrase = Networks.TESTNET;
const CONTRACT_ID = 'CC2FBN334MR4R6KQ45WOUDCYB7Q74ERAFT3RAYUIIY7Z33IOIYOVMHDB';

// Initialize contract instance
export const initContract = async () => {
  try {
    const contract = new Contract(CONTRACT_ID);
    return contract;
  } catch (error) {
    console.error('Failed to initialize contract:', error);
    throw error;
  }
};

// Connect wallet using Freighter
export const connectWallet = async () => {
  if (!window.freighter) {
    throw new Error(
      'Freighter wallet not installed. Please install it from https://freighter.app'
    );
  }

  await window.freighter.load();
  const publicKey = await window.freighter.getPublicKey();
  return publicKey;
};

// Parse energy type to match contract enum
export const parseEnergyType = (type) => {
  const energyTypes = {
    solar: { Solar: null },
    wind: { Wind: null },
    hydro: { Hydro: null },
    biomass: { Biomass: null },
    other: { Other: null },
  };

  return energyTypes[type.toLowerCase()];
};

// Sign and submit real transactions
export const signAndSubmit = async (transaction) => {
  if (!window.freighter) {
    throw new Error('Freighter wallet not installed');
  }

  const signedXDR = await window.freighter.signTransaction(
    transaction.toXDR(),
    { networkPassphrase }
  );

  const tx = SorobanRpc.TransactionBuilder.fromXDR(signedXDR);
  return await server.sendTransaction(tx);
};

// ✅ Read-only: Get market status without wallet
export const getMarketStatus = async () => {
  try {
    const contract = new Contract(CONTRACT_ID);
    const dummyKey = Keypair.random().publicKey();
    const account = await server.getAccount(dummyKey);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(contract.call('get_market_status'))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    const decoded = contract.fromSimulatedTransaction(tx, sim);

    return decoded;
  } catch (error) {
    console.error('Failed to get market status:', error);
    throw error;
  }
};

// ✅ Read-only: Get active offers
export const getActiveOffers = async () => {
  try {
    const contract = new Contract(CONTRACT_ID);
    const dummyKey = Keypair.random().publicKey();
    const account = await server.getAccount(dummyKey);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(contract.call('get_active_offers')) // Replace with actual method if needed
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    const decoded = contract.fromSimulatedTransaction(tx, sim);

    return decoded;
  } catch (error) {
    console.error('Failed to fetch active offers:', error);
    throw error;
  }
};

// ✅ Write: Create new offer (requires wallet + signed tx)
export const createOffer = async (energyType, quantity, price) => {
  try {
    const publicKey = await connectWallet();
    const account = await server.getAccount(publicKey);
    const contract = new Contract(CONTRACT_ID);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        contract.call('create_offer', parseEnergyType(energyType), quantity, price)
      )
      .setTimeout(30)
      .build();

    const result = await signAndSubmit(tx);
    return result;
  } catch (error) {
    console.error('Failed to create offer:', error);
    throw error;
  }
};
