from django.db import models
from apps.core.models import TenantAwareModel
import uuid


class Assessment(TenantAwareModel):
    """An assessment event (exam, test, quiz, etc.) for a subject in a term."""

    ASSESSMENT_TYPES = [
        ('EXAM', 'Examination'),
        ('TEST', 'Class Test'),
        ('QUIZ', 'Quiz'),
        ('CA', 'Continuous Assessment'),
        ('PROJ', 'Project'),
    ]

    name = models.CharField(max_length=200)
    assessment_type = models.CharField(max_length=10, choices=ASSESSMENT_TYPES)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='assessments')
    grade = models.ForeignKey('academics.Grade', on_delete=models.CASCADE, related_name='assessments')
    stream = models.ForeignKey(
        'academics.Stream', on_delete=models.CASCADE,
        null=True, blank=True, related_name='assessments'
    )
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, related_name='assessments')
    date = models.DateField()
    max_score = models.DecimalField(max_digits=6, decimal_places=2, default=100)
    created_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True,
        related_name='created_assessments'
    )

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.name} — {self.subject} ({self.term})"


class StudentScore(TenantAwareModel):
    """A student's score on a specific assessment."""

    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='scores')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='scores')
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    remarks = models.TextField(blank=True)
    entered_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True,
        related_name='entered_scores'
    )

    class Meta:
        unique_together = ('assessment', 'student')
        ordering = ['assessment', 'student__last_name']

    @property
    def percentage(self):
        if self.score is not None and self.assessment.max_score:
            return round((self.score / self.assessment.max_score) * 100, 2)
        return None

    def __str__(self):
        return f"{self.student} — {self.assessment}: {self.score}"
