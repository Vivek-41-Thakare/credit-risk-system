from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

# Enums
class RiskCategory(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium" 
    HIGH = "High"

class LoanPurpose(str, Enum):
    CAR_NEW = "A40"
    CAR_USED = "A41"
    FURNITURE = "A42"
    RADIO_TV = "A43"
    APPLIANCES = "A44"
    REPAIRS = "A45"
    EDUCATION = "A46"
    VACATION = "A47"
    RETRAINING = "A48"
    BUSINESS = "A49"
    OTHERS = "A410"

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: str
    is_active: bool
    is_superuser: bool
    created_at: datetime

    @validator('id', pre=True)
    def _coerce_id_to_str(cls, v):
        # User.id is a UUID column; serialize it as a plain string
        return str(v)

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

# Credit application schema
class CreditApplication(BaseModel):
    # Account information
    checking_account_status: str = Field(..., description="Status of checking account")
    credit_history: str = Field(..., description="Credit history")
    savings_account: str = Field(..., description="Savings account status")
    
    # Loan details
    duration_months: int = Field(..., ge=1, le=72, description="Loan duration in months")
    credit_amount: float = Field(..., gt=0, le=100000, description="Credit amount requested")
    purpose: str = Field(..., description="Purpose of the loan")
    
    # Personal information
    age: int = Field(..., ge=18, le=100, description="Age of applicant")
    personal_status_sex: str = Field(..., description="Personal status and sex")
    other_debtors: str = Field(..., description="Other debtors/guarantors")
    
    # Employment & Property
    employment_since: str = Field(..., description="Employment duration")
    job: str = Field(..., description="Job type")
    property: str = Field(..., description="Property ownership")
    
    # Other financial obligations
    installment_rate: int = Field(..., ge=1, le=4, description="Installment rate as % of disposable income")
    residence_since: int = Field(..., ge=1, le=4, description="Years at current residence")
    existing_credits: int = Field(..., ge=1, le=4, description="Number of existing credits")
    num_dependents: int = Field(..., ge=1, le=2, description="Number of dependents")
    
    # Additional information
    other_installment_plans: str = Field(..., description="Other installment plans")
    housing: str = Field(..., description="Housing situation")
    telephone: str = Field(..., description="Telephone registration")
    foreign_worker: str = Field(..., description="Foreign worker status")
    
    @validator('credit_amount')
    def validate_credit_amount(cls, v):
        if v <= 0:
            raise ValueError('Credit amount must be positive')
        return v
    
    @validator('age')
    def validate_age(cls, v):
        if v < 18:
            raise ValueError('Applicant must be at least 18 years old')
        if v > 100:
            raise ValueError('Invalid age')
        return v

class PredictionRequest(BaseModel):
    application: CreditApplication
    include_explanation: bool = False

class PredictionResponse(BaseModel):
    prediction_id: str
    default_probability: float = Field(..., ge=0, le=1)
    prediction: int = Field(..., description="0=Good, 1=Bad")
    risk_category: RiskCategory
    recommendation: str
    confidence: float = Field(..., ge=0, le=1)
    expected_loss: Optional[float] = None
    processing_time_ms: float
    model_version: str
    explanation: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class BatchPredictionRequest(BaseModel):
    applications: List[CreditApplication]
    include_explanation: bool = False

class BatchPredictionResponse(BaseModel):
    predictions: List[PredictionResponse]
    total_processed: int
    processing_time_ms: float

# API Key schemas
class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class APIKeyResponse(BaseModel):
    id: int
    key: str
    name: str
    is_active: bool
    created_at: datetime
    last_used: Optional[datetime]
    
    class Config:
        from_attributes = True

# Statistics schemas
class ModelMetrics(BaseModel):
    accuracy: float
    roc_auc: float
    precision: float
    recall: float
    f1_score: float
    business_cost_reduction: float

class SystemStats(BaseModel):
    total_predictions: int
    predictions_today: int
    predictions_this_week: int
    predictions_this_month: int
    average_processing_time_ms: float
    model_version: str
    uptime_seconds: float
    
class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    version: str
    database_connected: bool
    redis_connected: bool
    model_loaded: bool