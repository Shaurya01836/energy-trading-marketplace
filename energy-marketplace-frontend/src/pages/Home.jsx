import React, { useEffect, useState } from 'react';
import { getMarketStatus, getActiveOffers } from '../api/contractAPI';
import MarketStats from '../components/marketplace/MarketStats';
import OfferList from '../components/marketplace/OfferList';
import CreateOfferForm from '../components/marketplace/CreateOfferForm';
import WalletConnect from '../components/common/WalletConnect';

const HomePage = () => {
  const [marketStatus, setMarketStatus] = useState(null);
  const [activeOffers, setActiveOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const status = await getMarketStatus();
        setMarketStatus(status);

        const offers = await getActiveOffers();
        setActiveOffers(offers);

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load marketplace data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleWalletConnect = (connected) => {
    setWalletConnected(connected);
  };

  const handleOfferCreated = async () => {
    try {
      const offers = await getActiveOffers();
      setActiveOffers(offers);

      const status = await getMarketStatus();
      setMarketStatus(status);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Energy Marketplace</h1>

      <div className="mb-8">
        <WalletConnect onConnect={handleWalletConnect} />
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          {marketStatus && <MarketStats stats={marketStatus} />}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold mb-4">Active Energy Offers</h2>
              <OfferList offers={activeOffers} walletConnected={walletConnected} />
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Create New Offer</h2>
              <CreateOfferForm onOfferCreated={handleOfferCreated} walletConnected={walletConnected} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;
