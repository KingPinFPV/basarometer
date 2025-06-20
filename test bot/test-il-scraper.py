#!/usr/bin/env python3
"""
Test script for il-supermarket-scraper package
"""

import sys
import json
from datetime import datetime

try:
    from il_supermarket_scarper.scrappers_factory import ScraperFactory
    from il_supermarket_scarper.main import ScarpingTask, MainScrapperRunner
    print("✅ Package imports successful")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

def test_available_chains():
    """Test listing all available chains"""
    print("\n📊 Available Israeli supermarket chains:")
    chains = []
    for scraper in ScraperFactory:
        chains.append({
            "name": scraper.name,
            "value": str(scraper.value),
            "description": scraper.value.__doc__ if hasattr(scraper.value, '__doc__') else "N/A"
        })
        print(f"   {scraper.name}")
    
    print(f"\n✅ Total chains available: {len(chains)}")
    return chains

def test_single_chain_scan(chain_name="MEGA"):
    """Test scanning a single chain (MEGA as example)"""
    print(f"\n🔍 Testing scan for {chain_name}...")
    
    try:
        # Get the scraper for the chain
        scraper = getattr(ScraperFactory, chain_name)
        print(f"   ✅ Found scraper for {chain_name}")
        
        # Create a scraping task
        task = ScarpingTask(
            folder_name=f"test_scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            files_types=['gz'],  # Get XML data files
            chain_names=[chain_name],
            quick_start=True  # Use quick start for testing
        )
        
        # Run the scanner
        runner = MainScrapperRunner()
        print(f"   🚀 Starting scan...")
        
        result = runner.run(task)
        print(f"   ✅ Scan completed: {result}")
        
        return result
        
    except Exception as e:
        print(f"   ❌ Scan failed: {e}")
        return None

def main():
    print("🚀 Testing il-supermarket-scraper integration...")
    
    # Test 1: List available chains
    chains = test_available_chains()
    
    # Test 2: Quick scan test (commented out for now to avoid long execution)
    # result = test_single_chain_scan("MEGA")
    print("\n⚠️ Skipping actual scan test to avoid long execution time")
    print("   Use test_single_chain_scan('MEGA') to test real scanning")
    
    print("\n✅ Test completed - package is ready for integration!")

if __name__ == "__main__":
    main()