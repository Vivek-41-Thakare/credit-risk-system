import pickle
import pandas as pd
from typing import Dict, Any, List
import time
import logging
from app.config import settings
from app.schemas import CreditApplication, RiskCategory

logger = logging.getLogger(__name__)

class ModelService:
    """Service for handling ML model operations"""
    
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.feature_names = None
        self.model_metadata = None
        self.text_to_code_mappings = self._create_text_to_code_mappings()
        self.load_model()
    
    def _create_text_to_code_mappings(self):
        """Create reverse mappings from human-readable text to encoded values"""
        feature_mappings = {
            'checking_account_status': {
                'A11': '< 0 DM',
                'A12': '0-200 DM', 
                'A13': '>= 200 DM',
                'A14': 'no checking account'
            },
            'credit_history': {
                'A30': 'no credits/all paid',
                'A31': 'all paid at this bank',
                'A32': 'existing paid',
                'A33': 'delay in past',
                'A34': 'critical account/other credits existing'
            },
            'purpose': {
                'A40': 'car (new)',
                'A41': 'car (used)',
                'A42': 'furniture',
                'A43': 'radio/television',
                'A44': 'appliances',
                'A45': 'repairs',
                'A46': 'education',
                'A47': 'vacation',
                'A48': 'retraining',
                'A49': 'business',
                'A410': 'others'
            },
            'savings_account': {
                'A61': '< 100 DM',
                'A62': '100-500 DM',
                'A63': '500-1000 DM',
                'A64': '>= 1000 DM',
                'A65': 'no savings account'
            },
            'employment_since': {
                'A71': 'unemployed',
                'A72': '< 1 year',
                'A73': '1 <= ... < 4 years',
                'A74': '4 <= ... < 7 years',
                'A75': '>= 7 years'
            },
            'personal_status_sex': {
                'A91': 'male : divorced/separated',
                'A92': 'female : divorced/separated/married',
                'A93': 'male : single',
                'A94': 'male : married/widowed',
                'A95': 'female : single'
            },
            'other_debtors': {
                'A101': 'none',
                'A102': 'co-applicant',
                'A103': 'guarantor'
            },
            'property': {
                'A121': 'real estate',
                'A122': 'savings/life insurance',
                'A123': 'car or other',
                'A124': 'no property'
            },
            'other_installment_plans': {
                'A141': 'bank',
                'A142': 'stores',
                'A143': 'none'
            },
            'housing': {
                'A151': 'rent',
                'A152': 'own',
                'A153': 'for free'
            },
            'job': {
                'A171': 'unemployed/ unskilled - non-resident',
                'A172': 'unskilled - resident',
                'A173': 'skilled employee/official',
                'A174': 'management/ self-employed/highly qualified employee/officer'
            },
            'telephone': {
                'A191': 'no',
                'A192': 'yes'
            },
            'foreign_worker': {
                'A201': 'yes',
                'A202': 'no'
            }
        }
        
        # Create reverse mappings (text -> code)
        reverse_mappings = {}
        for feature, code_to_text in feature_mappings.items():
            reverse_mappings[feature] = {text: code for code, text in code_to_text.items()}
        
        return reverse_mappings
    
    def load_model(self):
        """Load the trained model from disk"""
        try:
            with open(settings.model_path, 'rb') as f:
                package = pickle.load(f)
            
            self.model = package['model']
            self.preprocessor = package['preprocessor']
            self.feature_names = package.get('feature_names', [])
            self.model_metadata = package.get('model_metadata', {
                'name': 'XGBoost',
                'version': '1.0.0'
            })
            
            logger.info(f"Model loaded successfully: {self.model_metadata}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def _convert_text_to_codes(self, data: dict) -> dict:
        """Convert human-readable text values to encoded format"""
        converted_data = data.copy()
        
        for feature, text_to_code in self.text_to_code_mappings.items():
            if feature in converted_data:
                text_value = converted_data[feature]
                if text_value in text_to_code:
                    converted_data[feature] = text_to_code[text_value]
                else:
                    logger.warning(f"Unknown value '{text_value}' for feature '{feature}'")
        
        return converted_data

    def create_features(self, application: CreditApplication) -> pd.DataFrame:
        """Create features from application including engineered features"""
        # Convert application to dict
        data = application.dict()
        
        # Convert text values to encoded format
        data = self._convert_text_to_codes(data)
        
        # Create DataFrame
        df = pd.DataFrame([data])
        
        # Add engineered features (as in the notebook)
        # 1. Loan Intensity Ratio (credit amount per month of loan duration)
        df['loan_intensity_ratio'] = df['credit_amount'] / (df['duration_months'] + 1)
        
        # 2. Financial Stability Score
        stability_score = 0
        if 'checking_account_status' in df.columns:
            stability_score += df['checking_account_status'].map({
                'A11': 0, 'A12': 1, 'A13': 2, 'A14': 1.5
            }).fillna(0)
        if 'savings_account' in df.columns:
            stability_score += df['savings_account'].map({
                'A61': 0, 'A62': 1, 'A63': 2, 'A64': 3, 'A65': 0.5
            }).fillna(0)
        df['financial_stability_score'] = stability_score
        
        # 3. Age-Credit Ratio
        df['age_credit_ratio'] = df['age'] / (df['credit_amount'] / 1000)
        
        # 4. Employment Stability Index
        df['employment_stability'] = df['employment_since'].map({
            'A71': 0, 'A72': 1, 'A73': 2, 'A74': 3, 'A75': 4
        }).fillna(2)
        
        # 5. Credit Utilization Flags
        df['high_credit_flag'] = (df['credit_amount'] > 5000).astype(int)
        df['long_duration_flag'] = (df['duration_months'] > 24).astype(int)
        
        return df
    
    def predict(self, application: CreditApplication) -> Dict[str, Any]:
        """Make prediction for a single application"""
        start_time = time.time()
        
        try:
            # Create features
            df = self.create_features(application)
            
            # Preprocess
            X_processed = self.preprocessor.transform(df)
            
            # Predict
            probability = float(self.model.predict_proba(X_processed)[0, 1])
            prediction = int(self.model.predict(X_processed)[0])
            
            # Determine risk category with more granularity
            if probability < 0.3:
                risk_category = RiskCategory.LOW
            elif probability < 0.6:
                risk_category = RiskCategory.MEDIUM
            else:
                risk_category = RiskCategory.HIGH
            
            # Business logic for recommendation
            if probability < 0.25:
                recommendation = "Approve with standard terms"
            elif probability < 0.5:
                recommendation = "Approve with additional verification"
            elif probability < 0.75:
                recommendation = "Review by senior analyst required"
            else:
                recommendation = "Reject application"
            
            # Calculate expected loss
            expected_loss = float(application.credit_amount * probability * 0.7)  # 70% loss on default
            
            # Processing time
            processing_time_ms = float((time.time() - start_time) * 1000)
            
            return {
                'default_probability': float(probability),
                'prediction': int(prediction),
                'risk_category': risk_category,
                'recommendation': recommendation,
                'confidence': float(max(probability, 1 - probability)),
                'expected_loss': expected_loss,
                'processing_time_ms': processing_time_ms,
                'model_version': self.model_metadata.get('version', '1.0.0')
            }
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise
    
    def batch_predict(self, applications: List[CreditApplication]) -> List[Dict[str, Any]]:
        """Make predictions for multiple applications"""
        predictions = []
        for application in applications:
            predictions.append(self.predict(application))
        return predictions
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the model"""
        try:
            if hasattr(self.model, 'feature_importances_'):
                importances = self.model.feature_importances_
                # Convert numpy float32 to Python float
                return {
                    feature: float(importance) 
                    for feature, importance in zip(self.feature_names[:len(importances)], importances)
                }
            return {}
        except Exception as e:
            logger.error(f"Failed to get feature importance: {e}")
            return {}
    
    def explain_prediction(self, application: CreditApplication) -> Dict[str, Any]:
        """Provide explanation for a prediction"""
        try:
            # Get prediction
            prediction_result = self.predict(application)
            
            # Get feature importance
            feature_importance = self.get_feature_importance()
            
            # Create features for this application
            df = self.create_features(application)
            
            # Identify top contributing factors
            top_factors = []
            
            # Check key risk indicators
            if df['checking_account_status'].iloc[0] == 'A11':  # < 0 DM
                top_factors.append("Negative checking account balance")
            
            if application.credit_history == 'A34':  # critical account
                top_factors.append("Critical credit history")
            
            if df['loan_intensity_ratio'].iloc[0] > 200:
                top_factors.append("High loan intensity ratio")
            
            if df['age'].iloc[0] < 25:
                top_factors.append("Young age (higher risk group)")
            
            if df['employment_stability'].iloc[0] < 2:
                top_factors.append("Limited employment history")
            
            return {
                **prediction_result,
                'explanation': {
                    'top_risk_factors': top_factors[:3],
                    'feature_importance': dict(sorted(
                        feature_importance.items(), 
                        key=lambda x: x[1], 
                        reverse=True
                    )[:5])
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to explain prediction: {e}")
            # If we have a prediction result, return it without explanation
            if 'prediction_result' in locals():
                return prediction_result
            # Otherwise, raise the error
            raise

# Create singleton instance
model_service = ModelService()