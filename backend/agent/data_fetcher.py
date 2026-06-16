import os
import requests
import yfinance as yf

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
            "fcf": metrics.get("freeCashFlowPerShareTTM"), # FMP returns per share, but we'll adapt
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
