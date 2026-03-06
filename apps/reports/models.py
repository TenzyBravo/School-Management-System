from django.db import models
from django.utils import timezone
from apps.core.models import TenantAwareModel
import uuid


class ReportCard(TenantAwareModel):
    """A student's report card for a specific term.

    Workflow (per spec Section 7.4):
      DRAFT → SUBMITTED → APPROVED → PUBLISHED
    Teachers generate; Head Teacher / Deputy approve and sign off;
    published version is visible to Student/Guardian.
    """

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted for Approval'),
        ('APPROVED', 'Approved'),
        ('PUBLISHED', 'Published'),
    ]

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='report_cards')
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, related_name='report_cards')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='report_cards')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')

    generated_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True,
        related_name='generated_report_cards'
    )
    # Only Head Teacher / Deputy Head or above can approve (enforced at API/view layer)
    approved_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_report_cards'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    teacher_comments = models.TextField(blank=True)
    head_teacher_comments = models.TextField(blank=True)

    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('student', 'term')
        ordering = ['-term__academic_year__start_date', 'student__last_name']

    def approve(self, approver):
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.status = 'APPROVED'
        self.save(update_fields=['approved_by', 'approved_at', 'status'])

    def publish(self):
        self.status = 'PUBLISHED'
        self.published_at = timezone.now()
        self.save(update_fields=['status', 'published_at'])

    def __str__(self):
        return f"Report Card: {self.student} — {self.term}"


class ReportCardEntry(models.Model):
    """Per-subject score and remarks on a report card."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_card = models.ForeignKey(ReportCard, on_delete=models.CASCADE, related_name='entries')
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    max_score = models.DecimalField(max_digits=6, decimal_places=2, default=100)
    grade_label = models.CharField(max_length=10, blank=True)  # e.g., 'A', 'B+', 'Distinction'
    teacher_remarks = models.TextField(blank=True)

    class Meta:
        unique_together = ('report_card', 'subject')

    @property
    def percentage(self):
        if self.score is not None and self.max_score:
            return round((self.score / self.max_score) * 100, 2)
        return None

    def __str__(self):
        return f"{self.report_card.student} — {self.subject}: {self.grade_label or self.score}"
