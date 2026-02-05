# Development Workflow

This document outlines our PR-based development process for the School Management System.

## Branching Strategy

### Main Branches
- **`main`**: Production-ready code, always deployable
- **`develop`**: Integration branch for features (optional)

### Feature Branches
- Create feature branches from `main`
- Naming convention: `feature/module-name` or `feature/issue-number-description`
- Examples:
  - `feature/assessments-module`
  - `feature/reports-generation`
  - `feature/social-services`

### Bug Fix Branches
- Naming convention: `fix/bug-description`
- Examples:
  - `fix/attendance-date-filter`
  - `fix/student-duplicate-admission`

## Workflow Steps

### 1. Starting New Work

```bash
# Make sure you're on main and up to date
git checkout main
git pull origin main

# Create a new feature branch
git checkout -b feature/assessments-module
```

### 2. During Development

```bash
# Make your changes, then commit frequently
git add .
git commit -m "Add assessment model and serializers

- Create Assessment model with grade fields
- Add serializers for API endpoints
- Include unit tests for model validation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push your branch regularly
git push -u origin feature/assessments-module
```

### 3. Creating a Pull Request

When your feature is ready:

1. **Push final changes:**
   ```bash
   git push origin feature/assessments-module
   ```

2. **Create PR on GitHub:**
   - Go to https://github.com/TenzyBravo/School-Management-System
   - Click "Pull requests" → "New pull request"
   - Select your feature branch
   - Fill in the PR template:

   ```markdown
   ## Summary
   Brief description of what this PR does

   ## Changes
   - List of key changes
   - What files were modified
   - New features added

   ## Testing
   - [ ] Manual testing completed
   - [ ] All existing tests pass
   - [ ] New tests added (if applicable)

   ## Screenshots (if UI changes)
   [Add screenshots here]

   ## Related Issues
   Closes #issue-number (if applicable)
   ```

3. **Request review** (if working with a team)

### 4. After PR Approval

```bash
# Merge via GitHub interface (use "Squash and merge" for clean history)
# Then update your local main
git checkout main
git pull origin main

# Delete the feature branch locally
git branch -d feature/assessments-module

# Delete remote branch (done automatically by GitHub)
```

## Module Development Order

Based on BACKLOG.md, work on modules in this order:

### P0 (MVP) - Current Phase
1. ✅ User Authentication & RBAC
2. ✅ School Management
3. ✅ Student Management
4. ✅ Attendance Module
5. ⏳ Basic Frontend (Students, Academics, Attendance pages)

### P1 (Enhanced Features) - Next
1. 📋 Assessments & Marks Module
   - Branch: `feature/assessments-module`
   - PR: Assessment models, API, UI

2. 📊 Report Cards Generation
   - Branch: `feature/report-cards`
   - PR: Report generation logic and PDF export

3. 🎯 HQ Dashboards
   - Branch: `feature/hq-dashboards`
   - PR: Cross-school analytics

4. 💙 Social Services Module
   - Branch: `feature/social-services`
   - PR: Student notes, follow-ups, welfare tracking

### P2 (Advanced) - Future
1. 📈 Advanced Analytics
2. 📱 PWA / Offline Support
3. 📧 Integrations (SMS, Email)

## Commit Message Guidelines

Good commit messages help track progress:

```bash
# Format:
<type>: <subject>

<body>

<footer>

# Types:
# feat: New feature
# fix: Bug fix
# docs: Documentation changes
# style: Code formatting
# refactor: Code restructuring
# test: Adding tests
# chore: Maintenance tasks

# Example:
feat: Add attendance statistics dashboard

- Display daily attendance summary with charts
- Show present/absent/late/excused counts
- Add date range filter for historical view
- Include export to Excel functionality

Closes #15

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Code Review Checklist

Before creating a PR, ensure:

- [ ] Code follows Django/React best practices
- [ ] No sensitive data (secrets, API keys) committed
- [ ] Tests added for new functionality
- [ ] Documentation updated (if needed)
- [ ] No console.log or debug statements left
- [ ] Code is formatted properly
- [ ] All existing tests still pass
- [ ] Multi-tenancy respected (school_id filtering)
- [ ] Proper error handling implemented
- [ ] API endpoints documented in Swagger

## Running Tests Before PR

```bash
# Backend tests
cd school_management
python manage.py test

# Frontend tests (when added)
cd frontend
npm test

# Check for security issues
pip-audit
```

## Deployment Process

### Automatic Deployment (Future Setup)
- PRs merged to `main` trigger CI/CD
- Automated tests run
- Deploy to staging environment
- Manual approval for production

### Manual Deployment (Current)
Will be set up with chosen hosting provider (Render/Railway/Vercel)

## Questions?

For issues or questions about the workflow, create an issue on GitHub or update this document via PR.
