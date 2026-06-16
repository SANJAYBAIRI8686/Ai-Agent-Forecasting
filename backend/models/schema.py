from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.models.database import Base
import datetime

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, unique=True, index=True)
    company_name = Column(String)
    sector = Column(String)
    latest_price = Column(Float, nullable=True)
    market_cap = Column(Float, nullable=True)

    metrics = relationship("FinancialMetrics", back_populates="stock")
    reports = relationship("AnalysisReport", back_populates="stock")


class FinancialMetrics(Base):
    __tablename__ = "financial_metrics"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    revenue_growth = Column(Float, nullable=True)
    profit_margin = Column(Float, nullable=True)
    pe_ratio = Column(Float, nullable=True)
    debt_equity = Column(Float, nullable=True)
    fcf = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    stock = relationship("Stock", back_populates="metrics")


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    score = Column(Float, nullable=True)
    report_text = Column(Text, nullable=True)
    risk_level = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    stock = relationship("Stock", back_populates="reports")


class AgentTask(Base):
    __tablename__ = "agent_tasks"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="pending")  # pending, running, completed, failed
    current_step = Column(String, nullable=True)
    logs = Column(Text, nullable=True)  # Store JSON as text
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
