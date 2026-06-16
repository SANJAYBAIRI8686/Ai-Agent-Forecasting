import os
import requests
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import google.generativeai as genai
from sqlalchemy.orm import Session
from backend.models import schema
from backend.agent.data_fetcher import fetch_stock_data, screen_top_profitable_stocks
from backend.agent.scoring import calculate_score
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_report_with_nvidia(ticker: str, data: dict, api_key: str) -> str:
    """
    Generates a research report using LangChain + NVIDIA NIM API (Llama 3.1 8B).
    """
    try:
        # Initialize LangChain ChatOpenAI with Nvidia base configurations
        llm = ChatOpenAI(
            model="meta/llama-3.1-8b-instruct",
            openai_api_key=api_key,
            openai_api_base="https://integrate.api.nvidia.com/v1",
            temperature=0.2,
            max_tokens=1024
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an advanced, professional stock market research agent. Provide concise, clear, and educational investment analysis reports."),
            ("user", """
            Analyze the following stock data for {ticker} ({company_name}).
            Financial Metrics:
            - P/E Ratio: {pe_ratio}
            - Profit Margin: {profit_margin}
            - Revenue Growth: {revenue_growth}
            - Debt to Equity: {debt_equity}
            
            Provide a short investment research report (educational only).
            Structure your report into:
            1. Executive Summary
            2. Financial Strengths & Weaknesses
            3. Core Risks
            
            At the very end of your response, output a risk level (Low, Medium, or High) formatted EXACTLY as 'RISK: [Level]'.
            """)
        ])
        
        # Assemble LCEL chain
        chain = prompt | llm | StrOutputParser()
        
        # Invoke LangChain run
        result = chain.invoke({
            "ticker": ticker,
            "company_name": data.get("company_name", ticker),
            "pe_ratio": data.get("pe_ratio", "N/A"),
            "profit_margin": data.get("profit_margin", "N/A"),
            "revenue_growth": data.get("revenue_growth", "N/A"),
            "debt_equity": data.get("debt_equity", "N/A")
        })
        return result
    except Exception as e:
        logger.error(f"LangChain NVIDIA NIM generation failed: {e}")
        raise e

def run_agent_workflow(db: Session, task_id: int, sector_or_tickers: str):
    """
    Executes the main AI agent workflow for a sector or list of tickers.
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
        # Determine if input is a sector or a list of tickers
        cleaned_input = sector_or_tickers.lower().strip()
        is_sector = cleaned_input in [
            "tech", "technology", "finance", "financials", "financial services", 
            "healthcare", "energy", "utilities", "industrials", "basic materials", 
            "consumer cyclical", "consumer defensive", "communication services", "real estate"
        ]
        
        tickers = []
        if is_sector:
            logs.append(f"Screening top profitable stocks in sector: {sector_or_tickers}...")
            task.current_step = f"Screening {sector_or_tickers} sector"
            task.logs = json.dumps(logs)
            db.commit()
            
            tickers = screen_top_profitable_stocks(cleaned_input)
            
            logs.append(f"Screener identified top stocks to analyze: {', '.join(tickers)}")
            task.logs = json.dumps(logs)
            db.commit()
        else:
            tickers = [t.strip().upper() for t in sector_or_tickers.split(",") if t.strip()]
            logs.append(f"Custom tickers to analyze: {', '.join(tickers)}")
            task.logs = json.dumps(logs)
            db.commit()

        for ticker in tickers:
            # 1. Fetch Data
            logs.append(f"Fetching data for {ticker}...")
            task.current_step = f"Fetching data for {ticker}"
            task.logs = json.dumps(logs)
            db.commit()
            
            data = fetch_stock_data(ticker)
            if not data:
                logs.append(f"Failed to fetch data for {ticker}.")
                task.logs = json.dumps(logs)
                db.commit()
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
            
            # 3. Generate Report using LLM (LangChain/NVIDIA or Gemini or Fallback)
            logs.append(f"Generating report for {ticker}...")
            task.current_step = f"Generating AI report for {ticker}"
            task.logs = json.dumps(logs)
            db.commit()
            
            nvidia_key = os.environ.get("NVIDIA_API_KEY")
            gemini_key = os.environ.get("GEMINI_API_KEY")
            report_text = ""
            risk_level = "Medium"
            
            # Try NVIDIA NIM (LangChain) first
            if nvidia_key:
                try:
                    logs.append(f"Invoking LangChain NVIDIA Llama-3.1 model...")
                    task.logs = json.dumps(logs)
                    db.commit()
                    report_text = generate_report_with_nvidia(ticker, data, nvidia_key)
                except Exception as e:
                    logger.error(f"Failed to generate report using LangChain: {e}")
                    logs.append("LangChain NVIDIA model failed. Attempting fallback...")
                    task.logs = json.dumps(logs)
                    db.commit()
            
            # Try Gemini if NVIDIA fails/absent
            if not report_text and gemini_key:
                try:
                    logs.append(f"Using Gemini LLM for report...")
                    task.logs = json.dumps(logs)
                    db.commit()
                    genai.configure(api_key=gemini_key)
                    model = genai.GenerativeModel("gemini-1.5-flash")
                    prompt = f"""
                    Analyze the following stock data for {ticker} ({data['company_name']}).
                    Metrics:
                    P/E Ratio: {data.get('pe_ratio')}
                    Profit Margin: {data.get('profit_margin')}
                    Revenue Growth: {data.get('revenue_growth')}
                    Debt to Equity: {data.get('debt_equity')}
                    
                    Provide a short investment research report (educational only).
                    Identify key risks and output a risk level (Low, Medium, or High) at the very end formatted as 'RISK: [Level]'.
                    """
                    response = model.generate_content(prompt)
                    report_text = response.text
                except Exception as e:
                    logger.error(f"Gemini LLM error: {e}")
                    logs.append("Gemini LLM failed.")
                    task.logs = json.dumps(logs)
                    db.commit()
            
            # Final fallback if both LLMs fail/absent
            if not report_text:
                report_text = f"Educational Report for {ticker}. Metrics fetched successfully. Scores calculated to be {score}."
                if score > 80:
                    risk_level = "Low"
                elif score < 40:
                    risk_level = "High"
            else:
                # Parse risk level from generated LLM text
                if "RISK: Low" in report_text or "RISK: LOW" in report_text:
                    risk_level = "Low"
                elif "RISK: High" in report_text or "RISK: HIGH" in report_text:
                    risk_level = "High"
                else:
                    risk_level = "Medium"
                
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
