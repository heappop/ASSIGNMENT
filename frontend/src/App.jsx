// Main Application Component
// Handles URL search parameter synchronization, data fetching via React Query,
// and layout rendering for destination cards and ranking list.

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDestinations, refreshDestinations } from "./api";
import DestinationCard from "./components/DestinationCard";
import RankingList from "./components/RankingList";

export default function App() {
    // Synchronize selected cities with the URL search parameters to ensure shareable URLs
    const [searchParams, setSearchParams] = useSearchParams();
    const citiesParam = searchParams.get("cities") || "Jaipur,Goa";
    
    // Parse the comma-separated cities parameter into an array of trimmed non-empty strings
    const selectedCities = citiesParam
        .split(",")
        .map(city => city.trim())
        .filter(Boolean);

    // Controlled component input state for adding/changing cities
    const [inputValue, setInputValue] = useState(selectedCities.join(", "));

    // Update input text if URL parameters change from outside (e.g., Back/Forward button)
    useEffect(() => {
        setInputValue(selectedCities.join(", "));
    }, [citiesParam]);

    // Access React Query Client to invalidate and fetch fresh cache data when needed
    const queryClient = useQueryClient();

    // Fetch destinations data from the API
    const { data, isLoading, isError } = useQuery({
        queryKey: ["destinations", selectedCities],
        queryFn: () => getDestinations(selectedCities),
        enabled: selectedCities.length > 0
    });

    // Mutation to force refresh cache data in the backend server
    const refreshMutation = useMutation({
        mutationFn: () => refreshDestinations(selectedCities),
        onSuccess: () => {
            // Once cache is successfully refreshed, refetch the active queries
            queryClient.invalidateQueries({ queryKey: ["destinations"] });
        }
    });

    // Handle form submit to change cities displayed on the page
    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        // Clean up input values to generate new query string
        const cleaned = inputValue
            .split(",")
            .map(city => city.trim())
            .filter(Boolean);

        // Update URL search parameters to trigger React Query refetch
        setSearchParams({ cities: cleaned.join(",") });
    };

    // Callback passed to individual blocks to trigger cache refresh for a single city on error
    const handleRetryCity = (cityQuery) => {
        refreshDestinations([cityQuery]).then(() => {
            queryClient.invalidateQueries({ queryKey: ["destinations"] });
        });
    };

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col">
            {/* Header Section */}
            <header className="border-b-4 border-brand-navy pb-6 mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl text-brand-navy m-0">Destination Board</h1>
                    <p className="text-brand-green font-bold uppercase tracking-wider text-sm mt-1">
                        Operations Dashboard
                    </p>
                </div>

                {/* Controls Section */}
                <form 
                    onSubmit={handleFormSubmit} 
                    className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
                >
                    <label htmlFor="city-input" className="sr-only">Enter Cities</label>
                    <input 
                        id="city-input"
                        type="text"
                        data-testid="city-input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter cities separated by comma..."
                        className="bg-white border-2 border-brand-navy p-2 rounded shadow text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-gold w-full sm:w-64 font-mono"
                    />

                    <button 
                        type="submit" 
                        className="bg-brand-navy text-white px-6 py-2 rounded uppercase font-display tracking-widest hover:bg-opacity-90 transition shadow"
                    >
                        Update View
                    </button>

                    <button 
                        type="button" 
                        data-testid="refresh-button"
                        onClick={() => refreshMutation.mutate()}
                        disabled={refreshMutation.isPending || isLoading}
                        className="bg-brand-gold text-brand-navy px-6 py-2 rounded uppercase font-display font-bold tracking-widest hover:bg-opacity-90 transition shadow disabled:opacity-50"
                    >
                        {refreshMutation.isPending ? "Refreshing..." : "Force Refresh"}
                    </button>
                </form>
            </header>

            {/* Main Destinations List Section */}
            <main className="flex-1">
                {isError && (
                    <div className="bg-red-100 text-red-900 border border-red-400 p-4 mb-8 rounded">
                        Failed to fetch destination data. Please ensure the backend server is operating properly.
                    </div>
                )}

                {/* Show placeholders while loading to prevent Cumulative Layout Shift (CLS) */}
                {isLoading ? (
                    selectedCities.map((city) => (
                        <DestinationCard 
                            key={`loading-${city}`} 
                            destination={{ query: city }} 
                            isLoading={true} 
                        />
                    ))
                ) : (
                    data?.destinations?.map((dest) => (
                        <DestinationCard 
                            key={dest.query} 
                            destination={dest} 
                            isLoading={false}
                            onRetryCity={handleRetryCity}
                        />
                    ))
                )}

                {/* Show ranking list once data arrives */}
                {!isLoading && data?.destinations && (
                    <RankingList destinations={data.destinations} />
                )}
            </main>

            {/* Simple Footer */}
            <footer className="border-t border-brand-navy/20 pt-4 mt-12 text-center text-xs text-brand-navy/60 font-mono">
                Saltstayz Destination Board Operations Suite &bull; {new Date().getFullYear()}
            </footer>
        </div>
    );
}
