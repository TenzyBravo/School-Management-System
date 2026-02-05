# Engineering Design Document
## Multi-Tenant School Management System
### Django Framework + PostgreSQL Architecture

**Version:** 1.0  
**Date:** January 2025

---

## Table of Contents

1. [Technology Stack Overview](#1-technology-stack-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [Django Application Structure](#4-django-application-structure)
5. [Multi-Tenancy Implementation](#5-multi-tenancy-implementation)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Design](#7-api-design)
8. [Security Implementation](#8-security-implementation)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Development Guidelines](#10-development-guidelines)

---

## 1. Technology Stack Overview

### 1.1 Core Technologies

| Layer | Technology | Version/Details |
|-------|------------|-----------------|
| Backend Framework | Django | 4.2 LTS (Long Term Support) |
| Database | PostgreSQL | 15.x with pg_trgm extension |
| API Framework | Django REST Framework | 3.14.x |
| Authentication | Django Auth + JWT | djangorestframework-simplejwt |
| Task Queue | Celery + Redis | Background jobs & caching |
| Frontend | React + TypeScript | 18.x with Tailwind CSS |
| Web Server | Nginx + Gunicorn | Reverse proxy + WSGI |

### 1.2 Key Python Dependencies

```txt
# requirements.txt
Django==4.2.8
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0
psycopg2-binary==2.9.9
django-filter==23.5
django-cors-headers==4.3.1
celery==5.3.4
redis==5.0.1
django-redis==5.4.0
Pillow==10.1.0
python-decouple==3.8
gunicorn==21.2.0
whitenoise==6.6.0
django-auditlog==2.3.0
```

---

## 2. System Architecture

### 2.1 High-Level Architecture

The system follows a layered architecture pattern with clear separation of concerns:

| Layer | Components |
|-------|------------|
| Presentation | React SPA, REST API endpoints |
| Application | Django Views, Serializers, Business Logic Services |
| Domain | Models, Managers, Validators |
| Infrastructure | PostgreSQL, Redis, Celery Workers |

### 2.2 Component Diagram

**Request Flow:**

```
┌─────────────┐     ┌─────────┐     ┌──────────────┐
│   Browser   │────▶│  Nginx  │────▶│   Gunicorn   │
│   (React)   │     │         │     │   (Django)   │
└─────────────┘     └─────────┘     └──────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
             ┌────────────┐        ┌────────────┐         ┌────────────┐
             │ PostgreSQL │        │   Redis    │         │   Celery   │
             │  Database  │        │   Cache    │         │  Workers   │
             └────────────┘        └────────────┘         └────────────┘
```

---

## 3. Database Design

### 3.1 Entity Relationship Overview

All tenant-scoped tables include a `school_id` foreign key for multi-tenancy isolation.

### 3.2 Core Tables

#### 3.2.1 School (Tenant) Model

```sql
-- schools table (tenant table)
CREATE TABLE schools (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(20) UNIQUE NOT NULL,
    address         TEXT,
    phone           VARCHAR(20),
    email           VARCHAR(255),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.2.2 User Model

```sql
-- users table (extends Django AbstractUser)
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(50) NOT NULL,  -- ENUM type
    school_id       UUID REFERENCES schools(id),  -- NULL for HQ users
    is_active       BOOLEAN DEFAULT TRUE,
    is_staff        BOOLEAN DEFAULT FALSE,
    last_login      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role ENUM values:
-- 'TEACHER', 'HEADTEACHER', 'DEPUTY_HEAD', 'SOCIAL_OFFICER',
-- 'ACADEMIC_MANAGER', 'HEAD_OF_OPS', 'DIRECTOR'
```

#### 3.2.3 Academic Structure Tables

```sql
-- academic_years table
CREATE TABLE academic_years (
    id              UUID PRIMARY KEY,
    name            VARCHAR(50) NOT NULL,  -- e.g., '2024-2025'
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    is_current      BOOLEAN DEFAULT FALSE
);

-- terms table
CREATE TABLE terms (
    id              UUID PRIMARY KEY,
    academic_year_id UUID REFERENCES academic_years(id),
    name            VARCHAR(50) NOT NULL,  -- e.g., 'Term 1'
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    is_current      BOOLEAN DEFAULT FALSE
);

-- grades table (form/class levels)
CREATE TABLE grades (
    id              UUID PRIMARY KEY,
    school_id       UUID REFERENCES schools(id) NOT NULL,
    name            VARCHAR(50) NOT NULL,  -- e.g., 'Grade 7'
    level           INTEGER NOT NULL,
    UNIQUE(school_id, name)
);

-- streams table (sections within grades)
CREATE TABLE streams (
    id              UUID PRIMARY KEY,
    school_id       UUID REFERENCES schools(id) NOT NULL,
    grade_id        UUID REFERENCES grades(id) NOT NULL,
    name            VARCHAR(50) NOT NULL,  -- e.g., 'A', 'B', 'Blue'
    UNIQUE(grade_id, name)
);
```

#### 3.2.4 Student Model

```sql
-- students table
CREATE TABLE students (
    id              UUID PRIMARY KEY,
    school_id       UUID REFERENCES schools(id) NOT NULL,
    admission_no    VARCHAR(50) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    date_of_birth   DATE NOT NULL,
    gender          VARCHAR(10) NOT NULL,
    current_grade_id UUID REFERENCES grades(id),
    current_stream_id UUID REFERENCES streams(id),
    guardian_name   VARCHAR(200),
    guardian_phone  VARCHAR(20),
    guardian_email  VARCHAR(255),
    address         TEXT,
    admission_date  DATE NOT NULL,
    status          VARCHAR(20) DEFAULT 'ACTIVE',
    photo           VARCHAR(500),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, admission_no)
);

-- Indexes for performance
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_grade ON students(current_grade_id);
CREATE INDEX idx_students_name ON students(last_name, first_name);
```

#### 3.2.5 Subject and Assignment Tables

```sql
-- subjects table
CREATE TABLE subjects (
    id              UUID PRIMARY KEY,
    school_id       UUID REFERENCES schools(id) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(20) NOT NULL,
    is_core         BOOLEAN DEFAULT TRUE,
    UNIQUE(school_id, code)
);

-- teacher_assignments table
CREATE TABLE teacher_assignments (
    id              UUID PRIMARY KEY,
    school_id       UUID REFERENCES schools(id) NOT NULL,
    teacher_id      UUID REFERENCES users(id) NOT NULL,
    grade_id        UUID REFERENCES grades(id) NOT NULL,
    stream_id       UUID REFERENCES streams(id),
    subject_id      UUID REFERENCES subjects(id) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id) NOT NULL,
    is_class_teacher BOOLEAN DEFAULT FALSE,
    UNIQUE(teacher_id, grade_id, stream_id, subject_id, academic_year_id)
);
```

#### 3.2.6 Attendance Table

```sql
-- attendance table
CREATE TABLE attendance (
    id              UUID PRIMARY KEY,
    school_id       UUID REFERENCES schools(id) NOT NULL,
    student_id      UUID REFERENCES students(id) NOT NULL,
    date            DATE NOT NULL,
    status          VARCHAR(20) NOT NULL,  -- PRESENT, ABSENT, LATE, EXCUSED
    marked_by       UUID REFERENCES users(id) NOT NULL,
    remarks         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date)
);

-- Indexes
CREATE INDEX idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX idx_attendance_student ON attendance(student_id, date);
```

#### 3.2.7 Assessment and Marks Tables

```sql
-- assessments table (defines assessment types)
CREATE TABLE assessments (
    id              UUID PRIMARY KEY,
    school_id       UUID REFERENCES schools(id) NOT NULL,
    term_id         UUID REFERENCES terms(id) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    type            VARCHAR(50) NOT NULL,  -- CA, EXAM, TEST
    max_marks       DECIMAL(5,2) NOT NULL,
    weight          DECIMAL(5,2) DEFAULT 1.0,
    grade_id        UUID REFERENCES grades(id),
    subject_id      UUID REFERENCES subjects(id),
    date            DATE
);

-- marks table
CREATE TABLE marks (
    id              UUID PRIMARY KEY,
    school_id       UUID REFERENCES schools(id) NOT NULL,
    student_id      UUID REFERENCES students(id) NOT NULL,
    assessment_id   UUID REFERENCES assessments(id) NOT NULL,
    subject_id      UUID REFERENCES subjects(id) NOT NULL,
    term_id         UUID REFERENCES terms(id) NOT NULL,
    marks_obtained  DECIMAL(5,2),
    grade           VARCHAR(5),
    remarks         TEXT,
    entered_by      UUID REFERENCES users(id) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, assessment_id, subject_id)
);

-- grading_scales table
CREATE TABLE grading_scales (
    id              UUID PRIMARY KEY,
    school_id       UUID REFERENCES schools(id) NOT NULL,
    name            VARCHAR(50) NOT NULL,
    min_percentage  DECIMAL(5,2) NOT NULL,
    max_percentage  DECIMAL(5,2) NOT NULL,
    grade           VARCHAR(5) NOT NULL,
    points          DECIMAL(3,1),
    description     VARCHAR(100)
);
```

#### 3.2.8 Social Services Tables

```sql
-- student_notes table (social services interventions)
CREATE TABLE student_notes (
    id              UUID PRIMARY KEY,
    school_id       UUID REFERENCES schools(id) NOT NULL,
    student_id      UUID REFERENCES students(id) NOT NULL,
    category        VARCHAR(50) NOT NULL,  -- WELFARE, ACADEMIC, BEHAVIOR, HEALTH
    title           VARCHAR(200) NOT NULL,
    content         TEXT NOT NULL,
    is_confidential BOOLEAN DEFAULT FALSE,
    follow_up_date  DATE,
    status          VARCHAR(20) DEFAULT 'OPEN',  -- OPEN, IN_PROGRESS, CLOSED
    created_by      UUID REFERENCES users(id) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- note_followups table
CREATE TABLE note_followups (
    id              UUID PRIMARY KEY,
    note_id         UUID REFERENCES student_notes(id) NOT NULL,
    content         TEXT NOT NULL,
    created_by      UUID REFERENCES users(id) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.2.9 Audit Log Table

```sql
-- audit_logs table
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY,
    school_id       UUID REFERENCES schools(id),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(50) NOT NULL,  -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    table_name      VARCHAR(100),
    record_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for querying
CREATE INDEX idx_audit_school ON audit_logs(school_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
```

---

## 4. Django Application Structure

### 4.1 Project Structure

```
school_management/
├── config/                     # Project configuration
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py            # Common settings
│   │   ├── development.py     # Dev settings
│   │   ├── production.py      # Prod settings
│   │   └── testing.py         # Test settings
│   ├── urls.py
│   ├── wsgi.py
│   └── celery.py
├── apps/
│   ├── core/                   # Shared utilities
│   │   ├── models.py          # Base models
│   │   ├── mixins.py          # Tenant mixins
│   │   ├── permissions.py     # Custom permissions
│   │   └── middleware.py      # Tenant middleware
│   ├── schools/                # School/tenant management
│   ├── users/                  # Authentication & users
│   ├── students/               # Student management
│   ├── academics/              # Grades, subjects, terms
│   ├── attendance/             # Attendance tracking
│   ├── assessments/            # Marks & grading
│   ├── welfare/                # Social services
│   └── reports/                # Reporting & analytics
├── manage.py
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
└── docker-compose.yml
```

### 4.2 App Structure Pattern

```
apps/students/
├── __init__.py
├── admin.py                    # Django admin config
├── apps.py                     # App config
├── models.py                   # Database models
├── managers.py                 # Custom model managers
├── serializers.py              # DRF serializers
├── views.py                    # API views
├── urls.py                     # URL routing
├── filters.py                  # Query filters
├── services.py                 # Business logic
├── signals.py                  # Django signals
├── tasks.py                    # Celery tasks
├── tests/
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_views.py
│   └── test_services.py
└── migrations/
```

---

## 5. Multi-Tenancy Implementation

### 5.1 Base Tenant Model

```python
# apps/core/models.py

from django.db import models
from django.conf import settings
import uuid

class TenantAwareModel(models.Model):
    """
    Abstract base model that provides tenant isolation.
    All tenant-scoped models should inherit from this.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='%(class)s_set'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        # Ensure school is set from request context if not provided
        if not self.school_id:
            from apps.core.context import get_current_school
            self.school = get_current_school()
        super().save(*args, **kwargs)
```

### 5.2 Tenant-Aware Manager

```python
# apps/core/managers.py

from django.db import models
from apps.core.context import get_current_school, get_current_user

class TenantManager(models.Manager):
    """
    Custom manager that automatically filters by current tenant.
    """

    def get_queryset(self):
        qs = super().get_queryset()
        school = get_current_school()
        user = get_current_user()
        
        # HQ users can see all data
        if user and user.is_hq_user:
            return qs
        
        # School users only see their school's data
        if school:
            return qs.filter(school=school)
        
        return qs.none()  # No tenant context = no data

    def for_school(self, school):
        """Explicitly filter for a specific school."""
        return super().get_queryset().filter(school=school)

    def all_schools(self):
        """Get data across all schools (HQ reporting)."""
        return super().get_queryset()
```

### 5.3 Tenant Context Middleware

```python
# apps/core/middleware.py

from threading import local
from django.utils.deprecation import MiddlewareMixin

_thread_locals = local()

class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to set current tenant in thread-local storage.
    """

    def process_request(self, request):
        user = getattr(request, 'user', None)
        
        if user and user.is_authenticated:
            _thread_locals.user = user
            _thread_locals.school = getattr(user, 'school', None)
        else:
            _thread_locals.user = None
            _thread_locals.school = None

    def process_response(self, request, response):
        # Clear thread-local data
        _thread_locals.user = None
        _thread_locals.school = None
        return response


# apps/core/context.py

def get_current_user():
    return getattr(_thread_locals, 'user', None)

def get_current_school():
    return getattr(_thread_locals, 'school', None)
```

---

## 6. Authentication & Authorization

### 6.1 Custom User Model

```python
# apps/users/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class UserRole(models.TextChoices):
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
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(
        max_length=50,
        choices=UserRole.choices,
        default=UserRole.TEACHER
    )
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
    def is_hq_user(self):
        return self.role in [
            UserRole.ACADEMIC_MANAGER,
            UserRole.HEAD_OF_OPS,
            UserRole.DIRECTOR
        ]

    @property
    def is_school_admin(self):
        return self.role in [UserRole.HEADTEACHER, UserRole.DEPUTY_HEAD]

    @property
    def can_mark_attendance(self):
        return self.role in [
            UserRole.TEACHER,
            UserRole.HEADTEACHER,
            UserRole.DEPUTY_HEAD
        ]
```

### 6.2 Custom Permissions

```python
# apps/core/permissions.py

from rest_framework.permissions import BasePermission
from apps.users.models import UserRole

class IsHQUser(BasePermission):
    """Allow access only to HQ users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_hq_user


class IsSchoolAdmin(BasePermission):
    """Allow access to headteachers and deputy heads."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_school_admin or request.user.is_hq_user
        )


class CanAccessStudent(BasePermission):
    """Check if user can access specific student data."""
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # HQ users can access all
        if user.is_hq_user:
            return True
        
        # Must be same school
        if obj.school_id != user.school_id:
            return False
        
        # School admins can access all in their school
        if user.is_school_admin:
            return True
        
        # Teachers can only access assigned students
        if user.role == UserRole.TEACHER:
            return obj.current_stream_id in user.assigned_stream_ids
        
        # Social officers can access all in their school
        if user.role == UserRole.SOCIAL_OFFICER:
            return True
        
        return False
```

---

## 7. API Design

### 7.1 API Endpoint Structure

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login/` | User login |
| POST | `/api/v1/auth/refresh/` | Refresh JWT token |
| GET | `/api/v1/schools/` | List schools (HQ) |
| GET | `/api/v1/schools/{id}/` | School details |
| GET | `/api/v1/students/` | List students |
| POST | `/api/v1/students/` | Create student |
| GET | `/api/v1/students/{id}/folder/` | Digital folder |
| POST | `/api/v1/attendance/bulk/` | Bulk attendance entry |
| GET | `/api/v1/attendance/stats/` | Attendance statistics |
| POST | `/api/v1/marks/` | Enter marks |
| GET | `/api/v1/reports/performance/` | Performance reports |

### 7.2 Sample View Implementation

```python
# apps/students/views.py

from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.core.permissions import CanAccessStudent
from .models import Student
from .serializers import StudentSerializer, StudentFolderSerializer
from .filters import StudentFilter


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [CanAccessStudent]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = StudentFilter
    search_fields = ['first_name', 'last_name', 'admission_no']

    def get_queryset(self):
        # TenantManager automatically filters by school
        return Student.objects.select_related(
            'current_grade', 'current_stream'
        ).order_by('last_name', 'first_name')

    @action(detail=True, methods=['get'])
    def folder(self, request, pk=None):
        """Get complete digital folder for a student."""
        student = self.get_object()
        serializer = StudentFolderSerializer(student)
        return Response(serializer.data)
```

---

## 8. Security Implementation

### 8.1 Security Checklist

- HTTPS enforced via Nginx with TLS 1.2+
- Django CSRF protection enabled
- SQL injection prevented via Django ORM
- XSS prevention with Django templates auto-escaping
- Password hashing with PBKDF2 (Django default) or Argon2
- JWT tokens with short expiry (15 min access, 7 day refresh)
- Rate limiting on authentication endpoints
- Audit logging for all sensitive operations

### 8.2 Django Security Settings

```python
# config/settings/production.py

# Security settings
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 10}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

---

## 9. Deployment Architecture

### 9.1 Infrastructure Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                         LOAD BALANCER                          │
│                      (Nginx / Cloud LB)                        │
└─────────────────────────────┬──────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   App Server 1  │  │   App Server 2  │  │   App Server N  │
│   (Gunicorn)    │  │   (Gunicorn)    │  │   (Gunicorn)    │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │     Redis       │  │  Celery Workers │
│   (Primary +    │  │   (Cache +      │  │  (Background    │
│    Replica)     │  │    Queue)       │  │    Tasks)       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 9.2 Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    env_file:
      - .env.production
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine

  celery:
    build: .
    command: celery -A config worker -l info
    depends_on:
      - db
      - redis

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - static_volume:/app/staticfiles
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - web

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

---

## 10. Development Guidelines

### 10.1 Coding Standards

- Follow PEP 8 for Python code
- Use Black for code formatting
- Use isort for import sorting
- Use flake8 for linting
- Write docstrings for all public methods
- Type hints for function signatures

### 10.2 Testing Requirements

- Minimum 80% code coverage
- Unit tests for all business logic
- Integration tests for API endpoints
- Test tenant isolation thoroughly

### 10.3 Git Workflow

- Main branch: production-ready code
- Develop branch: integration branch
- Feature branches: `feature/SMS-XXX-description`
- Pull requests require code review
- CI/CD pipeline must pass before merge

### 10.4 Environment Setup

```bash
# Local development setup

# 1. Clone repository
git clone https://github.com/org/school-management.git
cd school-management

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac

# 3. Install dependencies
pip install -r requirements/development.txt

# 4. Setup environment variables
cp .env.example .env
# Edit .env with your local settings

# 5. Start services
docker-compose up -d db redis

# 6. Run migrations
python manage.py migrate

# 7. Create superuser
python manage.py createsuperuser

# 8. Load initial data
python manage.py loaddata schools grades subjects

# 9. Run development server
python manage.py runserver
```

---

## Appendix A: Database Index Strategy

| Table | Index Columns | Purpose |
|-------|---------------|---------|
| students | `school_id` | Tenant filtering |
| students | `school_id, current_grade_id` | Class listings |
| attendance | `school_id, date` | Daily reports |
| attendance | `student_id, date` | Student history |
| marks | `student_id, term_id` | Report cards |
| marks | `school_id, subject_id, term_id` | Subject analysis |

## Appendix B: API Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found or wrong tenant |
| 500 | Server Error | Internal server error |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| Solution Architect | | | |
| Project Manager | | | |

---

*End of Document*
