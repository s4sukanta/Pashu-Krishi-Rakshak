import { NextResponse } from 'next/server';
import { GeoPlacesClient, SearchTextCommand } from '@aws-sdk/client-geo-places';

const placesClient = new GeoPlacesClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

// Create a helper to calculate distance between two coordinates in kilometers using Haversine formula
function calculateDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

export async function POST(request: Request) {
    try {
        const { latitude, longitude } = await request.json();

        if (latitude === undefined || longitude === undefined) {
            return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
        }

        const command = new SearchTextCommand({
            QueryText: 'veterinary pharmacy',
            BiasPosition: [longitude, latitude],
            MaxResults: 1,
        });

        const response = await placesClient.send(command);

        if (response.ResultItems && response.ResultItems.length > 0) {
            const topResult = response.ResultItems[0];
            const placeLng = topResult.Position?.[0]; // Usually [longitude, latitude]
            const placeLat = topResult.Position?.[1];

            let distanceKm = null;
            if (placeLat !== undefined && placeLng !== undefined) {
                distanceKm = calculateDistanceInKm(latitude, longitude, placeLat, placeLng);
            }

            return NextResponse.json({
                name: topResult.Title || "Veterinary Pharmacy",
                address: topResult.Address?.Label,
                distanceKm: distanceKm ? distanceKm.toFixed(2) : null,
            });
        }

        return NextResponse.json({ message: 'No nearby veterinary pharmacies found.' }, { status: 404 });

    } catch (error: unknown) {
        console.error("Location API Error:", error);
        return NextResponse.json(
            { error: "Failed to search for locations", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
