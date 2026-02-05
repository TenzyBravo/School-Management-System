# School Management System

A modern, multi-tenant school management system built with Django REST Framework and React, designed to manage 19 schools with ~19,000 students, 950 teachers, and various administrative staff.

## 🌟 Features

- **Multi-Tenancy**: Logical data isolation per school via `school_id`
- **Role-Based Access Control**: 7 distinct roles (Teacher, Headteacher, Deputy, Social Services Officer, Academic Manager, Head of Operations, Director)
- **Student Management**: Complete digital student folders with biographical data, academic history, and attendance
- **Attendance Tracking**: Daily marking with Present/Absent/Late/Excused status
- **Academic Structure**: Grades, streams, subjects, and teacher assignments
- **JWT Authentication**: Secure token-based authentication with automatic refresh
- **RESTful API**: Full API documentation with Swagger/OpenAPI

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TenzyBravo/School-Management-System.git
   cd School-Management-System
   ```

2. **Backend Setup:**
   ```bash
   cd school_management
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements/base.txt

   # Create .env file
   cp .env.example .env
   # Edit .env with your database credentials

   # Run migrations
   python manage.py migrate

   # Create test users
   python manage.py create_test_users

   # Start server
   python manage.py runserver
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api/v1/
   - API Docs: http://localhost:8000/api/docs/

### Docker Setup

```bash
cd school_management
docker-compose up -d
```

## 📁 Project Structure

```
PERFORMANCE tracker/
├── Documentation/
│   ├── Engineering_Design_Document.md
│   └── PRD_School_Management_System.md
├── school_management/
│   ├── apps/
│   │   ├── core/           # Base models, auth, permissions
│   │   ├── users/          # User management
│   │   ├── schools/        # School/tenant management
│   │   ├── students/       # Student profiles
│   │   ├── academics/      # Grades, subjects, teachers
│   │   ├── attendance/     # Attendance tracking
│   │   ├── assessments/    # Marks & grading (stub)
│   │   ├── welfare/        # Student welfare (stub)
│   │   └── reports/        # Reporting (stub)
│   ├── config/             # Django settings
│   ├── frontend/           # React application
│   │   └── src/
│   │       ├── components/
│   │       ├── context/
│   │       └── lib/
│   └── requirements/
├── DEVELOPMENT_WORKFLOW.md
└── README.md
```

## 🛠️ Tech Stack

**Backend:**
- Django 4.2 LTS
- Django REST Framework 3.14
- PostgreSQL 15
- Celery + Redis
- JWT Authentication
- Docker

**Frontend:**
- React 18.2
- TypeScript 5.2
- Vite 5.0
- Tailwind CSS (configured)

## 🔐 Authentication

The system uses JWT token authentication:

```bash
# Login
POST /api/v1/auth/login/
{
  "username": "teacher1",
  "password": "password123"
}

# Response includes access and refresh tokens
# Access token expires in 15 minutes
# Refresh token expires in 7 days
```

## 📊 Current Modules

### ✅ Implemented

1. **User Authentication & RBAC**
   - JWT login/logout
   - Token refresh
   - Role-based permissions

2. **School Management**
   - CRUD operations (HQ only)
   - Multi-tenant isolation

3. **Student Management**
   - Complete CRUD
   - Unique admission numbers per school
   - Biographical data

4. **Attendance Module**
   - Daily marking interface
   - Date selection
   - Attendance statistics
   - Bulk "Mark All Present"

5. **Academics**
   - Grades and streams
   - Subject management
   - Teacher assignments
   - Academic calendar

### 🚧 In Progress

6. **Frontend UI**
   - Login page
   - Schools list
   - Student management
   - Attendance page
   - Academics page

### 📋 Planned (Next)

7. **Assessments & Marks** (P1)
8. **Report Cards Generation** (P1)
9. **HQ Dashboards** (P1)
10. **Social Services Module** (P1)

See [BACKLOG.md](school_management/BACKLOG.md) for full roadmap.

## 🤝 Contributing

We follow a PR-based workflow. Please read [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) for details on:

- Branching strategy
- Commit message guidelines
- PR process
- Code review checklist

### Creating a Feature

```bash
# Create feature branch
git checkout -b feature/your-module-name

# Make changes and commit
git add .
git commit -m "feat: Add your feature

Detailed description

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push and create PR
git push origin feature/your-module-name
```

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.students

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

## 🚀 Deployment

### Recommended Free Hosting

**Backend:**
- [Render](https://render.com) - Free PostgreSQL + Django hosting
- [Railway](https://railway.app) - $5/month free credit
- [PythonAnywhere](https://www.pythonanywhere.com) - Free tier available

**Frontend:**
- [Vercel](https://vercel.com) - Best for React, unlimited bandwidth
- [Netlify](https://netlify.com) - Similar to Vercel

**Database:**
- [Neon.tech](https://neon.tech) - Up to 10 PostgreSQL instances free
- Included with Render/Railway

See [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) for detailed deployment instructions.

## 📖 API Documentation

Access interactive API documentation:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- OpenAPI Schema: http://localhost:8000/api/schema/

## 🔧 Configuration

Key environment variables (see `.env.example`):

```env
DJANGO_SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/school_db
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

## 📝 License

This project is proprietary software. All rights reserved.

## 🙋 Support

For questions or issues:
- Create an issue on GitHub
- Check [Engineering Design Document](Engineering_Design_Document.md)
- Review [Product Requirements Document](PRD_School_Management_System.md)

## 📈 Roadmap

**MVP (Months 1-3):** ✅ Complete
- User authentication & RBAC
- School management
- Student management
- Attendance tracking
- Basic frontend

**Phase 1 (Months 4-6):** 🎯 Next
- Assessments & marks
- Report cards generation
- HQ dashboards
- Social services module

**Phase 2 (Months 7+):** 📅 Future
- Advanced analytics & early warning system
- PWA with offline capability
- SMS/Email integrations
- Mobile apps

## 🎯 Project Status

**Current Focus:** Transitioning from MVP to Phase 1

**Next Module:** Assessments & Marks (see [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md))

**GitHub Repository:** https://github.com/TenzyBravo/School-Management-System

---

Built with ❤️ for education management
