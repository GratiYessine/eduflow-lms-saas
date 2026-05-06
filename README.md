# PFA LMS SaaS Monorepo

This repository contains the LMS SaaS backend and frontend.

## Structure

- `backend/` - Spring Boot 3 SaaS LMS API.
- `frontend/` - Angular LMS web application.
- `monitoring/` - Prometheus and Grafana provisioning.
- `docker-compose.yml` - Local PostgreSQL, Redis, API, Prometheus and Grafana stack.

## Backend

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd package
```

### Local Backend Development

The default `dev` profile expects PostgreSQL on `localhost:5433` with database/user/password `lms/lms/lms`.
Docker maps PostgreSQL to host port `5433` to avoid collisions with locally installed PostgreSQL services
that often already use `5432`.
For local runs without starting the whole API container, start only the dependencies:

```powershell
docker compose up -d postgres redis mailhog minio minio-setup
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-17'
$env:DB_URL='jdbc:postgresql://localhost:5433/lms'
$env:DB_USERNAME='lms'
$env:DB_PASSWORD='lms'
.\mvnw.cmd spring-boot:run
```

If port `8080` is already used by the Docker API container, add `$env:SERVER_PORT='8081'`.
The `dev` profile uses local in-memory rate limiting and simple cache by default, so Redis is optional
for direct backend runs. Docker overrides those settings to validate Redis-backed behavior.

On a fresh database, create the first platform administrator by setting these environment variables before
the first backend startup:

```powershell
$env:APP_BOOTSTRAP_SUPER_ADMIN_EMAIL='admin@example.test'
$env:APP_BOOTSTRAP_SUPER_ADMIN_PASSWORD='ChangeMe123!'
```

After that, SUPER_ADMIN users can create TRAINER, COMPANY_ADMIN, TEAM_MANAGER, LEARNER, and additional
SUPER_ADMIN accounts from the `/api/v1/users` API or the Users page.

## Frontend

```powershell
cd frontend
npm install
npm start
```

## Docker Production Validation Stack

```powershell
docker compose config
docker compose up --build
```

The local stack starts PostgreSQL, Redis, the API, Mailhog, MinIO, Prometheus and Grafana.

- API: `http://localhost:8080/api/v1`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Mailhog: `http://localhost:8025`
- MinIO console: `http://localhost:9001`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`

Copy `.env.example` to `.env` for local overrides. Keep real secrets out of the repository.

For production SMTP, set `MAIL_ENABLED=true` and configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`,
`SMTP_PASSWORD`, `SMTP_AUTH`, `SMTP_STARTTLS` and `MAIL_FROM` through environment variables.

For production file storage, use `FILE_STORAGE_PROVIDER=s3` or `FILE_STORAGE_PROVIDER=minio` with
S3-compatible credentials provided by the deployment environment. Use the internal storage endpoint for
backend-to-storage traffic and `S3_PUBLIC_ENDPOINT` or `MINIO_PUBLIC_ENDPOINT` for browser-facing signed URLs.
