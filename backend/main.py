from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.models import database, schema
from backend.api import routes
from dotenv import load_dotenv

load_dotenv()


# Create database tables
schema.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AI Stock Market Research Agent API")

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
