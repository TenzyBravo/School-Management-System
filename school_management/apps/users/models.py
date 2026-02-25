from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    TEACHER = 'TEACHER', 'Teacher'
    HEADTEACHER = 'HEADTEACHER', 'Headteacher'
    DEPUTY_HEAD = 'DEPUTY_HEAD', 'Deputy Headteacher'
    SOCIAL_OFFICER = 'SOCIAL_OFFICER', 'Social Services Officer'
    ACADEMIC_MANAGER = 'ACADEMIC_MANAGER', 'Academic Manager'
    HEAD_OF_OPS = 'HEAD_OF_OPS', 'Head of Operations'
    DIRECTOR = 'DIRECTOR', 'Director'


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    email = models.EmailField(unique=True)
    employee_number = models.CharField(
        max_length=50, unique=True,
        help_text="Employee ID - Unique identifier", default='TEMP'
    )
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(
        max_length=50,
        choices=UserRole.choices,
        default=UserRole.TEACHER
    )
    # Null for super admins and HQ users (not tied to a single school)
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff'
    )
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        null=True,
        blank=True,
        help_text="Staff profile picture"
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    @property
    def is_super_admin(self):
        return self.role == UserRole.SUPER_ADMIN

    @property
    def is_hq_user(self):
        """HQ staff + super admin both have cross-school access."""
        return self.role in [
            UserRole.SUPER_ADMIN,
            UserRole.ACADEMIC_MANAGER,
            UserRole.HEAD_OF_OPS,
            UserRole.DIRECTOR,
        ]

    @property
    def is_school_admin(self):
        return self.role in [UserRole.HEADTEACHER, UserRole.DEPUTY_HEAD]

    @property
    def can_mark_attendance(self):
        return self.role in [
            UserRole.TEACHER,
            UserRole.HEADTEACHER,
            UserRole.DEPUTY_HEAD,
        ]

    def __str__(self):
        return self.email
