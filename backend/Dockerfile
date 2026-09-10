# Multi-stage build for efficient container
FROM python:3.11-slim AS builder

# Install build dependencies
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install UV using the installer script  
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Set environment variables
ENV PATH="/root/.local/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV UV_SYSTEM_PYTHON=1

WORKDIR /app

# Copy project files
COPY pyproject.toml uv.lock ./
COPY app ./app
COPY credit_risk_model.pkl ./
COPY model_info.json ./

# Install dependencies with UV
RUN /root/.local/bin/uv sync --frozen --no-dev

# Production stage
FROM python:3.11-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 creditrisk && \
    mkdir -p /app && \
    chown -R creditrisk:creditrisk /app

WORKDIR /app

# Copy UV and virtual environment from builder
COPY --from=builder --chown=creditrisk:creditrisk /root/.local/bin/uv /usr/local/bin/uv
COPY --from=builder --chown=creditrisk:creditrisk /app/.venv /app/.venv
COPY --from=builder --chown=creditrisk:creditrisk /app /app

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV HOST=0.0.0.0
ENV PORT=8000

# Switch to non-root user
USER creditrisk

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Run the application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]