const { GeoPlacesClient, SearchTextCommand } = require('@aws-sdk/client-geo-places');

const placesClient = new GeoPlacesClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

function calculateDistanceInKm(lat1, lon1, lat2, lon2) {
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

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { latitude, longitude } = body;

        if (latitude === undefined || longitude === undefined) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: 'Missing coordinates' }) };
        }

        const command = new SearchTextCommand({
            QueryText: 'veterinary', // Broadened slightly from 'veterinary pharmacy' as rural results might be thin
            BiasPosition: [longitude, latitude],
            MaxResults: 1,
        });

        const response = await placesClient.send(command);

        if (response.ResultItems && response.ResultItems.length > 0) {
            const topResult = response.ResultItems[0];
            const placeLng = topResult.Position?.[0];
            const placeLat = topResult.Position?.[1];

            let distanceKm = null;
            if (placeLat !== undefined && placeLng !== undefined) {
                distanceKm = calculateDistanceInKm(latitude, longitude, placeLat, placeLng);
            }

            return {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({
                    name: topResult.Title || "Veterinary Pharmacy",
                    address: topResult.Address?.Label,
                    distanceKm: distanceKm ? distanceKm.toFixed(2) : null,
                })
            }
        }

        return { statusCode: 404, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "No nearby veterinary pharmacies found." }) };

    } catch (error) {
        console.error("Location API Error:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Failed to search for locations", details: error.message })
        };
    }
};
