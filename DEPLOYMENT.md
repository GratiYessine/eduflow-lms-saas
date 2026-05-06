# EduFlow LMS SaaS Deployment Guide

This guide prepares the monorepo for this production architecture:

```text
Angular frontend on Firebase Hosting
  -> calls Spring Boot API on Render
  -> uses Render PostgreSQL
  -> uses Redis, S3-compatible storage, and SMTP through environment variables
```

No secrets should be committed to the repository. Use Firebase configuration, Render environment variables, and provider dashboards for production values.

## 1. Deployment Placeholders To Replace

Replace these before deploying:

| Placeholder | Replace with |
|---|---|
| `YOUR_FIREBASE_PROJECT_ID` | Firebase project id |
| `https://YOUR_FIREBASE_APP_URL` | Firebase Hosting URL, for example `https://your-project.web.app` |
| `https://YOUR_RENDER_BACKEND_URL` | Render backend URL, for example `https://eduflow-api.onrender.com` |

Files containing placeholders:

- `frontend/.firebaserc`
- `frontend/src/environments/environment.prod.ts`
- Render environment variables in the Render dashboard

## 2. Firebase Frontend Deployment

### Frontend Production Configuration

Production Angular builds use:

```text
frontend/src/environments/environment.prod.ts
```

Current placeholder:

```ts
apiBaseUrl: 'https://YOUR_RENDER_BACKEND_URL/api/v1'
```

Set it to your Render API URL before deploying.

### Firebase Hosting Files

Firebase Hosting is configured in:

```text
frontend/firebase.json
frontend/.firebaserc
```

The configured public directory is:

```text
dist/frontend/browser
```

The SPA rewrite sends all frontend routes to `index.html`, so refresh works for:

- `/`
- `/auth/login`
- `/auth/register`
- `/dashboard`
- `/trainings`
- `/teams`
- `/assignments`
- `/profile`

### Firebase Commands

Run from the monorepo root:

```powershell
cd C:\Users\GRATI\Desktop\pfa\frontend
npm install
npm run build
firebase login
firebase deploy
```

If you have not initialized Firebase before, use:

```powershell
firebase init hosting
```

Choose:

- Project: your Firebase project
- Public directory: `dist/frontend/browser`
- Single-page app rewrite: `Yes`
- GitHub automatic deploys: optional

## 3. Render Backend Deployment

### Render Service Type

Create a Render Web Service:

- Root directory: `backend`
- Runtime: Docker
- Dockerfile path: `Dockerfile`
- Health check path: `/actuator/health`

The backend Dockerfile builds the Spring Boot jar and runs it in a Java 17 runtime image.

### Required Backend Environment Variables

Set these in the Render Web Service dashboard:

```text
SPRING_PROFILES_ACTIVE=prod
PORT=8080

DB_URL=jdbc:postgresql://HOST:PORT/DATABASE
DB_USERNAME=...
DB_PASSWORD=...

JWT_SECRET=...
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000

FRONTEND_BASE_URL=https://YOUR_FIREBASE_APP_URL
CORS_ALLOWED_ORIGINS=https://YOUR_FIREBASE_APP_URL

MAIL_ENABLED=true
MAIL_FROM=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...
SMTP_AUTH=true
SMTP_STARTTLS=true

REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...

FILE_STORAGE_PROVIDER=s3
S3_ENDPOINT=...
S3_PUBLIC_ENDPOINT=...
S3_BUCKET=...
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

SENTRY_DSN=
APP_ENVIRONMENT=production
APP_RELEASE=...
```

Optional production toggles:

```text
SWAGGER_ENABLED=false
ACTUATOR_ENDPOINTS=health,info
JSON_LOGS=true
AUTH_RATE_LIMIT_BACKEND=redis
```

### Render PostgreSQL

Create a Render PostgreSQL database and connect it to the web service.

Preferred:

```text
DB_URL=jdbc:postgresql://host:port/database
DB_USERNAME=render_database_user
DB_PASSWORD=render_database_password
```

Also supported:

```text
DATABASE_URL=postgres://user:password@host:port/database
```

The backend includes a deployment environment post-processor that converts `DATABASE_URL` into:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

Flyway migrations run automatically on startup.

### Redis

Use Render Redis if available on your account, or another Redis provider.

Set:

```text
REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...
AUTH_RATE_LIMIT_BACKEND=redis
```

If Redis is not available during early testing, you can temporarily use:

```text
AUTH_RATE_LIMIT_BACKEND=local
```

For production, Redis is recommended so rate limiting is safe across multiple backend instances.

### File Storage

For production, do not use local file storage on Render because container disks are ephemeral.

Recommended:

```text
FILE_STORAGE_PROVIDER=s3
S3_ENDPOINT=https://your-s3-compatible-endpoint
S3_PUBLIC_ENDPOINT=https://your-public-or-signed-url-endpoint
S3_BUCKET=your-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

For MinIO-compatible providers, you can also use:

```text
FILE_STORAGE_PROVIDER=minio
MINIO_ENDPOINT=...
MINIO_PUBLIC_ENDPOINT=...
MINIO_BUCKET=...
MINIO_REGION=us-east-1
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
```

The storage client also supports the AWS SDK variable names:

```text
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Email Links

Set:

```text
FRONTEND_BASE_URL=https://YOUR_FIREBASE_APP_URL
```

Emails will point users to frontend routes such as:

- `/auth/verify-email`
- `/auth/reset-password`
- `/auth/accept-invitation`
- `/auth/trainer-pending`
- `/auth/login`

## 4. CORS Configuration

Production CORS should be restricted:

```text
CORS_ALLOWED_ORIGINS=https://YOUR_FIREBASE_APP_URL
```

Do not use `*` in production because the API uses authenticated requests.

For local development, Docker Compose still defaults to:

```text
http://localhost:4200,http://127.0.0.1:4200
```

## 5. Security Production Checklist

Before production:

- Use a strong `JWT_SECRET` with at least 32 random characters.
- Keep all secrets in Render environment variables.
- Keep `.env` local only.
- Keep `SWAGGER_ENABLED=false` unless you intentionally expose API docs.
- Keep `ACTUATOR_ENDPOINTS=health,info` unless Prometheus is protected.
- Restrict `CORS_ALLOWED_ORIGINS` to Firebase/custom frontend domains.
- Do not log passwords, tokens, SMTP secrets, or reset codes.
- Use HTTPS URLs for frontend, backend, storage, and email links.

## 6. Local Development

Local Docker development remains unchanged:

```powershell
cd C:\Users\GRATI\Desktop\pfa
docker compose up --build
```

Local frontend still uses:

```text
http://localhost:8080/api/v1
```

from:

```text
frontend/src/environments/environment.ts
```

## 7. Production Verification

After deploying:

1. Open Firebase frontend.
2. Refresh these routes directly:
   - `/auth/login`
   - `/dashboard`
   - `/trainings`
   - `/teams`
   - `/assignments`
   - `/profile`
3. Check Render backend:

```text
https://YOUR_RENDER_BACKEND_URL/actuator/health
```

4. Register a company.
5. Verify email link opens Firebase frontend.
6. Login from Firebase.
7. Confirm API calls go to Render.
8. Create a team.
9. Invite a member.
10. Create or approve a trainer.
11. Assign a published training.
12. Complete lesson and quiz flow.
13. Generate/download certificate.
14. Upload avatar/logo/thumbnail and verify retrieval.

## 8. Build And Test Commands

Backend:

```powershell
cd C:\Users\GRATI\Desktop\pfa\backend
.\mvnw.cmd test
.\mvnw.cmd package
```

Frontend:

```powershell
cd C:\Users\GRATI\Desktop\pfa\frontend
npm.cmd test -- --watch=false
npm.cmd run build
```

Docker config:

```powershell
cd C:\Users\GRATI\Desktop\pfa
docker compose config
```

