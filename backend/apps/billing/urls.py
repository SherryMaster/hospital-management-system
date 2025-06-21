from django.urls import path
from .views import (
    InvoiceListCreateView,
    InvoiceDetailView,
    MyInvoicesView,
    PaymentListCreateView,
    PaymentDetailView,
    InvoiceSummaryView,
    PaymentSummaryView,
    InvoiceLineItemListCreateView,
    InvoiceLineItemDetailView,
)

app_name = 'billing'

urlpatterns = [
    # Invoice endpoints
    path('invoices/', InvoiceListCreateView.as_view(), name='invoice_list_create'),
    path('invoices/<int:pk>/', InvoiceDetailView.as_view(), name='invoice_detail'),
    path('invoices/<int:invoice_id>/line-items/', InvoiceLineItemListCreateView.as_view(), name='invoice_line_items'),
    path('invoices/<int:invoice_id>/line-items/<int:pk>/', InvoiceLineItemDetailView.as_view(), name='invoice_line_item_detail'),
    
    # Payment endpoints
    path('payments/', PaymentListCreateView.as_view(), name='payment_list_create'),
    path('payments/<int:pk>/', PaymentDetailView.as_view(), name='payment_detail'),
    
    # Current user's invoices
    path('my-invoices/', MyInvoicesView.as_view(), name='my_invoices'),
    
    # Summary and statistics
    path('summary/invoices/', InvoiceSummaryView.as_view(), name='invoice_summary'),
    path('summary/payments/', PaymentSummaryView.as_view(), name='payment_summary'),
]
