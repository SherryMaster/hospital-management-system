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
import { billingService } from '../services/api';

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

      // Fetch real data from API
      const [invoicesResult, paymentsResult] = await Promise.all([
        billingService.getInvoices({ page_size: 100 }),
        // Note: Payments endpoint might need to be implemented in backend
        // For now, we'll extract payments from invoices
        Promise.resolve({ data: { results: [] }, error: null })
      ]);

      if (invoicesResult.error) {
        throw new Error(invoicesResult.error.message || 'Failed to fetch invoices');
      }

      // Process invoices data
      const processedInvoices = (invoicesResult.data?.results || []).map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        patient: {
          id: invoice.patient?.id,
          full_name: invoice.patient?.user?.full_name || invoice.patient?.full_name || 'Unknown Patient',
          patient_id: invoice.patient?.patient_id || 'N/A'
        },
        appointment: {
          id: invoice.appointment?.id,
          date: invoice.appointment?.appointment_date,
          doctor: invoice.appointment?.doctor?.user?.full_name || invoice.appointment?.doctor?.full_name || 'Unknown Doctor'
        },
        total_amount: parseFloat(invoice.total_amount || 0),
        paid_amount: parseFloat(invoice.paid_amount || 0),
        status: invoice.status || 'pending',
        issue_date: invoice.issue_date || invoice.created_at,
        due_date: invoice.due_date,
        payment_method: invoice.payment_method
      }));

      // Extract payments from invoices (if payment data is embedded)
      const processedPayments = [];
      processedInvoices.forEach(invoice => {
        if (invoice.paid_amount > 0) {
          processedPayments.push({
            id: `payment-${invoice.id}`,
            payment_id: `PAY-${invoice.invoice_number}`,
            invoice: {
              id: invoice.id,
              invoice_number: invoice.invoice_number
            },
            patient: invoice.patient,
            amount: invoice.paid_amount,
            payment_method: invoice.payment_method || 'unknown',
            payment_date: invoice.issue_date, // Assuming payment date is same as issue date for now
            status: invoice.paid_amount >= invoice.total_amount ? 'completed' : 'partial',
            transaction_id: `TXN-${invoice.id}`
          });
        }
      });

      setInvoices(processedInvoices);
      setPayments(processedPayments);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError(err.message || 'Failed to load billing data. Please try again.');
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
