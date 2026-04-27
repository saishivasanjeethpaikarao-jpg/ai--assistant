import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';
import Portfolio from './pages/Portfolio';
import Watchlist from './pages/Watchlist';
import Alerts from './pages/Alerts';
import Trading from './pages/Trading';
import './App.css';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Navigation */}
        <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
                <span className="text-xl font-bold">Trading System</span>
              </Link>

              {/* Desktop Menu */}
              <div className="hidden md:flex gap-8">
                <Link to="/" className="hover:text-blue-400 transition">Dashboard</Link>
                <Link to="/portfolio" className="hover:text-blue-400 transition">Portfolio</Link>
                <Link to="/watchlist" className="hover:text-blue-400 transition">Watchlist</Link>
                <Link to="/alerts" className="hover:text-blue-400 transition">Alerts</Link>
                <Link to="/trading" className="hover:text-blue-400 transition">Trading</Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
              </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
              <div className="md:hidden pb-4 space-y-2">
                <Link to="/" className="block hover:text-blue-400">Dashboard</Link>
                <Link to="/portfolio" className="block hover:text-blue-400">Portfolio</Link>
                <Link to="/watchlist" className="block hover:text-blue-400">Watchlist</Link>
                <Link to="/alerts" className="block hover:text-blue-400">Alerts</Link>
                <Link to="/trading" className="block hover:text-blue-400">Trading</Link>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stock/:symbol" element={<StockDetail />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/trading" element={<Trading />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 border-t border-gray-700 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-400">
            <p>© 2024 Trading System. Powered by AI & Real-time NSE/BSE Data</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
