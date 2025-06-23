/**
 * MyInvoices Page
 * 
 * Patient's personal invoices page with payment status, filtering, and payment capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { billingService } from '../../services/api';
import {
  PatientPageHeader,
  PatientLoadingState,
  PatientErrorAlert,
  PatientSummaryCards,
  PatientTableActions
} from './components';

const MyInvoices = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'credit_card',
    notes: '',
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter, dateFilter]);

  const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await billingService.getMyInvoices({ page_size: 100 });
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch invoices');
      }
      
      const processedInvoices = (result.data?.results || result.data || []).map(invoice => ({
        id: invoice.id,
        invoiceId: invoice.invoice_id,
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        status: invoice.status,
        subtotal: parseFloat(invoice.subtotal || 0),
        taxRate: parseFloat(invoice.tax_rate || 0),
        taxAmount: parseFloat(invoice.tax_amount || 0),
        discountAmount: parseFloat(invoice.discount_amount || 0),
        totalAmount: parseFloat(invoice.total_amount || 0),
        paidAmount: parseFloat(invoice.paid_amount || 0),
        balanceDue: parseFloat(invoice.balance_due || 0),
        isPaid: invoice.is_paid,
        isOverdue: invoice.is_overdue,
        notes: invoice.notes,
        termsAndConditions: invoice.terms_and_conditions,
        lineItems: invoice.line_items || [],
        payments: invoice.payments || [],
      }));
      
      setInvoices(processedInvoices);
    } catch (err) {
      setError(err.message);
      showNotification('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    
    // Date filter
    if (dateFilter) {
      const today = new Date();
      const filterDate = new Date(today);
      
      switch (dateFilter) {
        case 'this_month':
          filtered = filtered.filter(invoice => {
            const invoiceDate = new Date(invoice.invoiceDate);
            return invoiceDate.getMonth() === today.getMonth() && 
                   invoiceDate.getFullYear() === today.getFullYear();
          });
          break;
        case 'overdue':
          filtered = filtered.filter(invoice => invoice.isOverdue);
          break;
        case 'paid':
          filtered = filtered.filter(invoice => invoice.isPaid);
          break;
        case 'unpaid':
          filtered = filtered.filter(invoice => !invoice.isPaid);
          break;
        default:
          break;
      }
    }
    
    setFilteredInvoices(filtered);
  };

  const handleViewClick = (invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handlePaymentClick = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: invoice.balanceDue.toString(),
      paymentMethod: 'credit_card',
      notes: '',
    });
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedInvoice || !paymentData.amount) {
      showNotification('Please enter a payment amount', 'warning');
      return;
    }
    
    const amount = parseFloat(paymentData.amount);
    if (amount <= 0 || amount > selectedInvoice.balanceDue) {
      showNotification('Invalid payment amount', 'warning');
      return;
    }
    
    try {
      const result = await billingService.payInvoice(selectedInvoice.id, {
        amount: amount,
        payment_method: paymentData.paymentMethod,
        notes: paymentData.notes,
      });
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to process payment');
      }
      
      showNotification('Payment processed successfully', 'success');
      setPaymentDialogOpen(false);
      setSelectedInvoice(null);
      setPaymentData({ amount: '', paymentMethod: 'credit_card', notes: '' });
      loadInvoices();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'partially_paid':
        return 'warning';
      case 'sent':
        return 'info';
      case 'overdue':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedInvoices = filteredInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Calculate summary statistics
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const outstandingAmount = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const overdueInvoices = invoices.filter(inv => inv.isOverdue).length;

  if (loading && invoices.length === 0) {
    return (
      <MainLayout user={user} onLogout={logout}>
        <PatientLoadingState
          type="circular"
          message="Loading your invoices..."
          fullHeight={true}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <PatientPageHeader
          title="My Invoices"
          subtitle="View and manage your medical bills and payments"
          user={user}
          refreshAction={{
            onClick: loadInvoices,
            disabled: loading
          }}
        />

        <PatientErrorAlert
          error={error}
          onClose={() => setError(null)}
          onRetry={loadInvoices}
          title="Failed to load invoices"
        />

        {/* Summary Cards */}
        <PatientSummaryCards
          cards={[
            {
              id: 'total',
              title: 'Total Invoices',
              value: invoices.length,
              icon: <ReceiptIcon />,
              color: 'primary'
            },
            {
              id: 'amount',
              title: 'Total Amount',
              value: formatCurrency(totalAmount),
              icon: <PaymentIcon />,
              color: 'info'
            },
            {
              id: 'outstanding',
              title: 'Outstanding',
              value: formatCurrency(outstandingAmount),
              icon: <ReceiptIcon />,
              color: 'warning'
            },
            {
              id: 'overdue',
              title: 'Overdue',
              value: overdueInvoices,
              icon: <ReceiptIcon />,
              color: 'error'
            }
          ]}
          loading={loading}
        />

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="partially_paid">Partially Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <MenuItem value="">All Invoices</MenuItem>
                  <MenuItem value="this_month">This Month</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setDateFilter('');
                  }}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        {loading ? 'Loading invoices...' : 'No invoices found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInvoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {invoice.invoiceId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(invoice.invoiceDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={invoice.isOverdue ? 'error.main' : 'text.primary'}
                        >
                          {formatDate(invoice.dueDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(invoice.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="success.main">
                          {formatCurrency(invoice.paidAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={invoice.balanceDue > 0 ? 'warning.main' : 'success.main'}
                        >
                          {formatCurrency(invoice.balanceDue)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status.replace('_', ' ')}
                          color={getStatusColor(invoice.status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <PatientTableActions
                          actions={[
                            {
                              id: 'view',
                              type: 'view',
                              label: 'View Details',
                              tooltip: 'View invoice details',
                              onClick: () => handleViewClick(invoice)
                            },
                            {
                              id: 'download',
                              type: 'download',
                              label: 'Download',
                              tooltip: 'Download invoice',
                              onClick: () => console.log('Download invoice', invoice.id)
                            },
                            {
                              id: 'payment',
                              type: 'payment',
                              label: 'Make Payment',
                              tooltip: 'Make payment',
                              visible: invoice.balanceDue > 0,
                              onClick: () => handlePaymentClick(invoice)
                            }
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredInvoices.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>

        {/* View Invoice Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Invoice Details - {selectedInvoice?.invoiceId}
          </DialogTitle>
          <DialogContent>
            {selectedInvoice && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Invoice Date:</Typography>
                    <Typography variant="body2">{formatDate(selectedInvoice.invoiceDate)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Due Date:</Typography>
                    <Typography variant="body2" color={selectedInvoice.isOverdue ? 'error.main' : 'text.primary'}>
                      {formatDate(selectedInvoice.dueDate)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>Line Items</Typography>
                {selectedInvoice.lineItems.length > 0 ? (
                  <List>
                    {selectedInvoice.lineItems.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={item.description || `Item ${index + 1}`}
                          secondary={`Quantity: ${item.quantity || 1} × ${formatCurrency(item.unit_price || 0)}`}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(item.total_amount || 0)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No line items available
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Subtotal:</Typography>
                    <Typography variant="body2">{formatCurrency(selectedInvoice.subtotal)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Tax ({(selectedInvoice.taxRate * 100).toFixed(2)}%):</Typography>
                    <Typography variant="body2">{formatCurrency(selectedInvoice.taxAmount)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Discount:</Typography>
                    <Typography variant="body2">{formatCurrency(selectedInvoice.discountAmount)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" fontWeight="bold">Total:</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatCurrency(selectedInvoice.totalAmount)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Paid:</Typography>
                    <Typography variant="body2" color="success.main">{formatCurrency(selectedInvoice.paidAmount)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" fontWeight="bold">Balance Due:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="warning.main">
                      {formatCurrency(selectedInvoice.balanceDue)}
                    </Typography>
                  </Grid>
                </Grid>

                {selectedInvoice.notes && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2">Notes:</Typography>
                    <Typography variant="body2">{selectedInvoice.notes}</Typography>
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            {selectedInvoice?.balanceDue > 0 && (
              <Button
                variant="contained"
                startIcon={<PaymentIcon />}
                onClick={() => {
                  setViewDialogOpen(false);
                  handlePaymentClick(selectedInvoice);
                }}
              >
                Make Payment
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCardIcon />
              Make Payment
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedInvoice && (
              <Box>
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2">Invoice: {selectedInvoice.invoiceId}</Typography>
                  <Typography variant="body2">
                    <strong>Total Amount:</strong> {formatCurrency(selectedInvoice.totalAmount)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Paid Amount:</strong> {formatCurrency(selectedInvoice.paidAmount)}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="warning.main">
                    <strong>Balance Due:</strong> {formatCurrency(selectedInvoice.balanceDue)}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Payment Amount"
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                      inputProps={{
                        min: 0,
                        max: selectedInvoice.balanceDue,
                        step: 0.01
                      }}
                      helperText={`Maximum: ${formatCurrency(selectedInvoice.balanceDue)}`}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Payment Method"
                      value={paymentData.paymentMethod}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    >
                      <MenuItem value="credit_card">Credit Card</MenuItem>
                      <MenuItem value="debit_card">Debit Card</MenuItem>
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="check">Check</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Payment Notes (Optional)"
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any notes about this payment..."
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              variant="contained"
              disabled={!paymentData.amount || parseFloat(paymentData.amount) <= 0}
              startIcon={<PaymentIcon />}
            >
              Process Payment
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default MyInvoices;
