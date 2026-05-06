# Full Project Report - EduFlow B2B LMS SaaS

Project path: `C:\Users\GRATI\Desktop\pfa`  
Report date: 2026-05-06  
Scope: Spring Boot backend, Angular frontend, Docker/monitoring/CI, SaaS workflows, deployment readiness.

> Security note: this report intentionally documents environment variable names only. It does not include passwords, SMTP secrets, JWT secrets, database passwords, or object storage credentials.

---

## 1. Executive Summary

EduFlow is a B2B SaaS Learning Management System designed for companies, trainers, team managers, and learners. The project is organized as a monorepo with:

- `backend/`: Spring Boot 3 API.
- `frontend/`: Angular web application.
- `monitoring/`: Prometheus and Grafana configuration.
- `docker-compose.yml`: local production-like infrastructure.
- `.github/`: GitHub Actions CI/CD workflow.

The backend is advanced and production-oriented: JWT authentication, refresh token rotation, role-based authorization, tenant-aware company isolation, Flyway migrations, PostgreSQL, Redis, email, file storage abstraction, S3/MinIO readiness, audit events, rate limiting, OpenAPI, Actuator, Prometheus metrics, Docker, and tests.

The frontend is a modern Angular SaaS interface with role-aware routing, reusable UI components, auth guards, interceptors, backend-ready DTOs/services, and a professional design system. However, the current frontend production build fails because of a template syntax issue in the assignments page. This is the main blocking issue before deployment.

Overall readiness score: **71/100**.

---

## 2. Project Overview

### Purpose

The product is a multi-role B2B LMS SaaS platform where trainers publish trainings, companies organize employees into teams, company admins assign trainings, learners complete courses/quizzes, and certificates are generated after completion and approval.

### Business Idea

The application targets companies that need structured employee training, compliance learning, professional development, and certification workflows. Trainers provide course content while companies consume and assign that content to their internal learners.

### Target Users

- `SUPER_ADMIN`: platform operator.
- `TRAINER`: creates and manages training content.
- `COMPANY_ADMIN`: manages company, employees, teams, assignments.
- `TEAM_MANAGER`: manages a specific team and team progress.
- `LEARNER`: consumes assigned trainings and receives certificates.

### SaaS Concept

The backend uses shared PostgreSQL tables with tenant isolation through `company_id` where applicable. Trainers create global platform content, while company-specific data such as teams, members, assignments, progress, and company users are scoped to the tenant company.

### Main Technologies

Backend:

- Java 17
- Spring Boot 3.3.6
- Spring Security
- JWT and refresh tokens
- Spring Data JPA / Hibernate
- PostgreSQL
- Redis
- Flyway
- MapStruct
- Lombok
- Bean Validation
- Spring Mail
- Bucket4j
- Spring Boot Actuator
- Micrometer Prometheus
- AWS SDK S3-compatible storage
- Docker
- JUnit 5 / Mockito / Spring Boot Test / Testcontainers

Frontend:

- Angular 21.1.x
- TypeScript 5.9.x
- SCSS design system
- RxJS
- Angular routing, guards, interceptors
- Vitest / jsdom

DevOps:

- Docker Compose
- PostgreSQL
- Redis
- Mailhog
- MinIO
- Prometheus
- Grafana
- GitHub Actions

---

## 3. Monorepo Structure

```text
C:\Users\GRATI\Desktop\pfa
|-- backend
|   |-- src/main/java/com/example/lms
|   |-- src/main/resources
|   |-- src/test/java/com/example/lms
|   |-- pom.xml
|   |-- mvnw.cmd
|   |-- Dockerfile
|   `-- README.md
|-- frontend
|   |-- src/app
|   |-- src/environments
|   |-- package.json
|   `-- angular.json
|-- monitoring
|   |-- prometheus.yml
|   `-- grafana
|-- .github/workflows/ci.yml
|-- docker-compose.yml
|-- .env.example
`-- FULL_PROJECT_REPORT.md
```

---

## 4. Architecture Report

### Backend Architecture

The backend follows a modular package architecture under `com.example.lms`. Each business area is separated into its own module, generally containing controllers, services, repositories, entities, DTOs, and mappers.

Main backend modules:

- `auth`
- `users`
- `companies`
- `teams`
- `trainings`
- `lessons`
- `quizzes`
- `assignments`
- `progress`
- `certificates`
- `billing`
- `notifications`
- `files`
- `audit`
- `security`
- `config`
- `common`

The architecture is service-oriented within a monolith. It is not a microservices architecture, which is appropriate for a production MVP because it keeps the system simpler to deploy and maintain.

### Frontend Architecture

The frontend is a standalone Angular application using:

- role-aware routing
- auth guards
- role guards
- HTTP interceptor for JWT
- reusable UI components
- shared DTO models
- backend-ready API services
- SCSS design tokens
- app shell layout for authenticated users
- auth layout for login/register/password flows
- public layout for the landing page

### Communication Between Angular and Spring Boot

Angular communicates with Spring Boot through REST APIs under:

```text
http://localhost:8080/api/v1
```

The frontend stores access and refresh tokens in local storage, attaches the access token through the auth interceptor, and attempts refresh-token recovery on `401` responses.

### Docker Architecture

The Docker Compose stack contains:

- PostgreSQL database
- Redis cache/rate-limit backing service
- Mailhog for local email testing
- MinIO for S3-compatible object storage
- Spring Boot API container
- Prometheus
- Grafana

The API container builds from `./backend`.

### Monitoring Architecture

Monitoring is prepared through:

- Spring Boot Actuator
- `/actuator/health`
- `/actuator/prometheus`
- Prometheus scrape configuration
- Grafana datasource and dashboard provisioning

### CI/CD Architecture

GitHub Actions contains two main jobs:

- Backend job:
  - Java 17 setup
  - Maven verify
  - Docker image build
  - optional GHCR push on push events

- Frontend job:
  - Node 22 setup
  - `npm ci`
  - tests
  - production build

---

## 5. Backend Report

### Backend Version and Dependencies

- Spring Boot: `3.3.6`
- Java: `17`
- Build tool: Maven with Maven Wrapper
- Database: PostgreSQL
- Migration tool: Flyway
- Cache/rate limit infrastructure: Redis
- API documentation: Springdoc OpenAPI
- Logging: SLF4J with structured logging support
- Metrics: Micrometer Prometheus
- Object storage: local and S3-compatible abstractions

### Backend Code Inventory

Observed code inventory:

- Controllers: 16
- Services: 28
- Repositories: 25
- Entities: 39
- DTO files: 58
- Mappers: 14

### Environment Configurations

Backend resource configuration includes:

- `application.yml`
- environment-driven database configuration
- JWT expiration/secret configuration
- Redis configuration
- mail configuration
- file storage configuration
- Actuator and Prometheus configuration
- CORS configuration

Required environment variable categories:

- Database: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- JWT: `JWT_SECRET`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`
- CORS: `CORS_ALLOWED_ORIGINS`
- Frontend URL: `FRONTEND_BASE_URL`
- Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- Mail: `MAIL_ENABLED`, `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_AUTH`, `SMTP_STARTTLS`
- File storage: `FILE_STORAGE_PROVIDER`, local path variables, S3/MinIO variables
- Monitoring/error tracking: `SENTRY_DSN`

---

## 6. Backend Modules

### 6.1 Auth Module

Purpose:

Handles registration, login, refresh tokens, logout, password reset, email verification, invitation acceptance, and trainer registration.

Main responsibilities:

- Company admin registration.
- Trainer application registration.
- Login with account status checks.
- Failed-login tracking.
- Account lock after multiple failed attempts.
- Refresh token rotation.
- Logout and token invalidation.
- Email verification.
- Password reset by secure email code.
- Invitation acceptance.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Register company and company admin | Implemented |
| POST | `/api/v1/auth/register-trainer` | Public | Submit trainer application | Implemented |
| POST | `/api/v1/auth/login` | Public | Authenticate user | Implemented |
| POST | `/api/v1/auth/refresh-token` | Public | Rotate refresh token | Implemented |
| POST | `/api/v1/auth/logout` | Authenticated | Revoke active tokens | Implemented |
| POST | `/api/v1/auth/forgot-password` | Public | Send reset code | Implemented |
| POST | `/api/v1/auth/reset-password` | Public | Reset password with code | Implemented |
| POST | `/api/v1/auth/verify-email` | Public | Verify email token/code | Implemented |
| POST | `/api/v1/auth/resend-verification` | Public | Resend email verification | Implemented |
| POST | `/api/v1/auth/accept-invitation` | Public | Activate invited member | Implemented |
| GET | `/api/v1/auth/me` | Authenticated | Return current user | Implemented |

Important security logic:

- BCrypt password hashing.
- JWT access tokens.
- DB-backed refresh tokens stored as hashes.
- Refresh token rotation and reuse protection.
- `tokenVersion` logout invalidation.
- Generic forgot-password response to reduce account enumeration.
- Trainer cannot login until approved.

### 6.2 Users Module

Purpose:

Manages user profiles, company users, profile updates, and password change flows.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/v1/users/me` | Authenticated | Current user profile | Implemented |
| GET | `/api/v1/users` | SUPER_ADMIN, COMPANY_ADMIN, TEAM_MANAGER | List users with tenant/role scope | Implemented |
| POST | `/api/v1/users` | SUPER_ADMIN, COMPANY_ADMIN | Create user | Implemented |
| PUT | `/api/v1/users/me` | Authenticated | Update own profile | Implemented |
| POST | `/api/v1/users/change-password/code` | Authenticated | Send change-password code | Implemented |
| PUT | `/api/v1/users/change-password` | Authenticated | Change password | Implemented |

Business logic:

- Company admins can manage company users.
- Team managers have limited user visibility.
- Password change uses SMTP code flow.
- DTOs prevent direct entity exposure.

### 6.3 Trainers Module

Purpose:

Handles trainer profile, trainer approval, trainer workspace, learner approvals, wallet overview, and trainer applications.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/v1/trainers/{id}` | Authenticated | Public trainer profile | Implemented |
| PUT | `/api/v1/trainers/profile` | TRAINER | Update trainer profile | Implemented |
| GET | `/api/v1/trainers/me/learners` | TRAINER | Learners assigned to trainer content | Implemented |
| GET | `/api/v1/trainers/me/approvals` | TRAINER | Pending learner approvals | Implemented |
| GET | `/api/v1/trainers/me/wallet` | TRAINER | Trainer wallet/earnings view | Implemented |
| GET | `/api/v1/admin/trainers/pending` | SUPER_ADMIN | Pending trainer profiles | Implemented |
| GET | `/api/v1/admin/trainers/applications` | SUPER_ADMIN | Trainer applications | Implemented |
| PATCH | `/api/v1/admin/trainers/{trainerId}/approve` | SUPER_ADMIN | Approve trainer | Implemented |
| PATCH | `/api/v1/admin/trainers/{trainerId}/reject` | SUPER_ADMIN | Reject trainer | Implemented |

Business logic:

- Trainers register as pending.
- Super admin approves or rejects.
- Approval/rejection emails are sent when mail is enabled.
- Approved trainers can create and publish trainings.

### 6.4 Companies Module

Purpose:

Manages company tenant records and company profile data.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/v1/companies` | SUPER_ADMIN | Create company | Implemented |
| GET | `/api/v1/companies` | SUPER_ADMIN | List companies | Implemented |
| GET | `/api/v1/companies/me` | COMPANY_ADMIN | Current company | Implemented |
| PUT | `/api/v1/companies/{id}` | SUPER_ADMIN or owning COMPANY_ADMIN | Update company | Implemented |

Business logic:

- Company data is tenant-scoped.
- Company admins can update only their own company.
- Company creation is also part of public registration.

### 6.5 Teams Module

Purpose:

Manages teams and team membership inside a company tenant.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/v1/teams` | COMPANY_ADMIN, TEAM_MANAGER, SUPER_ADMIN | Create team | Implemented |
| GET | `/api/v1/teams` | Authenticated scoped roles | List tenant teams | Implemented |
| GET | `/api/v1/teams/{id}` | Tenant authorized | Team details | Implemented |
| PUT | `/api/v1/teams/{id}` | Tenant authorized | Update team | Implemented |
| DELETE | `/api/v1/teams/{id}` | Tenant authorized | Delete team | Implemented |
| POST | `/api/v1/teams/{id}/members` | Tenant authorized | Add team member | Implemented |
| DELETE | `/api/v1/teams/{id}/members/{memberId}` | Tenant authorized | Remove team member | Implemented |

Business logic:

- Duplicate team names are blocked within the same company.
- Team managers have ownership-limited access.
- Team membership uses `company_id` to prevent cross-company membership.

### 6.6 Trainings Module

Purpose:

Manages trainer-owned training content.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/v1/trainings` | TRAINER, SUPER_ADMIN | Create training | Implemented |
| GET | `/api/v1/trainings` | Authenticated | List/search trainings | Implemented |
| GET | `/api/v1/trainings/{id}` | Authenticated | Training details | Implemented |
| GET | `/api/v1/trainings/{id}/lessons` | Authenticated | Training lesson list | Implemented |
| GET | `/api/v1/trainings/{id}/learners` | TRAINER owner, SUPER_ADMIN | Learners for a training | Implemented |
| PUT | `/api/v1/trainings/{id}` | Owner or SUPER_ADMIN | Update training | Implemented |
| DELETE | `/api/v1/trainings/{id}` | Owner or SUPER_ADMIN | Delete training | Implemented |
| PATCH | `/api/v1/trainings/{id}/publish` | Owner or SUPER_ADMIN | Publish training | Implemented |
| PATCH | `/api/v1/trainings/{id}/archive` | Owner or SUPER_ADMIN | Archive training | Implemented |
| POST | `/api/v1/trainings/{id}/lessons` | Owner or SUPER_ADMIN | Add lesson | Implemented |

Business logic:

- Trainers own their content.
- Only published trainings should be assignable.
- Training search supports filters such as category, level, trainer, and status.

### 6.7 Lessons Module

Purpose:

Manages lessons and lesson resources.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| PUT | `/api/v1/lessons/{id}` | Training owner or SUPER_ADMIN | Update lesson | Implemented |
| DELETE | `/api/v1/lessons/{id}` | Training owner or SUPER_ADMIN | Delete lesson | Implemented |
| POST | `/api/v1/lessons/{id}/quiz` | Training owner or SUPER_ADMIN | Create quiz for lesson | Implemented |
| GET | `/api/v1/lessons/{id}/quiz` | Authenticated | Get lesson quiz | Implemented |
| POST | `/api/v1/lessons/{lessonId}/resources` | Training owner or SUPER_ADMIN | Upload lesson resource | Implemented |
| GET | `/api/v1/lessons/{lessonId}/resources` | Authenticated | List lesson resources | Implemented |
| DELETE | `/api/v1/lesson-resources/{id}` | Training owner or SUPER_ADMIN | Delete resource | Implemented |

### 6.8 Quizzes Module

Purpose:

Manages quizzes, questions, answer options, quiz publishing, and quiz submission.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| PUT | `/api/v1/quizzes/{id}` | Training owner or SUPER_ADMIN | Update quiz | Implemented |
| DELETE | `/api/v1/quizzes/{id}` | Training owner or SUPER_ADMIN | Delete quiz | Implemented |
| PATCH | `/api/v1/quizzes/{id}/publish` | Training owner or SUPER_ADMIN | Publish quiz | Implemented |
| PATCH | `/api/v1/quizzes/{id}/unpublish` | Training owner or SUPER_ADMIN | Unpublish quiz | Implemented |
| POST | `/api/v1/quizzes/{id}/submit` | LEARNER | Submit quiz answers | Implemented |

Business logic:

- Quiz scoring is automatic.
- Quiz answer validity is checked.
- Attempts are recorded.
- Passed quiz can trigger notification and progress update.

### 6.9 Assignments Module

Purpose:

Assigns trainings to companies, teams, or learners.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/v1/assignments` | SUPER_ADMIN, COMPANY_ADMIN, TEAM_MANAGER | Create assignment | Implemented |
| POST | `/api/v1/assignments/bulk` | SUPER_ADMIN, COMPANY_ADMIN, TEAM_MANAGER | Create multiple assignments | Implemented |
| GET | `/api/v1/assignments/my` | Authenticated | Current user's assignments | Implemented |

Business logic:

- Assignment target can be company, team, or learner.
- Company admins can assign within their company.
- Team managers are constrained by permissions/ownership.
- Duplicate assignments should be handled with validation.
- Assignment creates or connects progress records for learners.

### 6.10 Progress Module

Purpose:

Tracks learner progress, lesson completion, quiz attempts, and trainer approval.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/v1/progress/my` | Authenticated | Current learner progress | Implemented |
| POST | `/api/v1/lessons/{id}/complete` | LEARNER | Mark lesson completed | Implemented |
| POST | `/api/v1/quizzes/{id}/submit` | LEARNER | Submit quiz | Implemented |
| PATCH | `/api/v1/progress/{id}/approve` | TRAINER, SUPER_ADMIN | Approve completion | Implemented |
| PATCH | `/api/v1/progress/{id}/reject` | TRAINER, SUPER_ADMIN | Reject completion | Implemented |

Note:

The controller uses absolute endpoint mappings instead of a class-level `/api/v1/progress` mapping. This works, but it is less maintainable than the rest of the project's controller style.

### 6.11 Certificates Module

Purpose:

Generates, stores, verifies, lists, and downloads learner certificates.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/v1/certificates/generate/{progressId}` | TRAINER, SUPER_ADMIN | Generate certificate | Implemented |
| GET | `/api/v1/certificates/my` | Authenticated | List my certificates | Implemented |
| GET | `/api/v1/certificates/verify/{code}` | Public | Verify certificate authenticity | Implemented |
| GET | `/api/v1/certificates/{id}/download` | Certificate owner/authorized | Download certificate | Implemented |

Business logic:

- Certificate is generated after completion and approval.
- Verification code is public-safe.
- Generated PDFs go through the file storage abstraction.

### 6.12 Notifications Module

Purpose:

Creates in-app notifications for user actions and system events.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/v1/notifications` | Authenticated | List notifications | Implemented |
| PATCH | `/api/v1/notifications/{id}/read` | Owner | Mark one notification read | Implemented |
| PATCH | `/api/v1/notifications/read-all` | Authenticated | Mark all notifications read | Implemented |

Events supported:

- invitation created
- training assigned
- quiz passed
- certificate issued
- approval required
- password reset
- trainer application events

### 6.13 Files Module

Purpose:

Handles file upload/download through a storage abstraction.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/v1/files/upload` | Authenticated | Upload validated file | Implemented |
| GET | `/api/v1/files/{id}` | Owner/SUPER_ADMIN | Download file | Implemented |
| GET | `/api/v1/files/{id}/signed-url` | Owner/SUPER_ADMIN | Generate signed URL | Implemented |

Supported storage:

- Local filesystem.
- S3-compatible storage.
- MinIO-compatible local cloud storage.

### 6.14 Billing Module

Purpose:

Prepares subscription and plan structure for future billing.

Main endpoints:

| Method | URL | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/v1/billing/plans` | Authenticated | List subscription plans | Implemented |
| GET | `/api/v1/billing/subscription/me` | COMPANY_ADMIN | Current company subscription | Implemented |

Status:

- Structurally ready.
- No real payment processor implemented.
- This is appropriate because no paid third-party service should be added without explicit approval.

### 6.15 Audit Module

Purpose:

Tracks important user/system actions.

Audited actions include:

- login attempts
- user creation
- training creation
- certificate generation
- trainer approval/rejection
- other security-sensitive events

The audit table exists and is indexed for actor and action lookup.

### 6.16 Common Module

Purpose:

Provides reusable API infrastructure:

- `ApiResponse<T>`
- `PageResponse<T>`
- global exceptions
- validation helpers
- tenant context
- common enums
- auditing base classes

---

## 7. Frontend Report

### Angular Version and Structure

- Angular: `21.1.x`
- TypeScript: `5.9.x`
- Testing: Vitest + jsdom
- Styling: SCSS tokens and global design system
- API base URL: `http://localhost:8080/api/v1`

Main frontend structure:

```text
frontend/src/app
|-- core
|   |-- guards
|   |-- interceptors
|   |-- models
|   |-- services
|-- features
|   |-- admin
|   |-- assignments
|   |-- auth
|   |-- certificates
|   |-- companies
|   |-- dashboard
|   |-- notifications
|   |-- profile
|   |-- progress
|   |-- public
|   |-- teams
|   |-- trainings
|-- layouts
|-- shared
`-- app.routes.ts
```

### Routes

Public:

- `/`

Authentication:

- `/auth/login`
- `/auth/register`
- `/auth/trainer-pending`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/verify-email`
- `/auth/accept-invitation`

Protected:

- `/dashboard`
- `/trainings`
- `/trainings/create`
- `/trainings/:id`
- `/company`
- `/teams`
- `/teams/:id`
- `/assignments`
- `/progress`
- `/notifications`
- `/users`
- `/admin/trainers/pending`
- `/certificates`
- `/profile`

### Layouts

- `public-layout`: public landing page.
- `auth-layout`: login, register, reset password, verification, invitation.
- `app-shell`: authenticated workspace.
- `sidebar`: role-aware navigation.
- `topbar`: search/user/menu actions.

### Shared Components

Reusable UI components include:

- badge
- button
- data table
- empty state
- entity combobox
- form field
- modal
- page header
- progress bar
- select
- skeleton
- spinner
- stat card
- textarea
- toast

### Frontend Services

| Service | Purpose | Status |
|---|---|---|
| `AuthService` | Login, register, trainer application, reset password, verification, invitation, current user | Implemented |
| `UserService` | Profile, users list, company members, password change | Implemented |
| `CompanyService` | Current company, companies list, create/update | Implemented |
| `TeamService` | Teams, details, add/remove members | Implemented |
| `TrainingService` | List/search/create/update/publish/archive trainings | Implemented |
| `LessonService` | Lessons, completion, resources | Implemented |
| `QuizService` | Quizzes, publish/unpublish/submit | Implemented |
| `AssignmentService` | Create/bulk/list assignments | Implemented |
| `ProgressService` | My progress, lesson complete, quiz submit, approve/reject | Implemented |
| `CertificateService` | List, verify, generate, download | Implemented |
| `NotificationService` | List/read notifications | Implemented |
| `FileUploadService` | Upload avatar/logo/thumbnail/resources | Implemented |
| `TrainerService` | Trainer profile, approvals, applications, wallet | Implemented |

### Guards and Interceptors

- `authGuard`: protects authenticated routes.
- `guestGuard`: redirects authenticated users away from login/register.
- `roleGuard`: enforces role-based route access.
- `authInterceptor`: attaches `Authorization: Bearer <token>`.
- Refresh handling: on `401`, attempts refresh token flow and retries the request.

### DTO Models

The frontend contains backend-oriented models for:

- `ApiResponse<T>`
- `PageResponse<T>`
- auth responses
- users
- companies
- teams
- trainings
- lessons
- quizzes
- assignments
- progress
- certificates
- notifications

### Design System

The SCSS system defines:

- color tokens
- typography
- spacing
- radius
- shadows
- cards
- buttons
- inputs
- tables
- badges
- loading states
- empty states
- responsive grids

The UI uses Material Symbols-style icons and a clean B2B SaaS visual direction.

### Responsive Strategy

- Desktop uses sidebar + main content.
- Tablet/mobile collapse grids.
- Sidebar becomes an overlay drawer under approximately 960px.
- Forms and filter bars stack on small screens.

### Frontend Issues Found

Critical:

- Production build currently fails in `frontend/src/app/features/assignments/assignments.page.ts` because of an Angular template block syntax error around an extra `} @else {`.

Medium:

- Some unused imports/components are reported in the assignments page.
- No separate production environment file was observed.
- Only one frontend unit test exists.
- Token storage uses localStorage, which is easy to implement but has XSS exposure risk.

---

## 8. User Roles and Permissions

### SUPER_ADMIN

Available pages:

- dashboard
- trainings
- users
- companies/company area
- admin trainer applications
- notifications
- certificates
- profile

Allowed actions:

- approve/reject trainers
- manage users
- list companies
- create/update companies
- manage platform content
- access global data where allowed
- generate certificates

Forbidden actions:

- should not bypass business rules that belong to tenant workflows unless explicitly designed.

Main workflow:

`Login -> Monitor platform -> Review trainer applications -> Approve/reject -> Manage users/companies -> Review activity`

### TRAINER

Available pages:

- dashboard
- trainings
- create training
- training details
- progress/approvals
- notifications
- certificates
- profile

Allowed actions:

- create trainings
- add lessons/resources
- create quizzes
- publish/archive own trainings
- view learners assigned to own trainings
- approve/reject learner progress
- trigger certificate generation
- update trainer profile

Forbidden actions:

- cannot manage company teams.
- cannot access other trainers' private content as owner.
- cannot approve own account.

Main workflow:

`Apply -> Wait approval -> Login -> Create content -> Publish -> Monitor learners -> Approve completion -> Certificates`

### COMPANY_ADMIN

Available pages:

- dashboard
- company workspace
- teams
- users
- assignments
- trainings
- progress
- notifications
- certificates
- profile

Allowed actions:

- manage own company profile
- create/update/delete teams
- invite or create members
- assign trainings to company/team/learner
- view company progress
- manage company users

Forbidden actions:

- cannot access other companies' users, teams, assignments, or progress.
- cannot approve trainers.
- cannot update trainer-owned training content unless explicitly allowed.

Main workflow:

`Register company -> Verify email -> Login -> Create teams/users -> Explore trainings -> Assign -> Track progress`

### TEAM_MANAGER

Available pages:

- dashboard
- teams
- assignments
- progress
- notifications
- certificates
- profile

Allowed actions:

- view/manage own team where allowed.
- view team progress.
- assign trainings to own team if backend permissions allow.

Forbidden actions:

- cannot manage other teams.
- cannot access other company data.
- cannot approve trainers.

Main workflow:

`Login -> Manage team -> Assign/track team training -> Monitor progress`

### LEARNER

Available pages:

- dashboard
- assigned trainings
- training details
- progress
- notifications
- certificates
- profile

Allowed actions:

- view assigned trainings
- complete lessons
- submit quizzes
- view progress
- download certificates

Forbidden actions:

- cannot create trainings.
- cannot assign trainings.
- cannot manage users or teams.
- cannot approve progress.

Main workflow:

`Accept invitation -> Login -> Learn -> Complete lessons/quizzes -> Wait approval -> Download certificate`

---

## 9. Full Application Workflow Analysis

This section documents how the whole SaaS product operates from end to end, not only page by page.

### 9.1 Product Lifecycle

The platform starts with either:

1. A company registering and becoming a tenant.
2. A trainer applying to join the platform.
3. A super admin managing the platform.

After setup:

- Trainers create training content.
- Super admins approve trainers.
- Company admins create company teams and users.
- Company admins assign published trainings.
- Learners complete trainings and quizzes.
- Trainers approve learner completion.
- Certificates are generated and can be verified publicly.

### 9.2 Role Interaction Model

```text
SUPER_ADMIN
  -> approves TRAINER applications
  -> manages platform users and companies

TRAINER
  -> creates TRAININGS
  -> creates LESSONS and QUIZZES
  -> approves LEARNER progress
  -> triggers CERTIFICATES

COMPANY_ADMIN
  -> manages COMPANY tenant
  -> creates TEAMS and USERS
  -> assigns TRAININGS
  -> tracks PROGRESS

TEAM_MANAGER
  -> manages assigned TEAM
  -> tracks team learners
  -> may assign trainings if allowed

LEARNER
  -> receives ASSIGNMENTS
  -> completes LESSONS and QUIZZES
  -> receives CERTIFICATES
```

---

## 10. Auth Workflow

### Public Landing Page

Frontend:

1. User opens `/`.
2. Landing page presents the product.
3. User chooses company registration, trainer registration, or login.

Backend:

- No authentication required.
- Public auth endpoints are allowed in Spring Security.

### Company Registration

Frontend:

1. User opens `/auth/register`.
2. Chooses company registration.
3. Enters company and admin information.
4. Frontend calls `POST /api/v1/auth/register`.
5. Success message asks user to verify email.

Backend:

1. Validates email, password, company fields.
2. Checks duplicate email.
3. Creates `companies` row.
4. Creates `users` row with role `COMPANY_ADMIN`.
5. Creates email verification token/code.
6. Sends verification email if mail is enabled.

Database changes:

- `companies`
- `users`
- `email_verification_tokens`
- `notifications` optionally
- `audit_events`

Security checks:

- password hashing
- duplicate email protection
- rate limiting on auth endpoint
- no token issued until valid login conditions are met

### Trainer Application

Frontend:

1. Trainer fills trainer registration form.
2. Uploads optional profile/application files.
3. Frontend calls `POST /api/v1/auth/register-trainer`.
4. Trainer is redirected to pending page.

Backend:

1. Validates trainer data and file uploads.
2. Creates `users` row with role `TRAINER` and pending status.
3. Creates `trainer_profiles` row with pending approval status.
4. Stores uploaded documents through file storage.
5. Sends confirmation email to trainer.
6. Sends admin notification/email.

Database changes:

- `users`
- `trainer_profiles`
- `stored_files`
- `notifications`
- `audit_events`

### Trainer Approval/Rejection

Frontend:

1. Super admin opens `/admin/trainers/pending`.
2. Reviews applications.
3. Approves or rejects trainer.

Backend:

1. Checks `SUPER_ADMIN` role.
2. Updates trainer profile approval status.
3. Activates or rejects trainer user depending on decision.
4. Sends approval or rejection email.
5. Creates audit event.

APIs:

- `GET /api/v1/admin/trainers/applications`
- `PATCH /api/v1/admin/trainers/{trainerId}/approve`
- `PATCH /api/v1/admin/trainers/{trainerId}/reject`

### Login Flow

Frontend:

1. User opens `/auth/login`.
2. Enters email/password.
3. Frontend calls `POST /api/v1/auth/login`.
4. Stores access and refresh tokens.
5. Loads current user.
6. Redirects by role.

Backend:

1. Applies auth rate limit.
2. Loads user by email.
3. Checks password with BCrypt.
4. Checks account status.
5. Checks trainer approval if role is `TRAINER`.
6. Tracks failed attempts.
7. Locks account after repeated failures.
8. Issues JWT access token.
9. Creates hashed refresh token.

Database changes:

- `refresh_tokens`
- `users.failed_login_attempts`
- `users.locked_until`
- `audit_events`

### Refresh Token Flow

Frontend:

1. API request receives `401`.
2. Interceptor calls `POST /api/v1/auth/refresh-token`.
3. If refresh succeeds, old request is retried.
4. If refresh fails, tokens are cleared and user is redirected to login.

Backend:

1. Validates refresh token hash.
2. Checks expiration/revocation.
3. Detects reuse.
4. Revokes old refresh token.
5. Issues new access and refresh tokens.

Database changes:

- `refresh_tokens` old token revoked.
- new refresh token inserted.

### Logout Flow

Frontend:

1. User clicks logout.
2. Frontend calls `POST /api/v1/auth/logout`.
3. Local tokens are cleared.
4. User is redirected to `/auth/login`.

Backend:

1. Revokes active refresh tokens.
2. Increments `tokenVersion`.
3. Creates audit event.

### Forgot/Reset Password

Frontend:

1. User requests reset from `/auth/forgot-password`.
2. Frontend calls `POST /api/v1/auth/forgot-password`.
3. User receives code by email.
4. User opens `/auth/reset-password`.
5. Frontend calls `POST /api/v1/auth/reset-password`.

Backend:

1. Responds generically even if email does not exist.
2. Creates password reset token/code for real users.
3. Sends reset email if mail is enabled.
4. Validates submitted code.
5. Hashes and updates password.
6. Revokes old tokens/increments token version as appropriate.

Database changes:

- `password_reset_tokens`
- `users.password`
- `refresh_tokens` revoked
- `audit_events`

### Email Verification

Frontend:

1. User opens verification route from email or enters code.
2. Frontend calls `POST /api/v1/auth/verify-email`.
3. Account becomes active if verification is valid.

Backend:

1. Validates token/code.
2. Marks user email verified.
3. Activates pending account where applicable.
4. Marks verification token consumed.

---

## 11. Trainer Workflow

```text
Trainer
-> Register as trainer
-> Upload profile/application data
-> Wait for super admin approval
-> Receive approval email
-> Login
-> Open trainer dashboard
-> Create training
-> Add lessons
-> Upload lesson resources
-> Create quizzes
-> Publish training
-> Learners get assigned by companies
-> Trainer reviews learner progress
-> Trainer approves completion
-> Certificate generated
-> Trainer manages profile/portfolio
```

Frontend flow:

- Trainer starts from auth registration.
- Pending page communicates approval status.
- After approval and login, trainer uses training pages.
- Training create/edit pages call training, lesson, quiz, and file APIs.
- Trainer approval pages use trainer/progress APIs.

Backend flow:

- Trainer profile is created in pending state.
- Super admin approval unlocks trainer access.
- Training service enforces ownership.
- Lesson and quiz services validate training ownership.
- Progress approval verifies trainer owns the related training.
- Certificate service generates PDF after approval.

Key APIs:

- `POST /api/v1/auth/register-trainer`
- `PATCH /api/v1/admin/trainers/{trainerId}/approve`
- `POST /api/v1/trainings`
- `POST /api/v1/trainings/{id}/lessons`
- `POST /api/v1/lessons/{id}/quiz`
- `PATCH /api/v1/trainings/{id}/publish`
- `GET /api/v1/trainers/me/approvals`
- `PATCH /api/v1/progress/{id}/approve`
- `POST /api/v1/certificates/generate/{progressId}`

Database interactions:

- `users`
- `trainer_profiles`
- `trainings`
- `lessons`
- `lesson_resources`
- `quizzes`
- `questions`
- `answer_options`
- `learner_progress`
- `certificates`
- `stored_files`

Validations:

- duplicate email
- trainer approval required
- training ownership
- lesson ownership through training
- quiz structure validity
- file type and size validation

---

## 12. Company Workflow

```text
Company Admin
-> Register company
-> Verify email
-> Login
-> Open company dashboard
-> Create teams
-> Invite/create employees
-> Explore published trainings
-> Select training
-> Choose assignment target
-> Assign to company/team/learners
-> Monitor progress
-> Review completion and certificates
```

### Company Dashboard

Frontend:

- Shows company stats.
- Shows teams, users, assignments, and available trainings.
- Provides assignment/purchase flow for published trainings.

Backend:

- Uses company-scoped APIs.
- Tenant context is resolved from authenticated user.
- Data is filtered by `company_id`.

### Team Management Flow

Frontend:

1. Company admin opens `/teams`.
2. Creates team.
3. Opens team details.
4. Adds or removes users.

Backend:

1. Validates company ownership.
2. Blocks duplicate team name in same company.
3. Adds members only from same company.

APIs:

- `GET /api/v1/teams`
- `POST /api/v1/teams`
- `GET /api/v1/teams/{id}`
- `POST /api/v1/teams/{id}/members`
- `DELETE /api/v1/teams/{id}/members/{memberId}`

Database changes:

- `teams`
- `team_members`

### Employee Invitation/User Flow

Frontend:

1. Company admin creates or invites employee.
2. Employee receives email.
3. Employee accepts invitation.
4. User becomes active.

Backend:

1. Creates user/invitation token.
2. Sends invitation email.
3. Accept endpoint validates token/code.
4. User sets password and activates account.

APIs:

- `POST /api/v1/users`
- `POST /api/v1/auth/accept-invitation`

Database changes:

- `users`
- `invitation_tokens`
- `notifications`
- `audit_events`

### Training Assignment Flow

```text
Company Admin
-> Dashboard
-> Explore Trainings
-> Search/filter published trainings
-> Select training
-> Choose target:
   - entire company
   - one or more teams
   - selected learners
-> Review summary
-> Confirm assignment
-> Backend creates assignment records
-> Learners receive assigned training
```

Frontend:

- Uses `TrainingService` to list published trainings.
- Uses `TeamService` and `UserService` to load company targets.
- Uses `AssignmentService` to create assignment or bulk assignments.
- Shows success/error toast.

Backend:

- Validates role.
- Validates company ownership.
- Validates training is assignable.
- Validates selected team/learner belongs to company.
- Creates assignment records.
- Creates notifications and progress records where applicable.

APIs:

- `GET /api/v1/trainings`
- `GET /api/v1/teams`
- `GET /api/v1/users`
- `POST /api/v1/assignments`
- `POST /api/v1/assignments/bulk`

Database changes:

- `training_assignments`
- `learner_progress`
- `notifications`
- `audit_events`

### Progress Tracking Flow

Frontend:

- Company admin opens progress/assignment views.
- Sees learner status and completion percentage.

Backend:

- Progress records are scoped by company.
- Trainers can see progress only for their own trainings.
- Company admins can see progress only for own tenant.

---

## 13. Learner Workflow

```text
Learner
-> Receives invitation
-> Accepts invitation and activates account
-> Login
-> Opens assigned trainings
-> Opens training details
-> Completes lessons
-> Watches videos/resources
-> Submits quizzes
-> Progress percentage updates
-> Completes training
-> Waits trainer approval if required
-> Certificate generated
-> Downloads/views certificate
```

Frontend behavior:

- Learner sees role-scoped dashboard/sidebar.
- Assigned trainings come from assignments/progress APIs.
- Lesson completion calls backend.
- Quiz submission sends selected answer IDs.
- Certificates page lists available certificates.

Backend behavior:

- Validates learner is assigned.
- Creates/updates `lesson_progress`.
- Calculates `learner_progress.progress_percentage`.
- Stores quiz attempts.
- Marks completion status.
- Trainer approval moves progress to approved.
- Certificate service creates certificate PDF and metadata.

Key APIs:

- `GET /api/v1/assignments/my`
- `GET /api/v1/progress/my`
- `POST /api/v1/lessons/{id}/complete`
- `POST /api/v1/quizzes/{id}/submit`
- `GET /api/v1/certificates/my`
- `GET /api/v1/certificates/{id}/download`

Database interactions:

- `training_assignments`
- `learner_progress`
- `lesson_progress`
- `quiz_attempts`
- `certificates`
- `stored_files`
- `notifications`

---

## 14. Super Admin Workflow

```text
SUPER_ADMIN
-> Login
-> Monitor platform dashboard
-> Review trainer applications
-> Approve/reject trainers
-> Manage users
-> Monitor companies
-> Monitor trainings
-> Review audit/security activity
```

Main responsibilities:

- trainer approval governance
- user/company management
- platform oversight
- exceptional certificate/training actions

Security:

- Super admin routes require `SUPER_ADMIN`.
- Backend method-level security protects trainer approval and company listing endpoints.

---

## 15. System Interaction Workflow

```text
Auth <-> Users
Users <-> Companies
Companies <-> Teams
Teams <-> Learners
Trainers <-> Trainings
Trainings <-> Lessons
Lessons <-> Quizzes
Assignments <-> Progress
Progress <-> Certificates
Notifications <-> Users
Files <-> Trainers/Trainings/Lessons/Certificates
Audit <-> Critical Actions
```

### Data Flow

1. Auth creates and authenticates users.
2. Users are assigned roles and optionally a company.
3. Company admins manage teams and members.
4. Trainers create content.
5. Companies assign content.
6. Learners consume content.
7. Progress updates through lesson and quiz actions.
8. Trainers approve completion.
9. Certificates are generated and stored.
10. Notifications keep users informed.
11. Audit events record sensitive actions.

### Ownership Rules

- Company data is scoped through `company_id`.
- Trainers own training content through `trainer_id`.
- Team managers are scoped to their managed teams.
- Learners can only access their assignments/progress.
- Super admin has platform-level access.

### Tenant Isolation

Tenant isolation is implemented through:

- `company_id` fields on company-scoped tables.
- `TenantContext` populated by JWT filter.
- service-layer tenant checks.
- repository queries filtered by company.
- method-level security.

---

## 16. Workflow Diagrams

### Auth Workflow

```text
Visitor
-> Landing Page
-> Register Company or Apply as Trainer
-> Email Verification / Trainer Approval
-> Login
-> Access Token + Refresh Token
-> Role-Based Dashboard
-> Refresh Token Rotation on Expiry
-> Logout
```

### Trainer Workflow

```text
Trainer
-> Apply
-> Pending Approval
-> Super Admin Approves
-> Approval Email
-> Login
-> Create Training
-> Add Lessons
-> Add Quiz
-> Publish
-> Review Learner Progress
-> Approve Completion
-> Certificate Generated
```

### Company Workflow

```text
Company Admin
-> Register Company
-> Verify Email
-> Login
-> Create Teams
-> Invite/Create Members
-> Explore Trainings
-> Assign Training
-> Track Progress
-> Review Completion
```

### Learner Workflow

```text
Learner
-> Invitation Email
-> Accept Invitation
-> Login
-> View Assigned Trainings
-> Complete Lessons
-> Submit Quizzes
-> Complete Training
-> Trainer Approval
-> Certificate Available
```

### Assignment Workflow

```text
Company Admin
-> Select Published Training
-> Choose Target Type
-> Select Company / Team / Learners
-> Review Summary
-> Confirm Assignment
-> Assignment Records Created
-> Learners Receive Notification
-> Learners See Training
```

### Certificate Workflow

```text
Learner Completes Training
-> Progress Reaches 100%
-> Trainer Reviews
-> Trainer Approves
-> Certificate Service Generates PDF
-> File Stored
-> Certificate Metadata Saved
-> Learner Notified
-> Public Verification Code Available
```

---

## 17. UI/UX Workflow Analysis

### Strengths

- Clear role-based navigation.
- Separate auth, public, and app layouts.
- Reusable UI components reduce inconsistency.
- Company dashboard includes modern assignment flow concepts.
- Trainer and admin workflows are represented in UI.
- Toasts, empty states, loading states, and filters are present in several pages.

### Confusing or Weak Flows

1. Assignments page currently has a template build error.
   - Impact: blocks production deployment.
   - Suggested fix: correct Angular control-flow block syntax and remove unused imports.

2. Role navigation can become dense.
   - Impact: users may need too many clicks for common actions.
   - Suggested fix: add quick actions per role on dashboard.

3. Learner journey depends on clean training detail UX.
   - Impact: lesson/quiz path can feel fragmented if not visually guided.
   - Suggested fix: add a persistent course progress sidebar inside training details.

4. Admin monitoring is functional but could be more dashboard-oriented.
   - Impact: platform operator has less immediate operational insight.
   - Suggested fix: add admin dashboard cards for pending trainers, active companies, failed logins, storage usage.

5. Production environment switching is not complete.
   - Impact: Firebase/Cloud deployment requires manual API URL changes.
   - Suggested fix: add `environment.prod.ts` and deployment docs.

---

## 18. API Documentation Summary

### Auth APIs

| Method | URL | Role | Request Body | Response Body | Purpose | Status |
|---|---|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Company/admin registration DTO | `ApiResponse` | Register company tenant | Implemented |
| POST | `/api/v1/auth/register-trainer` | Public | Multipart trainer application | `ApiResponse` | Submit trainer application | Implemented |
| POST | `/api/v1/auth/login` | Public | email/password | auth tokens + user | Login | Implemented |
| POST | `/api/v1/auth/refresh-token` | Public | refresh token | rotated tokens | Refresh session | Implemented |
| POST | `/api/v1/auth/logout` | Authenticated | refresh token/current session | `ApiResponse` | Logout | Implemented |
| POST | `/api/v1/auth/forgot-password` | Public | email | generic response | Send reset code | Implemented |
| POST | `/api/v1/auth/reset-password` | Public | email/code/new password | `ApiResponse` | Reset password | Implemented |
| POST | `/api/v1/auth/verify-email` | Public | token/code | `ApiResponse` | Verify email | Implemented |
| POST | `/api/v1/auth/resend-verification` | Public | email | `ApiResponse` | Resend verification | Implemented |
| POST | `/api/v1/auth/accept-invitation` | Public | invitation token/password | `ApiResponse` | Activate invited user | Implemented |
| GET | `/api/v1/auth/me` | Authenticated | none | user response | Current session user | Implemented |

### User/Company/Team APIs

| Method | URL | Role | Request Body | Response Body | Purpose | Status |
|---|---|---|---|---|---|---|
| GET | `/api/v1/users/me` | Authenticated | none | user DTO | Current user profile | Implemented |
| GET | `/api/v1/users` | SUPER_ADMIN, COMPANY_ADMIN, TEAM_MANAGER | filters/page | page of users | List users | Implemented |
| POST | `/api/v1/users` | SUPER_ADMIN, COMPANY_ADMIN | create user DTO | user DTO | Create/invite user | Implemented |
| PUT | `/api/v1/users/me` | Authenticated | profile DTO | user DTO | Update profile | Implemented |
| POST | `/api/v1/users/change-password/code` | Authenticated | none/email | `ApiResponse` | Send password-change code | Implemented |
| PUT | `/api/v1/users/change-password` | Authenticated | old/new/code | `ApiResponse` | Change password | Implemented |
| POST | `/api/v1/companies` | SUPER_ADMIN | company DTO | company DTO | Create company | Implemented |
| GET | `/api/v1/companies` | SUPER_ADMIN | page/filter | page of companies | List companies | Implemented |
| GET | `/api/v1/companies/me` | COMPANY_ADMIN | none | company DTO | Current company | Implemented |
| PUT | `/api/v1/companies/{id}` | SUPER_ADMIN/owner admin | company DTO | company DTO | Update company | Implemented |
| POST | `/api/v1/teams` | COMPANY_ADMIN, TEAM_MANAGER, SUPER_ADMIN | team DTO | team DTO | Create team | Implemented |
| GET | `/api/v1/teams` | Authenticated scoped | page/filter | page of teams | List teams | Implemented |
| GET | `/api/v1/teams/{id}` | Tenant authorized | none | team DTO | Team details | Implemented |
| PUT | `/api/v1/teams/{id}` | Tenant authorized | team DTO | team DTO | Update team | Implemented |
| DELETE | `/api/v1/teams/{id}` | Tenant authorized | none | `ApiResponse` | Delete team | Implemented |
| POST | `/api/v1/teams/{id}/members` | Tenant authorized | user/member DTO | member DTO | Add member | Implemented |
| DELETE | `/api/v1/teams/{id}/members/{memberId}` | Tenant authorized | none | `ApiResponse` | Remove member | Implemented |

### Training/Lesson/Quiz APIs

| Method | URL | Role | Request Body | Response Body | Purpose | Status |
|---|---|---|---|---|---|---|
| POST | `/api/v1/trainings` | TRAINER, SUPER_ADMIN | training DTO | training DTO | Create training | Implemented |
| GET | `/api/v1/trainings` | Authenticated | filters/page | page of trainings | Search/list trainings | Implemented |
| GET | `/api/v1/trainings/{id}` | Authenticated | none | training DTO | Training details | Implemented |
| PUT | `/api/v1/trainings/{id}` | Owner/SUPER_ADMIN | training DTO | training DTO | Update training | Implemented |
| DELETE | `/api/v1/trainings/{id}` | Owner/SUPER_ADMIN | none | `ApiResponse` | Delete training | Implemented |
| PATCH | `/api/v1/trainings/{id}/publish` | Owner/SUPER_ADMIN | none | training DTO | Publish training | Implemented |
| PATCH | `/api/v1/trainings/{id}/archive` | Owner/SUPER_ADMIN | none | training DTO | Archive training | Implemented |
| POST | `/api/v1/trainings/{id}/lessons` | Owner/SUPER_ADMIN | lesson DTO | lesson DTO | Add lesson | Implemented |
| GET | `/api/v1/trainings/{id}/lessons` | Authenticated | none | lessons | List lessons | Implemented |
| GET | `/api/v1/trainings/{id}/learners` | Owner/SUPER_ADMIN | filters/page | learners | Learners on training | Implemented |
| PUT | `/api/v1/lessons/{id}` | Owner/SUPER_ADMIN | lesson DTO | lesson DTO | Update lesson | Implemented |
| DELETE | `/api/v1/lessons/{id}` | Owner/SUPER_ADMIN | none | `ApiResponse` | Delete lesson | Implemented |
| POST | `/api/v1/lessons/{id}/quiz` | Owner/SUPER_ADMIN | quiz DTO | quiz DTO | Create quiz | Implemented |
| GET | `/api/v1/lessons/{id}/quiz` | Authenticated | none | quiz DTO | Get quiz | Implemented |
| PUT | `/api/v1/quizzes/{id}` | Owner/SUPER_ADMIN | quiz DTO | quiz DTO | Update quiz | Implemented |
| DELETE | `/api/v1/quizzes/{id}` | Owner/SUPER_ADMIN | none | `ApiResponse` | Delete quiz | Implemented |
| PATCH | `/api/v1/quizzes/{id}/publish` | Owner/SUPER_ADMIN | none | quiz DTO | Publish quiz | Implemented |
| PATCH | `/api/v1/quizzes/{id}/unpublish` | Owner/SUPER_ADMIN | none | quiz DTO | Unpublish quiz | Implemented |

### Assignment/Progress/Certificate APIs

| Method | URL | Role | Request Body | Response Body | Purpose | Status |
|---|---|---|---|---|---|---|
| POST | `/api/v1/assignments` | SUPER_ADMIN, COMPANY_ADMIN, TEAM_MANAGER | assignment DTO | assignment DTO | Create assignment | Implemented |
| POST | `/api/v1/assignments/bulk` | SUPER_ADMIN, COMPANY_ADMIN, TEAM_MANAGER | bulk assignment DTO | assignments | Bulk assignment | Implemented |
| GET | `/api/v1/assignments/my` | Authenticated | filters/page | assignments | My assignments | Implemented |
| GET | `/api/v1/progress/my` | Authenticated | filters/page | progress | My progress | Implemented |
| POST | `/api/v1/lessons/{id}/complete` | LEARNER | none/body | progress | Complete lesson | Implemented |
| POST | `/api/v1/quizzes/{id}/submit` | LEARNER | selected answers | quiz attempt/progress | Submit quiz | Implemented |
| PATCH | `/api/v1/progress/{id}/approve` | TRAINER, SUPER_ADMIN | optional note | progress | Approve progress | Implemented |
| PATCH | `/api/v1/progress/{id}/reject` | TRAINER, SUPER_ADMIN | reason | progress | Reject progress | Implemented |
| POST | `/api/v1/certificates/generate/{progressId}` | TRAINER, SUPER_ADMIN | none | certificate DTO | Generate certificate | Implemented |
| GET | `/api/v1/certificates/my` | Authenticated | page | certificates | My certificates | Implemented |
| GET | `/api/v1/certificates/verify/{code}` | Public | none | certificate verification | Verify certificate | Implemented |
| GET | `/api/v1/certificates/{id}/download` | Authorized | none | file | Download certificate | Implemented |

### Support APIs

| Method | URL | Role | Request Body | Response Body | Purpose | Status |
|---|---|---|---|---|---|---|
| GET | `/api/v1/notifications` | Authenticated | page | notifications | List notifications | Implemented |
| PATCH | `/api/v1/notifications/{id}/read` | Owner | none | notification | Mark read | Implemented |
| PATCH | `/api/v1/notifications/read-all` | Authenticated | none | `ApiResponse` | Mark all read | Implemented |
| POST | `/api/v1/files/upload` | Authenticated | multipart file/category | stored file DTO | Upload file | Implemented |
| GET | `/api/v1/files/{id}` | Owner/SUPER_ADMIN | none | file | Download file | Implemented |
| GET | `/api/v1/files/{id}/signed-url` | Owner/SUPER_ADMIN | none | signed URL | Temporary URL | Implemented |
| GET | `/api/v1/billing/plans` | Authenticated | none | plans | Subscription plans | Implemented |
| GET | `/api/v1/billing/subscription/me` | COMPANY_ADMIN | none | subscription | Current subscription | Implemented |
| GET | `/actuator/health` | Public | none | health | Health check | Implemented |
| GET | `/actuator/prometheus` | Public/internal | none | metrics | Prometheus metrics | Implemented |

---

## 19. Database Report

### Migration Files

Flyway migrations:

1. `V1__initial_schema.sql`
2. `V2__security_indexes_and_account_lock.sql`
3. `V3__email_invitation_audit.sql`
4. `V4__user_provisioning_and_token_version.sql`
5. `V5__trainer_module_completion.sql`
6. `V6__trainer_applications.sql`

### Main Tables

Observed PostgreSQL tables:

- `users`
- `companies`
- `trainer_profiles`
- `teams`
- `team_members`
- `trainings`
- `lessons`
- `lesson_resources`
- `quizzes`
- `questions`
- `answer_options`
- `training_assignments`
- `learner_progress`
- `lesson_progress`
- `quiz_attempts`
- `certificates`
- `stored_files`
- `notifications`
- `subscription_plans`
- `company_subscriptions`
- `refresh_tokens`
- `password_reset_tokens`
- `email_verification_tokens`
- `invitation_tokens`
- `audit_events`
- `flyway_schema_history`

### Relationships

Core relationships:

- `companies` 1-N `users`
- `companies` 1-N `teams`
- `teams` 1-N `team_members`
- `users` 1-N `team_members`
- `users` 1-1 `trainer_profiles`
- `users` 1-N `trainings` as trainer
- `trainings` 1-N `lessons`
- `lessons` 1-1/N `quizzes`
- `quizzes` 1-N `questions`
- `questions` 1-N `answer_options`
- `trainings` 1-N `training_assignments`
- `users` 1-N `learner_progress`
- `learner_progress` N-1 `trainings`
- `lesson_progress` tracks learner completion per lesson
- `quiz_attempts` tracks learner quiz attempts
- `certificates` link learner/training/trainer
- `stored_files` support avatars/logos/thumbnails/resources/certificates

### Tenant Isolation

Tenant isolation uses `company_id` on company-scoped data:

- users
- teams
- team members
- assignments
- progress
- company subscriptions

Trainer-owned global content does not belong to a company, but access to learner progress and assignments is restricted by trainer ownership and tenant checks.

### Important Indexes

Observed index categories:

- user lookup: email, company, role
- training filters: category, level, status, trainer
- assignment lookup: company, team, learner
- progress lookup: learner/training/status
- lesson progress lookup: lesson/completion
- token lookup: active hashed refresh/reset/verification/invitation tokens
- certificate verification code
- audit actor/action indexes

### Enum/Status Fields

Important statuses:

- user role: `SUPER_ADMIN`, `TRAINER`, `COMPANY_ADMIN`, `TEAM_MANAGER`, `LEARNER`
- account status: active/pending/suspended or equivalent
- trainer approval status
- training status: draft/published/archived
- assignment status
- progress status: not started/in progress/completed/approved
- subscription status
- notification type/read state

---

## 20. Security Report

### JWT Authentication

The backend uses stateless Spring Security with JWT access tokens. The JWT filter validates tokens and sets the Spring Security context.

### Refresh Token Strategy

Refresh tokens are:

- stored in the database as hashes
- rotated on refresh
- revoked on logout
- protected against reuse

This is strong for a SaaS MVP.

### Token Version Logout Invalidation

The backend includes `tokenVersion` support so logout/password changes can invalidate older access tokens logically.

### Password Hashing

Passwords are hashed with BCrypt.

### Trainer Approval Security

Trainer users cannot fully access trainer functionality until approved by `SUPER_ADMIN`.

### Role-Based Access

The backend uses:

- Spring Security filter chain
- method-level security
- `@PreAuthorize`
- service-layer ownership checks

### Tenant Isolation

Tenant safety is handled by:

- `TenantContext`
- `company_id` database fields
- scoped repository queries
- service-level checks
- role-aware logic

### File Validation

File uploads validate:

- file category
- content type
- extension
- file size
- sanitized filename

### Rate Limiting

Auth endpoints are protected by a rate limit filter. The project includes both local and Redis-backed rate limiting for horizontal scalability.

### CORS

CORS is environment-driven and defaults to local Angular development. Production must explicitly configure allowed origins.

### Security Headers

Security headers include:

- CSP
- frame denial
- referrer policy
- HSTS
- content-type sniffing protection
- permissions policy

### Email Token Security

Verification, reset, and invitation flows use database-backed tokens/codes with expiration and consumed/revoked states.

### Remaining Security Risks

1. Access/refresh tokens are stored in localStorage.
   - Impact: token theft risk if XSS exists.
   - Fix: consider HttpOnly secure cookies for production.

2. `.env` exists locally and must never be committed or exposed.
   - Impact: secret leakage.
   - Fix: use cloud secret manager or CI secret variables.

3. Public metrics endpoint should be protected or network-restricted in production.
   - Impact: information disclosure.
   - Fix: expose Prometheus only inside private network.

4. File download authorization may be too strict for shared learning resources.
   - Impact: learners may fail to access trainer-uploaded resources unless served through resource-specific authorization.
   - Fix: verify end-to-end file access for lesson resources.

5. Frontend build failure blocks production deployment.
   - Impact: no deployable frontend artifact.
   - Fix: repair assignments template.

---

## 21. File Upload Report

### Supported File Categories

- avatars
- company logos
- training thumbnails
- videos
- certificates
- lesson resources
- trainer application documents

### Validation

Validation includes:

- category-based MIME type restrictions
- extension restrictions
- max size control
- filename sanitization

Examples:

- avatars/logos/thumbnails: jpeg, png, webp
- videos: mp4, webm, quicktime
- certificates: pdf
- generic resources: pdf, jpeg, png, webp, txt

### Storage Implementations

- Local file storage.
- S3-compatible storage.
- MinIO-ready object storage.

### Signed URLs

The file module supports signed URL generation for external storage, useful for private files and temporary access.

### Production Recommendations

- Use S3, MinIO, or Google Cloud Storage in production.
- Keep buckets private.
- Use signed URLs with short expiration.
- Scan uploads for malware if accepting arbitrary documents.
- Add CDN only after file authorization rules are stable.

---

## 22. Email System Report

### Email Capabilities

The backend includes an SMTP email service using JavaMailSender.

Supported emails:

- email verification
- password reset code
- change-password code
- invitation email
- trainer application received
- trainer application admin notification
- trainer approval email
- trainer rejection email

### SMTP Configuration

Environment variables:

- `MAIL_ENABLED`
- `MAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_AUTH`
- `SMTP_STARTTLS`

### Gmail Support

Gmail SMTP can work when:

- 2FA is enabled on the Gmail account.
- an app password is used.
- port `587` and STARTTLS are enabled.
- credentials are passed only through environment variables.

### Mailhog Dev Mode

Docker Compose includes Mailhog for local testing:

- SMTP port: `1025`
- Web UI: `http://localhost:8025`

### Production Recommendation

Use a reliable SMTP provider approved by the project owner. Since project rules say not to add paid third-party services by default, Gmail SMTP or an approved free/dev SMTP setup can be used until a production email provider is explicitly selected.

---

## 23. DevOps Report

### Docker Compose Services

| Service | Purpose | Status |
|---|---|---|
| `postgres` | PostgreSQL database | Configured |
| `redis` | Cache/rate limit backend | Configured |
| `mailhog` | Local email capture | Configured |
| `minio` | S3-compatible file storage | Configured |
| `minio-setup` | Creates bucket | Configured |
| `api` | Spring Boot backend | Configured |
| `prometheus` | Metrics scraping | Configured |
| `grafana` | Dashboards | Configured |

### Dockerfile

The backend Dockerfile is production-friendly:

- multi-stage build
- Java 17
- Maven wrapper build
- smaller JRE runtime image
- non-root application user
- healthcheck support

### Monitoring

Prometheus scrapes:

```text
api:8080/actuator/prometheus
```

Grafana is provisioned with Prometheus as a datasource.

### Local Run Instructions

Backend only:

```powershell
cd C:\Users\GRATI\Desktop\pfa\backend
.\mvnw.cmd spring-boot:run
```

Full infrastructure:

```powershell
cd C:\Users\GRATI\Desktop\pfa
docker compose up -d
```

Frontend:

```powershell
cd C:\Users\GRATI\Desktop\pfa\frontend
npm install
npm start
```

Health checks:

```powershell
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/prometheus
```

---

## 24. Firebase Deployment Readiness

### Can the Project Deploy to Firebase?

Partially.

Angular frontend:

- Can be deployed to Firebase Hosting.

Spring Boot backend:

- Cannot run directly on Firebase Hosting.
- Must be deployed to a backend/container platform.

### Recommended Firebase-Compatible Architecture

```text
Angular Frontend
-> Firebase Hosting

Spring Boot Backend Docker Image
-> Google Cloud Run / Render / Railway / VPS / AWS

PostgreSQL
-> Managed PostgreSQL

Redis
-> Managed Redis

Files
-> S3 / MinIO / Google Cloud Storage

Email
-> Gmail SMTP or approved SMTP provider

Monitoring
-> Prometheus/Grafana stack or managed observability
```

Best fit:

- Frontend: Firebase Hosting.
- Backend: Google Cloud Run, because it integrates well with Firebase/Google Cloud.
- Database: managed PostgreSQL.
- Redis: managed Redis.
- Files: Google Cloud Storage or S3-compatible storage.

### Required Changes Before Firebase Deployment

1. Fix frontend production build.
2. Add production frontend environment:

```text
frontend/src/environments/environment.prod.ts
```

3. Set production API base URL:

```text
https://your-backend-domain.example.com/api/v1
```

4. Add Firebase config:

```text
firebase.json
.firebaserc
```

5. Configure SPA rewrites for Angular routes.
6. Configure backend CORS:

```text
https://your-firebase-project.web.app
https://your-custom-domain.com
```

7. Set `FRONTEND_BASE_URL` in backend production environment.
8. Move secrets to cloud secret manager.
9. Use HTTPS-only public URLs.
10. Protect Prometheus metrics from public access.

---

## 25. Testing Report

### Backend Tests

Command:

```powershell
cd C:\Users\GRATI\Desktop\pfa\backend
.\mvnw.cmd test
```

Result:

- Passed.
- 26 tests executed.
- 0 failures.
- 0 errors.
- 1 skipped.

Skipped test:

- `PostgresMigrationTest`

Reason:

- Testcontainers could not detect a valid Docker environment through the Java provider during the test run, even though Docker containers were running locally.

### Backend Package

Command:

```powershell
cd C:\Users\GRATI\Desktop\pfa\backend
.\mvnw.cmd package
```

Result:

- Passed.
- Application jar built successfully.
- Same test summary: 26 tests, 0 failures, 0 errors, 1 skipped.

### Frontend Tests

Command:

```powershell
cd C:\Users\GRATI\Desktop\pfa\frontend
npm.cmd test -- --watch=false
```

Result:

- Passed.
- 1 test file passed.
- 1 test passed.

Coverage concern:

- Frontend test coverage is very low for the number of routes/services/components.

### Frontend Build

Command:

```powershell
cd C:\Users\GRATI\Desktop\pfa\frontend
npm.cmd run build
```

Result:

- Failed.

Main error:

```text
NG5002: Unexpected closing block.
frontend/src/app/features/assignments/assignments.page.ts:113:6
```

Likely cause:

- Extra or malformed Angular control-flow block around `} @else {`.

Warnings before failure:

- Several unused imports/components in assignments page.

Impact:

- The frontend is not deployable until this is fixed.

### Docker Compose Config

Command:

```powershell
cd C:\Users\GRATI\Desktop\pfa
docker compose config --quiet
```

Result:

- Passed.

### Runtime Health

Observed:

- API container healthy.
- PostgreSQL healthy.
- Redis healthy.
- MinIO healthy.
- Prometheus/Grafana/Mailhog running.
- `/actuator/health` returns HTTP 200.
- `/actuator/prometheus` returns HTTP 200.

---

## 26. Readiness Scores

| Area | Score | Reason |
|---|---:|---|
| Backend readiness | 86/100 | Strong architecture, security, migrations, Docker, tests, monitoring. Some production hardening remains. |
| Frontend readiness | 62/100 | Good architecture and services, but production build currently fails and test coverage is low. |
| Security readiness | 78/100 | Strong backend security, token rotation, rate limiting, tenant checks. Remaining concerns: localStorage tokens, metrics exposure, final file ACL review. |
| Deployment readiness | 58/100 | Docker stack works, but frontend build blocks deployment and cloud production config is incomplete. |
| Overall readiness | 71/100 | Backend is close to production MVP; frontend/deployment blockers must be fixed before release. |

---

## 27. Remaining Gaps

### Critical Issues

#### 1. Frontend build failure

Description:

- Angular build fails in `frontend/src/app/features/assignments/assignments.page.ts`.

Impact:

- Cannot deploy Angular frontend.

Suggested fix:

- Correct the Angular template control-flow block and remove unused imports.

#### 2. Production frontend configuration missing

Description:

- No complete production API environment/Firebase hosting config was observed.

Impact:

- Firebase deployment would require manual configuration.

Suggested fix:

- Add `environment.prod.ts`, `firebase.json`, and documented deployment commands.

### High Priority Issues

#### 1. Secrets management must be productionized

Description:

- Local `.env` is useful for development, but production secrets must be stored in cloud/CI secrets.

Impact:

- Secret leakage risk.

Suggested fix:

- Use Google Secret Manager, GitHub Actions secrets, Render/Railway env vars, or VPS secret injection.

#### 2. Testcontainers migration test skipped

Description:

- Backend migration integration test did not run because Java Testcontainers could not detect Docker.

Impact:

- Migration confidence is lower in local test run.

Suggested fix:

- Fix local Docker/Testcontainers configuration or run in CI with Docker service available.

#### 3. Metrics endpoint should not be public in production

Description:

- `/actuator/prometheus` is accessible.

Impact:

- May expose internal metrics.

Suggested fix:

- Restrict by network, gateway, VPN, or Spring Security matcher in production.

#### 4. File access authorization needs final E2E validation

Description:

- File downloads are owner/SUPER_ADMIN oriented.

Impact:

- Learners may not access some trainer-uploaded resources unless resource APIs handle permission correctly.

Suggested fix:

- Test learner access to lesson resources and adjust authorization if needed.

### Medium Priority Issues

#### 1. Frontend test coverage is low

Impact:

- UI regressions may pass unnoticed.

Suggested fix:

- Add tests for auth interceptor, guards, login, assignment flow, training pages, and team member management.

#### 2. LocalStorage token storage

Impact:

- XSS can expose tokens.

Suggested fix:

- Consider HttpOnly secure cookie auth in production.

#### 3. Admin dashboard observability can improve

Impact:

- Super admin has less operational insight.

Suggested fix:

- Add dashboard cards for pending trainers, failed logins, active companies, total learners, and storage usage.

#### 4. Billing is structural only

Impact:

- Real purchase/payment flow is not implemented.

Suggested fix:

- Keep current assignment label as "Confirm Assignment"; add payment only when business requirements are finalized.

### Low Priority Issues

#### 1. Controller mapping consistency

Description:

- `ProgressController` uses absolute method mappings.

Impact:

- Works, but less consistent.

Suggested fix:

- Refactor to class-level `@RequestMapping("/api/v1/progress")` where practical.

#### 2. More frontend polish after build fix

Impact:

- Some pages may still need spacing/alignment review on small screens.

Suggested fix:

- Run manual responsive QA after the build compiles.

---

## 28. Deployment Checklist

### Before Any Deployment

- Fix frontend build error.
- Run backend tests and package.
- Run frontend tests and build.
- Run `docker compose config`.
- Confirm `.env` is ignored and no secrets are committed.
- Confirm SMTP credentials are production-safe.
- Confirm CORS allows only production frontend origin.
- Confirm JWT secret is long and environment-provided.
- Confirm PostgreSQL uses managed backups.
- Confirm Redis is reachable by backend.
- Confirm object storage is private.
- Confirm signed URLs work.
- Confirm email verification/password reset/invitation emails work.
- Confirm logs do not include secrets.
- Confirm Prometheus endpoint is private.

### Firebase + Cloud Run Deployment Checklist

- Build Angular app.
- Add Firebase Hosting config.
- Deploy frontend to Firebase.
- Build backend Docker image.
- Deploy backend to Cloud Run or equivalent.
- Configure backend env vars.
- Configure database connection.
- Configure Redis connection.
- Configure file storage bucket.
- Configure SMTP.
- Update `FRONTEND_BASE_URL`.
- Update `CORS_ALLOWED_ORIGINS`.
- Test full auth flow on HTTPS.
- Test full assignment and learner flow.

---

## 29. Final Recommendation

The project is a strong production MVP foundation, especially on the backend side. The backend has the right SaaS building blocks: multi-tenancy, security, role permissions, migrations, monitoring, email, file storage, audit, and Docker infrastructure.

The main issue before deployment is the frontend build failure. Once fixed, the next priority is production configuration for Firebase/Cloud Run, secrets management, and a final manual end-to-end QA pass:

```text
Company registration
-> Email verification
-> Login
-> Create team
-> Invite learner
-> Trainer approval/content
-> Assign training
-> Learner completion
-> Trainer approval
-> Certificate generation
```

Until the frontend build is fixed, the system should be considered **not deployable** even though the backend and Docker stack are healthy.

