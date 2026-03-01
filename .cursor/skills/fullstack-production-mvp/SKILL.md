---
name: fullstack-production-mvp
description: Guides building production-ready full-stack apps with React 18+ (TypeScript, Router v6, PWA), FastAPI (JWT, asyncpg, Redis, RBAC, S3/MinIO), Docker, Nginx/HTTPS, and security-first practices. Use when implementing frontend features, backend APIs, auth, media upload, deployment, or when the user asks for production MVP patterns, clean architecture, or stack best practices.
---

# Full-Stack Production MVP

Apply this skill when working on React + FastAPI projects targeting production: auth, media, APIs, deployment, or architecture decisions.

## Principles

- **Security-first**: JWT (access + refresh), HTTPS, strict CORS, rate limiting, env/secrets, no secrets in code.
- **Clean architecture**: Separate layers (routers → services → repositories), clear dependencies.
- **Production-ready MVP**: Logging, error handling, env-based config, Docker, minimal but deployable.

---

## Frontend (React 18+ / TypeScript)

### Stack

- **React 18+**: Functional components, hooks only. Use `useCallback`/`useMemo` for expensive computations or stable refs passed to children; avoid premature optimization.
- **TypeScript**: Strict mode. Define interfaces for API responses and props; avoid `any`.
- **React Router v6**: `createBrowserRouter` + `RouterProvider`, or `BrowserRouter` with `Routes`/`Route`. Use `useNavigate`, `useParams`, `Outlet` for nested routes.
- **React Toastify**: `toast.success()` / `toast.error()` for user feedback; configure once in root (e.g. `<ToastContainer />`).
- **Leaflet + OpenStreetMap**: Use `react-leaflet`. For TypeScript, add `@types/leaflet`. Tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
- **Drag & drop upload**: Use `react-dropzone` or native HTML5 DnD; validate file types/size on client; send as `FormData` to backend.
- **PWA**: `workbox-webpack-plugin` or Vite PWA plugin; register service worker; cache static assets and optional offline fallback; keep SW scope and cache names versioned.

### Code patterns

```tsx
// Lazy loading routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
<Suspense fallback={<Spinner />}><Route path="/dashboard" element={<Dashboard />} /></Suspense>

// Auth context (minimal)
const AuthContext = createContext<{ user: User | null; login: (t: string) => void; logout: () => void } | null>(null);
export const useAuth = () => useContext(AuthContext)!;
```

- Prefer one context for auth; avoid context for every piece of state.
- Explain non-obvious logic in short comments; keep component and function names self-explanatory.

---

## Backend (FastAPI)

### Stack

- **FastAPI**: Routers per domain; `APIRouter(prefix="/api/v1/...")`. Use `Depends()` for DB session, current user, optional RBAC.
- **JWT**: Access token (short-lived, e.g. 15 min) + refresh token (long-lived, stored server-side or in httpOnly cookie). Validate signature, expiry, and optional blacklist (e.g. Redis) on refresh.
- **bcrypt**: Hash passwords with `bcrypt.hashpw(password.encode(), bcrypt.gensalt())`; verify with `bcrypt.checkpw`. Never store or log plain passwords.
- **PostgreSQL**: Use **asyncpg** (or SQLAlchemy 2.0 async). One connection pool per app; inject session via dependency.
- **Redis**: Use for rate limiting (e.g. sliding window or fixed window per IP/user) and optionally refresh token store or cache.
- **RBAC**: Middleware or dependency that loads user, checks `role` (e.g. admin, user), and returns 403 if not allowed.
- **MinIO / S3**: Use `boto3` or `minio` SDK; store files in buckets with generated keys; serve via presigned URLs or through your API with strict access checks.
- **Docker**: Multi-stage build; one service each for app, Postgres, Redis, MinIO (if used). Use Docker Compose for local and simple production.

### Code patterns

```python
# Dependency: get current user from JWT
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = decode_jwt(token)  # validate signature + expiry
    user = await user_repo.get_by_id(payload["sub"])
    if not user: raise HTTPException(401, "Invalid token")
    return user

# RBAC
def require_roles(*allowed: str):
    def _(user: User = Depends(get_current_user)):
        if user.role not in allowed: raise HTTPException(403)
        return user
    return _
```

- Keep routers thin: parse input, call service, return response. Business logic in service layer; DB access in repository layer.
- Use Pydantic for request/response schemas; validate and sanitize all inputs.

---

## DevOps & Security

- **Nginx**: Reverse proxy to FastAPI (e.g. `proxy_pass http://127.0.0.1:8000`). Serve static files via Nginx if applicable.
- **HTTPS**: Use Certbot (Let’s Encrypt); auto-renew. Redirect HTTP → HTTPS in Nginx.
- **CORS**: Strict allowlist: only your frontend origin(s); no `*` in production. Credentials if using cookies.
- **Rate limiting**: Implement in FastAPI with Redis (e.g. by IP and optionally by user ID); return 429 with Retry-After when exceeded.
- **Secrets**: Environment variables or secret manager; never commit. Use `.env.example` with dummy values; load in app and Docker via env.
- **Logging**: Structured logs (JSON or key=value); include request id, user id (if any), level, message. Avoid logging secrets or full tokens.
- **VPS**: Single host is fine for MVP; run app in Docker, Nginx on host or in Docker. Use systemd or Docker restart policies for resilience.

---

## API & Architecture

- **REST**: Resource-oriented URLs; GET/POST/PUT/PATCH/DELETE with clear semantics. Use consistent status codes (200, 201, 400, 401, 403, 404, 429, 500).
- **Layers**: Router → Service → Repository. Router handles HTTP; service handles business rules and transactions; repository handles DB/S3.
- **MVP**: Prefer simple, working features over perfect abstraction. Add health check endpoint (e.g. `/health`) for Docker/load balancer.
- **Comments**: Explain “why” and non-obvious constraints; keep snippets step-by-step readable for future maintainers.
- **Performance**: Backend—use DB indexes, connection pooling, avoid N+1. Frontend—lazy load routes and heavy components; memoize only when profiling shows need.

---

## Checklist (before calling “production-ready”)

- [ ] Passwords hashed with bcrypt; JWT access + refresh; refresh stored/revocable.
- [ ] CORS restricted to known origins; HTTPS in production; rate limiting enabled.
- [ ] Secrets in env; no credentials in repo; logging without secrets.
- [ ] DB migrations applied; backups considered; health check implemented.
- [ ] Frontend: auth flow, error toasts, basic offline/PWA if required.

---

## Additional resources

- For detailed code examples (auth flow, file upload, Docker Compose), see [reference.md](reference.md).
