from django.db import models
from django.utils import timezone
from apps.core.models import TenantAwareModel
import uuid


class WelfareCase(TenantAwareModel):
    """A welfare or safeguarding case for a student.

    Per spec Section 3.7: Social Services can log visits, actions, and outcomes.
    Cases can be opened by any role above Student/Guardian and assigned to Social Services.
    """

    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('ESCALATED', 'Escalated'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]

    CATEGORY_CHOICES = [
        ('ATTENDANCE', 'Attendance Concern'),
        ('SAFEGUARDING', 'Safeguarding'),
        ('WELFARE', 'General Welfare'),
        ('MEDICAL', 'Medical'),
        ('OTHER', 'Other'),
    ]

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='welfare_cases')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='WELFARE')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    summary = models.TextField()

    opened_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True,
        related_name='opened_welfare_cases'
    )
    assigned_to = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_welfare_cases'
    )

    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def resolve(self):
        self.status = 'RESOLVED'
        self.resolved_at = timezone.now()
        self.save(update_fields=['status', 'resolved_at'])

    def escalate(self):
        self.status = 'ESCALATED'
        self.save(update_fields=['status'])

    def __str__(self):
        return f"[{self.get_status_display()}] {self.student} — {self.get_category_display()}"


class WelfareNote(models.Model):
    """A log entry (visit, action, outcome) on a welfare case.

    Per spec: Social Services log welfare visits, actions, and outcomes.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(WelfareCase, on_delete=models.CASCADE, related_name='notes')
    author = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True,
        related_name='welfare_notes'
    )
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Note on {self.case} by {self.author} at {self.created_at:%Y-%m-%d}"
