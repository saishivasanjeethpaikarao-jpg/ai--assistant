import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stockAPI } from '../services/api';
import { HiArrowUp, HiArrowDown } from 'react-icons/hi';

export default function Dashboard() {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const [gainersRes, losersRes] = await Promise.all([
        stockAPI.getGainers(),
        stockAPI.getLosers(),
      ]);

      setGainers(gainersRes.data || []);
      setLosers(losersRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Market Overview</h1>
        <p className="text-gray-400">Real-time NSE/BSE stock data</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <p className="text-gray-400 mb-2">Top Gainers</p>
          <p className="text-3xl font-bold text-green-400">{gainers.length}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <p className="text-gray-400 mb-2">Top Losers</p>
          <p className="text-3xl font-bold text-red-400">{losers.length}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <p className="text-gray-400 mb-2">Market Status</p>
          <p className="text-3xl font-bold text-blue-400">Open</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Top Gainers */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Top Gainers 📈</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {gainers.slice(0, 4).map((stock, idx) => (
            <Link
              key={idx}
              to={`/stock/${stock.symbol || stock}`}
              className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-green-500 transition cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold">{stock.symbol || stock}</p>
                <HiArrowUp className="text-green-400" />
              </div>
              {stock.price && (
                <>
                  <p className="text-lg font-bold">₹{stock.price}</p>
                  <p className="text-green-400 text-sm">+{stock.change}%</p>
                </>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Top Losers */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Top Losers 📉</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {losers.slice(0, 4).map((stock, idx) => (
            <Link
              key={idx}
              to={`/stock/${stock.symbol || stock}`}
              className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-red-500 transition cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold">{stock.symbol || stock}</p>
                <HiArrowDown className="text-red-400" />
              </div>
              {stock.price && (
                <>
                  <p className="text-lg font-bold">₹{stock.price}</p>
                  <p className="text-red-400 text-sm">{stock.change}%</p>
                </>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/portfolio"
            className="bg-white/10 hover:bg-white/20 p-4 rounded text-center transition"
          >
            My Portfolio
          </Link>
          <Link
            to="/watchlist"
            className="bg-white/10 hover:bg-white/20 p-4 rounded text-center transition"
          >
            Watchlist
          </Link>
          <Link
            to="/alerts"
            className="bg-white/10 hover:bg-white/20 p-4 rounded text-center transition"
          >
            Alerts
          </Link>
          <Link
            to="/trading"
            className="bg-white/10 hover:bg-white/20 p-4 rounded text-center transition"
          >
            Trading Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
