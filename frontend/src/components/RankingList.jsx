// RankingList Component
// Renders the summary ranking table below all city cards, sorted by best-window score.

import React from "react";

export default function RankingList({ destinations }) {
    // Return early if no destinations exist
    if (!destinations || !destinations.length) {
        return null;
    }

    // Sort destinations by their bestWindow score in descending order
    // Using a slice to avoid mutating the props directly
    const ranked = [...destinations].sort((a, b) => {
        const scoreA = a.blocks?.bestWindow?.data?.score || 0;
        const scoreB = b.blocks?.bestWindow?.data?.score || 0;
        return scoreB - scoreA;
    });

    return (
        <div className="bg-white border-2 border-brand-navy p-6 shadow-md my-8" data-testid="ranking-list">
            <h2 className="text-2xl text-brand-navy border-b-2 border-brand-gold pb-2 mb-4">
                Ranked by Best-Window Score
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-brand-navy/20">
                            <th className="p-2 text-brand-maroon uppercase font-bold text-sm">Rank</th>
                            <th className="p-2 text-brand-maroon uppercase font-bold text-sm">City</th>
                            <th className="p-2 text-brand-maroon uppercase font-bold text-sm">Best Window</th>
                            <th className="p-2 text-brand-maroon uppercase font-bold text-sm">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ranked.map((dest, index) => {
                            const name = dest.resolved?.name || dest.query;
                            const window = dest.blocks?.bestWindow?.data;
                            const score = window?.score?.toFixed(1) || "N/A";
                            const dates = window ? `${window.startDate} to ${window.endDate}` : "None";

                            return (
                                <tr key={dest.query} className="border-b border-gray-100 hover:bg-brand-cream/20">
                                    <td className="p-2 font-bold font-display text-lg text-brand-navy">#{index + 1}</td>
                                    <td className="p-2 font-bold">{name}</td>
                                    <td className="p-2 font-mono text-sm">{dates}</td>
                                    <td className="p-2 font-display text-lg font-bold text-brand-green">{score}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
