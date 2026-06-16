# StockAgent 📈 • AI-Powered Stock Market Research Agent

StockAgent is a free, educational, student-friendly stock market research dashboard. It connects a **Next.js & Tailwind CSS** frontend with a **FastAPI & SQLite** backend, running an autonomous investment research agent powered by **LangChain** and **NVIDIA NIM LLMs**.

The agent automatically screens sectors for profitable stocks, fetches detailed financials via FMP and `yfinance`, scores companies based on quantitative balance sheet metrics, and uses AI to generate research reports—all viewable in real-time through a polished, glassmorphic dark-theme dashboard.

---

## 🌟 Key Features

*   **LangChain Agent Core**: Leverages the **NVIDIA NIM API** (Llama 3.1 8B Instruct) via LangChain Expression Language (LCEL) chains to write detailed, structured research reports and assess company risk profiles.
*   **Autonomous Stock Screening**: Automatically screens sectors (e.g. Technology, Financial Services) using the **Financial Modeling Prep (FMP)** API. If the free tier limit is reached, it uses a robust fallback that queries sector leaders via `yfinance` and picks the top 10 by profit margin.
*   **Cyberpunk Terminal Logger**: Displays a live terminal-style logger on the dashboard to watch the agent perform actions (screening, fetching metrics, scoring, and invoking LangChain) with a blinking block cursor and custom syntax highlights.
*   **Interactive Glowing Charts**: Displays 1-year historical price data on an elegant, fading green **Recharts AreaChart**.
*   **Out-of-the-Box Bootstrapping**: Detects if the database is empty on server startup and automatically runs the screening agent for the Technology sector in a background thread, so your dashboard is pre-populated on the very first load.
*   **Active Task Banner**: The frontend automatically polls the server for running tasks and displays a banner with a shortcut link to the live monitor if a task is active.

---

## 🛠️ Tech Stack

### Backend
*   **Python 3.10+**
*   **FastAPI**: High-performance ASGI web framework for APIs.
*   **SQLAlchemy / SQLite**: Local database storage for stocks, metrics, and reports.
*   **LangChain & LangChain OpenAI**: Handles LLM prompting, system roles, and NVIDIA NIM integration.
*   **yfinance / Financial Modeling Prep**: Real-time financial metric, ticker profile, and chart data collection.
*   **python-dotenv**: Handles local environment variable loading.

### Frontend
*   **Next.js 15+ (App Router)**
*   **TypeScript**
*   **Tailwind CSS v4**: Theme styling, neon glows, and glassmorphism.
*   **Recharts**: Interactive historical performance area charts.
*   **Lucide React**: Vector dashboard iconography.

---

## ⚙️ Project Setup & Installation

### Prerequisites
*   [Python 3.10+](https://www.python.org/downloads/)
*   [Node.js 18+](https://nodejs.org/)
*   Free API keys:
    *   **NVIDIA NIM API Key** (Provides Llama-3.1 Llama NIM access)
    *   **Financial Modeling Prep (FMP) API Key** (Provides stock screener access)
    *   **Alpha Vantage API Key** (Optional fallback)

---

### Step 1: Backend Setup
1.  Navigate into the `backend` folder:
    ```bash
    cd backend
    ```
2.  Create a virtual environment and activate it:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
3.  Install the required Python packages:
    ```bash
    pip install fastapi uvicorn sqlalchemy yfinance pandas google-generativeai pydantic python-dotenv langchain langchain-openai langchain-core
    ```
4.  Configure your API keys by creating a `.env` file inside the `backend` folder:
    ```ini
    NVIDIA_API_KEY=your_nvidia_api_key_here
    FMP_API_KEY=your_fmp_api_key_here
    ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
    ```

---

### Step 2: Frontend Setup
1.  Open a new terminal window and navigate into the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install the Node packages:
    ```bash
    npm install
    ```

---

## 🚀 How to Run the Application

Always run both the backend and frontend servers:

### 1. Start the FastAPI Backend
From the root workspace directory, activate the virtual environment and launch uvicorn:
```bash
source backend/venv/bin/activate
export PYTHONPATH=.
python -m backend.main
```
*The API server will run at `http://localhost:8000`.*

### 2. Start the Next.js Frontend
In a separate terminal window:
```bash
cd frontend
npm run dev
```
*The dashboard will run at `http://localhost:3000`.*

Open your web browser and navigate to **`http://localhost:3000`** to begin!

---

## 📂 Folder Structure

```text
/Ai-Agent-Forecasting
├── backend/
│   ├── main.py                  # FastAPI Application Entrypoint
│   ├── api/
│   │   ├── routes.py            # API routing for stocks, tasks, and reports
│   ├── agent/
│   │   ├── data_fetcher.py      # yfinance and FMP screener integration
│   │   ├── scoring.py           # Quantitative metrics scoring formula
│   │   └── workflow.py          # LangChain orchestration pipeline
│   ├── models/
│   │   ├── database.py          # SQLAlchemy SQLite configurations
│   │   └── schema.py            # SQLite database tables
│   ├── .env                     # Local API keys (NVIDIA, FMP, Alpha Vantage)
│   └── requirements.txt         # Backend Python packages
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Dashboard Homepage (Controls & Top Stocks)
│   │   │   ├── agent/           # Live Agent monitoring logs
│   │   │   ├── reports/         # Analysis reports listing archive
│   │   │   ├── stocks/[ticker]/ # Detail charts and AI report reader
│   │   │   ├── top10/           # Top 10 recommendations leaderboard
│   │   │   └── globals.css      # Core styles, glows, animations
│   │   └── components/
│   │       ├── Sidebar.tsx      # Hover-sliding Sidebar nav
│   │       └── Header.tsx       # Global search & Server status tracker
│   └── package.json             # Frontend Node packages
└── README.md
```

---

## 📈 Quantitative Scoring Formula (100 Points Max)
The agent scores stocks using 5 metrics (each weighted up to 20 points):
1.  **P/E Ratio (20%)**: Ideal value between 10 and 25 (20 pts). Escalates downwards if values are overstretched or negative.
2.  **Revenue Growth YoY (20%)**: Earns full points if YoY revenue growth exceeds 20%.
3.  **Net Profit Margin (20%)**: Earns full points if profit margin exceeds 20%.
4.  **Debt-to-Equity Ratio (20%)**: Ideal value is less than 0.5 (20 pts).
5.  **Free Cash Flow (20%)**: Positive and growing cash flows earn full points.

---

## ⚖️ Disclaimer
This application is created solely as an **educational student project**. The quantitative scoring model and AI-generated research reports do not constitute formal financial advice or investment recommendations. Use at your own risk.
