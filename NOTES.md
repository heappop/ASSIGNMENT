# Notes

## Cache Strategy

| Source | TTL | Reason |
| --- | --- | --- |
| Nominatim | 7 days | Coordinates rarely change |
| Weather | 1 hour | Forecast updates frequently |
| FX | 24 hours | Daily exchange rate |
| Country | 30 days | Metadata is stable |
| POI | 24 hours | Nearby places change slowly |

## Scoring Model
- Ideal temperature (20-30°C) is preferred. Scores degrade linearly away from this band.
- High precipitation probability acts as a strong penalty.
- High wind speed acts as a penalty.
- Missing data explicitly flags the event window with `hasMissingData: true`, rather than silently replacing it with averages.

## Rate Limiting
- The Nominatim limit (max 1 request per second globally) is enforced using a central asynchronous rate limiter queue. All Nominatim requests wait their turn, ensuring a 1-second delay between calls.
- We can prove this by hitting `/api/debug/stats`, where `rateLimiter.nominatim.maxObservedRatePerSecond` proves we never exceed `1.0`.

## Cuts and Future Improvements
- **Cuts**: Authentication, Database integration, dark mode, Docker setup, and Stale Cache / Background Revalidation (current implementation falls back to strict TTL cache due to time limits).
- **With two more days**: I would implement stale cache background revalidation to serve stale cache instantly while fetching fresh data, add comprehensive automated tests, and move the cache out of memory into Redis.

## Specifications Feedback
Overpass API as a point-of-interest density source is extremely slow and unpredictably unreliable. For a production destination board, I would strongly prefer using a more robust commercial API (such as Google Places, Mapbox, or Foursquare) or host a static geospatial dataset to calculate POI density, as the frequent time-outs hurt user experience despite the isolated block-level error handling.

## AI Tools Used
- **Antigravity AI (Gemini 3.1 Pro)**: Used as a pair-programmer to scaffold the frontend Vite application, configure React Query, set up Tailwind CSS theming (using brand constraints), write frontend components (App, DestinationCard, Block, RankingList), and manage the project's root `package.json` setup for seamless backend/frontend concurrent startup.
