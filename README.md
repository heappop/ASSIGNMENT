# Destination Board

Take-home assignment — Senior Full-Stack Engineer

## Running the Application

To run both the backend (Express) and frontend (Vite/React) from a clean clone with no manual steps, use the following commands:

### Live Upstreams
```bash
npm install
npm run dev # live upstreams
```

### Offline / Mock Mode
```bash
MOCK=1 npm run dev # fixtures only, no network, deterministic
```

*(Note for Windows users: replace with `set MOCK=1 && npm run dev` if running outside of bash/WSL)*

---

## Architecture — Spine of the Application
The frontend application communicates solely with our backend BFF (Backend For Frontend), never directly calling external upstream services. The server handles all rate limiting, retries, timeout enforcement, and caching:

```text
Browser ──► Your server (BFF + cache + rate limiter) ──► 5 public APIs
```

- **Backend Port:** `5000` (API Server)
- **Frontend Port:** `5173` (Vite Development Server with API Proxy configured to 5000)

---

## Frontend Highlights
- **Responsive Layout:** Simple, single-page operations tool styled within brand design constraints.
- **Shareable URL:** City selections map directly to URL parameters (e.g., `?cities=Jaipur,Goa`).
- **Zero Cumulative Layout Shift (CLS):** Explicit skeleton structures render while data loads.
- **Resilient Degraded Rendering:** Blocks handle their own independent status (`ok`, `loading`, `stale`, `error`). Failure in one source (like Overpass API timeouts) never crashes the page.
- **Testable Structure:** Complete integration of required automated test hooks (`data-testid`).
