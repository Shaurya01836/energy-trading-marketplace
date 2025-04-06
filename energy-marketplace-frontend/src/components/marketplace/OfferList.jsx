import React, { useState } from 'react';

const OfferList = ({ offers = [] }) => {
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');

  // Handle sorting offers
  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // Sort offers based on current criteria
  const sortedOffers = [...offers].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a[sortBy] > b[sortBy] ? 1 : -1;
    } else {
      return a[sortBy] < b[sortBy] ? 1 : -1;
    }
  });

  // Format energy value with appropriate units
  const formatEnergy = (amount, unit = 'kWh') => {
    return `${amount} ${unit}`;
  };

  // Format price with currency
  const formatPrice = (price, currency = 'USD') => {
    return `${price} ${currency}/kWh`;
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">Available Energy Offers</h2>
      
      {offers.length === 0 ? (
        <div className="p-4 border rounded text-center bg-gray-50">
          No offers available at the moment.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th 
                  className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('seller')}
                >
                  Seller
                  {sortBy === 'seller' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('energy')}
                >
                  Energy Amount
                  {sortBy === 'energy' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('price')}
                >
                  Price
                  {sortBy === 'price' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('source')}
                >
                  Energy Source
                  {sortBy === 'source' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('expiry')}
                >
                  Expiry
                  {sortBy === 'expiry' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedOffers.map((offer) => (
                <tr key={offer.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{offer.seller}</td>
                  <td className="px-4 py-3">{formatEnergy(offer.energy)}</td>
                  <td className="px-4 py-3">{formatPrice(offer.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      offer.source === 'Solar' ? 'bg-yellow-100 text-yellow-800' :
                      offer.source === 'Wind' ? 'bg-blue-100 text-blue-800' :
                      offer.source === 'Hydro' ? 'bg-cyan-100 text-cyan-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {offer.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(offer.expiry).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                      onClick={() => window.alert(`Purchase offer from ${offer.seller}`)}
                    >
                      Purchase
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OfferList;