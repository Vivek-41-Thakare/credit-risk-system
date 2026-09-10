import React, { useEffect, useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  TablePagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Feedback, Info } from '@mui/icons-material';
import { predictionAPI } from '../services/api';

interface PredictionRecord {
  prediction_id: number;
  default_probability: number;
  prediction: number;
  risk_category: string;
  recommendation: string;
  confidence: number;
  expected_loss?: number;
  processing_time_ms: number;
  model_version: string;
  created_at?: string;
}

const PredictionHistory: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPredictions();
  }, [page, rowsPerPage]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await predictionAPI.getHistory(
        page * rowsPerPage,
        rowsPerPage
      );
      setPredictions(response.data);
      // Assuming the API returns total count
      setTotal(response.data.length || 0);
    } catch (err: any) {
      setError('Failed to load prediction history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'error';
      default: return 'default';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.includes('Approve')) return 'success';
    if (recommendation.includes('Review')) return 'warning';
    if (recommendation.includes('Reject')) return 'error';
    return 'default';
  };

  if (loading && predictions.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Prediction History
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Risk Category</TableCell>
              <TableCell>Default Probability</TableCell>
              <TableCell>Recommendation</TableCell>
              <TableCell>Expected Loss</TableCell>
              <TableCell>Confidence</TableCell>
              <TableCell>Processing Time</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {predictions.map((prediction) => (
              <TableRow key={prediction.prediction_id}>
                <TableCell>{prediction.prediction_id}</TableCell>
                <TableCell>
                  <Chip
                    label={prediction.risk_category}
                    color={getRiskColor(prediction.risk_category) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {(prediction.default_probability * 100).toFixed(2)}%
                </TableCell>
                <TableCell>
                  <Chip
                    label={prediction.recommendation}
                    color={getRecommendationColor(prediction.recommendation) as any}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {prediction.expected_loss
                    ? `€${prediction.expected_loss.toFixed(2)}`
                    : '-'}
                </TableCell>
                <TableCell>
                  {(prediction.confidence * 100).toFixed(1)}%
                </TableCell>
                <TableCell>
                  {prediction.processing_time_ms.toFixed(0)}ms
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton size="small">
                      <Info />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Provide Feedback">
                    <IconButton size="small">
                      <Feedback />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {predictions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary">
                    No predictions found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default PredictionHistory;