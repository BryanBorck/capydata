# Use Python 3.11 slim image for better performance and smaller size
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Configure poetry: Don't create virtual environment, install deps to system python
RUN poetry config virtualenvs.create false

# Copy poetry files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry install --only main

# Copy application code
COPY src/ ./src/

# Create data directories
RUN mkdir -p data/images

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Health check (using curl instead of python requests to avoid dependency issues)
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Run the application
CMD exec uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8080} 