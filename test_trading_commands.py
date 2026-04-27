"""
Test Suite & Validation for Trading Commands
Comprehensive testing of NSE/BSE trading functionality
"""

import unittest
import json
import os
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock

# Import modules to test
from indian_stock_api import IndianStockAPI, StockData, SearchResult, get_api
from market_tracker import Watchlist, Portfolio, WatchlistItem, PortfolioHolding
from trading_commands import (
    get_stock_price,
    search_stock,
    compare_exchanges,
    get_market_gainers,
    get_market_losers,
    get_market_summary,
    add_to_watchlist,
    view_watchlist,
    add_portfolio_holding,
    view_portfolio,
    get_stock_analysis,
    get_trading_recommendations
)


class TestIndianStockAPI(unittest.TestCase):
    """Test Indian Stock API client"""
    
    def setUp(self):
        """Initialize API client"""
        self.api = IndianStockAPI()
    
    def test_api_initialization(self):
        """Test API client initializes correctly"""
        self.assertIsNotNone(self.api)
        self.assertEqual(self.api.base_url, "http://65.0.104.9")
        self.assertTrue(len(self.api.popular_stocks) > 0)
    
    def test_singleton_instance(self):
        """Test singleton pattern works"""
        api1 = get_api()
        api2 = get_api()
        self.assertIs(api1, api2)
    
    @patch('indian_stock_api.requests.Session.get')
    def test_search_stocks(self, mock_get):
        """Test stock search functionality"""
        mock_response = Mock()
        mock_response.json.return_value = {
            "status": "success",
            "results": [
                {
                    "symbol": "RELIANCE",
                    "company_name": "Reliance Industries",
                    "match_type": "exact"
                }
            ]
        }
        mock_get.return_value = mock_response
        
        results = self.api.search("reliance")
        
        self.assertIsNotNone(results)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].symbol, "RELIANCE")
    
    def test_get_value_extraction(self):
        """Test numeric value extraction from different formats"""
        # Test numeric format
        data = {"price": 100.5}
        value = self.api._get_value(data, "price")
        self.assertEqual(value, 100.5)
        
        # Test value-with-units format
        data = {"price": {"value": 100.5, "unit": "INR"}}
        value = self.api._get_value(data, "price")
        self.assertEqual(value, 100.5)
        
        # Test missing value
        value = self.api._get_value({}, "price")
        self.assertEqual(value, 0)


class TestWatchlist(unittest.TestCase):
    """Test Watchlist functionality"""
    
    def setUp(self):
        """Initialize watchlist"""
        self.watchlist = Watchlist()
        # Clear existing items
        self.watchlist.items = {}
    
    def test_watchlist_add_item(self):
        """Test adding item to watchlist"""
        with patch.object(self.watchlist.api, 'get_stock') as mock_get:
            mock_stock = Mock()
            mock_stock.last_price = 2500.0
            mock_get.return_value = mock_stock
            
            success = self.watchlist.add("RELIANCE", alert_price=2600)
            self.assertTrue(success)
            self.assertIn("RELIANCE_NSE", self.watchlist.items)
    
    def test_watchlist_remove_item(self):
        """Test removing item from watchlist"""
        with patch.object(self.watchlist.api, 'get_stock') as mock_get:
            mock_stock = Mock()
            mock_stock.last_price = 2500.0
            mock_get.return_value = mock_stock
            
            self.watchlist.add("RELIANCE")
            success = self.watchlist.remove("RELIANCE")
            self.assertTrue(success)
            self.assertEqual(len(self.watchlist.items), 0)
    
    def test_watchlist_persistence(self):
        """Test watchlist saves and loads from file"""
        with patch.object(self.watchlist.api, 'get_stock') as mock_get:
            mock_stock = Mock()
            mock_stock.last_price = 2500.0
            mock_get.return_value = mock_stock
            
            self.watchlist.add("TCS")
            self.watchlist.save()
            
            # Create new instance and load
            new_watchlist = Watchlist()
            self.assertGreater(len(new_watchlist.items), 0)


class TestPortfolio(unittest.TestCase):
    """Test Portfolio functionality"""
    
    def setUp(self):
        """Initialize portfolio"""
        self.portfolio = Portfolio()
        # Clear existing holdings
        self.portfolio.holdings = {}
    
    def test_portfolio_add_holding(self):
        """Test adding holding to portfolio"""
        with patch.object(self.portfolio.api, 'get_stock') as mock_get:
            mock_stock = Mock()
            mock_stock.last_price = 3000.0
            mock_get.return_value = mock_stock
            
            success = self.portfolio.add_holding("TCS", 5, 3000)
            self.assertTrue(success)
            self.assertIn("TCS_NSE", self.portfolio.holdings)
    
    def test_portfolio_value_calculation(self):
        """Test portfolio value calculations"""
        with patch.object(self.portfolio.api, 'get_stock') as mock_get:
            mock_stock = Mock()
            mock_stock.last_price = 3100.0
            mock_get.return_value = mock_stock
            
            self.portfolio.add_holding("TCS", 5, 3000)
            self.portfolio.update_prices()
            
            total_cost, total_value, total_gain, gain_pct = self.portfolio.get_portfolio_value()
            
            self.assertEqual(total_cost, 15000)  # 5 * 3000
            self.assertEqual(total_value, 15500)  # 5 * 3100
            self.assertEqual(total_gain, 500)
            self.assertAlmostEqual(gain_pct, 3.33, places=1)
    
    def test_portfolio_diversification(self):
        """Test portfolio diversification calculation"""
        with patch.object(self.portfolio.api, 'get_stock') as mock_get:
            mock_stock = Mock()
            mock_stock.last_price = 100.0
            mock_get.return_value = mock_stock
            
            self.portfolio.add_holding("STOCK1", 5, 100)
            self.portfolio.add_holding("STOCK2", 5, 100)
            
            diversification = self.portfolio.get_diversification()
            
            self.assertEqual(len(diversification), 2)
            self.assertAlmostEqual(diversification["STOCK1"], 50.0)
            self.assertAlmostEqual(diversification["STOCK2"], 50.0)


class TestTradingCommands(unittest.TestCase):
    """Test trading command handlers"""
    
    @patch('trading_commands.get_api')
    def test_get_stock_price_command(self, mock_get_api):
        """Test stock price command"""
        mock_api = Mock()
        mock_stock = Mock()
        mock_stock.company_name = "Reliance Industries"
        mock_stock.symbol = "RELIANCE"
        mock_stock.exchange = "NSE"
        mock_stock.ticker = "RELIANCE.NS"
        mock_stock.last_price = 2456.75
        mock_stock.change = 12.30
        mock_stock.percent_change = 0.50
        mock_stock.previous_close = 2444.45
        mock_stock.day_high = 2468.90
        mock_stock.day_low = 2445.20
        mock_stock.year_high = 2856.00
        mock_stock.year_low = 2220.30
        mock_stock.volume = 8234567
        mock_stock.market_cap = 16645678900000
        mock_stock.pe_ratio = 27.35
        mock_stock.earnings_per_share = 89.75
        mock_stock.dividend_yield = 0.35
        mock_stock.sector = "Energy"
        mock_stock.industry = "Oil & Gas"
        mock_stock.timestamp = datetime.now().isoformat()
        
        mock_api.get_stock.return_value = mock_stock
        mock_get_api.return_value = mock_api
        
        result = get_stock_price("RELIANCE")
        
        self.assertIn("RELIANCE", result)
        self.assertIn("2456.75", result)
        self.assertIn("NSE", result)
    
    @patch('trading_commands.get_api')
    def test_search_stock_command(self, mock_get_api):
        """Test stock search command"""
        mock_api = Mock()
        mock_result = Mock()
        mock_result.company_name = "Reliance Industries"
        mock_result.symbol = "RELIANCE"
        mock_result.nse_ticker = "RELIANCE.NS"
        mock_result.bse_ticker = "RELIANCE.BO"
        
        mock_api.search.return_value = [mock_result]
        mock_get_api.return_value = mock_api
        
        result = search_stock("reliance")
        
        self.assertIn("RELIANCE", result)
        self.assertIn("Reliance Industries", result)
    
    @patch('trading_commands.get_watchlist')
    @patch('trading_commands.get_api')
    def test_add_to_watchlist_command(self, mock_get_api, mock_get_watchlist):
        """Test add to watchlist command"""
        mock_api = Mock()
        mock_stock = Mock()
        mock_stock.last_price = 2500.0
        mock_api.get_stock.return_value = mock_stock
        mock_get_api.return_value = mock_api
        
        mock_watchlist = Mock()
        mock_watchlist.add.return_value = True
        mock_get_watchlist.return_value = mock_watchlist
        
        result = add_to_watchlist("RELIANCE", alert_price=2600)
        
        self.assertIn("Added", result)
        self.assertIn("RELIANCE", result)
    
    @patch('trading_commands.get_portfolio')
    @patch('trading_commands.get_api')
    def test_add_portfolio_holding_command(self, mock_get_api, mock_get_portfolio):
        """Test add portfolio holding command"""
        mock_api = Mock()
        mock_stock = Mock()
        mock_stock.last_price = 3000.0
        mock_api.get_stock.return_value = mock_stock
        mock_get_api.return_value = mock_api
        
        mock_portfolio = Mock()
        mock_portfolio.add_holding.return_value = True
        mock_get_portfolio.return_value = mock_portfolio
        
        result = add_portfolio_holding("TCS", 5, 3000)
        
        self.assertIn("Added", result)
        self.assertIn("TCS", result)
    
    @patch('trading_commands.get_portfolio')
    def test_view_portfolio_command(self, mock_get_portfolio):
        """Test view portfolio command"""
        mock_portfolio = Mock()
        mock_portfolio.get_summary.return_value = {
            "total_holdings": 2,
            "total_cost_basis": 50000,
            "total_current_value": 52000,
            "total_gain_loss": 2000,
            "total_gain_loss_pct": 4.0,
            "diversification": {"STOCK1": 50, "STOCK2": 50},
            "sector_allocation": {"Tech": 50, "Finance": 50},
            "best_performer": None,
            "worst_performer": None
        }
        mock_get_portfolio.return_value = mock_portfolio
        
        result = view_portfolio()
        
        self.assertIn("PORTFOLIO", result)
        self.assertIn("2", result)
        self.assertIn("52000", result)


class TestDataIntegrity(unittest.TestCase):
    """Test data integrity and edge cases"""
    
    def test_empty_search_result(self):
        """Test handling empty search results"""
        with patch('trading_commands.get_api') as mock_get_api:
            mock_api = Mock()
            mock_api.search.return_value = []
            mock_get_api.return_value = mock_api
            
            result = search_stock("nonexistent_stock_xyz_123")
            self.assertIn("No results", result)
    
    def test_invalid_stock_symbol(self):
        """Test handling invalid stock symbol"""
        with patch('trading_commands.get_api') as mock_get_api:
            mock_api = Mock()
            mock_api.get_stock.return_value = None
            mock_get_api.return_value = mock_api
            
            result = get_stock_price("INVALID")
            self.assertIn("not find", result.lower())
    
    def test_zero_portfolio_value(self):
        """Test portfolio with zero value"""
        with patch('trading_commands.get_portfolio') as mock_get_portfolio:
            mock_portfolio = Mock()
            mock_portfolio.get_summary.return_value = {
                "total_holdings": 0,
                "total_cost_basis": 0,
                "total_current_value": 0,
                "total_gain_loss": 0,
                "total_gain_loss_pct": 0,
                "diversification": {},
                "sector_allocation": {},
                "best_performer": None,
                "worst_performer": None
            }
            mock_get_portfolio.return_value = mock_portfolio
            
            result = view_portfolio()
            self.assertIn("empty", result.lower())


class TestPerformance(unittest.TestCase):
    """Test performance and optimization"""
    
    def test_batch_stock_operations(self):
        """Test batch operations performance"""
        import time
        
        start = time.time()
        
        with patch('trading_commands.get_api') as mock_get_api:
            mock_api = Mock()
            mock_stock = Mock()
            mock_stock.last_price = 100.0
            mock_api.get_stock.return_value = mock_stock
            mock_get_api.return_value = mock_api
            
            # Simulate 10 stock lookups
            for i in range(10):
                get_stock_price("STOCK")
        
        elapsed = time.time() - start
        
        # Should complete in reasonable time (< 5 seconds)
        self.assertLess(elapsed, 5.0)


def run_full_test_suite():
    """Run complete test suite"""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestIndianStockAPI))
    suite.addTests(loader.loadTestsFromTestCase(TestWatchlist))
    suite.addTests(loader.loadTestsFromTestCase(TestPortfolio))
    suite.addTests(loader.loadTestsFromTestCase(TestTradingCommands))
    suite.addTests(loader.loadTestsFromTestCase(TestDataIntegrity))
    suite.addTests(loader.loadTestsFromTestCase(TestPerformance))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result


if __name__ == "__main__":
    print("="*60)
    print("TRADING COMMANDS TEST SUITE")
    print("="*60)
    result = run_full_test_suite()
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Tests Run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success Rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    print("="*60)
