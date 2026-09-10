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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { apiKeysAPI } from '../services/api';

interface ApiKey {
  id: number;
  key: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used?: string;
}

const ApiKeys: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeysAPI.list();
      setApiKeys(response.data);
    } catch (err: any) {
      setError('Failed to load API keys');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key');
      return;
    }

    try {
      const response = await apiKeysAPI.create(newKeyName);
      setCreatedKey(response.data.key);
      setApiKeys([...apiKeys, response.data]);
      setNewKeyName('');
      setSnackbarMessage('API key created successfully');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create API key');
    }
  };

  const handleDeleteKey = async (keyId: number) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      await apiKeysAPI.delete(keyId);
      setApiKeys(apiKeys.filter(key => key.id !== keyId));
      setSnackbarMessage('API key deleted successfully');
    } catch (err: any) {
      setError('Failed to delete API key');
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setSnackbarMessage('API key copied to clipboard');
  };

  const toggleKeyVisibility = (keyId: number) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          API Keys
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create New Key
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>API Key</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Used</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell>{apiKey.name}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      sx={{ ml: 1 }}
                    >
                      {visibleKeys.has(apiKey.id) ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyKey(apiKey.key)}
                      sx={{ ml: 0.5 }}
                    >
                      <CopyIcon />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={apiKey.is_active ? 'Active' : 'Inactive'}
                    color={apiKey.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(apiKey.created_at)}</TableCell>
                <TableCell>
                  {apiKey.last_used ? formatDate(apiKey.last_used) : 'Never'}
                </TableCell>
                <TableCell>
                  <Tooltip title="Delete API Key">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteKey(apiKey.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {apiKeys.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary">
                    No API keys found. Create one to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          {createdKey ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                API key created successfully! Make sure to copy it now - you won't be able to see it again.
              </Alert>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {createdKey}
                </Typography>
              </Box>
              <Button
                fullWidth
                variant="contained"
                startIcon={<CopyIcon />}
                onClick={() => handleCopyKey(createdKey)}
                sx={{ mt: 2 }}
              >
                Copy API Key
              </Button>
            </Box>
          ) : (
            <TextField
              autoFocus
              margin="dense"
              label="API Key Name"
              fullWidth
              variant="outlined"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., Production API Key"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            setCreatedKey(null);
            setNewKeyName('');
          }}>
            {createdKey ? 'Close' : 'Cancel'}
          </Button>
          {!createdKey && (
            <Button onClick={handleCreateKey} variant="contained">
              Create
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default ApiKeys;