# Prioritized Backlog (MVP -> Next)

This backlog is derived from the PRD and Engineering Design Document. Items are ordered by priority for an MVP and subsequent phases.

## Priority: P0 (MVP - Months 1-3)

1. User Authentication & RBAC
   - Implement JWT login, roles (Teacher, Headteacher, HQ roles)
   - Acceptance: Users can login and receive access/refresh tokens; role claims present in token.

2. School Management (Tenant)
   - CRUD for schools (HQ only)
   - Acceptance: HQ can create schools; schools list accessible to HQ.

3. Student Management
   - CRUD students, unique admission numbers per school
   - Acceptance: Teachers/Headteachers can create and view students scoped to their school.

4. Attendance
   - Daily marking (Present, Absent, Late, Excused)
   - Acceptance: Teachers can mark attendance for their assigned classes; records stored with school scope.

5. Basic Frontend (Dev GUI)
   - Minimal React app to login, list schools, view students
   - Acceptance: Login and schools list pages working against local API.

## Priority: P1 (Enhanced features - Months 4-6)

1. Assessments & Marks
2. Report cards generation
3. HQ dashboards (cross-school analytics)
4. Social Services module (student notes, follow-ups)

## Priority: P2 (Advanced - Months 7+)

1. Advanced analytics & early warning system
2. PWA / offline-capable frontend
3. Integrations (SMS, Email notifications)

## Non-functional & Dev Tasks
- CI/CD pipeline (tests, pip-audit) — done
- Pre-commit hooks & secret scanning — done
- Security: rotate secrets and remove any leaked keys from history

## Next immediate tasks (this sprint)
1. Frontend scaffold (Vite + React + TypeScript) and Schools list page. (In progress)
2. Student list page in frontend and JWT auth flow. (In progress)
3. Implement Attendance endpoints and basic UI. (next)
