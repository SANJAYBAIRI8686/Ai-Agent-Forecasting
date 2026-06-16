import yfinance as yf

def fetch_stock_data(ticker: str):
    """
    Fetches basic stock information and financials using yfinance.
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Calculate derived metrics if missing
        return {
            "ticker": ticker,
            "company_name": info.get("shortName", ticker),
            "sector": info.get("sector", "Unknown"),
            "latest_price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "market_cap": info.get("marketCap"),
            "revenue_growth": info.get("revenueGrowth"),
            "profit_margin": info.get("profitMargins"),
            "pe_ratio": info.get("trailingPE"),
            "debt_equity": info.get("debtToEquity"),
            "fcf": info.get("freeCashflow"),
        }
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return None
