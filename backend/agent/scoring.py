def calculate_score(metrics: dict) -> float:
    """
    Calculates a financial score out of 100 based on basic metrics.
    Weights:
    - P/E Ratio (20%): Lower is better (ideal range 10-25)
    - Revenue Growth (20%): Higher is better (> 0)
    - Profit Margin (20%): Higher is better (> 0)
    - Debt to Equity (20%): Lower is better (< 2)
    - Free Cash Flow (20%): Positive is good
    """
    score = 0.0
    
    # 1. P/E Ratio (0 to 20 points)
    pe = metrics.get("pe_ratio")
    if pe is not None:
        if 0 < pe <= 15:
            score += 20
        elif 15 < pe <= 25:
            score += 15
        elif 25 < pe <= 40:
            score += 10
        elif pe > 40:
            score += 5
    else:
        score += 10  # Neutral if missing
        
    # 2. Revenue Growth (0 to 20 points)
    rg = metrics.get("revenue_growth")
    if rg is not None:
        if rg > 0.20:
            score += 20
        elif rg > 0.10:
            score += 15
        elif rg > 0:
            score += 10
    else:
        score += 10
        
    # 3. Profit Margin (0 to 20 points)
    pm = metrics.get("profit_margin")
    if pm is not None:
        if pm > 0.20:
            score += 20
        elif pm > 0.10:
            score += 15
        elif pm > 0:
            score += 10
    else:
        score += 10
        
    # 4. Debt to Equity (0 to 20 points)
    de = metrics.get("debt_equity")
    if de is not None:
        # yfinance often returns it as a percentage (e.g., 150 for 1.5)
        # assuming it is absolute for scoring here:
        val = de / 100 if de > 10 else de
        if val < 0.5:
            score += 20
        elif val < 1.0:
            score += 15
        elif val < 2.0:
            score += 10
    else:
        score += 10
        
    # 5. Free Cash Flow (0 to 20 points)
    fcf = metrics.get("fcf")
    if fcf is not None:
        if fcf > 1000000000: # > 1B
            score += 20
        elif fcf > 0:
            score += 15
        else:
            score += 0 # Negative FCF
    else:
        score += 10
        
    return score
