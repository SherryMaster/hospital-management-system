from rest_framework import generics, status, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Sum, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, date, timedelta
from decimal import Decimal
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Invoice, InvoiceLineItem, Payment
from .serializers import (
    InvoiceSerializer,
    InvoiceCreateSerializer,
    InvoiceUpdateSerializer,
    InvoiceListSerializer,
    MyInvoiceSerializer,
    InvoiceLineItemSerializer,
    InvoiceLineItemCreateSerializer,
    PaymentSerializer,
    PaymentCreateSerializer,
    InvoiceSummarySerializer,
    PaymentSummarySerializer
)
from apps.accounts.permissions import (
    IsAdminUser,
    IsOwnerOrAdmin,
    CanViewBilling,
    CanManageBilling,
    IsStaffOrAdmin
)


class InvoiceListCreateView(generics.ListCreateAPIView):
    """
    List all invoices or create a new invoice
    """
    queryset = Invoice.objects.select_related('patient__user', 'appointment', 'created_by')
    permission_classes = [CanManageBilling]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InvoiceCreateSerializer
        return InvoiceListSerializer

    def get_queryset(self):
        queryset = Invoice.objects.select_related('patient__user', 'appointment', 'created_by')

        # Filter by patient
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(invoice_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(invoice_date__lte=date_to)

        # Filter overdue invoices
        overdue = self.request.query_params.get('overdue')
        if overdue and overdue.lower() == 'true':
            queryset = queryset.filter(
                due_date__lt=date.today(),
                status__in=['sent', 'partially_paid', 'overdue']
            )

        # Filter unpaid invoices
        unpaid = self.request.query_params.get('unpaid')
        if unpaid and unpaid.lower() == 'true':
            queryset = queryset.filter(status__in=['sent', 'partially_paid', 'overdue'])

        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(invoice_id__icontains=search) |
                Q(patient__user__first_name__icontains=search) |
                Q(patient__user__last_name__icontains=search) |
                Q(patient__patient_id__icontains=search)
            )

        return queryset.order_by('-invoice_date')

    @extend_schema(
        summary="List invoices",
        description="Get list of invoices with filtering options",
        parameters=[
            OpenApiParameter(name='patient_id', type=OpenApiTypes.INT, description='Filter by patient ID'),
            OpenApiParameter(name='status', type=OpenApiTypes.STR, description='Filter by invoice status'),
            OpenApiParameter(name='date_from', type=OpenApiTypes.DATE, description='Filter from date'),
            OpenApiParameter(name='date_to', type=OpenApiTypes.DATE, description='Filter to date'),
            OpenApiParameter(name='overdue', type=OpenApiTypes.BOOL, description='Show only overdue invoices'),
            OpenApiParameter(name='unpaid', type=OpenApiTypes.BOOL, description='Show only unpaid invoices'),
            OpenApiParameter(name='search', type=OpenApiTypes.STR, description='Search invoices'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create invoice",
        description="Create a new invoice with line items"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class InvoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an invoice
    """
    queryset = Invoice.objects.select_related('patient__user', 'appointment', 'created_by').prefetch_related('line_items', 'payments')
    permission_classes = [CanViewBilling]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return InvoiceUpdateSerializer
        return InvoiceSerializer

    def get_permissions(self):
        """Different permissions for different actions"""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            permission_classes = [CanManageBilling]
        else:
            permission_classes = [CanViewBilling]
        return [permission() for permission in permission_classes]

    @extend_schema(
        summary="Get invoice details",
        description="Retrieve detailed invoice information"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update invoice",
        description="Update invoice information"
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Partially update invoice",
        description="Partially update invoice information"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        summary="Delete invoice",
        description="Cancel invoice (admin only)"
    )
    def delete(self, request, *args, **kwargs):
        invoice = self.get_object()
        if invoice.status in ['paid', 'refunded']:
            return Response(
                {'error': 'Cannot delete paid or refunded invoices'},
                status=status.HTTP_400_BAD_REQUEST
            )

        invoice.status = 'cancelled'
        invoice.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyInvoicesView(generics.ListAPIView):
    """
    Current patient's invoices
    """
    serializer_class = MyInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Get current user's invoices"""
        if self.request.user.role == 'patient':
            if hasattr(self.request.user, 'patient_profile'):
                return Invoice.objects.filter(
                    patient=self.request.user.patient_profile
                ).prefetch_related('line_items', 'payments').order_by('-invoice_date')

        return Invoice.objects.none()

    @extend_schema(
        summary="Get my invoices",
        description="Get current patient's invoices"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class PaymentListCreateView(generics.ListCreateAPIView):
    """
    List all payments or create a new payment
    """
    queryset = Payment.objects.select_related('invoice__patient__user', 'processed_by')
    permission_classes = [CanManageBilling]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaymentCreateSerializer
        return PaymentSerializer

    def get_queryset(self):
        queryset = Payment.objects.select_related('invoice__patient__user', 'processed_by')

        # Filter by invoice
        invoice_id = self.request.query_params.get('invoice_id')
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)

        # Filter by payment method
        payment_method = self.request.query_params.get('payment_method')
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(payment_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(payment_date__lte=date_to)

        # Today's payments
        today = self.request.query_params.get('today')
        if today and today.lower() == 'true':
            queryset = queryset.filter(payment_date__date=date.today())

        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(payment_id__icontains=search) |
                Q(reference_number__icontains=search) |
                Q(invoice__invoice_id__icontains=search) |
                Q(invoice__patient__user__first_name__icontains=search) |
                Q(invoice__patient__user__last_name__icontains=search)
            )

        return queryset.order_by('-payment_date')

    @extend_schema(
        summary="List payments",
        description="Get list of payments with filtering options",
        parameters=[
            OpenApiParameter(name='invoice_id', type=OpenApiTypes.INT, description='Filter by invoice ID'),
            OpenApiParameter(name='payment_method', type=OpenApiTypes.STR, description='Filter by payment method'),
            OpenApiParameter(name='status', type=OpenApiTypes.STR, description='Filter by payment status'),
            OpenApiParameter(name='date_from', type=OpenApiTypes.DATE, description='Filter from date'),
            OpenApiParameter(name='date_to', type=OpenApiTypes.DATE, description='Filter to date'),
            OpenApiParameter(name='today', type=OpenApiTypes.BOOL, description='Show only today\'s payments'),
            OpenApiParameter(name='search', type=OpenApiTypes.STR, description='Search payments'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create payment",
        description="Record a new payment for an invoice"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class PaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a payment
    """
    queryset = Payment.objects.select_related('invoice__patient__user', 'processed_by')
    serializer_class = PaymentSerializer
    permission_classes = [CanManageBilling]

    @extend_schema(
        summary="Get payment details",
        description="Retrieve detailed payment information"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update payment",
        description="Update payment information"
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Delete payment",
        description="Delete payment record (admin only)"
    )
    def delete(self, request, *args, **kwargs):
        payment = self.get_object()
        if payment.status == 'completed':
            return Response(
                {'error': 'Cannot delete completed payments'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().delete(request, *args, **kwargs)


class InvoiceSummaryView(APIView):
    """
    Get invoice summary statistics
    """
    permission_classes = [CanViewBilling]

    @extend_schema(
        summary="Get invoice summary",
        description="Get invoice statistics and summary information",
        parameters=[
            OpenApiParameter(name='date_from', type=OpenApiTypes.DATE, description='Filter from date'),
            OpenApiParameter(name='date_to', type=OpenApiTypes.DATE, description='Filter to date'),
        ]
    )
    def get(self, request):
        # Get date range
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        queryset = Invoice.objects.all()

        if date_from:
            queryset = queryset.filter(invoice_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(invoice_date__lte=date_to)

        # Calculate summary statistics
        summary = queryset.aggregate(
            total_invoices=Count('id'),
            total_amount=Sum('total_amount') or Decimal('0.00'),
            total_paid=Sum('paid_amount') or Decimal('0.00')
        )

        summary['total_outstanding'] = summary['total_amount'] - summary['total_paid']

        # Count by status
        summary['overdue_count'] = queryset.filter(
            due_date__lt=date.today(),
            status__in=['sent', 'partially_paid', 'overdue']
        ).count()

        summary['overdue_amount'] = queryset.filter(
            due_date__lt=date.today(),
            status__in=['sent', 'partially_paid', 'overdue']
        ).aggregate(amount=Sum('total_amount') - Sum('paid_amount'))['amount'] or Decimal('0.00')

        summary['paid_count'] = queryset.filter(status='paid').count()
        summary['draft_count'] = queryset.filter(status='draft').count()
        summary['sent_count'] = queryset.filter(status='sent').count()

        serializer = InvoiceSummarySerializer(summary)
        return Response(serializer.data)


class PaymentSummaryView(APIView):
    """
    Get payment summary statistics
    """
    permission_classes = [CanViewBilling]

    @extend_schema(
        summary="Get payment summary",
        description="Get payment statistics and summary information",
        parameters=[
            OpenApiParameter(name='date_from', type=OpenApiTypes.DATE, description='Filter from date'),
            OpenApiParameter(name='date_to', type=OpenApiTypes.DATE, description='Filter to date'),
        ]
    )
    def get(self, request):
        # Get date range
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        queryset = Payment.objects.filter(status='completed')

        if date_from:
            queryset = queryset.filter(payment_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(payment_date__lte=date_to)

        # Calculate summary statistics
        summary = queryset.aggregate(
            total_payments=Count('id'),
            total_amount=Sum('amount') or Decimal('0.00')
        )

        # Payment method breakdown
        summary['cash_payments'] = queryset.filter(
            payment_method='cash'
        ).aggregate(amount=Sum('amount'))['amount'] or Decimal('0.00')

        summary['card_payments'] = queryset.filter(
            payment_method__in=['credit_card', 'debit_card']
        ).aggregate(amount=Sum('amount'))['amount'] or Decimal('0.00')

        summary['insurance_payments'] = queryset.filter(
            payment_method='insurance'
        ).aggregate(amount=Sum('amount'))['amount'] or Decimal('0.00')

        # Today's payments
        summary['today_payments'] = queryset.filter(
            payment_date__date=date.today()
        ).aggregate(amount=Sum('amount'))['amount'] or Decimal('0.00')

        # This month's payments
        today = date.today()
        month_start = today.replace(day=1)
        summary['this_month_payments'] = queryset.filter(
            payment_date__date__gte=month_start
        ).aggregate(amount=Sum('amount'))['amount'] or Decimal('0.00')

        serializer = PaymentSummarySerializer(summary)
        return Response(serializer.data)


class InvoiceLineItemListCreateView(generics.ListCreateAPIView):
    """
    List or create invoice line items for a specific invoice
    """
    serializer_class = InvoiceLineItemSerializer
    permission_classes = [CanManageBilling]

    def get_queryset(self):
        invoice_id = self.kwargs['invoice_id']
        return InvoiceLineItem.objects.filter(invoice_id=invoice_id)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InvoiceLineItemCreateSerializer
        return InvoiceLineItemSerializer

    def perform_create(self, serializer):
        invoice_id = self.kwargs['invoice_id']
        invoice = get_object_or_404(Invoice, id=invoice_id)

        if invoice.status not in ['draft', 'sent']:
            raise serializers.ValidationError("Cannot add line items to paid or cancelled invoices")

        serializer.save(invoice=invoice)

        # Recalculate invoice totals
        invoice.calculate_totals()
        invoice.save()

    @extend_schema(
        summary="List invoice line items",
        description="Get line items for a specific invoice"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Add invoice line item",
        description="Add a new line item to an invoice"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class InvoiceLineItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an invoice line item
    """
    serializer_class = InvoiceLineItemSerializer
    permission_classes = [CanManageBilling]

    def get_queryset(self):
        invoice_id = self.kwargs['invoice_id']
        return InvoiceLineItem.objects.filter(invoice_id=invoice_id)

    def perform_update(self, serializer):
        line_item = serializer.save()

        # Recalculate invoice totals
        line_item.invoice.calculate_totals()
        line_item.invoice.save()

    def perform_destroy(self, instance):
        invoice = instance.invoice

        if invoice.status not in ['draft', 'sent']:
            raise serializers.ValidationError("Cannot delete line items from paid or cancelled invoices")

        instance.delete()

        # Recalculate invoice totals
        invoice.calculate_totals()
        invoice.save()

    @extend_schema(
        summary="Get line item details",
        description="Retrieve detailed line item information"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update line item",
        description="Update line item information"
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Delete line item",
        description="Delete line item from invoice"
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)
