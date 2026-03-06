from django.db import models
from apps.core.models import TenantAwareModel


class Attendance(TenantAwareModel):
    STATUS_CHOICES = [
        ('P', 'Present'),
        ('A', 'Absent'),
        ('L', 'Late'),
        ('E', 'Excused'),
    ]

    # Per spec: AM/PM session marking supported
    SESSION_CHOICES = [
        ('AM', 'Morning'),
        ('PM', 'Afternoon'),
    ]

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    session = models.CharField(max_length=2, choices=SESSION_CHOICES, default='AM')
    status = models.CharField(max_length=1, choices=STATUS_CHOICES)
    marked_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='marked_attendances')
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        # One record per student per session per day
        unique_together = ('student', 'date', 'session')
        ordering = ['-date', 'session']

    def __str__(self):
        return f"{self.student} - {self.date} {self.session}: {self.get_status_display()}"


class AbsenceAlert(TenantAwareModel):
    """Tracks auto-generated alerts when a student is absent 3+ consecutive days in a week.

    Per spec Section 5.1: triggered Monday–Friday; resets each week.
    Recipients: Social Services, Head Teacher, Deputy Head, Parent/Guardian.
    """
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='absence_alerts')
    week_start = models.DateField(help_text="Monday of the week this alert covers.")
    consecutive_days = models.PositiveIntegerField()
    is_acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='acknowledged_alerts'
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    is_escalated = models.BooleanField(default=False)

    class Meta:
        unique_together = ('student', 'week_start')
        ordering = ['-week_start']

    def __str__(self):
        return f"AbsenceAlert: {self.student} — week of {self.week_start} ({self.consecutive_days} days)"

