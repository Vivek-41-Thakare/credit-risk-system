import React, { useState } from 'react';
import {
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { predictionAPI, CreditApplication } from '../services/api';

const PredictionForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [includeExplanation, setIncludeExplanation] = useState(false);
  
  const [formData, setFormData] = useState<CreditApplication>({
    checking_account_status: 'A12',
    credit_history: 'A32',
    savings_account: 'A62',
    duration_months: 12,
    credit_amount: 5000,
    purpose: 'A43',
    age: 30,
    personal_status_sex: 'A93',
    other_debtors: 'A101',
    employment_since: 'A73',
    job: 'A173',
    property: 'A121',
    installment_rate: 2,
    residence_since: 2,
    existing_credits: 1,
    num_dependents: 1,
    other_installment_plans: 'A143',
    housing: 'A152',
    telephone: 'A192',
    foreign_worker: 'A201',
  });

  const handleChange = (field: keyof CreditApplication) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const response = await predictionAPI.predict(formData, includeExplanation);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'Low': return '#4caf50';
      case 'Medium': return '#ff9800';
      case 'High': return '#f44336';
      default: return '#757575';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Credit Risk Assessment
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Application Details
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                {/* Account Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Account Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Checking Account Status</InputLabel>
                    <Select
                      value={formData.checking_account_status}
                      onChange={handleChange('checking_account_status')}
                      label="Checking Account Status"
                    >
                      <MenuItem value="A11">&lt; 0 DM</MenuItem>
                      <MenuItem value="A12">0-200 DM</MenuItem>
                      <MenuItem value="A13">&gt;= 200 DM</MenuItem>
                      <MenuItem value="A14">No checking account</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Savings Account</InputLabel>
                    <Select
                      value={formData.savings_account}
                      onChange={handleChange('savings_account')}
                      label="Savings Account"
                    >
                      <MenuItem value="A61">&lt; 100 DM</MenuItem>
                      <MenuItem value="A62">100-500 DM</MenuItem>
                      <MenuItem value="A63">500-1000 DM</MenuItem>
                      <MenuItem value="A64">&gt;= 1000 DM</MenuItem>
                      <MenuItem value="A65">No savings account</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Credit History</InputLabel>
                    <Select
                      value={formData.credit_history}
                      onChange={handleChange('credit_history')}
                      label="Credit History"
                    >
                      <MenuItem value="A30">No credits/all paid</MenuItem>
                      <MenuItem value="A31">All paid at this bank</MenuItem>
                      <MenuItem value="A32">Existing paid</MenuItem>
                      <MenuItem value="A33">Delay in past</MenuItem>
                      <MenuItem value="A34">critical account/other credits existing</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Loan Details */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="primary" gutterBottom sx={{ mt: 2 }}>
                    Loan Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Credit Amount (DM)"
                    type="number"
                    value={formData.credit_amount}
                    onChange={handleChange('credit_amount')}
                    inputProps={{ min: 100, max: 100000 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography gutterBottom>Duration (months): {formData.duration_months}</Typography>
                    <Slider
                      value={formData.duration_months}
                      onChange={(e, value) => setFormData({ ...formData, duration_months: value as number })}
                      min={1}
                      max={72}
                      marks={[
                        { value: 12, label: '1y' },
                        { value: 36, label: '3y' },
                        { value: 60, label: '5y' },
                      ]}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Purpose</InputLabel>
                    <Select
                      value={formData.purpose}
                      onChange={handleChange('purpose')}
                      label="Purpose"
                    >
                      <MenuItem value="A40">Car (new)</MenuItem>
                      <MenuItem value="A41">Car (used)</MenuItem>
                      <MenuItem value="A42">Furniture</MenuItem>
                      <MenuItem value="A43">Radio/Television</MenuItem>
                      <MenuItem value="A44">Appliances</MenuItem>
                      <MenuItem value="A45">Repairs</MenuItem>
                      <MenuItem value="A46">Education</MenuItem>
                      <MenuItem value="A47">Vacation</MenuItem>
                      <MenuItem value="A48">Retraining</MenuItem>
                      <MenuItem value="A49">Business</MenuItem>
                      <MenuItem value="A410">Others</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Personal Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="primary" gutterBottom sx={{ mt: 2 }}>
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange('age')}
                    inputProps={{ min: 18, max: 100 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Employment Since</InputLabel>
                    <Select
                      value={formData.employment_since}
                      onChange={handleChange('employment_since')}
                      label="Employment Since"
                    >
                      <MenuItem value="A71">Unemployed</MenuItem>
                      <MenuItem value="A72">&lt; 1 year</MenuItem>
                      <MenuItem value="A73">1 &lt;= ... &lt; 4 years</MenuItem>
                      <MenuItem value="A74">4-7 years</MenuItem>
                      <MenuItem value="A75">&gt;= 7 years</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Job</InputLabel>
                    <Select
                      value={formData.job}
                      onChange={handleChange('job')}
                      label="Job"
                    >
                      <MenuItem value="A171">unemployed/ unskilled - non-resident</MenuItem>
                      <MenuItem value="A172">unskilled - resident</MenuItem>
                      <MenuItem value="A173">skilled employee/official</MenuItem>
                      <MenuItem value="A174">management/ self-employed/highly qualified employee/officer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Housing</InputLabel>
                    <Select
                      value={formData.housing}
                      onChange={handleChange('housing')}
                      label="Housing"
                    >
                      <MenuItem value="A151">Rent</MenuItem>
                      <MenuItem value="A152">Own</MenuItem>
                      <MenuItem value="A153">For free</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Personal Status & Sex</InputLabel>
                    <Select
                      value={formData.personal_status_sex}
                      onChange={handleChange('personal_status_sex')}
                      label="Personal Status & Sex"
                    >
                      <MenuItem value="A91">male : divorced/separated</MenuItem>
                      <MenuItem value="A92">female : divorced/separated/married</MenuItem>
                      <MenuItem value="A93">male : single</MenuItem>
                      <MenuItem value="A94">male : married/widowed</MenuItem>
                      <MenuItem value="A95">female : single</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Financial Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="primary" gutterBottom sx={{ mt: 2 }}>
                    Additional Financial Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Other Debtors</InputLabel>
                    <Select
                      value={formData.other_debtors}
                      onChange={handleChange('other_debtors')}
                      label="Other Debtors"
                    >
                      <MenuItem value="A101">none</MenuItem>
                      <MenuItem value="A102">co-applicant</MenuItem>
                      <MenuItem value="A103">guarantor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Property</InputLabel>
                    <Select
                      value={formData.property}
                      onChange={handleChange('property')}
                      label="Property"
                    >
                      <MenuItem value="A121">real estate</MenuItem>
                      <MenuItem value="A122">savings/life insurance</MenuItem>
                      <MenuItem value="A123">car or other</MenuItem>
                      <MenuItem value="A124">no property</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography gutterBottom>Installment Rate (% of income): {formData.installment_rate}</Typography>
                    <Slider
                      value={formData.installment_rate}
                      onChange={(e, value) => setFormData({ ...formData, installment_rate: value as number })}
                      min={1}
                      max={4}
                      marks={[
                        { value: 1, label: '1%' },
                        { value: 2, label: '2%' },
                        { value: 3, label: '3%' },
                        { value: 4, label: '4%' },
                      ]}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography gutterBottom>Years at Current Residence: {formData.residence_since}</Typography>
                    <Slider
                      value={formData.residence_since}
                      onChange={(e, value) => setFormData({ ...formData, residence_since: value as number })}
                      min={1}
                      max={4}
                      marks={[
                        { value: 1, label: '1y' },
                        { value: 2, label: '2y' },
                        { value: 3, label: '3y' },
                        { value: 4, label: '4+y' },
                      ]}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography gutterBottom>Existing Credits: {formData.existing_credits}</Typography>
                    <Slider
                      value={formData.existing_credits}
                      onChange={(e, value) => setFormData({ ...formData, existing_credits: value as number })}
                      min={1}
                      max={4}
                      marks={[
                        { value: 1, label: '1' },
                        { value: 2, label: '2' },
                        { value: 3, label: '3' },
                        { value: 4, label: '4+' },
                      ]}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography gutterBottom>Number of Dependents: {formData.num_dependents}</Typography>
                    <Slider
                      value={formData.num_dependents}
                      onChange={(e, value) => setFormData({ ...formData, num_dependents: value as number })}
                      min={1}
                      max={2}
                      marks={[
                        { value: 1, label: '1' },
                        { value: 2, label: '2+' },
                      ]}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Other Installment Plans</InputLabel>
                    <Select
                      value={formData.other_installment_plans}
                      onChange={handleChange('other_installment_plans')}
                      label="Other Installment Plans"
                    >
                      <MenuItem value="A141">bank</MenuItem>
                      <MenuItem value="A142">stores</MenuItem>
                      <MenuItem value="A143">none</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Telephone</InputLabel>
                    <Select
                      value={formData.telephone}
                      onChange={handleChange('telephone')}
                      label="Telephone"
                    >
                      <MenuItem value="A191">no</MenuItem>
                      <MenuItem value="A192">yes</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Foreign Worker</InputLabel>
                    <Select
                      value={formData.foreign_worker}
                      onChange={handleChange('foreign_worker')}
                      label="Foreign Worker"
                    >
                      <MenuItem value="A201">yes</MenuItem>
                      <MenuItem value="A202">no</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeExplanation}
                        onChange={(e) => setIncludeExplanation(e.target.checked)}
                      />
                    }
                    label="Include detailed explanation"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Assess Risk'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={4}>
          {result && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Assessment Results
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Risk Category
                  </Typography>
                  <Chip
                    label={result.risk_category}
                    sx={{
                      backgroundColor: getRiskColor(result.risk_category),
                      color: 'white',
                      fontWeight: 'bold',
                      mt: 1,
                    }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Default Probability
                  </Typography>
                  <Typography variant="h4">
                    {(result.default_probability * 100).toFixed(2)}%
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Recommendation
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {result.recommendation}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Expected Loss
                  </Typography>
                  <Typography variant="body1">
                    €{result.expected_loss?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Confidence
                  </Typography>
                  <Typography variant="body1">
                    {(result.confidence * 100).toFixed(1)}%
                  </Typography>
                </Box>

                {result.explanation && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Risk Factors
                    </Typography>
                    {result.explanation.top_risk_factors?.map((factor: string, index: number) => (
                      <Chip
                        key={index}
                        label={factor}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </>
                )}

                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Processing time: {result.processing_time_ms.toFixed(0)}ms
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PredictionForm;