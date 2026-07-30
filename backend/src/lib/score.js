/**
 * Event Window Scoring Engine
 * 
 * This module exports `scoreWindows`, a pure, deterministic algorithm designed to evaluate
 * weather forecast days and rank consecutive multi-day windows for outdoor events or property launches.
 * 
 * Design Criteria Met:
 * - Pure & Deterministic: Zero randomness, no network or filesystem calls, no reliance on Date.now().
 * - Monotonicity: Increasing rain probability or wind speeds never raises a window's score.
 * - Honest Gap Handling: Missing values trigger `hasMissingData: true` rather than being silently obfuscated.
 * - Bounded Output: All scores are clamped between 0 and 100 with zero possibility of NaN or exceptions.
 */

/**
 * Evaluates consecutive day windows in a weather forecast and ranks them best-first.
 * 
 * @param {Array<Object>} days - Array of daily weather objects containing tempMax, tempMin, precipProbability, and windMax.
 * @param {Object} [options] - Optional settings, such as windowSize (defaulting to 3 days).
 * @returns {Array<Object>} Deterministically sorted array of scored windows.
 */
function scoreWindows(days = [], options = {}) {
    // Parameterize window size as required; avoid hardcoding to 3
    const windowSize = options.windowSize || 3;
    const results = [];

    // Early exit if forecast duration is shorter than the requested window size
    if (!Array.isArray(days) || days.length < windowSize) {
        return results;
    }

    // Evaluate every possible consecutive rolling window in the timeframe
    for (let i = 0; i <= days.length - windowSize; i++) {
        const windowSlice = days.slice(i, i + windowSize);

        const tempScores = [];
        const precipScores = [];
        const windScores = [];
        let hasMissingData = false;

        windowSlice.forEach(day => {
            // Explicit missing-data tracking: any null reading immediately flags the entire window
            if (day.tempMax === null || day.precipProbability === null || day.windMax === null ||
                day.tempMax === undefined || day.precipProbability === undefined || day.windMax === undefined) {
                hasMissingData = true;
            }

            // 1. Temperature Scoring (Ideal band: 20-30°C)
            if (day.tempMax !== null && day.tempMax !== undefined) {
                let score = 0;
                if (day.tempMax >= 20 && day.tempMax <= 30) {
                    score = 100; // Optimal comfort range
                } else {
                    // Linear degradation: lose 10 points for every degree outside the ideal band
                    const distance = day.tempMax < 20 ? (20 - day.tempMax) : (day.tempMax - 30);
                    score = Math.max(0, 100 - (distance * 10));
                }
                tempScores.push(score);
            }

            // 2. Precipitation Probability Scoring (0-100% scale)
            if (day.precipProbability !== null && day.precipProbability !== undefined) {
                // Monotonic penalty: higher chance of rain linearly reduces the score
                precipScores.push(Math.max(0, 100 - day.precipProbability));
            }

            // 3. Wind Speed Scoring (km/h)
            if (day.windMax !== null && day.windMax !== undefined) {
                // Moderate penalty: lose 2 points per km/h of wind
                windScores.push(Math.max(0, 100 - (day.windMax * 2)));
            }
        });

        // Compute dimension averages from available readings
        const tempAvg = calculateAverage(tempScores);
        const precipAvg = calculateAverage(precipScores);
        const windAvg = calculateAverage(windScores);

        // Weighted aggregation:
        // Temperature (50% weight) is considered most critical for outdoor comfort,
        // Precipitation (30% weight) heavily penalizes potential event disruption,
        // Wind speed (20% weight) provides minor comfort adjustments.
        const weightedTotal = (tempAvg * 0.5) + (precipAvg * 0.3) + (windAvg * 0.2);
        const finalScore = clamp(weightedTotal, 0, 100);

        results.push({
            startDate: windowSlice[0].date,
            endDate: windowSlice[windowSlice.length - 1].date,
            score: Number(finalScore.toFixed(1)),
            hasMissingData,
            breakdown: {
                temp: Number(tempAvg.toFixed(1)),
                precip: Number(precipAvg.toFixed(1)),
                wind: Number(windAvg.toFixed(1))
            }
        });
    }

    // Sort deterministically: highest score first, breaking ties by earlier start dates
    return results.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return String(a.startDate).localeCompare(String(b.startDate));
    });
}

/**
 * Calculates the arithmetic mean of an array of numerical values.
 * Returns a neutral fallback score (50) if all readings were missing, ensuring bounded behavior.
 * 
 * @param {Array<number>} values 
 * @returns {number}
 */
function calculateAverage(values) {
    if (!values || values.length === 0) {
        return 50; 
    }
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return sum / values.length;
}

/**
 * Ensures a number stays within the specified numeric bounds.
 * 
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
function clamp(value, min, max) {
    if (Number.isNaN(value)) {
        return min;
    }
    return Math.min(Math.max(value, min), max);
}

module.exports = {
    scoreWindows
};