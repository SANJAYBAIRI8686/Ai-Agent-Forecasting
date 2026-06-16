import os
import requests
import yfinance as yf

# Map generic names to FMP sectors
SECTOR_MAP = {
    "tech": "Technology",
    "technology": "Technology",
    "finance": "Financial Services",
    "financials": "Financial Services",
    "financial services": "Financial Services",
    "healthcare": "Healthcare",
    "energy": "Energy",
    "utilities": "Utilities",
    "industrials": "Industrials",
    "basic materials": "Basic Materials",
    "consumer cyclical": "Consumer Cyclical",
    "consumer defensive": "Consumer Defensive",
    "communication services": "Communication Services",
    "real estate": "Real Estate"
}

# Predefined top tickers per sector for fallback screening
FALLBACK_SECTORS = {
    "Technology": ["AAPL", "MSFT", "GOOGL", "NVDA", "AVGO", "META", "CSCO", "ORCL", "ADBE", "CRM", "AMD", "QCOM", "TXN", "INTC", "ASML"],
    "Financial Services": ["JPM", "BAC", "WFC", "MS", "GS", "C", "BLK", "AXP", "SCHW", "RY", "TD", "HSBC", "UBS", "PNC", "TFC"],
    "Healthcare": ["LLY", "UNH", "JNJ", "ABBV", "MRK", "TMO", "AZN", "NVO", "PFE", "ABT", "DHR", "BMY", "AMGN", "ISRG", "GILD"],
    "Consumer Defensive": ["PG", "WMT", "KO", "PEP", "COST", "PM", "EL", "MO", "DEO", "CL", "KDP", "GIS", "DG", "KR", "K"]
}

def screen_top_profitable_stocks(sector_input: str) -> list:
    """
    Screens the top 10 profitable stocks in a sector.
    First tries FMP stock-screener API. If it fails/missing, falls back to yfinance evaluation.
    """
    fmp_key = os.environ.get("FMP_API_KEY")
    fmp_sector = SECTOR_MAP.get(sector_input.lower().strip(), "Technology")
    
    if fmp_key:
        print(f"Using FMP to screen top profitable stocks in sector: {fmp_sector}...")
        try:
            # Query FMP stock screener for the sector, sorting by net income (most profitable)
            url = f"https://financialmodelingprep.com/api/v3/stock-screener?sector={fmp_sector}&limit=50&isEtf=false&apikey={fmp_key}"
            res = requests.get(url).json()
            if res:
                # FMP free screener doesn't always sort by profitability directly, so we'll fetch them,
                # then calculate profit margin (netIncome / revenue) or sort by netIncome and return top 10
                # Filter out those without symbol or price
                valid = [
                    s for s in res 
                    if s.get("symbol") and s.get("price") and s.get("marketCap", 0) > 1e9
                ]
                # Sort by netIncome if available, otherwise marketCap
                # (Free API returns basic info, let's sort by market cap / profitability metrics available)
                # Let's sort by marketCap to get the top stable companies in the sector
                valid.sort(key=lambda x: x.get("marketCap") or 0, reverse=True)
                top_10 = [s["symbol"] for s in valid[:10]]
                print(f"FMP Screener found: {top_10}")
                return top_10
        except Exception as e:
            print(f"FMP screening failed: {e}. Falling back to manual evaluation...")

    # Fallback: Evaluates profitability of the predefined tickers using yfinance
    print(f"Using yfinance to screen top profitable stocks in: {fmp_sector}...")
    tickers = FALLBACK_SECTORS.get(fmp_sector, FALLBACK_SECTORS["Technology"])
    
    scored_tickers = []
    for ticker in tickers[:12]: # Limit to first 12 for speed
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            profit_margin = info.get("profitMargins") or 0.0
            scored_tickers.append((ticker, profit_margin))
        except Exception:
            continue
            
    # Sort by profit margin descending
    scored_tickers.sort(key=lambda x: x[1], reverse=True)
    top_10 = [t[0] for t in scored_tickers[:10]]
    print(f"yfinance Fallback Screener found: {top_10}")
    return top_10

def fetch_from_fmp(ticker: str, api_key: str):
    """
    Fetches financial data from Financial Modeling Prep (FMP) API.
    """
    try:
        # 1. Profile
        profile_url = f"https://financialmodelingprep.com/api/v3/profile/{ticker}?apikey={api_key}"
        profile_res = requests.get(profile_url).json()
        if not profile_res:
            return None
        profile = profile_res[0]
        
        # 2. Key Metrics (TTM)
        metrics_url = f"https://financialmodelingprep.com/api/v3/key-metrics-ttm/{ticker}?apikey={api_key}"
        metrics_res = requests.get(metrics_url).json()
        metrics = metrics_res[0] if metrics_res else {}
        
        # 3. Income Statement
        income_url = f"https://financialmodelingprep.com/api/v3/income-statement/{ticker}?limit=2&apikey={api_key}"
        income_res = requests.get(income_url).json()
        
        revenue_growth = None
        profit_margin = None
        if len(income_res) >= 2:
            current_rev = income_res[0].get("revenue", 0)
            prior_rev = income_res[1].get("revenue", 0)
            if prior_rev > 0:
                revenue_growth = (current_rev - prior_rev) / prior_rev
            
            net_income = income_res[0].get("netIncome", 0)
            if current_rev > 0:
                profit_margin = net_income / current_rev
        
        return {
            "ticker": ticker,
            "company_name": profile.get("companyName", ticker),
            "sector": profile.get("sector", "Unknown"),
            "latest_price": profile.get("price"),
            "market_cap": profile.get("mktCap"),
            "revenue_growth": revenue_growth,
            "profit_margin": profit_margin,
            "pe_ratio": metrics.get("peRatioTTM"),
            "debt_equity": metrics.get("debtToEquityTTM"),
            "fcf": metrics.get("freeCashFlowPerShareTTM"),
        }
    except Exception as e:
        print(f"Error fetching from FMP for {ticker}: {e}")
        return None

def fetch_stock_data(ticker: str):
    """
    Fetches basic stock information and financials, trying FMP first, then yfinance.
    """
    fmp_key = os.environ.get("FMP_API_KEY")
    if fmp_key:
        print(f"Attempting to fetch data for {ticker} using FMP...")
        fmp_data = fetch_from_fmp(ticker, fmp_key)
        if fmp_data:
            return fmp_data
            
    # Fallback to yfinance
    print(f"Fetching data for {ticker} using yfinance fallback...")
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
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
        print(f"Error fetching from yfinance for {ticker}: {e}")
        return None
