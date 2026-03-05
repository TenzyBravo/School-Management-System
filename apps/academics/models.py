from django.db import models
from django.conf import settings
from apps.core.models import TenantAwareModel
import uuid

class AcademicYear(models.Model):
    # Not strictly TenantAwareModel if shared? 
    # PRD says "AcademicYear model". Usually shared across system or per school?
    # PRD Phase 3: "AcademicYear model... is_current flag".
    # If different schools have different calendars, it should be TenantAware.
    # Design doc says "academic_years table" has NO school_id. It seems shared.
    # However, Phase 3 text says: "Grade model (tenant-scoped)".
    # Let's check Design Doc again for AcademicYear.
    # SQL: CREATE TABLE academic_years (id UUID PRIMARY KEY, ...). No school_id.
    # So it is global.
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)  # e.g., '2024-2025'
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name

class Term(models.Model):
    # Design doc: No school_id. Global.
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=50)  # e.g., 'Term 1'
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.academic_year})"

class Grade(TenantAwareModel):
    # Tenant scoped
    name = models.CharField(max_length=50)  # e.g., 'Grade 7'
    level = models.IntegerField() # e.g., 7 for sorting

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

    def __str__(self):
        return f"{self.teacher} - {self.subject} ({self.grade})"


class Classroom(TenantAwareModel):
    """Represents a class/stream instance under a Grade for a specific school.
    Example: Grade 1 -> '1-A', '1-B'
    """
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='classrooms')
    name = models.CharField(max_length=50)  # e.g., '1-A' or 'Form 1A'
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                null=True, blank=True, related_name='classrooms')
    capacity = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('grade', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.grade.name} - {self.name}"
