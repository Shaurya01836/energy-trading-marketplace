import { SorobanRpc, Contract } from 'soroban-client';
import { Networks } from '@stellar/stellar-sdk';

// Configure for testnet by default
import { Server } from 'soroban-client';

const server = new Server('https://rpc-futurenet.stellar.org');
const networkPassphrase = Networks.TESTNET;

// Your contract ID from deployment
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

// Helper to convert between UI and contract data types
export const parseEnergyType = (type) => {
  const energyTypes = {
    'solar': { Solar: null },
    'wind': { Wind: null },
    'hydro': { Hydro: null },
    'biomass': { Biomass: null },
    'other': { Other: null },
  };

  return energyTypes[type.toLowerCase()];
};

// Connect wallet using Freighter
export const connectWallet = async () => {
  if (!window.freighterApi) {
    throw new Error('Freighter wallet not installed. Please install it from https://freighter.app');
  }

  try {
    const publicKey = await window.freighterApi.getPublicKey();
    return publicKey;
  } catch (error) {
    console.error("Failed to connect to Freighter:", error);
    throw new Error("Could not connect to Freighter wallet.");
  }
};

// Sign and submit transaction
export const signAndSubmit = async (transaction) => {
  if (!window.freighterApi) {
    throw new Error('Freighter wallet not installed');
  }

  try {
    const signedXDR = await window.freighterApi.signTransaction(
      transaction.toXDR(),
      { networkPassphrase }
    );

    const tx = new SorobanRpc.Transaction(signedXDR);
    return await server.sendTransaction(tx);
  } catch (error) {
    console.error("Failed to sign or send transaction:", error);
    throw error;
  }
};
