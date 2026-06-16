import os
import google.generativeai as genai
from sqlalchemy.orm import Session
from ..models import schema
from .data_fetcher import fetch_stock_data
from .scoring import calculate_score
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini API
# In a real setup, load this from an environment variable
# genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

def run_agent_workflow(db: Session, task_id: int, tickers: list):
    """
    Executes the main AI agent workflow for a list of tickers.
    """
    task = db.query(schema.AgentTask).filter(schema.AgentTask.id == task_id).first()
    if not task:
        return
    
    task.status = "running"
    task.current_step = "Starting workflow"
    logs = ["Workflow initialized."]
    task.logs = json.dumps(logs)
    db.commit()

    try:
        for ticker in tickers:
            # 1. Fetch Data
            logs.append(f"Fetching data for {ticker}...")
            task.current_step = f"Fetching data for {ticker}"
            task.logs = json.dumps(logs)
            db.commit()
            
            data = fetch_stock_data(ticker)
            if not data:
                logs.append(f"Failed to fetch data for {ticker}.")
                continue
            
            # Save or update stock
            stock = db.query(schema.Stock).filter(schema.Stock.ticker == ticker).first()
            if not stock:
                stock = schema.Stock(
                    ticker=ticker,
                    company_name=data["company_name"],
                    sector=data["sector"],
                    latest_price=data["latest_price"],
                    market_cap=data["market_cap"]
                )
                db.add(stock)
                db.commit()
                db.refresh(stock)
            else:
                stock.latest_price = data["latest_price"]
                stock.market_cap = data["market_cap"]
                db.commit()
            
            # Save metrics
            metrics = schema.FinancialMetrics(
                stock_id=stock.id,
                revenue_growth=data["revenue_growth"],
                profit_margin=data["profit_margin"],
                pe_ratio=data["pe_ratio"],
                debt_equity=data["debt_equity"],
                fcf=data["fcf"]
            )
            db.add(metrics)
            db.commit()

            # 2. Score
            logs.append(f"Scoring {ticker}...")
            task.current_step = f"Scoring {ticker}"
            task.logs = json.dumps(logs)
            db.commit()
            
            score = calculate_score(data)
            
            # 3. Generate Report using Gemini (Mocked if no key)
            logs.append(f"Generating report for {ticker}...")
            task.current_step = f"Generating AI report for {ticker}"
            task.logs = json.dumps(logs)
            db.commit()
            
            api_key = os.environ.get("GEMINI_API_KEY")
            report_text = ""
            risk_level = "Medium"
            
            if api_key:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                prompt = f\"\"\"
                Analyze the following stock data for {ticker} ({data['company_name']}).
                Metrics:
                P/E Ratio: {data['pe_ratio']}
                Profit Margin: {data['profit_margin']}
                Revenue Growth: {data['revenue_growth']}
                Debt to Equity: {data['debt_equity']}
                
                Provide a short investment research report (educational only).
                Identify the key risks and output a risk level (Low, Medium, or High) at the very end formatted as 'RISK: [Level]'.
                \"\"\"
                try:
                    response = model.generate_content(prompt)
                    report_text = response.text
                    if "RISK: Low" in report_text:
                        risk_level = "Low"
                    elif "RISK: High" in report_text:
                        risk_level = "High"
                except Exception as e:
                    logger.error(f"Gemini API error: {e}")
                    report_text = "Failed to generate report using AI due to an API error."
            else:
                report_text = f"This is a placeholder report for {ticker}. Provide a GEMINI_API_KEY environment variable to enable AI generation."
                if score > 80:
                    risk_level = "Low"
                elif score < 40:
                    risk_level = "High"
                
            # Save report
            report = schema.AnalysisReport(
                stock_id=stock.id,
                score=score,
                report_text=report_text,
                risk_level=risk_level
            )
            db.add(report)
            db.commit()
            
            logs.append(f"Completed analysis for {ticker}.")

        task.status = "completed"
        task.current_step = "Finished"
        task.logs = json.dumps(logs)
        db.commit()

    except Exception as e:
        task.status = "failed"
        task.current_step = "Error"
        logs.append(f"Error: {str(e)}")
        task.logs = json.dumps(logs)
        db.commit()
        logger.error(f"Agent workflow error: {e}")
