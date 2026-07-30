// Block Component
// Represents a single widget (weather, fx, poi, etc.) for a destination.
// Handles different states: loading, ok, stale, error, and empty.

import React from "react";

export default function Block({ 
    title, 
    testId, 
    data, 
    isLoading, 
    onRetry,
    children
}) {
    // Determine the state based on the provided data and loading status
    // Default to 'empty' if no data is present. 'loading' if actively fetching.
    let state = "empty";
    let content = null;
    let freshness = null;

    if (isLoading) {
        state = "loading";
    } else if (data) {
        // Map backend status to our state.
        if (data.status === "ok") {
            // Check if the data is stale
            state = data.stale ? "stale" : "ok";
        } else {
            state = "error";
        }
    }

    // Format the freshness label text based on fetchedAt and validAt
    if (data && data.status === "ok") {
        const fetched = data.fetchedAt ? new Date(data.fetchedAt).toLocaleString() : "Unknown";
        const valid = data.validAt ? new Date(data.validAt).toLocaleString() : "Unknown";
        freshness = `Fetched: ${fetched} | Valid: ${valid}`;
    }

    // Render the appropriate content based on the state
    if (state === "loading") {
        content = (
            <div className="animate-pulse bg-brand-cream/50 h-16 rounded flex items-center justify-center text-sm text-brand-navy/60">
                Loading...
            </div>
        );
    } else if (state === "error") {
        content = (
            <div className="bg-red-50 text-red-800 p-3 rounded text-sm flex justify-between items-center">
                <span>{data?.error || "Error fetching data"}</span>
                {onRetry && (
                    <button 
                        onClick={onRetry}
                        className="bg-red-200 hover:bg-red-300 text-red-900 px-3 py-1 rounded font-medium"
                    >
                        Retry
                    </button>
                )}
            </div>
        );
    } else if (state === "empty") {
        content = <div className="text-sm text-brand-navy/50 italic p-3">No data available.</div>;
    }

    return (
        <div 
            className="border border-brand-green/20 rounded p-4 bg-white shadow-sm flex flex-col gap-2"
            data-testid={testId}
        >
            <div className="flex justify-between items-center border-b border-brand-green/10 pb-2">
                <h3 className="text-brand-green font-bold text-sm tracking-widest uppercase m-0">
                    {title}
                </h3>
                
                {/* Status indicator badge required by assignment */}
                <span 
                    data-testid="block-state"
                    data-state={state}
                    className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-bold
                        ${state === 'ok' ? 'bg-brand-green/10 text-brand-green' : ''}
                        ${state === 'loading' ? 'bg-blue-100 text-blue-800' : ''}
                        ${state === 'stale' ? 'bg-brand-gold/20 text-brand-gold' : ''}
                        ${state === 'error' ? 'bg-red-100 text-red-800' : ''}
                        ${state === 'empty' ? 'bg-gray-100 text-gray-800' : ''}
                    `}
                >
                    {state}
                </span>
            </div>
            
            {/* Display freshness data if available */}
            {freshness && (
                <div 
                    data-testid="freshness-label" 
                    className="text-[10px] text-brand-navy/60 font-mono"
                >
                    {freshness}
                </div>
            )}
            
            {/* The main content area: either skeleton/error or children passed to component */}
            <div className="pt-2">
                {content || children}
            </div>
        </div>
    );
}
