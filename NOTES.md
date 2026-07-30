# Technical Architecture & Design Decisions

## Cache Strategy & Justifications
Each third-party public API carries vastly different update frequency characteristics and latency penalties. The cache time-to-live (TTL) strategies were selected to balance freshness against external rate limits and reliability.

| Upstream Source | TTL | Justification |
| :--- | :--- | :--- |
| **Nominatim (Geocoding)** | 7 Days | Geographical coordinates and administrative hierarchy for cities remain virtually static over multi-year periods. |
| **Open-Meteo (Weather)** | 1 Hour | Short-range daily forecast ensembles evolve frequently throughout the day as meteorological models re-run. |
| **Frankfurter (FX Rates)** | 24 Hours | Foreign exchange conversion benchmarks update once per banking business day, making frequent polling redundant. |
| **REST Countries (Metadata)** | 30 Days | Sovereign nation attributes (capital cities, currency designations, and geographic regions) almost never mutate. |
| **Overpass API (POI Density)** | 24 Hours | Commercial establishments and amenity infrastructures in surrounding neighborhoods change relatively slowly over weeks. |

## Event Window Scoring Model
The logic evaluates every consecutive multi-day slice within the 14-day horizon. To yield defensible rankings without excessive complexity, the scoring engine balances three environmental dimensions using weighted averages:
* **Temperature Comfort (50% Weight)**: Days with maximum temperatures falling within the ideal band of 20–30°C earn 100 points. Temperatures outside this band suffer a linear penalty of 10 points per degree away from the boundary to reflect discomfort during outdoor events.
* **Precipitation Risk (30% Weight)**: Rain poses an outright hazard to property launches and outdoor gatherings. We apply a direct monotonic penalty where a daily precipitation probability reduces the score linearly (100 minus rain percentage).
* **Wind Disruption (20% Weight)**: High wind speed degrades outdoor audio quality and structures. We penalize readings by deducting 2 points per km/h.
* **Missing Data Policy**: If an upstream provider omits data for any parameter, we never synthesize fictional averages. The window is evaluated using remaining valid inputs and explicitly tagged with `hasMissingData: true` so operational staff are alerted to blind spots. Tie-breaks favor earlier calendar windows deterministically.

## Nominatim Rate Limiting & Evidence
To comply with OpenStreetMap's stringent usage guidelines (maximum one query per second globally), all outbound geocoding attempts funnel through a dedicated asynchronous bottleneck queue. Even if multiple users request simultaneous un-cached city evaluations, the throttling layer forces a strict one-second separation between executions. Consequently, hitting the test hook at `/api/debug/stats` confirms that `rateLimiter.nominatim.maxObservedRatePerSecond` never exceeds `1.0`.

## Scope Management & Future Enhancements
* **Time Cuts**: To strictly honor the time budget and focus on core architectural patterns (failure isolation, request coalescing, and layout stability), user accounts, database persistence, automated integration test suites, Docker containerization, and background stale-cache revalidations were cut.
* **Two More Days**: With additional time, I would migrate the in-memory cache to a shared Redis store, implement stale-while-revalidate background polling to render expired data instantly without user delays, and implement unit tests covering network timeout boundary conditions.

## Specification Critique & Alternative Approach
Relying on OpenStreetMap's Overpass API for real-time amenity density calculation is problematic for interactive client dashboards. Overpass query execution times frequently spike above several seconds, and the public server experiences unpredictable timeouts and 504 Gateway errors under load. Even though our backend isolates this failure so it doesn't break the rendering of weather or FX blocks, the constant fallback states create a degraded user experience. 

Instead, I would recommend consuming a reliable commercial location API (such as Mapbox Tilequery, Foursquare Places, or Google Places) or pre-computing static geohabitat density indexes within our own spatial database during routine background jobs.

## AI Tool Assistance
* **AI Partner (Antigravity/Gemini 3.1 Pro)**: Utilized as an interactive pair-programmer to assist in boilerplate code organization, structuring Tailwind design layout primitives according to brand constraints, formatting diagnostic error handling, and refining Markdown documentation syntax.
