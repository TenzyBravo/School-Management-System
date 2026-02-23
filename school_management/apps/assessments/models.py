from django.db import models
from apps.core.models import TenantAwareModel
import uuid


class AssessmentType(models.TextChoices):
    TEST = 'TEST', 'Test'
    QUIZ = 'QUIZ', 'Quiz'
    EXAM = 'EXAM', 'Exam'
    ASSIGNMENT = 'ASSIGNMENT', 'Assignment'
    PROJECT = 'PROJECT', 'Project'
    PRACTICAL = 'PRACTICAL', 'Practical'


class Assessment(TenantAwareModel):
    """
    Represents an assessment/exam that students take
    """
    name = models.CharField(max_length=200)
    assessment_type = models.CharField(max_length=50, choices=AssessmentType.choices)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='assessments')
    grade = models.ForeignKey('academics.Grade', on_delete=models.CASCADE, related_name='assessments')
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, related_name='assessments')

    # Assessment details
    max_marks = models.DecimalField(max_digits=6, decimal_places=2, default=100)
    weight = models.DecimalField(max_digits=5, decimal_places=2, default=1.0, help_text="Weight in final grade calculation")
    date_conducted = models.DateField()

    # Optional fields
    description = models.TextField(blank=True)
    instructions = models.TextField(blank=True)

    class Meta:
        ordering = ['-date_conducted']
        unique_together = ('name', 'subject', 'grade', 'term')

    def __str__(self):
        return f"{self.name} - {self.subject.name} ({self.grade.name})"


class Mark(TenantAwareModel):
    """
    Individual student's marks for an assessment
    """
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='marks')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='marks')

    # Marks
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2)
    remarks = models.TextField(blank=True, help_text="Teacher's comments/remarks")

    # Metadata
    entered_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='marks_entered')
    entered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('assessment', 'student')
        ordering = ['-entered_at']

    def __str__(self):
        return f"{self.student.full_name} - {self.assessment.name}: {self.marks_obtained}/{self.assessment.max_marks}"

    @property
    def percentage(self):
        """Calculate percentage score"""
        if self.assessment.max_marks > 0:
            return (self.marks_obtained / self.assessment.max_marks) * 100
        return 0

    @property
    def grade_letter(self):
        """Convert percentage to letter grade"""
        percentage = self.percentage
        if percentage >= 80:
            return 'A'
        elif percentage >= 70:
            return 'B'
        elif percentage >= 60:
            return 'C'
        elif percentage >= 50:
            return 'D'
        elif percentage >= 40:
            return 'E'
        else:
            return 'F'


class TermGrade(TenantAwareModel):
    """
    Aggregated grade for a student in a subject for a term
    """
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='term_grades')
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='term_grades')
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, related_name='term_grades')
    grade = models.ForeignKey('academics.Grade', on_delete=models.CASCADE, related_name='term_grades')

    # Calculated values
    total_marks = models.DecimalField(max_digits=6, decimal_places=2)
    max_possible_marks = models.DecimalField(max_digits=6, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    grade_letter = models.CharField(max_length=2)

    # Metadata
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'subject', 'term', 'grade')
        ordering = ['-calculated_at']

    def __str__(self):
        return f"{self.student.full_name} - {self.subject.name} ({self.term.name}): {self.grade_letter}"
