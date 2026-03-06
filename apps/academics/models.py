from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from apps.core.models import TenantAwareModel
import uuid


class AcademicYear(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)  # e.g., '2024-2025'
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    def clean(self):
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError("start_date must be before end_date.")
        if self.is_current:
            qs = AcademicYear.objects.filter(is_current=True)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError("Only one AcademicYear can be current at a time.")

    def __str__(self):
        return self.name


class Term(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=50)  # e.g., 'Term 1'
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    def clean(self):
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError("start_date must be before end_date.")
        if self.is_current and self.academic_year_id:
            qs = Term.objects.filter(academic_year_id=self.academic_year_id, is_current=True)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError("Only one Term per AcademicYear can be current at a time.")

    def __str__(self):
        return f"{self.name} ({self.academic_year})"


class Grade(TenantAwareModel):
    name = models.CharField(max_length=50)  # e.g., 'Grade 7'
    level = models.IntegerField()  # e.g., 7 for sorting

    class Meta:
        unique_together = ('school', 'name')
        ordering = ['level']

    def __str__(self):
        return self.name


class Stream(TenantAwareModel):
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='streams')
    name = models.CharField(max_length=50)  # e.g., 'A', 'Blue'

    class Meta:
        unique_together = ('grade', 'name')
        ordering = ['name']

    def clean(self):
        if self.grade_id and self.school_id and self.grade.school_id != self.school_id:
            raise ValidationError("Stream's school must match its grade's school.")

    def __str__(self):
        return f"{self.grade.name} - {self.name}"


class Subject(TenantAwareModel):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    is_core = models.BooleanField(default=True)

    class Meta:
        unique_together = ('school', 'code')
        ordering = ['name']

    def __str__(self):
        return self.name


class TeacherAssignment(TenantAwareModel):
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assignments')
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE)
    stream = models.ForeignKey(Stream, on_delete=models.CASCADE, null=True, blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    is_class_teacher = models.BooleanField(default=False)

    class Meta:
        unique_together = ('teacher', 'grade', 'stream', 'subject', 'academic_year')

    def clean(self):
        school_id = self.school_id
        if self.grade_id and self.grade.school_id != school_id:
            raise ValidationError("Grade must belong to the same school as this assignment.")
        if self.stream_id and self.stream.school_id != school_id:
            raise ValidationError("Stream must belong to the same school as this assignment.")
        if self.subject_id and self.subject.school_id != school_id:
            raise ValidationError("Subject must belong to the same school as this assignment.")
        if self.stream_id and self.grade_id and self.stream.grade_id != self.grade_id:
            raise ValidationError("Stream must belong to the specified grade.")

    def __str__(self):
        return f"{self.teacher} - {self.subject} ({self.grade})"


class Classroom(TenantAwareModel):
    """Links a Stream to an optional class teacher and capacity.

    Replaces the previous (grade, name) design — Stream is the canonical
    academic sub-division; Classroom adds organizational metadata on top.
    """
    stream = models.OneToOneField(Stream, on_delete=models.CASCADE, related_name='classroom')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                null=True, blank=True, related_name='classrooms')
    capacity = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ['stream__name']

    def clean(self):
        if self.stream_id and self.school_id and self.stream.school_id != self.school_id:
            raise ValidationError("Classroom's school must match its stream's school.")

    def __str__(self):
        return str(self.stream)
