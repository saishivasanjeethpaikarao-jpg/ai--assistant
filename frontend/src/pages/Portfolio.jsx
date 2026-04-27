import React, { useState, useEffect } from 'react';
import { portfolioAPI } from '../services/api';
import { HiPlus, HiTrash } from 'react-icons/hi';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    buy_price: '',
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.get();
      setPortfolio(response.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await portfolioAPI.add(formData);
      setFormData({ symbol: '', quantity: '', buy_price: '' });
      setShowForm(false);
      fetchPortfolio();
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  const handleDeleteStock = async (symbol) => {
    if (window.confirm(`Remove ${symbol} from portfolio?`)) {
      try {
        await portfolioAPI.remove(symbol);
        fetchPortfolio();
      } catch (error) {
        console.error('Error removing stock:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
          <p className="text-gray-400">Manage your stock holdings</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg flex items-center gap-2 transition"
        >
          <HiPlus size={20} />
          Add Stock
        </button>
      </div>

      {/* Add Stock Form */}
      {showForm && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Add Stock to Portfolio</h2>
          <form onSubmit={handleAddStock} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Symbol</label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                placeholder="e.g., RELIANCE"
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Number of shares"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Buy Price (₹)</label>
                <input
                  type="number"
                  value={formData.buy_price}
                  onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
                  placeholder="Price per share"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded transition"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Portfolio Stats */}
      {portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-400 mb-2">Total Invested</p>
            <p className="text-3xl font-bold">₹{portfolio.total_invested?.toFixed(2) || '0'}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-400 mb-2">Current Value</p>
            <p className="text-3xl font-bold">₹{portfolio.total_current_value?.toFixed(2) || '0'}</p>
          </div>
          <div className={`bg-gray-800 p-6 rounded-lg border border-gray-700`}>
            <p className="text-gray-400 mb-2">Total Gains/Losses</p>
            <p className={`text-3xl font-bold ${portfolio.total_gains_losses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₹{portfolio.total_gains_losses?.toFixed(2) || '0'}
            </p>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700 border-b border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Symbol</th>
                <th className="px-6 py-4 text-left font-semibold">Quantity</th>
                <th className="px-6 py-4 text-left font-semibold">Buy Price</th>
                <th className="px-6 py-4 text-left font-semibold">Current Price</th>
                <th className="px-6 py-4 text-left font-semibold">Gain/Loss</th>
                <th className="px-6 py-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {portfolio?.holdings?.map((holding, idx) => (
                <tr key={idx} className="hover:bg-gray-700 transition">
                  <td className="px-6 py-4 font-bold">{holding.symbol}</td>
                  <td className="px-6 py-4">{holding.quantity}</td>
                  <td className="px-6 py-4">₹{holding.buy_price?.toFixed(2)}</td>
                  <td className="px-6 py-4">₹{holding.current_price?.toFixed(2) || '-'}</td>
                  <td className={`px-6 py-4 font-semibold ${holding.gain_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ₹{holding.gain_loss?.toFixed(2) || '0'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeleteStock(holding.symbol)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      <HiTrash size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!portfolio?.holdings || portfolio.holdings.length === 0) && (
          <div className="p-8 text-center text-gray-400">
            <p>No holdings yet. Add a stock to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
