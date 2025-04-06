import React from 'react';

const MarketStats = ({ stats }) => {
  const statItems = [
    {
      title: 'Active Offers',
      value: stats.activeOffers,
      icon: '📊',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Completed Trades',
      value: stats.completedTrades,
      icon: '🤝',
      color: 'bg-green-100 text-green-800'
    },
    {
      title: 'Total Energy Traded (kWh)',
      value: stats.totalEnergyTraded.toLocaleString(),
      icon: '⚡',
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      title: 'Total Offers Created',
      value: stats.totalOffersCreated,
      icon: '📈',
      color: 'bg-purple-100 text-purple-800'
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Market Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className={`${item.color} rounded-lg p-4 flex flex-col`}>
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{item.icon}</span>
              <h3 className="font-medium">{item.title}</h3>
            </div>
            <div className="text-2xl font-bold">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketStats;