from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings, SHOW_DOCS_ENVIRONMENT
from src.routes import scraper
from src.routes import storage as storage_routes
from src.routes import ai as ai_routes


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    
    # Configure app settings based on environment
    app_configs = {
        "title": settings.app_name,
        "version": settings.app_version,
        "debug": settings.debug,
    }
    
    # Hide docs in production
    if settings.environment not in SHOW_DOCS_ENVIRONMENT:
        app_configs["openapi_url"] = None
    
    # Create FastAPI app
    app = FastAPI(**app_configs)
    
    # Enable CORS (allow all origins by default for development)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(scraper.router, prefix="/api/v1")
    app.include_router(storage_routes.router, prefix="/api/v1")
    app.include_router(ai_routes.router, prefix="/api/v1")
    
    # Root endpoint
    @app.get("/", tags=["Root"])
    async def root():
        """Root endpoint."""
        return {
            "message": f"Welcome to {settings.app_name}",
            "version": settings.app_version,
            "docs_url": "/docs" if settings.environment in SHOW_DOCS_ENVIRONMENT else None,
            "endpoints": {
                "docs": "/docs"
            }
        }
    
    # Health check endpoint
    @app.get("/health", tags=["Health"])
    async def health_check():
        """Health check endpoint."""
        return {"status": "ok", "environment": settings.environment}
    
    return app


# Create app instance
app = create_app() 