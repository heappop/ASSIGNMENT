# Destination Board - Backend

## Running the Application

To run the backend with live upstreams:
```bash
npm install
npm run dev
```

To run the backend using local fixtures with no network calls (deterministic offline mode):
```bash
MOCK=1 npm run dev
```

## Architecture

```text
       React
         |
    Express BFF
         |
-------------------
|  |  |  |  |
Nominatim
Weather
FX
Country
POI (Overpass)
```
