// DestinationCard Component
// Renders all the specific blocks for a single destination city

import React from "react";
import Block from "./Block";

export default function DestinationCard({ 
    destination, 
    isLoading,
    onRetryCity
}) {
    // If there is no destination data, show an empty state placeholder
    if (!destination && !isLoading) {
        return null;
    }

    // Extract blocks safely, defaulting to empty objects if missing
    const blocks = destination?.blocks || {};
    const resolved = destination?.resolved;
    const query = destination?.query || "Unknown City";

    // Handle retry specifically for this city
    const handleRetry = () => {
        if (onRetryCity) {
            onRetryCity(query);
        }
    };

    // Safely parse POI count from object ({ count: X }) or primitive number
    let poiCount = "N/A";
    if (blocks.poi?.data !== undefined && blocks.poi?.data !== null) {
        if (typeof blocks.poi.data === "object" && "count" in blocks.poi.data) {
            poiCount = blocks.poi.data.count;
        } else if (typeof blocks.poi.data === "number" || typeof blocks.poi.data === "string") {
            poiCount = blocks.poi.data;
        }
    }

    return (
        <div 
            className="flex flex-col gap-4 bg-brand-cream border-2 border-brand-navy p-6 shadow-[8px_8px_0_0_#0B2B3F] mb-8"
            data-testid="destination-card"
        >
            <div className="flex justify-between items-end border-b-4 border-brand-maroon pb-4">
                <div>
                    <h2 className="text-4xl text-brand-navy m-0">
                        {resolved ? resolved.name : query}
                    </h2>
                    {resolved && (
                        <p className="text-brand-green font-bold text-lg mt-1">
                            {resolved.country} ({resolved.countryCode}) 
                            {resolved.lat !== undefined && resolved.lon !== undefined && (
                                <span className="text-sm font-normal ml-2 opacity-70 font-mono">
                                    {Number(resolved.lat).toFixed(4)}, {Number(resolved.lon).toFixed(4)}
                                </span>
                            )}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Weather Block */}
                <Block 
                    title="Weather" 
                    testId="block-weather"
                    data={blocks.weather} 
                    isLoading={isLoading}
                    onRetry={handleRetry}
                >
                    {blocks.weather?.data && (
                        <div className="text-sm space-y-1">
                            <p><strong>Days Forecasted:</strong> {blocks.weather.data.days?.length || 0}</p>
                            {blocks.weather.data.days && blocks.weather.data.days.length > 0 && (
                                <p className="text-xs text-brand-navy/80 font-mono mt-2">
                                    Next Day: {blocks.weather.data.days[0].tempMax}&deg;C max / {blocks.weather.data.days[0].tempMin}&deg;C min
                                </p>
                            )}
                        </div>
                    )}
                </Block>

                {/* Best Window Block */}
                <Block 
                    title="Best Window" 
                    testId="block-bestwindow"
                    data={blocks.bestWindow} 
                    isLoading={isLoading}
                    onRetry={handleRetry}
                >
                    {blocks.bestWindow?.data && (
                        <div className="flex flex-col items-center justify-center py-2">
                            <div className="text-5xl font-display font-bold text-brand-gold">
                                {blocks.bestWindow.data.score?.toFixed(1) || "0.0"}
                            </div>
                            <div className="text-sm font-bold text-brand-navy mt-2 font-mono">
                                {blocks.bestWindow.data.startDate} to {blocks.bestWindow.data.endDate}
                            </div>
                            {blocks.bestWindow.data.hasMissingData && (
                                <span className="mt-2 text-xs bg-brand-maroon text-white px-2 py-1 rounded">
                                    Contains Missing Data
                                </span>
                            )}
                        </div>
                    )}
                </Block>

                {/* FX Rates Block */}
                <Block 
                    title="FX Rates" 
                    testId="block-fx"
                    data={blocks.fx} 
                    isLoading={isLoading}
                    onRetry={handleRetry}
                >
                    {blocks.fx?.data && (
                        <div className="text-center py-4">
                            <div className="text-3xl text-brand-navy font-bold font-mono">
                                1 {blocks.fx.data.currency || "USD"}
                            </div>
                            <div className="text-xl text-brand-green font-bold mt-2 font-mono">
                                = {blocks.fx.data.rateToInr ?? "N/A"} INR
                            </div>
                        </div>
                    )}
                </Block>

                {/* Country Info Block */}
                <Block 
                    title="Country" 
                    testId="block-country"
                    data={blocks.country} 
                    isLoading={isLoading}
                    onRetry={handleRetry}
                >
                    {blocks.country?.data && (
                        <div className="text-sm space-y-1">
                            <p><strong>Name:</strong> {blocks.country.data.name || resolved?.country || "N/A"}</p>
                            <p><strong>Region:</strong> {blocks.country.data.region || "N/A"}</p>
                            <p><strong>Currency:</strong> {blocks.country.data.currency || "N/A"}</p>
                        </div>
                    )}
                </Block>

                {/* POI Block */}
                <Block 
                    title="Nearby POI" 
                    testId="block-poi"
                    data={blocks.poi} 
                    isLoading={isLoading}
                    onRetry={handleRetry}
                >
                    {blocks.poi?.data !== undefined && blocks.poi?.data !== null && (
                        <div className="flex flex-col items-center justify-center py-2">
                            <div className="text-5xl font-display font-bold text-brand-navy">
                                {poiCount}
                            </div>
                            <div className="text-sm font-bold text-brand-navy/70 mt-2">
                                amenities within 2km
                            </div>
                        </div>
                    )}
                </Block>
            </div>
        </div>
    );
}
