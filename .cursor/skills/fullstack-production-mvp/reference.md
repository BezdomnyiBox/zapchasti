# Reference: Step-by-step patterns

Use this when implementing auth, file upload, Docker, or Nginx. Keep layers separated and security in mind.

---

## 1. Auth flow (JWT access + refresh)

**Backend (FastAPI)**

1. **Login**  
   - Accept `username` + `password`.  
   - Load user, verify with `bcrypt.checkpw(plain, user.hashed_password)`.  
   - Issue access token (short-lived, e.g. 15 min) and refresh token (e.g. 7 days).  
   - Store refresh token in Redis keyed by token ID or user ID; set TTL.  
   - Return `{ "access_token", "refresh_token", "expires_in" }` (or set refresh in httpOnly cookie).

2. **Refresh**  
   - Accept refresh token (body or cookie).  
   - Verify signature, check not in blacklist (Redis).  
   - Optionally rotate: delete old refresh, create new one.  
   - Return new access token (and optionally new refresh).

3. **Protected routes**  
   - Use `Depends(oauth2_scheme)` to read Bearer token.  
   - Decode JWT, validate expiry and signature, load user → `get_current_user`.  
   - Use `require_roles("admin")` etc. for RBAC.

**Frontend**

1. After login, store access token (memory or sessionStorage; avoid localStorage if XSS is a concern).  
2. Store refresh token in httpOnly cookie if backend sets it; otherwise store securely and send only to refresh endpoint.  
3. On 401, call refresh endpoint; on success update access token and retry request; on failure redirect to login.  
4. Use a single axios/fetch interceptor or API client to attach `Authorization: Bearer <access_token>` and handle 401 + refresh.

---

## 2. File upload (drag & drop → backend → MinIO/S3)

**Frontend**

1. Use `react-dropzone` (or native DnD): restrict `accept` and `maxSize`, validate before upload.  
2. Build `FormData`: append file(s) and any metadata (e.g. `type`, `id`).  
3. POST to backend upload endpoint with `Content-Type: multipart/form-data` (browser sets boundary).  
4. Show progress if needed; on success show toast and update UI (e.g. image list); on error show toast with message.

**Backend**

1. Accept `UploadFile` in FastAPI; validate content type and size.  
2. Generate safe object key (e.g. `uuid4` + extension or `prefix/user_id/filename`).  
3. Use MinIO/S3 client to `put_object` (stream file or read in chunks).  
4. Save key/path in DB linked to entity (e.g. user, product).  
5. Serve: presigned URL (short-lived) or proxy through your API with RBAC check.  
6. Never trust client filename for storage path; sanitize or use generated key only.

---

## 3. Docker Compose (app + Postgres + Redis + MinIO)

```yaml
# Minimal production-oriented layout
services:
  app:
    build: .
    env_file: .env
    ports: ["8000:8000"]
    depends_on:
      - db
      - redis
    # Optional: restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes: ["pgdata:/var/lib/postgresql/data"]
    # Expose only to app in production; no 5432:5432 if not needed from host

  redis:
    image: redis:7-alpine
    # Optional: command for persistence or maxmemory

  minio:
    image: minio/minio
    command: server /data
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes: ["minio_data:/data"]
    # Expose 9000 for API; 9001 for console if needed

volumes:
  pgdata:
  minio_data:
```

- Use `.env` for secrets; add `.env.example` with dummy values.  
- App connects to `db`, `redis`, `minio` by service name.  
- For VPS: run `docker compose up -d`; put Nginx on host or in Compose in front of `app`.

---

## 4. Nginx reverse proxy + HTTPS (Certbot)

1. Install Nginx and Certbot: `apt install nginx certbot python3-certbot-nginx`.  
2. Create server block for your domain; initially allow HTTP.  
3. Run `certbot --nginx -d yourdomain.com`; Certbot configures SSL and redirect.  
4. Proxy to app:

```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

5. In FastAPI, trust `X-Forwarded-Proto` for redirects/URL generation if needed.  
6. Set CORS to your frontend origin (e.g. `https://app.yourdomain.com`); no `*` in production.

---

## 5. Rate limiting with Redis (FastAPI)

1. Get client IP from `request.client.host` or `X-Forwarded-For` (use rightmost trusted proxy).  
2. Key per IP (and optionally per user): e.g. `ratelimit:ip:<ip>`.  
3. Sliding window: `INCR` key, `EXPIRE` key with window (e.g. 60 s); if count > limit → 429.  
4. Or use fixed window: get current window key (e.g. by minute), INCR, set TTL; compare to limit.  
5. Return `429 Too Many Requests` and optional `Retry-After` header.  
6. Apply as dependency or middleware on sensitive routes (login, signup, upload).

---

## 6. PWA (service worker, offline)

1. **Build**: Use Vite PWA plugin or Workbox; generate `sw.js` and precache static assets.  
2. **Register**: In main entry, register service worker; handle updates (e.g. prompt user to reload).  
3. **Offline**: Cache GET for API sparingly (e.g. only critical data) or show offline fallback page; avoid caching POST/PUT.  
4. **Versioning**: Change cache name or precache manifest when deploying so SW updates.  
5. **HTTPS**: Service workers require HTTPS (or localhost).

---

## 7. REST and status codes

| Situation              | Method   | Status   |
|------------------------|----------|----------|
| List/Get OK            | GET      | 200      |
| Create OK              | POST     | 201      |
| Update OK              | PUT/PATCH| 200      |
| Delete OK              | DELETE   | 200/204  |
| Validation error       | any      | 400      |
| Unauthorized           | any      | 401      |
| Forbidden              | any      | 403      |
| Not found              | any      | 404      |
| Rate limited           | any      | 429      |
| Server error           | any      | 500      |

Use consistent error body shape, e.g. `{ "detail": "..." }` or `{ "code", "message" }`.
