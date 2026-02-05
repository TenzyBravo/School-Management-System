# Product Requirements Document
## Multi-Tenant School Management System

**Version:** 1.0  
**Date:** January 2025  
**Status:** Draft  
**Technology Stack:** Django Framework + PostgreSQL

---

## Document Information

| Field | Details |
|-------|---------|
| Document Title | Multi-Tenant School Management System PRD |
| Version | 1.0 |
| Date | January 2025 |
| Status | Draft |
| Technology Stack | Django Framework + PostgreSQL |

---

## 1. Executive Summary

This Product Requirements Document outlines the specifications for a comprehensive Multi-Tenant School Management System (SMS) designed to serve 19 schools under a centralized Head Office (HQ). The system will manage approximately 19,000 pupils, 950 teachers, and various administrative staff across all institutions.

The platform enables each school to operate independently while providing HQ with comprehensive oversight, monitoring, and reporting capabilities across the entire educational network. Built on Django and PostgreSQL, the system emphasizes data security, scalability, and offline-first capabilities suitable for the Zambian context.

---

## 2. Vision & Objectives

### 2.1 Product Vision

To create a unified digital platform that streamlines educational administration, enhances pupil tracking, and enables data-driven decision-making across a network of 19 schools while maintaining individual school autonomy.

### 2.2 Key Objectives

- Centralize student data management across 19 schools
- Enable real-time attendance tracking and reporting
- Digitize pupil academic records and performance tracking
- Provide comprehensive analytics for HQ oversight
- Support welfare monitoring through Social Services integration
- Ensure system works reliably in low-connectivity environments

---

## 3. Scale & Capacity Requirements

### 3.1 School Network Overview

| Metric | Per School | Total (19 Schools) |
|--------|------------|-------------------|
| Pupils | ~1,000 | ~19,000 |
| Teachers | ~50 | ~950 |
| Deputy Headteachers | 2 | 38 |
| Headteachers | 1 | 19 |
| Social Services Officers | 6 | 114 |

### 3.2 Head Office Staff

| Role | Count |
|------|-------|
| Academic Managers | 3 |
| Head of Operations (Admin) | 1 |
| Director | 1 |

---

## 4. User Roles & Permissions

### 4.1 School-Level Roles

#### 4.1.1 Teacher
- Mark daily attendance for assigned classes
- Enter marks and grades per subject
- Add remarks on pupil performance
- View only assigned pupils and classes
- Cannot access data from other classes or schools

#### 4.1.2 Headteacher / Deputy Headteacher
- Full view access to all school data
- Approve and review reports
- Track teacher performance and workload
- Manage class and teacher assignments
- View attendance statistics and alerts

#### 4.1.3 Social Services Officer
- Access pupil welfare records
- View attendance patterns and alerts
- Add intervention notes and follow-ups
- Track at-risk pupils
- Cannot modify academic records

### 4.2 Head Office Roles

#### 4.2.1 Academic Manager
- View performance data across all 19 schools
- Compare schools, grades, and subjects
- Generate cross-school analytics reports
- Identify trends and areas for improvement

#### 4.2.2 Head of Operations (Admin)
- User account management (create, modify, deactivate)
- School setup and configuration
- System configuration and settings
- Role and permission management
- Audit log access

#### 4.2.3 Director
- Executive dashboard access
- High-level reports and KPIs
- Read-only access to all data
- Strategic overview capabilities

---

## 5. Core Functional Modules

### 5.1 School Management Module

**Purpose:** Manage organizational structure and academic configuration.

- School profiles (19 schools with unique identifiers)
- Class management (grades/forms and streams)
- Subject configuration per grade level
- Academic year and term management
- Teacher-to-class/subject assignments

### 5.2 User & Access Control Module

**Purpose:** Secure authentication and role-based access control.

- Secure login with password policies
- Role-Based Access Control (RBAC)
- Multi-tenant isolation (school_id filtering)
- Session management and timeout
- Audit logging for all sensitive operations

### 5.3 Pupil Digital Folder Module

**Purpose:** Comprehensive digital record for each pupil - the core data asset.

- Biographical data (name, DOB, admission number, guardian info)
- Complete attendance history
- Academic performance (per subject, per term, per year)
- Teacher remarks and assessments
- Social services notes and interventions
- Promotion/retention history
- Medical/health notes (optional)

### 5.4 Attendance Module

**Purpose:** Track and analyze pupil attendance patterns.

- Daily attendance marking by teachers
- Status options: Present, Absent, Late, Excused
- Automatic attendance statistics calculation
- Chronic absence alerts (configurable threshold)
- Attendance trends and heatmaps
- HQ aggregated attendance reporting

### 5.5 Assessment & Marks Module

**Purpose:** Manage academic assessments and track performance.

- Subject-based grading
- Continuous assessment (CA) tracking
- End-of-term examinations
- Configurable grading scales per school
- Longitudinal tracking (progress across years)
- Report card generation

### 5.6 Reporting & Analytics Module

**Purpose:** Provide actionable insights for decision-making.

- School performance comparisons
- Teacher workload and marking completion tracking
- Attendance heatmaps and trends
- Early warning system for at-risk pupils
- Exportable reports (PDF, Excel)
- Executive dashboards for Director

---

## 6. Multi-Tenancy Architecture

### 6.1 Chosen Approach

**Single Database + Tenant ID** - All schools share one database with logical separation via `school_id` foreign key on all tenant-scoped tables.

### 6.2 Benefits

- Logical separation per school while maintaining unified data
- Easy cross-school reporting and analytics
- Lower infrastructure costs
- Simplified maintenance and updates
- Easier backup and disaster recovery

### 6.3 Security Requirements

- Every database query MUST filter by `school_id`
- HQ users have special permissions to bypass school restrictions
- Teachers cannot access other classes or schools
- Middleware enforces tenant isolation at application level
- Comprehensive audit logging

---

## 7. Non-Functional Requirements

### 7.1 Performance

- Page load time < 3 seconds on 3G connection
- Support 500+ concurrent users
- Database queries optimized with proper indexing

### 7.2 Availability

- 99.5% uptime during school hours
- Scheduled maintenance windows outside peak hours

### 7.3 Offline & Low Connectivity (Zambia Context)

- Mobile-responsive design
- Auto-save drafts during data entry
- Graceful handling of connection interruptions
- Future: Progressive Web App with offline attendance

### 7.4 Security

- HTTPS encryption for all traffic
- Password hashing with bcrypt/Argon2
- Session-based authentication with CSRF protection
- Regular security audits
- Data backup with encryption

---

## 8. Implementation Roadmap

### Phase 1: MVP (Months 1-3)

**Goal:** Core functionality for daily school operations.

- User authentication and role-based access
- School setup and configuration
- Student and class management
- Daily attendance tracking
- Basic marks entry

### Phase 2: Enhanced Features (Months 4-6)

**Goal:** Comprehensive reporting and pupil management.

- Full pupil digital folder implementation
- Report card generation
- HQ dashboards and cross-school reports
- Social services module

### Phase 3: Advanced Analytics (Months 7-9)

**Goal:** Predictive insights and mobile accessibility.

- Advanced analytics and trend analysis
- Early warning system for at-risk pupils
- Automated alerts and notifications
- Mobile app (optional) / PWA with offline support

---

## 9. Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Daily attendance marking rate | >95% | Month 4 |
| Teacher adoption rate | >90% | Month 6 |
| Marks entry completion | >98% | Each term |
| System uptime | >99.5% | Ongoing |
| User satisfaction score | >4/5 | Quarterly |

---

## 10. Appendix

### 10.1 Glossary

| Term | Definition |
|------|------------|
| SMS | School Management System |
| HQ | Head Office - Central administrative authority |
| RBAC | Role-Based Access Control |
| Tenant | Individual school in the multi-tenant system |
| CA | Continuous Assessment |
| PWA | Progressive Web Application |

### 10.2 Document Approval

| Role | Name | Date |
|------|------|------|
| Product Owner | | |
| Technical Lead | | |
| Director | | |

---

*End of Document*
