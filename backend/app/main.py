from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time
from datetime import datetime
from typing import List

from app.config import settings
from app.database import init_db, test_connection
from app.schemas import (
    UserCreate, UserResponse, UserLogin, Token,
    PredictionRequest, PredictionResponse,
    BatchPredictionRequest, BatchPredictionResponse,
    APIKeyCreate, APIKeyResponse,
    HealthCheck, SystemStats, ModelMetrics
)
from app.auth import (
    get_current_active_user, get_current_admin_user,
    get_current_user_or_api_key, get_password_hash,
    create_access_token, verify_password, generate_api_key
)
from app.ml_model import model_service
from app.models import User, APIKey, Prediction
from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import func
import redis
import json

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# App startup time for uptime calculation
app_start_time = time.time()

# Redis client
try:
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    redis_client.ping()
    logger.info("Redis connected successfully")
except Exception as e:
    logger.warning(f"Redis connection failed: {e}")
    redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager"""
    # Startup
    logger.info("Starting Credit Risk Assessment System")
    try:
        init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Credit Risk Assessment System")

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Duration: {process_time:.3f}s"
    )
    
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Health check endpoint
@app.get("/health", response_model=HealthCheck, tags=["System"])
async def health_check():
    """Check system health"""
    return HealthCheck(
        status="healthy",
        timestamp=datetime.utcnow(),
        version=settings.app_version,
        database_connected=test_connection(),
        redis_connected=bool(redis_client and redis_client.ping()),
        model_loaded=model_service.model is not None
    )

# System statistics
@app.get("/stats", response_model=SystemStats, tags=["System"])
async def get_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get system statistics"""
    now = datetime.utcnow()
    
    total_predictions = db.query(func.count(Prediction.id)).scalar()
    predictions_today = db.query(func.count(Prediction.id)).filter(
        func.date(Prediction.created_at) == now.date()
    ).scalar()
    
    # Note: processing_time_ms is now stored in prediction_result JSON
    avg_processing_time = 0  # Can be calculated from prediction_result if needed
    
    return SystemStats(
        total_predictions=total_predictions,
        predictions_today=predictions_today,
        predictions_this_week=0,  # Implement if needed
        predictions_this_month=0,  # Implement if needed
        average_processing_time_ms=avg_processing_time,
        model_version=model_service.model_metadata.get('version', '1.0.0'),
        uptime_seconds=time.time() - app_start_time
    )

# Authentication endpoints
@app.post("/register", response_model=UserResponse, tags=["Authentication"])
async def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Create new user
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.post("/login", response_model=Token, tags=["Authentication"])
async def login(
    form_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Login and get access token"""
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    
    # Log the login (audit logging temporarily disabled)
    logger.info(f"User {user.username} logged in successfully")
    
    return Token(access_token=access_token)

# API Key management
@app.post("/api-keys", response_model=APIKeyResponse, tags=["API Keys"])
async def create_api_key(
    key_data: APIKeyCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new API key"""
    api_key = generate_api_key()
    
    db_key = APIKey(
        key=api_key,
        name=key_data.name,
        user_id=current_user.id
    )
    db.add(db_key)
    db.commit()
    db.refresh(db_key)
    
    return db_key

@app.get("/api-keys", response_model=List[APIKeyResponse], tags=["API Keys"])
async def list_api_keys(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List user's API keys"""
    keys = db.query(APIKey).filter(APIKey.user_id == current_user.id).all()
    return keys

@app.delete("/api-keys/{key_id}", tags=["API Keys"])
async def delete_api_key(
    key_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an API key"""
    key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id
    ).first()
    
    if not key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    db.delete(key)
    db.commit()
    
    return {"message": "API key deleted"}

# Prediction endpoints
@app.post("/predict", response_model=PredictionResponse, tags=["Predictions"])
async def predict(
    request: PredictionRequest,
    auth: dict = Depends(get_current_user_or_api_key),
    db: Session = Depends(get_db)
):
    """Make a credit risk prediction"""
    try:
        # Check cache if available
        if redis_client:
            cache_key = f"prediction:{hash(str(request.application.dict()))}"
            cached_result = redis_client.get(cache_key)
            if cached_result:
                logger.info("Returning cached prediction")
                return json.loads(cached_result)
        
        # Make prediction
        if request.include_explanation:
            result = model_service.explain_prediction(request.application)
        else:
            result = model_service.predict(request.application)
        
        # Store in database
        db_prediction = Prediction(
            user_id=auth['user'].id if auth['user'] else None,
            application_data=request.application.dict(),
            prediction_result=result,
            default_probability=result.get('default_probability', result.get('probability', 0)),
            risk_category=result.get('risk_category', 'Unknown'),
            recommendation=result.get('recommendation', ''),
            model_version=result.get('model_version', '1.0.0')
        )
        db.add(db_prediction)
        db.commit()
        db.refresh(db_prediction)
        
        # Add prediction_id to result
        result['prediction_id'] = str(db_prediction.id)
        
        # Cache result
        if redis_client:
            redis_client.setex(
                cache_key,
                300,  # 5 minutes TTL
                json.dumps(result, default=str)
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@app.post("/batch-predict", response_model=BatchPredictionResponse, tags=["Predictions"])
async def batch_predict(
    request: BatchPredictionRequest,
    auth: dict = Depends(get_current_user_or_api_key),
    db: Session = Depends(get_db)
):
    """Make batch predictions"""
    start_time = time.time()
    predictions = []
    
    for application in request.applications:
        try:
            if request.include_explanation:
                result = model_service.explain_prediction(application)
            else:
                result = model_service.predict(application)
            
            # Store in database
            db_prediction = Prediction(
                user_id=auth['user'].id if auth['user'] else None,
                application_data=application.dict(),
                prediction_result=result,
                default_probability=result['default_probability'],
                risk_category=result['risk_category'],
                recommendation=result['recommendation'],
                model_version=result['model_version']
            )
            db.add(db_prediction)
            
            result['prediction_id'] = str(db_prediction.id)
            predictions.append(result)
            
        except Exception as e:
            logger.error(f"Batch prediction error for application: {e}")
            predictions.append({
                'error': str(e),
                'prediction_id': None
            })
    
    db.commit()
    
    return BatchPredictionResponse(
        predictions=predictions,
        total_processed=len(predictions),
        processing_time_ms=(time.time() - start_time) * 1000
    )

@app.get("/predictions", response_model=List[PredictionResponse], tags=["Predictions"])
async def list_predictions(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List user's predictions"""
    predictions = db.query(Prediction).filter(
        Prediction.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return [
        {
            'prediction_id': str(p.id),
            'default_probability': p.default_probability,
            'prediction': p.prediction_result.get('prediction', 0),
            'risk_category': p.risk_category,
            'recommendation': p.recommendation,
            'confidence': p.prediction_result.get('confidence', 0),
            'expected_loss': p.prediction_result.get('expected_loss', 0),
            'processing_time_ms': p.prediction_result.get('processing_time_ms', 0),
            'model_version': p.model_version
        }
        for p in predictions
    ]

@app.put("/predictions/{prediction_id}/feedback", tags=["Predictions"])
async def update_prediction_feedback(
    prediction_id: int,
    actual_outcome: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update prediction with actual outcome for model improvement"""
    prediction = db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.user_id == current_user.id
    ).first()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found"
        )
    
    prediction.actual_outcome = actual_outcome
    prediction.feedback_date = datetime.utcnow()
    db.commit()
    
    return {"message": "Feedback updated successfully"}

# Model information
@app.get("/model/metrics", response_model=ModelMetrics, tags=["Model"])
async def get_model_metrics(
    current_user: User = Depends(get_current_active_user)
):
    """Get model performance metrics"""
    return ModelMetrics(
        accuracy=0.805,
        roc_auc=0.776,
        precision=0.78,
        recall=0.73,
        f1_score=0.75,
        business_cost_reduction=0.23
    )

@app.get("/model/feature-importance", tags=["Model"])
async def get_feature_importance(
    current_user: User = Depends(get_current_active_user)
):
    """Get feature importance from the model"""
    return model_service.get_feature_importance()

# Admin endpoints
@app.get("/admin/users", response_model=List[UserResponse], tags=["Admin"])
async def list_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """List all users (admin only)"""
    users = db.query(User).all()
    # Convert UUID to string for each user
    return [
        {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "created_at": user.created_at
        }
        for user in users
    ]

@app.get("/admin/audit-logs", tags=["Admin"])
async def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get audit logs (admin only) - Currently disabled"""
    return {
        "message": "Audit logging is temporarily disabled",
        "logs": []
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)