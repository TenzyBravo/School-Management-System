from django.db import models
from django.core.exceptions import ValidationError
from apps.core.models import TenantAwareModel
import uuid


class Student(TenantAwareModel):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    admission_number = models.CharField(max_length=50)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    enrollment_date = models.DateField()

    # Per spec: each student is enrolled in exactly one class (Classroom = Stream + metadata).
    # classroom implies stream and grade — do not store stream/grade separately.
    classroom = models.ForeignKey(
        'academics.Classroom',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )

    # The academic year of current enrollment
    academic_year = models.ForeignKey(
        'academics.AcademicYear',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrolled_students'
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('school', 'admission_number')
        ordering = ['last_name', 'first_name']

    def clean(self):
        if self.classroom_id and self.school_id and self.classroom.school_id != self.school_id:
            raise ValidationError("Classroom must belong to the same school as the student.")

    @property
    def current_stream(self):
        return self.classroom.stream if self.classroom_id else None

    @property
    def current_grade(self):
        stream = self.current_stream
        return stream.grade if stream else None

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.admission_number})"


class StudentProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='profile')
    
    guardian_name = models.CharField(max_length=255)
    guardian_phone = models.CharField(max_length=20)
    guardian_email = models.EmailField(blank=True, null=True)
    address = models.TextField()
    
    medical_notes = models.TextField(blank=True, null=True)
    special_needs = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.student}"
