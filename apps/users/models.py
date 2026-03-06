from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class UserRole(models.TextChoices):
    # Level 1 — highest authority
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    # Level 2
    ADMIN = 'ADMIN', 'Admin'
    # Level 3
    MANAGER = 'MANAGER', 'Manager'
    # Level 4
    HEAD_TEACHER = 'HEAD_TEACHER', 'Head Teacher'
    # Level 5
    DEPUTY_HEAD = 'DEPUTY_HEAD', 'Deputy Head Teacher'
    # Level 6
    TEACHER = 'TEACHER', 'Teacher'
    # Level 7
    SOCIAL_SERVICES = 'SOCIAL_SERVICES', 'Social Services'
    # Level 8 — end users only
    STUDENT_GUARDIAN = 'STUDENT_GUARDIAN', 'Student / Guardian'


# Authority level per role — lower number = more authority
ROLE_LEVELS = {
    UserRole.SUPER_ADMIN: 1,
    UserRole.ADMIN: 2,
    UserRole.MANAGER: 3,
    UserRole.HEAD_TEACHER: 4,
    UserRole.DEPUTY_HEAD: 5,
    UserRole.TEACHER: 6,
    UserRole.SOCIAL_SERVICES: 7,
    UserRole.STUDENT_GUARDIAN: 8,
}


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(
        max_length=50,
        choices=UserRole.choices,
        default=UserRole.TEACHER
    )
    # Null for global-scope users (Super Admin, Admin) who operate across schools
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    @property
    def role_level(self):
        return ROLE_LEVELS.get(self.role, 99)

    def has_authority_over(self, role):
        """True if this user can create/manage users of the given role."""
        return self.role_level < ROLE_LEVELS.get(role, 99)

    # --- Scope ---

    @property
    def is_global_admin(self):
        """Super Admin or Admin — can operate across all schools."""
        return self.role in (UserRole.SUPER_ADMIN, UserRole.ADMIN)

    @property
    def is_school_leadership(self):
        """Head Teacher or Deputy — highest authority within a school."""
        return self.role in (UserRole.HEAD_TEACHER, UserRole.DEPUTY_HEAD)

    # --- Permission gates (per spec Section 4) ---

    @property
    def can_record_attendance(self):
        return self.role in (
            UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER,
            UserRole.HEAD_TEACHER, UserRole.DEPUTY_HEAD, UserRole.TEACHER,
        )

    @property
    def can_enter_academic_performance(self):
        return self.role in (
            UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER,
            UserRole.HEAD_TEACHER, UserRole.DEPUTY_HEAD, UserRole.TEACHER,
        )

    @property
    def can_generate_report_cards(self):
        return self.role in (
            UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER,
            UserRole.HEAD_TEACHER, UserRole.DEPUTY_HEAD, UserRole.TEACHER,
        )

    @property
    def can_approve_report_cards(self):
        """Only Head Teacher and above can approve/sign off report cards."""
        return self.role in (
            UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER,
            UserRole.HEAD_TEACHER, UserRole.DEPUTY_HEAD,
        )

    @property
    def can_grant_social_services_access(self):
        """Teacher and above can grant Social Services access."""
        return self.role in (
            UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER,
            UserRole.HEAD_TEACHER, UserRole.DEPUTY_HEAD, UserRole.TEACHER,
        )

    @property
    def is_social_services(self):
        return self.role == UserRole.SOCIAL_SERVICES

    def __str__(self):
        return self.email
