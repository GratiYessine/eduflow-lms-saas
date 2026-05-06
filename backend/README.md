# B2B SaaS LMS Backend

Production MVP backend for a multi-tenant B2B training platform built with Java 17, Spring Boot 3, Spring Security, JWT, Spring Data JPA, PostgreSQL, Flyway, MapStruct and Docker.

## Features

- Company-scoped multi-tenancy with shared PostgreSQL tables and tenant checks.
- JWT access tokens plus hashed refresh tokens stored in the database.
- Company registration flow that creates a `COMPANY_ADMIN` and its company.
- Users, trainer profiles, companies, teams, members, trainings, lessons, quizzes, assignments, progress, certificates, files, notifications and billing-ready subscription structures.
- DTO-only API responses with consistent `success`, `message`, `data`, `errors`, `timestamp` shape.
- Swagger UI with bearer token support at `/swagger-ui/index.html`.
- Local file storage abstraction ready to replace with S3, MinIO or Cloudinary later.

## Requirements

- Java 17+
- Docker Desktop
- Maven is not required globally; use the included Maven Wrapper.

On Windows PowerShell, if `JAVA_HOME` is not configured:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-17'
```

## Run Locally

Start PostgreSQL:

```powershell
docker compose up -d postgres
```

Run the API:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-17'
.\mvnw.cmd spring-boot:run
```

Open Swagger:

```text
http://localhost:8080/swagger-ui/index.html
```

## Run With Docker Compose

```powershell
docker compose up --build
```

API:

```text
http://localhost:8080
```

## Main Environment Variables

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRATION`
- `JWT_REFRESH_EXPIRATION`
- `FILE_STORAGE_PATH`
- `CORS_ALLOWED_ORIGINS`

Do not commit real secrets. The default JWT secret is dev-only and must be replaced outside local development.

## Auth Flow

1. `POST /api/v1/auth/register` creates a company and its `COMPANY_ADMIN`.
2. `POST /api/v1/auth/login` returns an access token and refresh token.
3. Use `Authorization: Bearer <accessToken>` for protected endpoints.
4. `POST /api/v1/auth/refresh-token` rotates refresh tokens.
5. `POST /api/v1/auth/logout` revokes the current refresh token.

## Useful Commands

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-17'
.\mvnw.cmd test
.\mvnw.cmd package
```

## Angular Frontend Notes

- Default CORS origin is `http://localhost:4200`.
- All endpoints are under `/api/v1`.
- API success/error envelopes are stable for frontend interceptors.
- File and certificate downloads return binary responses with `Content-Disposition`.
