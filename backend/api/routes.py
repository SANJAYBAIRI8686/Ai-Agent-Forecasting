from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models import schema
from pydantic import BaseModel
from typing import List
from backend.agent.workflow import run_agent_workflow

router = APIRouter()

class StockResponse(BaseModel):
    ticker: str
    company_name: str
    sector: str
    latest_price: float | None = None
    market_cap: float | None = None

    class Config:
        from_attributes = True

@router.get("/stocks/{ticker}", response_model=StockResponse)
def get_stock(ticker: str, db: Session = Depends(get_db)):
    stock = db.query(schema.Stock).filter(schema.Stock.ticker == ticker.upper()).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock

@router.get("/recommendations/top10")
def get_top_10(db: Session = Depends(get_db)):
    reports = db.query(schema.AnalysisReport).order_by(schema.AnalysisReport.score.desc()).limit(10).all()
    results = []
    for r in reports:
        stock = db.query(schema.Stock).filter(schema.Stock.id == r.stock_id).first()
        results.append({
            "ticker": stock.ticker,
            "company_name": stock.company_name,
            "score": r.score,
            "risk_level": r.risk_level
        })
    return results

@router.get("/reports")
def get_all_reports(db: Session = Depends(get_db)):
    reports = db.query(schema.AnalysisReport).order_by(schema.AnalysisReport.timestamp.desc()).all()
    results = []
    for r in reports:
        stock = db.query(schema.Stock).filter(schema.Stock.id == r.stock_id).first()
        if stock:
            results.append({
                "ticker": stock.ticker,
                "company_name": stock.company_name,
                "score": r.score,
                "risk_level": r.risk_level,
                "timestamp": str(r.timestamp.date()),
                "id": r.id
            })
    return results

@router.get("/stocks/{ticker}/report")
def get_stock_report(ticker: str, db: Session = Depends(get_db)):
    stock = db.query(schema.Stock).filter(schema.Stock.ticker == ticker.upper()).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    report = db.query(schema.AnalysisReport).filter(schema.AnalysisReport.stock_id == stock.id).order_by(schema.AnalysisReport.timestamp.desc()).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found for this stock")
        
    return {
        "ticker": stock.ticker,
        "company_name": stock.company_name,
        "score": report.score,
        "report_text": report.report_text,
        "risk_level": report.risk_level,
        "timestamp": str(report.timestamp.date())
    }



@router.post("/agent/analyze")
def analyze_sector(sector: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Create an agent task to track execution
    task = schema.AgentTask(status="pending", current_step="Initializing")
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # Pass the sector or tickers input string directly to the workflow
    background_tasks.add_task(run_agent_workflow, db, task.id, sector)
    
    return {"message": "Analysis started", "task_id": task.id}


@router.get("/agent/status/{task_id}")
def get_task_status(task_id: int, db: Session = Depends(get_db)):
    task = db.query(schema.AgentTask).filter(schema.AgentTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": task.status, "current_step": task.current_step, "logs": task.logs}

import yfinance as yf

@router.get("/stocks/{ticker}/history")
def get_stock_history(ticker: str, period: str = "1y"):
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)
        if hist.empty:
            raise HTTPException(status_code=404, detail="No historical data found")
        
        # Format the index as string and return closing prices
        data = [{"date": str(idx.date()), "price": row["Close"]} for idx, row in hist.iterrows()]
        return {"ticker": ticker, "history": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stocks/{ticker}/financials")
def get_stock_financials(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Extract basic financials from info dict
        return {
            "ticker": ticker,
            "revenue_growth": info.get("revenueGrowth"),
            "profit_margin": info.get("profitMargins"),
            "pe_ratio": info.get("trailingPE"),
            "debt_to_equity": info.get("debtToEquity"),
            "free_cashflow": info.get("freeCashflow"),
            "market_cap": info.get("marketCap")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

