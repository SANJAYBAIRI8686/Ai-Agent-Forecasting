from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.models import database, schema
from backend.api import routes
from dotenv import load_dotenv

load_dotenv()


# Create database tables
schema.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AI Stock Market Research Agent API")

@app.on_event("startup")
def startup_populate_db():
    db = database.SessionLocal()
    try:
        # Check if we already have stocks analyzed
        count = db.query(schema.Stock).count()
        if count == 0:
            print("Database is empty. Automatically starting initial agent analysis for Tech sector...")
            # Create a task
            task = schema.AgentTask(status="pending", current_step="Auto-started on startup")
            db.add(task)
            db.commit()
            db.refresh(task)
            
            # Start the agent workflow in a background thread to prevent blocking server startup
            import threading
            from backend.agent.workflow import run_agent_workflow
            
            def run_in_thread():
                thread_db = database.SessionLocal()
                try:
                    run_agent_workflow(thread_db, task.id, "tech")
                finally:
                    thread_db.close()
            
            thread = threading.Thread(target=run_in_thread)
            thread.start()
    finally:
        db.close()


# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Stock Market Research Agent API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
