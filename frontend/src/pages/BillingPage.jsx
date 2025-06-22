/**
 * BillingPage Component
 *
 * Billing and invoice management for administrators and receptionists
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Payment as PaymentIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { MainLayout } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import api from '../services/api';

const BillingPage = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const tabLabels = ['Invoices', 'Payments', 'Reports'];

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll use mock data since the billing endpoints might need adjustment
      // TODO: Replace with actual API calls to /api/billing/
      const mockInvoices = [
        {
          id: 1,
          invoice_number: 'INV-2024-001',
          patient: { id: 1, full_name: 'John Doe', patient_id: 'P001' },
          appointment: { id: 1, date: '2024-01-15', doctor: 'Dr. Smith' },
          total_amount: 250.00,
          paid_amount: 250.00,
          status: 'paid',
          issue_date: '2024-01-15',
          due_date: '2024-02-15',
          payment_method: 'credit_card',
        },
        {
          id: 2,
          invoice_number: 'INV-2024-002',
          patient: { id: 2, full_name: 'Jane Smith', patient_id: 'P002' },
          appointment: { id: 2, date: '2024-01-20', doctor: 'Dr. Johnson' },
          total_amount: 180.00,
          paid_amount: 0.00,
          status: 'pending',
          issue_date: '2024-01-20',
          due_date: '2024-02-20',
          payment_method: null,
        },
        {
          id: 3,
          invoice_number: 'INV-2024-003',
          patient: { id: 3, full_name: 'Bob Wilson', patient_id: 'P003' },
          appointment: { id: 3, date: '2024-01-25', doctor: 'Dr. Brown' },
          total_amount: 500.00,
          paid_amount: 200.00,
          status: 'partial',
          issue_date: '2024-01-25',
          due_date: '2024-02-25',
          payment_method: 'cash',
        },
      ];

      const mockPayments = [
        {
          id: 1,
          payment_id: 'PAY-2024-001',
          invoice: { id: 1, invoice_number: 'INV-2024-001' },
          patient: { id: 1, full_name: 'John Doe', patient_id: 'P001' },
          amount: 250.00,
          payment_method: 'credit_card',
          payment_date: '2024-01-15',
          status: 'completed',
          transaction_id: 'TXN123456789',
        },
        {
          id: 2,
          payment_id: 'PAY-2024-002',
          invoice: { id: 3, invoice_number: 'INV-2024-003' },
          patient: { id: 3, full_name: 'Bob Wilson', patient_id: 'P003' },
          amount: 200.00,
          payment_method: 'cash',
          payment_date: '2024-01-25',
          status: 'completed',
          transaction_id: null,
        },
      ];

      setInvoices(mockInvoices);
      setPayments(mockPayments);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to load billing data. Please try again.');
      showNotification('Failed to load billing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleViewItem = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleEditItem = () => {
    showNotification('Edit functionality coming soon', 'info');
    handleMenuClose();
  };

  const handlePrintItem = () => {
    showNotification('Print functionality coming soon', 'info');
    handleMenuClose();
  };

  const handleAddInvoice = () => {
    showNotification('Add new invoice functionality coming soon', 'info');
  };

  const handleRecordPayment = () => {
    showNotification('Record payment functionality coming soon', 'info');
  };

  const getInvoiceStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'partial':
        return 'info';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = payments.filter(payment =>
    payment.patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.payment_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentData = activeTab === 0 ? filteredInvoices : filteredPayments;
  const paginatedData = currentData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const renderInvoicesTab = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Invoice #</TableCell>
            <TableCell>Patient</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Paid</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Due Date</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.map((invoice) => (
            <TableRow key={invoice.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  {invoice.invoice_number}
                </Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {invoice.patient.full_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {invoice.patient.patient_id}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  ${invoice.total_amount.toFixed(2)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  ${invoice.paid_amount.toFixed(2)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={invoice.status}
                  color={getInvoiceStatusColor(invoice.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuClick(e, invoice)}
                >
                  <MoreVertIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderPaymentsTab = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Payment #</TableCell>
            <TableCell>Patient</TableCell>
            <TableCell>Invoice</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Method</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.map((payment) => (
            <TableRow key={payment.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  {payment.payment_id}
                </Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {payment.patient.full_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {payment.patient.patient_id}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {payment.invoice.invoice_number}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  ${payment.amount.toFixed(2)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {payment.payment_method.replace('_', ' ')}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(payment.payment_date).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={payment.status}
                  color={getPaymentStatusColor(payment.status)}
                  size="small"
                />
              </TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuClick(e, payment)}
                >
                  <MoreVertIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderReportsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Billing Reports
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Generate and download detailed billing reports for various time periods.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                • Monthly revenue reports
              </Typography>
              <Typography variant="body2">
                • Outstanding invoices
              </Typography>
              <Typography variant="body2">
                • Payment method analysis
              </Typography>
              <Typography variant="body2">
                • Patient billing history
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <MainLayout user={user} onLogout={logout}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Billing Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage invoices, payments, and billing reports
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<PaymentIcon />}
              onClick={handleRecordPayment}
            >
              Record Payment
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddInvoice}
            >
              New Invoice
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by patient name, ID, invoice number, or payment ID..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabLabels.map((label, index) => (
              <Tab key={index} label={label} />
            ))}
          </Tabs>
        </Paper>

        {/* Content */}
        <Paper>
          {activeTab === 0 && renderInvoicesTab()}
          {activeTab === 1 && renderPaymentsTab()}
          {activeTab === 2 && renderReportsTab()}
          
          {activeTab < 2 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={currentData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </Paper>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleViewItem}>
            <VisibilityIcon sx={{ mr: 1 }} />
            View Details
          </MenuItem>
          <MenuItem onClick={handleEditItem}>
            <EditIcon sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handlePrintItem}>
            <PrintIcon sx={{ mr: 1 }} />
            Print
          </MenuItem>
        </Menu>

        {/* View Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {activeTab === 0 ? 'Invoice Details' : 'Payment Details'}
          </DialogTitle>
          <DialogContent>
            {selectedItem && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    {JSON.stringify(selectedItem, null, 2)}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default BillingPage;
