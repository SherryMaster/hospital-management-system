from rest_framework import serializers
from django.contrib.auth import get_user_model
from decimal import Decimal
from .models import Invoice, InvoiceLineItem, Payment
from apps.patients.serializers import PatientListSerializer
from apps.appointments.serializers import AppointmentListSerializer

User = get_user_model()


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    """
    Serializer for Invoice Line Items
    """
    
    class Meta:
        model = InvoiceLineItem
        fields = [
            'id', 'description', 'quantity', 'unit_price', 'total_amount', 'created_at'
        ]
        read_only_fields = ['total_amount', 'created_at']


class InvoiceLineItemCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating Invoice Line Items
    """
    
    class Meta:
        model = InvoiceLineItem
        fields = ['description', 'quantity', 'unit_price']
    
    def validate_quantity(self, value):
        """Validate quantity is positive"""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value
    
    def validate_unit_price(self, value):
        """Validate unit price is not negative"""
        if value < 0:
            raise serializers.ValidationError("Unit price cannot be negative")
        return value


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for Payment model
    """
    processed_by_name = serializers.ReadOnlyField(source='processed_by.get_full_name')
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_id', 'amount', 'payment_method', 'status',
            'payment_date', 'reference_number', 'notes', 'processed_by',
            'processed_by_name', 'created_at'
        ]
        read_only_fields = ['payment_id', 'created_at']


class PaymentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating payments
    """
    
    class Meta:
        model = Payment
        fields = [
            'invoice', 'amount', 'payment_method', 'payment_date',
            'reference_number', 'notes'
        ]
    
    def validate_amount(self, value):
        """Validate payment amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Payment amount must be greater than 0")
        return value
    
    def validate(self, attrs):
        """Cross-field validation"""
        invoice = attrs.get('invoice')
        amount = attrs.get('amount')
        
        if invoice and amount:
            # Check if payment amount doesn't exceed remaining balance
            remaining_balance = invoice.balance_due
            if amount > remaining_balance:
                raise serializers.ValidationError(
                    f"Payment amount (${amount}) cannot exceed remaining balance (${remaining_balance})"
                )
        
        return attrs
    
    def create(self, validated_data):
        """Create payment with current user as processor"""
        validated_data['processed_by'] = self.context['request'].user
        validated_data['status'] = Payment.Status.COMPLETED
        return super().create(validated_data)


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Invoice model
    """
    patient_name = serializers.ReadOnlyField(source='patient.get_full_name')
    appointment_info = AppointmentListSerializer(source='appointment', read_only=True)
    line_items = InvoiceLineItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    created_by_name = serializers.ReadOnlyField(source='created_by.get_full_name')
    balance_due = serializers.ReadOnlyField()
    is_paid = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_id', 'patient', 'patient_name', 'appointment',
            'appointment_info', 'invoice_date', 'due_date', 'status',
            'subtotal', 'tax_rate', 'tax_amount', 'discount_amount',
            'total_amount', 'paid_amount', 'balance_due', 'is_paid',
            'is_overdue', 'notes', 'terms_and_conditions', 'line_items',
            'payments', 'created_at', 'updated_at', 'created_by',
            'created_by_name'
        ]
        read_only_fields = [
            'invoice_id', 'invoice_date', 'subtotal', 'tax_amount',
            'total_amount', 'paid_amount', 'created_at', 'updated_at'
        ]


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating invoices
    """
    line_items = InvoiceLineItemCreateSerializer(many=True)
    
    class Meta:
        model = Invoice
        fields = [
            'patient', 'appointment', 'due_date', 'tax_rate',
            'discount_amount', 'notes', 'terms_and_conditions', 'line_items'
        ]
    
    def validate_line_items(self, value):
        """Validate that at least one line item is provided"""
        if not value:
            raise serializers.ValidationError("At least one line item is required")
        return value
    
    def validate_tax_rate(self, value):
        """Validate tax rate is reasonable"""
        if value < 0 or value > 1:
            raise serializers.ValidationError("Tax rate must be between 0 and 1 (0% to 100%)")
        return value
    
    def validate_discount_amount(self, value):
        """Validate discount amount is not negative"""
        if value < 0:
            raise serializers.ValidationError("Discount amount cannot be negative")
        return value
    
    def create(self, validated_data):
        """Create invoice with line items"""
        line_items_data = validated_data.pop('line_items')
        validated_data['created_by'] = self.context['request'].user

        # Create invoice first
        invoice = Invoice.objects.create(**validated_data)

        # Create line items after invoice is saved
        for line_item_data in line_items_data:
            InvoiceLineItem.objects.create(invoice=invoice, **line_item_data)

        # Recalculate totals after line items are created
        invoice.refresh_from_db()
        invoice.calculate_totals()
        invoice.save()

        return invoice


class InvoiceUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating invoices
    """
    
    class Meta:
        model = Invoice
        fields = [
            'due_date', 'status', 'tax_rate', 'discount_amount',
            'notes', 'terms_and_conditions'
        ]
    
    def validate_status(self, value):
        """Validate status transitions"""
        if self.instance:
            current_status = self.instance.status
            
            # Define allowed status transitions
            allowed_transitions = {
                'draft': ['sent', 'cancelled'],
                'sent': ['paid', 'partially_paid', 'overdue', 'cancelled'],
                'paid': ['refunded'],
                'partially_paid': ['paid', 'overdue', 'cancelled'],
                'overdue': ['paid', 'partially_paid', 'cancelled'],
                'cancelled': [],
                'refunded': []
            }
            
            if value != current_status and value not in allowed_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Cannot change status from '{current_status}' to '{value}'"
                )
        
        return value


class InvoiceListSerializer(serializers.ModelSerializer):
    """
    Serializer for invoice list view
    """
    patient_name = serializers.ReadOnlyField(source='patient.get_full_name')
    balance_due = serializers.ReadOnlyField()
    is_paid = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_id', 'patient_name', 'invoice_date', 'due_date',
            'status', 'total_amount', 'paid_amount', 'balance_due',
            'is_paid', 'is_overdue'
        ]


class MyInvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for patient's own invoices
    """
    line_items = InvoiceLineItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    balance_due = serializers.ReadOnlyField()
    is_paid = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_id', 'invoice_date', 'due_date', 'status',
            'subtotal', 'tax_rate', 'tax_amount', 'discount_amount',
            'total_amount', 'paid_amount', 'balance_due', 'is_paid',
            'is_overdue', 'notes', 'terms_and_conditions', 'line_items',
            'payments'
        ]


class InvoiceSummarySerializer(serializers.Serializer):
    """
    Serializer for invoice summary statistics
    """
    total_invoices = serializers.IntegerField(read_only=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_outstanding = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    overdue_count = serializers.IntegerField(read_only=True)
    overdue_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    paid_count = serializers.IntegerField(read_only=True)
    draft_count = serializers.IntegerField(read_only=True)
    sent_count = serializers.IntegerField(read_only=True)


class PaymentSummarySerializer(serializers.Serializer):
    """
    Serializer for payment summary statistics
    """
    total_payments = serializers.IntegerField(read_only=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    cash_payments = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    card_payments = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    insurance_payments = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    today_payments = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    this_month_payments = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
