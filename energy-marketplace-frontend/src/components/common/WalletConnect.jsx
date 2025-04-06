import React, { useState, useEffect } from 'react';
import { connectWallet } from '../../api/soroban';

const WalletConnect = ({ onConnect }) => {
  const [address, setAddress] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.freighter) {
        try {
          await window.freighter.load();
          const connected = await window.freighter.isConnected();

          if (connected) {
            const publicKey = await window.freighter.getPublicKey();
            setAddress(publicKey);
            onConnect(publicKey);
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
        }
      }
    };

    checkConnection();
  }, [onConnect]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      if (!window.freighter || !window.freighter.isConnected) {
        throw new Error(
          'Freighter wallet extension not detected. Please install it from https://freighter.app'
        );
      }

      const publicKey = await connectWallet();
      setAddress(publicKey);
      onConnect(publicKey);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet. Please try again.');
      onConnect(null);
    } finally {
      setConnecting(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      {!address ? (
        <div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>

          {error && (
            <div className="mt-2 text-red-600 text-sm">{error}</div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-green-100 text-green-800 rounded-full w-3 h-3 mr-2"></div>
            <span className="font-medium">Connected: {formatAddress(address)}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
