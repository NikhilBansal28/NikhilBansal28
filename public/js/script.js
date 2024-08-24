const socket = io('http://<192.168.1.5:>:8000');  // Replace with your laptop's local IP

const map = L.map("map").setView([0, 0], 2);  // Initialize the map with default view
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);  // Add tile layer

const markers = {};

// Function to calculate distance between two lat/lon points (in meters)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radius of Earth in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;  // Distance in meters
}

// Watch the device's position and send it to the server
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;

            // Emit the location data to the server via Socket.IO
            socket.emit("send-location", { latitude, longitude });

            // Log the location to the console
            console.log("Sending location:", { latitude, longitude });
        },
        (error) => {
            console.error("Error getting location:", error);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        }
    );
} else {
    console.error("Geolocation is not supported by this browser.");
}

// Listen for location updates from other clients
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;
    console.log(`Location received from ${id}: { latitude: ${latitude}, longitude: ${longitude} }`);
    map.setView([latitude, longitude], 15);

    // Update marker position if it already exists
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);  // Update marker position
    } else {
        // Create a new marker if it doesn't exist
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }

    // Optionally, calculate and display distances between devices
    const userCoords = markers[socket.id] ? markers[socket.id].getLatLng() : null;
    if (userCoords) {
        const distance = calculateDistance(userCoords.lat, userCoords.lng, latitude, longitude);
        console.log(`Distance to device ${id}: ${distance.toFixed(2)} meters`);
    }
});

// Listen for user disconnection and remove their marker from the map
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});

// Function to calculate distance between two geographical points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon1 - lon2) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Returns distance in meters
}
