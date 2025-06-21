from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid

User = get_user_model()


class Invoice(models.Model):
    """
    Invoice model for billing patients
    """

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENT = 'sent', 'Sent'
        PAID = 'paid', 'Paid'
        PARTIALLY_PAID = 'partially_paid', 'Partially Paid'
        OVERDUE = 'overdue', 'Overdue'
        CANCELLED = 'cancelled', 'Cancelled'
        REFUNDED = 'refunded', 'Refunded'

    # Relationships
    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.CASCADE,
        related_name='invoices'
    )

    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices'
    )

    # Invoice Information
    invoice_id = models.CharField(max_length=20, unique=True)
    invoice_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )

    # Financial Information
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )

    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        default=Decimal('0.0000'),
        help_text="Tax rate as decimal (e.g., 0.0825 for 8.25%)"
    )

    tax_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )

    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )

    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )

    # Additional Information
    notes = models.TextField(blank=True, null=True)
    terms_and_conditions = models.TextField(blank=True, null=True)

    # System Information
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices_created'
    )

    class Meta:
        db_table = 'billing_invoice'
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        ordering = ['-invoice_date']
        indexes = [
            models.Index(fields=['invoice_id']),
            models.Index(fields=['patient', 'invoice_date']),
            models.Index(fields=['status']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f"Invoice {self.invoice_id} - {self.patient.get_full_name()}"

    def save(self, *args, **kwargs):
        """Override save to generate invoice ID and calculate totals"""
        if not self.invoice_id:
            self.invoice_id = self.generate_invoice_id()

        # Calculate totals
        self.calculate_totals()
        super().save(*args, **kwargs)

    def generate_invoice_id(self):
        """Generate unique invoice ID"""
        import datetime
        year = datetime.datetime.now().year
        count = Invoice.objects.filter(
            created_at__year=year
        ).count() + 1
        return f"INV{year}{count:06d}"

    def calculate_totals(self):
        """Calculate invoice totals"""
        # Only calculate if invoice has been saved (has a primary key)
        if self.pk:
            # Calculate subtotal from line items
            self.subtotal = sum(item.total_amount for item in self.line_items.all())
        else:
            self.subtotal = Decimal('0.00')

        # Calculate tax
        self.tax_amount = self.subtotal * self.tax_rate

        # Calculate total
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount

    @property
    def balance_due(self):
        """Calculate remaining balance"""
        return self.total_amount - self.paid_amount

    @property
    def is_paid(self):
        """Check if invoice is fully paid"""
        return self.paid_amount >= self.total_amount

    @property
    def is_overdue(self):
        """Check if invoice is overdue"""
        from datetime import date
        return self.due_date < date.today() and not self.is_paid

    def mark_as_paid(self):
        """Mark invoice as paid"""
        self.paid_amount = self.total_amount
        self.status = self.Status.PAID
        self.save()


class InvoiceLineItem(models.Model):
    """
    Individual line items for invoices
    """

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='line_items'
    )

    # Item Information
    description = models.CharField(max_length=200)
    quantity = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('1.00'),
        validators=[MinValueValidator(Decimal('0.01'))]
    )

    unit_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )

    # System Information
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'billing_invoice_line_item'
        verbose_name = 'Invoice Line Item'
        verbose_name_plural = 'Invoice Line Items'
        ordering = ['id']

    def __str__(self):
        return f"{self.description} - {self.quantity} x ${self.unit_price}"

    def save(self, *args, **kwargs):
        """Override save to calculate total"""
        self.total_amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)

        # Update invoice totals
        self.invoice.calculate_totals()
        self.invoice.save()


class Payment(models.Model):
    """
    Payment model for tracking invoice payments
    """

    class PaymentMethod(models.TextChoices):
        CASH = 'cash', 'Cash'
        CREDIT_CARD = 'credit_card', 'Credit Card'
        DEBIT_CARD = 'debit_card', 'Debit Card'
        CHECK = 'check', 'Check'
        BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
        INSURANCE = 'insurance', 'Insurance'
        OTHER = 'other', 'Other'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    # Relationships
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='payments'
    )

    # Payment Information
    payment_id = models.CharField(max_length=20, unique=True)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    payment_date = models.DateTimeField()
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    # System Information
    created_at = models.DateTimeField(auto_now_add=True)
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments_processed'
    )

    class Meta:
        db_table = 'billing_payment'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['payment_id']),
            models.Index(fields=['invoice', 'payment_date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Payment {self.payment_id} - ${self.amount}"

    def save(self, *args, **kwargs):
        """Override save to generate payment ID"""
        if not self.payment_id:
            self.payment_id = self.generate_payment_id()
        super().save(*args, **kwargs)

        # Update invoice paid amount if payment is completed
        if self.status == self.Status.COMPLETED:
            self.invoice.paid_amount = sum(
                payment.amount for payment in self.invoice.payments.filter(
                    status=self.Status.COMPLETED
                )
            )

            # Update invoice status
            if self.invoice.paid_amount >= self.invoice.total_amount:
                self.invoice.status = Invoice.Status.PAID
            elif self.invoice.paid_amount > 0:
                self.invoice.status = Invoice.Status.PARTIALLY_PAID

            self.invoice.save()

    def generate_payment_id(self):
        """Generate unique payment ID"""
        import datetime
        year = datetime.datetime.now().year
        count = Payment.objects.filter(
            created_at__year=year
        ).count() + 1
        return f"PAY{year}{count:06d}"
