#!/usr/bin/env python
"""
Run script for Credit Risk Assessment System Backend
"""
import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=30001,
        reload=True,
        log_level="info"
    )