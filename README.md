# Destination Board

Take-home submission for the Senior Full-Stack Engineer role at Saltstayz.
An internal operations dashboard designed to evaluate weather forecasts, currency conversion rates, country metadata, and surrounding amenity density across short-listed boutique hotel destinations.

## Quick Start (Run Commands)

Both execution modes work cleanly from a fresh git clone without manual intervention.

### 1. Live Upstreams Mode
Connects directly to external public APIs via the backend rate-limited proxy:
```bash
npm install
npm run dev
```

### 2. Offline / Mock Mode
Bypasses all live network requests and deterministically serves responses from local fixtures while continuing to exercise real cache and rate-limiter logic paths:
```bash
MOCK=1 npm run dev
```

*(Note for Windows command prompt users: replace with `set MOCK=1 && npm run dev` if running outside of Bash/WSL)*

---

## Architectural Summary
To protect public upstreams from client-side rate exhaustion and build fault tolerance against unreliable third-party endpoints, all requests go through an Express Backend-For-Frontend (BFF). The server layer manages request coalescing (deduplicity), per-source cache TTLs, and asynchronous throttling:

```
Browser ──► Your server (BFF + cache + rate limiter) ──► 5 public APIs
```

* **Frontend Development Server:** `http://localhost:5173/` (Vite + React)
* **Backend API Server:** `http://localhost:5000/` (Express.js)
* **Debug Telemetry Endpoint:** `http://localhost:5000/api/debug/stats`
