# Main entry point - ensures health check is always available
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

# Create app first with health check
app = FastAPI(title="KasaBurger API", version="1.0.2")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check - defined before any other imports
@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/")
async def root():
    return {"message": "KasaBurger API v1.0.2", "status": "active"}

# Import and include the rest of the application
try:
    from server import api_router, client
    app.include_router(api_router)
    
    @app.on_event("shutdown")
    async def shutdown():
        client.close()
except Exception as e:
    # Log error but keep health check working
    import logging
    logging.error(f"Failed to load full application: {e}")
    
    @app.get("/api/")
    async def api_fallback():
        return {"status": "limited", "error": "Full API not available"}
